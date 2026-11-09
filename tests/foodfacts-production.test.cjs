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
  delete require.cache[apiFile];
  const previous = require.cache[configFile];
  require.cache[configFile] = { id: configFile, filename: configFile, loaded: true, exports: Object.freeze({ enabled }) };
  const handler = require(apiFile);
  delete require.cache[configFile];
  if (previous) require.cache[configFile] = previous;
  return handler;
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
async function call(handler, code = barcode, method = 'GET', headers = {}) {
  const res = response();
  await handler({ method, url: `/api/foodfacts?barcode=${encodeURIComponent(code)}`, headers }, res);
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
  assert.match(api, /enabled === true/);
  assert.match(api, /Soulanova-FoodScore\/1\.0 \(support@soulanova\.com\)/);
  assert.match(api, /api\/v3\.6\/product/);
  assert.match(api, /MAX_UPSTREAM_REQUESTS = 10/);
  assert.match(api, /EVAL', RATE_SCRIPT/);
  assert.match(api, /s-maxage=300, stale-while-revalidate=600/);
  assert.match(api, /redisConfiguration\(process\.env\)/);
  const hub = fs.readFileSync(path.resolve(__dirname, '../app/release2/index.html'), 'utf8');
  assert.doesNotMatch(hub, /openfoodfacts\.org\/api\//);
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
    const res = await call(handler, barcode, 'GET', origin ? { origin } : {});
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['Cache-Control'], 'public, max-age=0, s-maxage=300, stale-while-revalidate=600');
    assert.deepEqual(JSON.parse(res.body), fixture);
  }
  assert.equal(calls.upstreamRequests.length, 1);
  const upstream = calls.upstreamRequests[0];
  assert.ok(upstream.url.startsWith('https://world.openfoodfacts.org/api/v3.6/product/'));
  assert.equal(upstream.options.headers['User-Agent'], 'Soulanova-FoodScore/1.0 (support@soulanova.com)');
  assert.equal(upstream.options.headers.Authorization, undefined);
  assert.ok(upstream.options.signal && typeof upstream.options.signal.aborted === 'boolean');
  assert.ok(calls.commands.some(command => command[0] === 'EVAL' && command[3] === 'soulanova:foodscore:off:product-read:global'));
  assert.ok(calls.commands.some(command => command[0] === 'SET' && command[3] === 'EX' && command[4] === '3600'));
  assert.doesNotMatch(fs.readFileSync(apiFile, 'utf8'), /openfoodfacts\.net|b2ZmOm9mZg==|off:off/);
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

test('invalid barcode and unsupported method are rejected before shared services', async t => {
  setupEnabledTest(t);
  const handler = handlerWithAvailability(true); let calls = 0; const before = global.fetch;
  global.fetch = async () => { calls++; throw Error('must not fetch'); };
  t.after(() => { global.fetch = before; });
  assert.equal((await call(handler, 'http://bad.invalid')).statusCode, 400);
  assert.equal((await call(handler, barcode, 'POST')).statusCode, 405);
  assert.equal(calls, 0);
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

test('existing scoring keeps incomplete data unavailable', () => {
  const core = require('../app/soulfuel/foodscore-core.js');
  const result = core.normalizeOpenFoodFactsProduct({ product_name: 'Incomplete', nutriments: {} }, barcode);
  assert.equal(result.score.status, 'insufficient-data');
  assert.equal(result.perServing.calories, null);
});
