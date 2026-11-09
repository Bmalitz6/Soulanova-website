'use strict';

// Public, read-only barcode proxy. Keeps the identifying User-Agent out of the browser
// and only forwards one narrowly-scoped product lookup (never user-provided URLs).
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_INSTANCE = 10;
const calls = [];
const FIELDS = 'code,product_name,product_name_en,brands,image_front_url,image_url,serving_size,nutriments,ingredients_text,ingredients_text_en,nutriscore_grade,nova_group';
const ALLOWED_ORIGINS = new Set(['https://soulanova.com', 'https://www.soulanova.com']);
const foodScoreAvailable = require('../app/soulfuel/foodscore-availability.js').enabled === true;

module.exports = async function foodFactsProxy(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Cache-Control', 'no-store');
  if (!foodScoreAvailable) return send(res, 503, { error: 'FoodScore barcode lookup is coming soon.' });
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.statusCode = 204;
    return res.end();
  }
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed.' });
  const url = new URL(req.url, 'http://localhost');
  const code = url.searchParams.get('barcode') || '';
  if (!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(code)) return send(res, 400, { error: 'A valid 8, 12, 13, or 14 digit barcode is required.' });
  const now = Date.now();
  while (calls.length && calls[0] < now - WINDOW_MS) calls.shift();
  if (calls.length >= MAX_REQUESTS_PER_INSTANCE) return send(res, 429, { error: 'Food lookup limit reached. Try again in a minute.' });
  calls.push(now);
  try {
    const headers = { 'User-Agent': 'Soulanova-FoodScore/1.0 (https://soulanova.com/contact)', Accept: 'application/json' };
    const host = 'world.openfoodfacts.org';
    const upstream = await fetch(`https://${host}/api/v3/product/${code}.json?fields=${encodeURIComponent(FIELDS)}`, {
      headers,
      signal: AbortSignal.timeout(12_000),
    });
    const body = await upstream.text();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = upstream.status;
    return res.end(body);
  } catch {
    return send(res, 502, { error: 'Open Food Facts is temporarily unavailable.' });
  }
};

function send(res, code, body) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.statusCode = code;
  return res.end(JSON.stringify(body));
}
