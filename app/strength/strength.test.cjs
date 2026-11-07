'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const mediaRoot = path.join(root, 'media');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'strengthWorkouts.json'), 'utf8'));

function checkAsset(relativePath) {
  const file = path.join(mediaRoot, decodeURIComponent(relativePath));
  assert.ok(file.startsWith(mediaRoot + path.sep), `asset must stay within media directory: ${relativePath}`);
  assert.ok(fs.statSync(file).isFile(), `asset exists: ${relativePath}`);
  return file;
}

test('web catalog preserves all 36 plans and the three approved difficulty counts', () => {
  assert.equal(catalog.exerciseCount, 17);
  assert.equal(catalog.exercises.length, 17);
  assert.equal(catalog.workouts.length, 36);
  assert.equal(new Set(catalog.workouts.map(plan => plan.id)).size, 36);
  for (const level of ['Beginner', 'Intermediate', 'Advanced']) {
    const plans = catalog.workouts.filter(plan => plan.level === level);
    assert.equal(plans.length, 12, `${level} workout count`);
    assert.equal(new Set(plans.map(plan => plan.id)).size, 12, `${level} unique ids`);
  }
});

test('every workout uses only verified catalog exercises and bundled video paths', () => {
  const ids = new Set(catalog.exercises.map(exercise => exercise.id));
  for (const plan of catalog.workouts) {
    assert.ok(ids.has(plan.thumbnailExerciseId), `${plan.id} featured exercise`);
    assert.ok(plan.exercises.length > 0, `${plan.id} exercise sequence`);
    for (const exercise of plan.exercises) {
      assert.ok(ids.has(exercise.exerciseId), `${plan.id} ${exercise.exerciseId}`);
      assert.ok(exercise.sets > 0 && exercise.restSeconds >= 0);
    }
  }
  for (const exercise of catalog.exercises) {
    const video = checkAsset(exercise.video);
    const image = checkAsset(exercise.thumbnail);
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(video)).digest('hex'), exercise.sha256, `${exercise.id} approved video checksum`);
    assert.ok(fs.statSync(image).size > 0);
  }
});

test('approved warm-up and cool-down narration assets preserve cue ordering and hashes', () => {
  for (const [videoPath, cues] of [
    [catalog.segments.warmupVideo, catalog.segments.warmupCues],
    [catalog.segments.cooldownVideo, catalog.segments.cooldownCues],
  ]) {
    checkAsset(videoPath);
    assert.equal(cues.length, 10);
    for (let index = 0; index < cues.length; index++) {
      const cue = cues[index];
      const file = checkAsset(cue.asset);
      assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'), cue.sha256, `${cue.id} narration checksum`);
      const next = cues[index + 1];
      if (next) assert.ok(cue.startSeconds + cue.durationSeconds <= next.startSeconds, `${cue.id} overlaps the next cue`);
    }
  }
});

test('level thumbnails, hero, and web player source references resolve', () => {
  checkAsset(catalog.hero);
  for (const image of Object.values(catalog.levelThumbnails)) checkAsset(image);
  const source = fs.readFileSync(path.join(root, 'strength.js'), 'utf8');
  assert.match(source, /visibilitychange/);
  assert.match(source, /strength_workout_completions/);
  assert.match(source, /video\.playsInline/);
  assert.match(source, /playback-toggle/);
  assert.match(source, /narrationForCurrentTime/);
  assert.match(source, /storagePrefix \+ member\.id/);
  const memberApp = fs.readFileSync(path.join(root, '../app.js'), 'utf8');
  assert.match(memberApp, /w\.id==='strength'[\s\S]*?\/app\/strength\//);
  const page = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(page, /supabase-js@2\.118\.0/);
});

test('library startup uses the shared Production-host classifier for protected Preview initialization', () => {
  const source = fs.readFileSync(path.join(root, 'strength.js'), 'utf8');
  assert.match(source, /progressTools\.isProductionWebsiteHost\(location\.hostname\)/);
  assert.match(source, /productionHost && !progressTools\.isExpectedSupabaseUrl\(config\.url, 'https:\/\/dscbavbnlubfmfhudqwy\.supabase\.co'\)/);
  assert.match(source, /!productionHost && window\.SOULANOVA_SUPABASE_DEVELOPMENT !== config/);
});

test('cross-platform completion migration is additive and enforces member-owned rows', () => {
  const migration = fs.readFileSync(path.join(root, '../../../Soulanova-SoulFuel/supabase/strength_workout_completions_v1.sql'), 'utf8');
  assert.match(migration, /create table if not exists public\.strength_workout_completions/);
  assert.match(migration, /completion_id uuid primary key/);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /using \(\(select auth\.uid\(\)\) = user_id\)/);
  assert.match(migration, /with check \(\(select auth\.uid\(\)\) = user_id\)/);
  assert.match(migration, /grant select, insert, delete on table public\.strength_workout_completions to authenticated/i);
  assert.doesNotMatch(migration, /service_role|workout_sessions|soulwalk_sessions/i);
});
