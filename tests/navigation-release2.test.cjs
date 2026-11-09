'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('dashboard keeps featured recommendations and an optional six-category workout directory', () => {
  const html = read('app/index.html');
  const cardCount = (html.match(/class="member-path"/g) || []).length;
  assert.equal(cardCount, 6);
  assert.match(html, /href="\/app\/classes\/beginner-tai-chi-foundations\/"/);
  assert.match(html, /href="\/app\/\?mode=signin#meditation"/);
  assert.match(html, /href="\/app\/strength\/"/);
  assert.match(html, /href="\/app\/stretching\/"/);
  assert.match(html, /href="\/app\/walking\/"/);
  assert.match(html, /href="\/app\/soulfuel\/"/);
  assert.match(html, /All Workouts directory/);
  const cards = [...html.matchAll(/<a class="member-path"[\s\S]*?<\/a>/g)].map(x => x[0]);
  assert.equal(cards.length, 6);
  for (const card of cards) {
    assert.doesNotMatch(card.replace(/^<a\b[^>]*>|<\/a>$/g, ''), /<(?:a|button|input|select)\b/i, 'one anchor owns the entire clickable card');
    assert.match(card, /<img\b/);
    assert.match(card, /<strong>/);
  }
  assert.match(html, /data-tab="home"/);
  assert.match(html, /data-tab="workouts"/);
  assert.match(html, /id="workout-list"/);

  const source = read('app/app.js');
  const match = source.match(/const workouts=(\[.*?\]);\nconst days=/s);
  assert.ok(match, 'workout catalog is present');
  const workouts = vm.runInNewContext(match[1]);
  assert.equal(new Set(workouts.map(workout => workout.category)).size, 6);
  assert.deepEqual(Array.from(workouts, workout => workout.id), ['tai', 'yoga', 'strength', 'mobility', 'cardio', 'meditation']);
});

test('Strength, SoulStretch, Tai Chi and Meditation enter their existing libraries directly', () => {
  const source = read('app/app.js');
  assert.match(source, /if\(w\.id==='strength'\)\{\s*window\.location\.href='\/app\/strength\/'/);
  assert.match(source, /if\(w\.id==='mobility'\)\{window\.location\.href='\/app\/stretching\/'/);
  assert.match(source, /if\(w\.id==='tai' && window\.SoulanovaClasses\)\{\s*window\.SoulanovaClasses\.open\(\)/);
  assert.match(source, /if\(w\.id==='meditation' && window\.SoulanovaMeditation\)\{\s*window\.SoulanovaMeditation\.open\(\)/);
  assert.match(read('app/player.js'), /window\.SoulanovaClasses=\{open:\(\)=>showLibrary\(false\),close:leaveLibrary\}/);
  assert.match(read('app/meditation.js'), /window\.SoulanovaMeditation=\{open\(\)/);
  assert.match(read('app/strength/index.html'), /href="\/app\/"/);
  assert.match(read('app/stretching/index.html'), /href="\/app\/"/);
  assert.match(read('app/classes/beginner-tai-chi-foundations/index.html'), /href="\/app"/);

  const meditation = read('app/meditation.js');
  const sessions = JSON.parse(meditation.match(/const sessions=(\[.*\]);/)[1]);
  assert.equal(sessions.length, 17);
});

test('SoulFuel and distinct SoulWalk experiences have direct authenticated entry paths', () => {
  const html = read('app/index.html');
  assert.match(html, /<a class="accessories-tab member-direct-link" href="\/app\/soulfuel\/">SoulFuel<\/a>/);
  assert.match(html, /<a class="accessories-tab member-direct-link" href="\/app\/walking\/">SoulWalk<\/a>/);
  const fuel = read('app/soulfuel/index.html');
  assert.match(fuel, /href="\/app\/#free-library">Mediterranean recipes/);
  assert.match(fuel, /href="\/app\/#meals">Meal planning/);
  assert.match(fuel, /href="#diary">Food diary/);
  assert.match(fuel, /id="diary"/);
  assert.match(fuel, /Coming soon\. Barcode lookup is temporarily unavailable/);
  const guided = read('app/walking/index.html');
  const freestyle = read('app/walking/freestyle/index.html');
  assert.match(guided, /Guided · 12-Week Journey/);
  assert.match(guided, /href="\/app\/walking\/freestyle\/"/);
  assert.match(freestyle, /Freestyle · Walk at your own pace/);
  assert.match(freestyle, /does not save or synchronize/);
  assert.match(read('app/walking/freestyle/freestyle.js'), /import \{requireMember\} from '\/app\/member-data\.mjs'/);
  assert.match(read('app/app.js'), /returnAfterSignIn=.*\/app\/walking\/freestyle\//);
  assert.match(read('app/walking/walking.js'), /const accountWritesEnabled=false/);
  assert.match(read('app/member-data.mjs'), /soulwalk:false/);
});
