const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const configSource = fs.readFileSync(path.join(__dirname, '../app/config.js'), 'utf8');

function configuredHost(hostname) {
  const window = {};
  vm.runInNewContext(configSource, { window, location: { hostname }, URL });
  return window.SOULANOVA_SUPABASE?.url ?? null;
}

test('production config contains no Development endpoint and fails closed on non-production hosts', () => {
  assert.doesNotMatch(configSource, /rhkaerduobytsmezllpe/);
  assert.equal(configuredHost('localhost'), null);
  assert.equal(configuredHost('preview.example.test'), null);
});

test('the official website domains retain the existing Production configuration', () => {
  assert.equal(new URL(configuredHost('www.soulanova.com')).hostname, 'dscbavbnlubfmfhudqwy.supabase.co');
  assert.equal(new URL(configuredHost('soulanova.com')).hostname, 'dscbavbnlubfmfhudqwy.supabase.co');
});
