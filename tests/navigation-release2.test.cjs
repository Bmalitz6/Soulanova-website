'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('dashboard retains three featured cards and an accessible six-category workout library', () => {
  const html = read('app/index.html');
  const cardCount = (html.match(/class="member-path"/g) || []).length;
  assert.equal(cardCount, 3);
  assert.match(html, /href="\/app\/classes\/beginner-tai-chi-foundations\/"/);
  assert.match(html, /href="\/app\/\?mode=signin#meditation"/);
  assert.match(html, /href="\/app\/\?mode=signin#workouts"/);
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
