'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const apiFile = path.resolve(__dirname, '../api/foodfacts.js');
const configFile = path.resolve(__dirname, '../app/soulfuel/foodscore-availability.js');
function response() {
  return { headers: {}, statusCode: 200, setHeader(k, v) { this.headers[k] = v; }, end(body) { this.body = body; } };
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

test('FoodScore release gate defaults off and the direct page keeps the existing diary', () => {
  delete require.cache[configFile];
  assert.equal(require(configFile).enabled, false);
  const page = fs.readFileSync(path.resolve(__dirname, '../app/soulfuel/index.html'), 'utf8');
  const client = fs.readFileSync(path.resolve(__dirname, '../app/soulfuel/foodscore.js'), 'utf8');
  assert.match(page, /id="foodscore-coming-soon"[^>]*>Coming soon\./);
  assert.match(page, /id="foodscore-lookup" hidden>/);
  assert.match(page, /id="diary"|class="card diary"/);
  assert.ok(page.indexOf('foodscore-availability.js') < page.indexOf('foodscore.js'));
  assert.match(client, /window\.SoulanovaFoodScoreAvailability\?\.enabled === true/);
  assert.match(client, /if\(lookupEnabled\)form\.addEventListener/);
  assert.doesNotMatch(client, /https:\/\/world\.openfoodfacts\.org\/api\//);
  assert.match(client, /const endpoint='\/api\/foodfacts'/);
  const hub = fs.readFileSync(path.resolve(__dirname, '../app/release2/index.html'), 'utf8');
  assert.doesNotMatch(hub, /openfoodfacts\.org\/api\//);
  const appRoot = path.resolve(__dirname, '../app');
  const sources = [];
  function walk(dir) { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, entry.name); if (entry.isDirectory()) walk(p); else if (/\.(?:js|html)$/.test(entry.name)) sources.push([p, fs.readFileSync(p, 'utf8')]); } }
  walk(appRoot);
  const directApiCalls = sources.filter(([, text]) => /https:\/\/(?:world|us)\.openfoodfacts\.org\/api\//i.test(text));
  assert.deepEqual(directApiCalls.map(([p]) => path.relative(appRoot, p)), []);
  const entries = sources.filter(([, text]) => /href=["']\/app\/soulfuel\//.test(text));
  assert.ok(entries.length > 0);
  assert.ok(entries.every(([, text]) => /href=["']\/app\/soulfuel\//.test(text)));
});

test('disabled client leaves lookup hidden and does not attach a lookup request handler', () => {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, { id, hidden: false, value: '0123456789012', handlers: {}, classList: { toggle() {} }, addEventListener(type, fn) { this.handlers[type] = fn; }, replaceChildren() {} });
    return elements.get(id);
  };
  const calls = [];
  const window = { SoulanovaFoodScoreAvailability: { enabled: false }, SoulanovaFoodScore: { normalizeOpenFoodFactsProduct() {} } };
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../app/soulfuel/foodscore.js'), 'utf8'), {
    window,
    document: { getElementById: element },
    localStorage: { getItem() { return null; }, setItem() { calls.push('storage write'); } },
    fetch(...args) { calls.push(args); throw Error('disabled lookup must not fetch'); },
    Date, Math, AbortSignal, URL, Intl, console,
  });
  assert.equal(element('foodscore-lookup').hidden, true);
  assert.equal(element('foodscore-coming-soon').hidden, false);
  assert.equal(element('lookup-form').handlers.submit, undefined);
  assert.deepEqual(calls, []);
});

test('disabled API rejects GET, OPTIONS and alternate methods without calling Open Food Facts', async t => {
  const handler = handlerWithAvailability(false), before = global.fetch;
  let calls = 0;
  global.fetch = async () => { calls++; throw Error('disabled gate must not fetch'); };
  t.after(() => { global.fetch = before; delete require.cache[apiFile]; delete require.cache[configFile]; });
  for (const method of ['GET', 'OPTIONS', 'POST']) {
    const res = response();
    await handler({ method, url: '/api/foodfacts?barcode=0123456789012', headers: { origin: 'https://www.soulanova.com' } }, res);
    assert.equal(res.statusCode, 503, method);
    assert.equal(res.headers['Cache-Control'], 'no-store');
    assert.match(res.body, /coming soon/i);
  }
  assert.equal(calls, 0);
});

test('explicitly enabled configuration retains the existing narrowly scoped OFF proxy', async t => {
  const handler = handlerWithAvailability(true), before = global.fetch, requests = [];
  global.fetch = async (url, options) => { requests.push({ url, options }); return { status: 200, text: async () => '{"status":0}' }; };
  t.after(() => { global.fetch = before; delete require.cache[apiFile]; delete require.cache[configFile]; });
  for (const origin of [undefined, 'http://localhost:4173', 'http://127.0.0.1:4173', 'https://www.soulanova.com', 'https://unknown.invalid']) {
    const res = response();
    await handler({ method: 'GET', url: '/api/foodfacts?barcode=0123456789012', headers: { origin } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['Cache-Control'], 'no-store');
  }
  assert.equal(requests.length, 5);
  for (const r of requests) {
    assert.ok(r.url.startsWith('https://world.openfoodfacts.org/api/v3/product/'));
    assert.equal(r.options.headers.Authorization, undefined);
    assert.match(r.options.headers['User-Agent'], /^Soulanova-FoodScore\/1.0/);
  }
  const source = fs.readFileSync(apiFile, 'utf8');
  assert.doesNotMatch(source, /openfoodfacts\.net|b2ZmOm9mZg==|off:off/);
});

test('invalid barcode and unsupported method never contact upstream when explicitly enabled', async t => {
  const handler = handlerWithAvailability(true), before = global.fetch;
  global.fetch = async () => { throw Error('must not fetch'); };
  t.after(() => { global.fetch = before; delete require.cache[apiFile]; delete require.cache[configFile]; });
  for (const [method, code, status] of [['POST', '0123456789012', 405], ['GET', 'http://bad.invalid', 400]]) {
    const res = response();
    await handler({ method, url: '/api/foodfacts?barcode=' + code, headers: {} }, res);
    assert.equal(res.statusCode, status);
  }
});

test('per-instance rate limiting returns 429 without extra upstream calls when explicitly enabled', async t => {
  const handler = handlerWithAvailability(true), before = global.fetch;
  let calls = 0;
  global.fetch = async () => { calls++; return { status: 200, text: async () => '{"status":0}' }; };
  t.after(() => { global.fetch = before; delete require.cache[apiFile]; delete require.cache[configFile]; });
  for (let i = 0; i < 11; i++) {
    const res = response();
    await handler({ method: 'GET', url: '/api/foodfacts?barcode=0123456789012', headers: {} }, res);
    assert.equal(res.statusCode, i === 10 ? 429 : 200);
  }
  assert.equal(calls, 10);
});

test('upstream failure is explicit and serving data is never fabricated when enabled', async t => {
  const handler = handlerWithAvailability(true), before = global.fetch;
  global.fetch = async () => { throw Error('offline'); };
  t.after(() => { global.fetch = before; delete require.cache[apiFile]; delete require.cache[configFile]; });
  const res = response();
  await handler({ method: 'GET', url: '/api/foodfacts?barcode=0123456789012', headers: {} }, res);
  assert.equal(res.statusCode, 502);
  assert.match(res.body, /temporarily unavailable/);
});

test('existing scoring keeps incomplete data unavailable', () => {
  const core = require('../app/soulfuel/foodscore-core.js');
  const result = core.normalizeOpenFoodFactsProduct({ product_name: 'Incomplete', nutriments: {} }, '0123456789012');
  assert.equal(result.score.status, 'insufficient-data');
  assert.equal(result.perServing.calories, null);
});
