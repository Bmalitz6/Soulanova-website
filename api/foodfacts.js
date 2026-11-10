'use strict';

// Public read-only barcode proxy. FoodScore stays disabled until its data-use and
// service configuration are reviewed. Enabled deployments require shared Redis so
// every Vercel instance uses the same upstream budget and response cache.
const WINDOW_MS = 60_000;
const MAX_UPSTREAM_REQUESTS = 10; // OFF allows 15 product reads/minute/IP.
const CACHE_TTL_SECONDS = 60 * 60;
const NOT_FOUND_TTL_SECONDS = 5 * 60;
const FIELDS = 'code,product_name,product_name_en,brands,serving_size,product_quantity_unit,serving_quantity_unit,categories_tags,nutriments,ingredients,ingredients_text,ingredients_text_en,nutriscore_grade,nova_group';
const ALLOWED_ORIGINS = new Set(['https://soulanova.com', 'https://www.soulanova.com']);
const previewPolicy = require('../lib/foodscore-preview.js');
const RATE_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
return {count, redis.call('PTTL', KEYS[1])}
`;

module.exports = async function foodFactsProxy(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  noStore(res);
  if (!(previewPolicy.enabled(process.env, req) === true)) return send(res, 503, { error: 'FoodScore barcode lookup is coming soon.' });
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.statusCode = 204;
    return res.end();
  }
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed.' });

  let body = req.body;
  if (typeof body === 'string') {
    if (body.length > 256) return send(res, 400, { error: 'A valid barcode is required.' });
    try { body = JSON.parse(body); } catch { return send(res, 400, { error: 'A valid barcode is required.' }); }
  }
  const code = body && typeof body === 'object' && !Array.isArray(body) && typeof body.barcode === 'string' ? body.barcode : '';
  if (!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(code)) {
    return send(res, 400, { error: 'A valid 8, 12, 13, or 14 digit barcode is required.' });
  }

  let redis;
  try {
    redis = redisConfiguration(process.env);
  } catch {
    return send(res, 503, { error: 'FoodScore lookup is not configured for safe shared access yet.' });
  }

  const cacheKey = `soulanova:foodscore:off:staging:v2:product:${code}`;
  let cached;
  try {
    cached = await redisCommand(redis, ['GET', cacheKey]);
  } catch {
    return send(res, 503, { error: 'FoodScore lookup is temporarily unavailable.' });
  }
  if (typeof cached === 'string') {
    try {
      return sendCached(res, JSON.parse(cached));
    } catch {
      // Ignore malformed cache data and replace it after a fresh, limited lookup.
    }
  }

  let limit;
  try {
    limit = await redisCommand(redis, ['EVAL', RATE_SCRIPT, '1', 'soulanova:foodscore:off:product-read:global', String(WINDOW_MS)]);
  } catch {
    return send(res, 503, { error: 'FoodScore lookup is temporarily unavailable.' });
  }
  const count = Number(Array.isArray(limit) ? limit[0] : NaN);
  const ttlMs = Number(Array.isArray(limit) ? limit[1] : NaN);
  if (!Number.isFinite(count) || !Number.isFinite(ttlMs)) {
    return send(res, 503, { error: 'FoodScore lookup is temporarily unavailable.' });
  }
  if (count > MAX_UPSTREAM_REQUESTS) {
    const retryAfter = Math.max(1, Math.ceil(ttlMs / 1000));
    res.setHeader('Retry-After', String(retryAfter));
    return send(res, 429, { error: `Food lookup limit reached. Try again in ${retryAfter} seconds.` });
  }

  try {
    const upstream = await fetch(`https://world.openfoodfacts.net/api/v3.6/product/${code}.json?fields=${encodeURIComponent(FIELDS)}`, {
      headers: {
        'User-Agent': 'Soulanova-FoodScore/1.0 (support@soulanova.com)',
        Accept: 'application/json',
        // OFF documents this public staging-only Basic credential; no member identity.
        Authorization: `Basic ${Buffer.from('off:off').toString('base64')}`,
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!upstream.ok) {
      if (upstream.status === 429) {
        const retryAfter = upstream.headers.get('Retry-After') || '60';
        res.setHeader('Retry-After', retryAfter);
        return send(res, 503, { error: 'Open Food Facts is temporarily rate limited. Please try again later.' });
      }
      return send(res, upstream.status >= 500 ? 503 : 502, { error: 'Open Food Facts is temporarily unavailable.' });
    }

    const payload = await upstream.json();
    if (!payload || typeof payload !== 'object' || ![0, 1, 'success'].includes(payload.status)) {
      return send(res, 502, { error: 'Open Food Facts returned an unexpected response.' });
    }
    const serialized = JSON.stringify(payload);
    const ttl = (payload.status === 1 || payload.status === 'success') && payload.product ? CACHE_TTL_SECONDS : NOT_FOUND_TTL_SECONDS;
    try {
      await redisCommand(redis, ['SET', cacheKey, serialized, 'EX', String(ttl)]);
    } catch {
      // Do not fail a successful lookup when only the cache write is unavailable.
    }
    return sendCached(res, payload);
  } catch {
    return send(res, 502, { error: 'Open Food Facts is temporarily unavailable.' });
  }
};

function redisConfiguration(env) {
  const url = new URL(env.UPSTASH_REDIS_REST_URL || '');
  const token = env.UPSTASH_REDIS_REST_TOKEN || '';
  if (url.protocol !== 'https:' || !url.hostname || url.username || url.password || url.search || url.hash || url.pathname !== '/' || !token) {
    throw Error('Shared FoodScore cache configuration is missing.');
  }
  return { url: url.origin, token };
}

async function redisCommand(redis, command) {
  const response = await fetch(redis.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${redis.token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(3_000),
  });
  if (!response.ok) throw Error('Shared FoodScore storage failed.');
  const body = await response.json();
  if (!body || Object.hasOwn(body, 'error') || !Object.hasOwn(body, 'result')) throw Error('Shared FoodScore storage failed.');
  return body.result;
}

function sendCached(res, body) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  // Product responses are cached server-side only. POST avoids exposing barcodes in
  // browser history, referrers, CDN cache keys, and the request URL.
  res.setHeader('Cache-Control', 'no-store');
  res.statusCode = 200;
  return res.end(JSON.stringify(body));
}

function noStore(res) {
  res.setHeader('Cache-Control', 'no-store');
}

function send(res, code, body) {
  noStore(res);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.statusCode = code;
  return res.end(JSON.stringify(body));
}
