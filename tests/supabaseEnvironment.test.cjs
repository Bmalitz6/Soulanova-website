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

test('production config contains no Development endpoint and fails closed outside approved hosts', () => {
  assert.doesNotMatch(configSource, /rhkaerduobytsmezllpe/);
  assert.equal(configuredHost('localhost'), null);
  assert.equal(configuredHost('preview.example.test'), null);
});

test('the official website domains retain the existing Production configuration', () => {
  assert.equal(new URL(configuredHost('www.soulanova.com')).hostname, 'dscbavbnlubfmfhudqwy.supabase.co');
  assert.equal(new URL(configuredHost('soulanova.com')).hostname, 'dscbavbnlubfmfhudqwy.supabase.co');
});

test('only generated Soulanova Vercel Preview hosts use the Production project', () => {
  assert.equal(new URL(configuredHost('soulanova-website-f286e1n0c-soulanova.vercel.app')).hostname, 'dscbavbnlubfmfhudqwy.supabase.co');
  assert.equal(configuredHost('another-project-f286e1n0c-soulanova.vercel.app'), null);
  assert.equal(configuredHost('soulanova-website.preview.vercel.app'), null);
});

test('approved Production Preview pages do not request the excluded Development config file', () => {
  const memberPage = fs.readFileSync(path.join(__dirname, '../app/index.html'), 'utf8');
  const strengthPage = fs.readFileSync(path.join(__dirname, '../app/strength/index.html'), 'utf8');
  for (const source of [memberPage, strengthPage]) {
    assert.ok(source.includes('/^soulanova-website-[a-z0-9]+-soulanova\\.vercel\\.app$/.test(host)'));
    assert.match(source, /if\s*\(\s*!productionDomain\s*&&\s*!protectedPreview\s*\)[\s\S]{0,160}document\.write/);
  }
});
