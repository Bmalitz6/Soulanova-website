'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const appSource = fs.readFileSync(path.join(root, 'app/app.js'), 'utf8');
const dashboard = fs.readFileSync(path.join(root, 'app/index.html'), 'utf8');
const programCatalog = JSON.parse(fs.readFileSync(path.join(root, 'app/programs/catalogs/programs.json'), 'utf8'));

test('Pilates is absent from active Workout page data, filter categories, and card metadata', () => {
  const data = appSource.match(/const workouts=\[([\s\S]*?)\n\];/);
  assert.ok(data, 'workout registry is present');
  assert.doesNotMatch(data[1], /pilates/i);
  const cards = appSource.match(/const workoutCardMeta = \{([\s\S]*?)\n\};/);
  assert.ok(cards, 'workout card metadata is present');
  assert.doesNotMatch(cards[1], /pilates/i);
  assert.match(appSource, /new Set\(workouts\.map\(w=>w\.category\)\)/, 'filter derives from the retired-program-free registry');
  assert.doesNotMatch(dashboard, /Pilates/i);
  assert.deepEqual(Object.keys(programCatalog.programs), ['strength']);
});

test('Pilates route is retired while history records remain renderable without an active catalog entry', () => {
  assert.equal(fs.existsSync(path.join(root, 'app/pilates')), false);
  assert.equal(fs.existsSync(path.join(root, 'app/pilates.html')), false);
  assert.match(appSource, /state\.history=\(data\|\|\[\]\)\.map/);
  assert.match(appSource, /category:r\.category/);
  assert.match(appSource, /label\.textContent=e\.name\|\|w\?\.title\|\|'Movement session'/);
  assert.doesNotMatch(appSource, /delete\([^)]*\).*Pilates|eq\('category','Pilates'\)/i);
});

test('other active member programs remain in the dashboard and workout data', () => {
  for (const label of ['SoulWalk', 'Strength', 'Yoga', 'Tai Chi', 'Meditation', 'Stretching', 'SoulFuel']) {
    assert.ok(dashboard.includes(`<h3>${label}</h3>`), `${label} dashboard tile remains`);
  }
  for (const label of ['Tai Chi', 'Yoga', 'Strength', 'Stretch & Mobility', 'Low-Impact Cardio', 'Meditation']) {
    assert.ok(appSource.includes(`category:'${label}'`), `${label} workout category remains`);
  }
  assert.match(appSource, /window\.location\.href='\/app\/chair-yoga\/'/);
  assert.match(dashboard, /href="\/app\/stretching\/"/);
});
