const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '../app/index.html'), 'utf8');
const homeStart = html.indexOf('<section id="home"');
const homeEnd = html.indexOf('<section id="workouts"', homeStart);
const home = html.slice(homeStart, homeEnd);

test('member home restores approved instructor, movement and recipe graphics without removing live progress IDs', () => {
  for (const marker of ['member-hero', 'member-paths', 'member-food', 'member-recipe-grid']) assert.ok(home.includes(marker), `missing ${marker}`);
  for (const id of ['home-count', 'home-minutes', 'home-plan']) assert.equal((home.match(new RegExp(`id="${id}"`, 'g')) || []).length, 1);
  assert.ok(home.includes('SoulStrength'));
  assert.ok(home.includes('/app/strength/'));
  assert.ok(home.includes('/app/walking/'));
  assert.ok(home.includes('/app/soulfuel/'));
  assert.ok(!home.includes('temporarily unavailable'));
});

test('all member-home image references resolve to bundled Development assets', () => {
  const sources = [...home.matchAll(/<img[^>]+src="([^"]+)"/g)].map(match => match[1]);
  assert.ok(sources.length >= 7);
  for (const source of sources) {
    assert.ok(source.startsWith('/'), `expected local asset: ${source}`);
    assert.ok(fs.existsSync(path.join(__dirname, '..', source.slice(1))), `missing asset: ${source}`);
  }
});
