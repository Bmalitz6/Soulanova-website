'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const apiFile = path.resolve(__dirname, '../api/foodfacts.js');
const configFile = path.resolve(__dirname, '../app/soulfuel/foodscore-availability.js');
const redisUrl = 'https://soulanova-test.upstash.io';
const barcode = '0123456789012';
function response() {
  return { headers: {}, statusCode: 200, setHeader(key, value) { this.headers[key] = value; }, end(body) { this.body = body; } };
}
function handlerWithAvailability(enabled) {
  const handler = require(apiFile);
  return (req, res) => {
    const keys = { VERCEL: '1', VERCEL_ENV: 'preview', VERCEL_TARGET_ENV: 'preview', VERCEL_PROJECT_ID: 'prj_dMMzPIdHf9o5dXuGu8qL3db0fu2I', VERCEL_GIT_COMMIT_REF: 'feature/soulfuel-preview', VERCEL_GIT_COMMIT_SHA: 'a'.repeat(40), FOODSCORE_PREVIEW_APPROVED_BRANCH: 'feature/soulfuel-preview', FOODSCORE_PREVIEW_APPROVED_COMMIT: 'a'.repeat(40), VERCEL_URL: 'soulfuel-test.vercel.app', FOODSCORE_PREVIEW_ENABLED: String(enabled), FOODSCORE_PREVIEW_APPROVED: 'true', FOODSCORE_PREVIEW_PROTECTION_CONFIRMED: 'true' };
    const before = Object.fromEntries(Object.keys(keys).map(key => [key, process.env[key]]));
    Object.assign(process.env, keys);
    req.headers.host = keys.VERCEL_URL;
    if (req.headers.origin) req.headers.origin = `https://${keys.VERCEL_URL}`;
    return handler(req, res).finally(() => { for (const key of Object.keys(keys)) { if (before[key] === undefined) delete process.env[key]; else process.env[key] = before[key]; } });
  };
}
function setupEnabledTest(t) {
  const oldUrl = process.env.UPSTASH_REDIS_REST_URL;
  const oldToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  process.env.UPSTASH_REDIS_REST_URL = redisUrl;
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-only-token';
  const oldFetch = global.fetch;
  t.after(() => {
    global.fetch = oldFetch;
    if (oldUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL; else process.env.UPSTASH_REDIS_REST_URL = oldUrl;
    if (oldToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN; else process.env.UPSTASH_REDIS_REST_TOKEN = oldToken;
    delete require.cache[apiFile]; delete require.cache[configFile];
  });
}
function mockRedisAndOff({ onUpstream, onRedis } = {}) {
  const cache = new Map(), commands = [], upstreamRequests = [];
  let rateCount = 0;
  global.fetch = async (url, options = {}) => {
    if (url === redisUrl) {
      const command = JSON.parse(options.body);
      commands.push(command);
      const result = onRedis ? await onRedis(command, cache, () => ++rateCount) : await defaultRedis(command, cache, () => ++rateCount);
      return { ok: true, status: 200, json: async () => ({ result }) };
    }
    upstreamRequests.push({ url, options });
    return onUpstream ? onUpstream(url, options) : jsonResponse(200, { status: 0 });
  };
  return { cache, commands, upstreamRequests };
}
async function defaultRedis(command, cache, increment) {
  if (command[0] === 'GET') return cache.get(command[1]) ?? null;
  if (command[0] === 'EVAL') return [increment(), 60_000];
  if (command[0] === 'SET') { cache.set(command[1], command[2]); return 'OK'; }
  throw Error('unexpected Redis command: ' + command[0]);
}
function jsonResponse(status, body, headers = {}) {
  return { ok: status >= 200 && status < 300, status, headers: { get: name => headers[name] || headers[name.toLowerCase()] || null }, json: async () => body };
}
async function call(handler, code = barcode, method = 'POST', headers = {}) {
  const res = response();
  await handler({ method, url: '/api/foodfacts', headers, body: method === 'POST' ? { barcode: code } : undefined }, res);
  return res;
}

test('FoodScore release gate defaults off and the direct page keeps diary and accurate OFF attribution', () => {
  delete require.cache[configFile];
  assert.equal(require(configFile).enabled, false);
  const page = fs.readFileSync(path.resolve(__dirname, '../app/soulfuel/index.html'), 'utf8');
  const client = fs.readFileSync(path.resolve(__dirname, '../app/soulfuel/foodscore.js'), 'utf8');
  const api = fs.readFileSync(apiFile, 'utf8');
  assert.match(page, /id="foodscore-coming-soon"[^>]*>Coming soon\./);
  assert.match(page, /id="foodscore-lookup" hidden>/);
  assert.match(page, /id="diary"|class="card diary"/);
  assert.ok(page.indexOf('foodscore-availability.js') < page.indexOf('foodscore.js'));
  for (const license of ['ODbL', 'DbCL', 'CC BY-SA 3.0']) assert.ok(page.includes(license));
  assert.match(client, /window\.SoulanovaFoodScoreAvailability\?\.enabled === true/);
  assert.match(client, /if\(lookupEnabled\)form\.addEventListener/);
  assert.match(client, /Retry-After/);
  assert.doesNotMatch(client, /https:\/\/world\.openfoodfacts\.org\/api\//);
  assert.match(client, /const endpoint='\/api\/foodfacts'/);
  assert.match(client, /method:'POST'/);
  assert.match(api, /previewPolicy\.enabled\(process\.env, req\) === true/);
  assert.match(api, /Soulanova-FoodScore\/1\.0 \(support@soulanova\.com\)/);
  assert.match(api, /api\/v3\.6\/product/);
  assert.match(api, /MAX_UPSTREAM_REQUESTS = 10/);
  assert.match(api, /EVAL', RATE_SCRIPT/);
  assert.match(api, /Cache-Control', 'no-store'/);
  assert.match(api, /redisConfiguration\(process\.env\)/);
  const appRoot = path.resolve(__dirname, '../app'), sources = [];
  function walk(dir) { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const file = path.join(dir, entry.name); if (entry.isDirectory()) walk(file); else if (/\.(?:js|html)$/.test(entry.name)) sources.push([file, fs.readFileSync(file, 'utf8')]); } }
  walk(appRoot);
  const directCalls = sources.filter(([, text]) => /https:\/\/(?:world|us)\.openfoodfacts\.org\/api\//i.test(text));
  assert.deepEqual(directCalls.map(([file]) => path.relative(appRoot, file)), []);
  const entries = sources.filter(([, text]) => /href=["']\/app\/soulfuel\//.test(text));
  assert.ok(entries.length > 0 && entries.every(([, text]) => /href=["']\/app\/soulfuel\//.test(text)));
});

test('disabled client hides lookup and registers no barcode submit handler or network request', () => {
  const elements = new Map();
  const element = id => { if (!elements.has(id)) elements.set(id, { id, hidden: false, value: barcode, handlers: {}, classList: { toggle() {} }, addEventListener(type, fn) { this.handlers[type] = fn; }, replaceChildren() {} }); return elements.get(id); };
  const calls = [];
  const window = { SoulanovaFoodScoreAvailability: { enabled: false }, SoulanovaFoodScore: { normalizeOpenFoodFactsProduct() {} } };
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../app/soulfuel/foodscore.js'), 'utf8'), {
    window, document: { getElementById: element }, localStorage: { getItem() { return null; }, setItem() { calls.push('storage write'); } },
    fetch(...args) { calls.push(args); throw Error('disabled lookup must not fetch'); }, Date, Math, AbortSignal, URL, Intl, console,
  });
  assert.equal(element('foodscore-lookup').hidden, true);
  assert.equal(element('foodscore-coming-soon').hidden, false);
  assert.equal(element('lookup-form').handlers.submit, undefined);
  assert.deepEqual(calls, []);
});

test('default-off server gate rejects GET, OPTIONS and alternate methods before Redis or OFF', async t => {
  const handler = handlerWithAvailability(false); let calls = 0; const before = global.fetch;
  global.fetch = async () => { calls++; throw Error('disabled gate must not fetch'); };
  t.after(() => { global.fetch = before; delete require.cache[apiFile]; delete require.cache[configFile]; });
  for (const method of ['GET', 'OPTIONS', 'POST']) {
    const res = await call(handler, barcode, method, { origin: 'https://www.soulanova.com' });
    assert.equal(res.statusCode, 503, method);
    assert.equal(res.headers['Cache-Control'], 'no-store');
    assert.match(res.body, /coming soon/i);
  }
  assert.equal(calls, 0);
});

test('an enabled lookup fails closed without shared Redis configuration', async t => {
  const handler = handlerWithAvailability(true), oldUrl = process.env.UPSTASH_REDIS_REST_URL, oldToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.UPSTASH_REDIS_REST_URL; delete process.env.UPSTASH_REDIS_REST_TOKEN;
  let calls = 0; const before = global.fetch;
  global.fetch = async () => { calls++; throw Error('must fail before upstream'); };
  t.after(() => { global.fetch = before; if (oldUrl !== undefined) process.env.UPSTASH_REDIS_REST_URL = oldUrl; if (oldToken !== undefined) process.env.UPSTASH_REDIS_REST_TOKEN = oldToken; delete require.cache[apiFile]; delete require.cache[configFile]; });
  const res = await call(handler);
  assert.equal(res.statusCode, 503);
  assert.match(res.body, /not configured/);
  assert.equal(res.headers['Cache-Control'], 'no-store');
  assert.equal(calls, 0);
});

test('valid lookup uses the identified v3.6 endpoint and shared cache with explicit attribution fields', async t => {
  setupEnabledTest(t);
  const handler = handlerWithAvailability(true), fixture = { status: 1, product: { code: barcode, product_name: 'Fixture product', nutriments: {} } };
  const calls = mockRedisAndOff({ onUpstream: async (url, options) => jsonResponse(200, fixture) });
  for (const origin of [undefined, 'http://localhost:4173', 'https://www.soulanova.com', 'https://unknown.invalid']) {
    const res = await call(handler, barcode, 'POST', origin ? { origin } : {});
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['Cache-Control'], 'no-store');
    assert.deepEqual(JSON.parse(res.body), fixture);
  }
  assert.equal(calls.upstreamRequests.length, 1);
  const upstream = calls.upstreamRequests[0];
  assert.ok(upstream.url.startsWith('https://world.openfoodfacts.net/api/v3.6/product/'));
  assert.equal(upstream.options.headers['User-Agent'], 'Soulanova-FoodScore/1.0 (support@soulanova.com)');
  assert.equal(upstream.options.headers.Authorization, 'Basic '+Buffer.from('off:off').toString('base64'));
  assert.ok(upstream.options.signal && typeof upstream.options.signal.aborted === 'boolean');
  assert.ok(calls.commands.some(command => command[0] === 'EVAL' && command[3] === 'soulanova:foodscore:off:product-read:global'));
  assert.ok(calls.commands.some(command => command[0] === 'SET' && command[3] === 'EX' && command[4] === '3600'));
  assert.doesNotMatch(fs.readFileSync(apiFile, 'utf8'), /https:\/\/world\.openfoodfacts\.org\/api/);
});

test('shared cached product responses avoid both another rate-limit slot and upstream request', async t => {
  setupEnabledTest(t);
  const handler = handlerWithAvailability(true), fixture = { status: 1, product: { code: barcode, product_name: 'Fixture product' } };
  const calls = mockRedisAndOff({ onUpstream: async () => jsonResponse(200, fixture) });
  const first = await call(handler); const second = await call(handler);
  assert.equal(first.statusCode, 200); assert.equal(second.statusCode, 200);
  assert.equal(calls.upstreamRequests.length, 1);
  assert.equal(calls.commands.filter(command => command[0] === 'EVAL').length, 1);
  assert.equal(calls.commands.filter(command => command[0] === 'SET').length, 1);
});

test('one shared atomic limiter caps all cache misses at ten per minute', async t => {
  setupEnabledTest(t);
  const handler = handlerWithAvailability(true), calls = mockRedisAndOff({ onUpstream: async () => jsonResponse(200, { status: 0 }) });
  for (let i = 0; i < 11; i++) {
    const res = await call(handler, String(1000000000000 + i));
    assert.equal(res.statusCode, i === 10 ? 429 : 200);
    if (i === 10) { assert.equal(res.headers['Retry-After'], '60'); assert.match(res.body, /Try again in 60 seconds/); }
  }
  assert.equal(calls.upstreamRequests.length, 10);
  assert.equal(calls.commands.filter(command => command[0] === 'EVAL').length, 11);
  assert.ok(calls.commands.filter(command => command[0] === 'EVAL').every(command => command[3] === 'soulanova:foodscore:off:product-read:global'));
});

test('malformed barcode and unsupported method are rejected before shared services', async t => {
  setupEnabledTest(t);
  const handler = handlerWithAvailability(true); let calls = 0; const before = global.fetch;
  global.fetch = async () => { calls++; throw Error('must not fetch'); };
  t.after(() => { global.fetch = before; });
  assert.equal((await call(handler, 'http://bad.invalid')).statusCode, 400);
  assert.equal((await call(handler, barcode, 'GET')).statusCode, 405);
  assert.equal(calls, 0);
});

test('unknown barcode result is briefly cached without storing it in browser/CDN caches', async t => {
  setupEnabledTest(t);
  const handler = handlerWithAvailability(true), calls = mockRedisAndOff({ onUpstream: async () => jsonResponse(200, { status: 0 }) });
  const first = await call(handler, '4000000000002'), second = await call(handler, '4000000000002');
  assert.equal(first.statusCode, 200); assert.deepEqual(JSON.parse(first.body), { status: 0 });
  assert.equal(first.headers['Cache-Control'], 'no-store');
  assert.equal(calls.upstreamRequests.length, 1);
  assert.ok(calls.commands.some(command => command[0] === 'SET' && command[3] === 'EX' && command[4] === '300'));
});

test('shared storage failure and malformed counter fail closed without an upstream call', async t => {
  setupEnabledTest(t);
  const handler = handlerWithAvailability(true), before = global.fetch; let upstreamCalls = 0;
  global.fetch = async (url, options) => {
    if (url !== redisUrl) { upstreamCalls++; throw Error('must not query OFF'); }
    const command = JSON.parse(options.body);
    return command[0] === 'GET' ? jsonResponse(200, { result: null }) : jsonResponse(200, { result: 'invalid counter' });
  };
  t.after(() => { global.fetch = before; });
  const res = await call(handler);
  assert.equal(res.statusCode, 503); assert.equal(upstreamCalls, 0);
});

test('Redis network failure fails closed and never reaches Open Food Facts', async t => {
  setupEnabledTest(t);
  const handler = handlerWithAvailability(true), before = global.fetch; let upstreamCalls = 0;
  global.fetch = async (url) => { if (url === redisUrl) throw Error('Redis unavailable'); upstreamCalls++; throw Error('provider must not be called'); };
  t.after(() => { global.fetch = before; });
  const res = await call(handler, '4000000000005');
  assert.equal(res.statusCode, 503);
  assert.equal(res.headers['Cache-Control'], 'no-store');
  assert.equal(upstreamCalls, 0);
});

test('upstream 429, 503, invalid payload and network failure are not cached', async t => {
  setupEnabledTest(t);
  const handler = handlerWithAvailability(true), before = global.fetch;
  for (const [status, jsonBody, expected] of [[429, {}, 503], [503, {}, 503], [200, { unexpected: true }, 502]]) {
    const calls = mockRedisAndOff({ onUpstream: async () => jsonResponse(status, jsonBody, { 'Retry-After': '45' }) });
    const res = await call(handler, String(1000000001000 + status));
    assert.equal(res.statusCode, expected);
    assert.equal(calls.commands.filter(command => command[0] === 'SET').length, 0);
    if (status === 429) assert.equal(res.headers['Retry-After'], '45');
  }
  const calls = mockRedisAndOff({ onUpstream: async () => { throw Error('offline'); } });
  const res = await call(handler, '1000000002000');
  assert.equal(res.statusCode, 502); assert.equal(calls.commands.filter(command => command[0] === 'SET').length, 0);
  global.fetch = before;
});

test('malformed provider JSON and request timeouts fail safely without caching', async t => {
  setupEnabledTest(t);
  const handler = handlerWithAvailability(true);
  const malformed = mockRedisAndOff({ onUpstream: async () => ({ ok: true, status: 200, json: async () => { throw Error('invalid JSON'); } }) });
  const malformedResponse = await call(handler, '4000000000003');
  assert.equal(malformedResponse.statusCode, 502);
  assert.equal(malformed.commands.filter(command => command[0] === 'SET').length, 0);
  const timeout = mockRedisAndOff({ onUpstream: async (_url, options) => { assert.equal(options.signal.aborted, false); throw new DOMException('timed out', 'TimeoutError'); } });
  const timeoutResponse = await call(handler, '4000000000004');
  assert.equal(timeoutResponse.statusCode, 502);
  assert.equal(timeout.commands.filter(command => command[0] === 'SET').length, 0);
});

test('existing scoring keeps incomplete data unavailable', () => {
  const core = require('../app/soulfuel/foodscore-core.js');
  const result = core.normalizeOpenFoodFactsProduct({ product_name: 'Incomplete', nutriments: {} }, barcode);
  assert.equal(result.score.status, 'insufficient-data');
  assert.equal(result.perServing.calories, null);
  assert.equal(result.per100g.fat, null);
  const missing = core.scaleProductNutrition(result, 2);
  assert.equal(missing.values.calories, null);
  assert.equal(missing.values.fat, null);
});

test('product diary nutrition scales by reported servings or explicitly entered grams only', () => {
  const core = require('../app/soulfuel/foodscore-core.js');
  const product = core.normalizeOpenFoodFactsProduct({
    code: barcode, product_name: 'Scaled fixture', serving_size: '30 g',
    nutriments: {
      'energy-kcal_100g': 200, 'energy-kcal_serving': 60,
      'proteins_100g': 10, 'proteins_serving': 3,
      'carbohydrates_100g': 20, 'carbohydrates_serving': 6,
      'fat_100g': 8, 'fat_serving': 2.4,
      'fiber_100g': 4, 'fiber_serving': 1.2,
    },
  }, barcode);
  const servings = core.scaleProductNutrition(product, 1.5, '');
  assert.equal(servings.values.calories, 90);
  assert.equal(servings.values.protein, 4.5);
  assert.equal(servings.values.fat, 3.5999999999999996);
  assert.equal(servings.values.sugar, null);
  assert.equal(servings.basis, '1.5 servings');
  const grams = core.scaleProductNutrition(product, 1, 75);
  assert.equal(grams.values.calories, 150);
  assert.equal(grams.values.protein, 7.5);
  assert.equal(grams.basis, '75 g');
  assert.throws(() => core.scaleProductNutrition(product, 0), /greater than zero/);
  assert.throws(() => core.scaleProductNutrition(product, 1, -2), /greater than zero/);
});

test('malformed JSON request bodies fail before Redis or provider requests', async t => {
  setupEnabledTest(t);
  const handler = handlerWithAvailability(true), before = global.fetch; let calls = 0;
  global.fetch = async () => { calls++; throw Error('must not fetch'); };
  t.after(() => { global.fetch = before; delete require.cache[apiFile]; delete require.cache[configFile]; });
  for (const body of ['{broken', 'x'.repeat(300), [], null]) {
    const res = response();
    await handler({ method: 'POST', url: '/api/foodfacts', headers: {}, body }, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.headers['Cache-Control'], 'no-store');
  }
  assert.equal(calls, 0);
});

for(const stage of ['CACHE_READ','RATE_LIMIT'])test(`Redis ${stage} diagnostic distinguishes HTTP failure without leaking provider details`,async t=>{
 setupEnabledTest(t);const handler=handlerWithAvailability(true);let calls=0;
 global.fetch=async(url,options)=>{calls++;const command=JSON.parse(options.body);if(stage==='RATE_LIMIT'&&command[0]==='GET')return jsonResponse(200,{result:null});return jsonResponse(401,{error:'secret-provider-detail'});};
 const res=await call(handler);assert.equal(res.statusCode,503);assert.equal(JSON.parse(res.body).code,`REDIS_${stage}_HTTP_401`);assert.doesNotMatch(res.body,/test-only-token|secret-provider-detail|upstash.io/);assert.equal(calls,stage==='CACHE_READ'?1:2);
});
test('Redis malformed limiter result is distinct and blocks OFF',async t=>{
 setupEnabledTest(t);const calls=mockRedisAndOff({onRedis:async command=>command[0]==='GET'?null:'invalid'});const res=await call(handlerWithAvailability(true));assert.equal(res.statusCode,503);assert.equal(JSON.parse(res.body).code,'REDIS_RATE_LIMIT_INVALID_RESULT');assert.equal(calls.upstreamRequests.length,0);
});
