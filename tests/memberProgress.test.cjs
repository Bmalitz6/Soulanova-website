'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const progress = require('../app/memberProgress.js');

const session = (overrides = {}) => ({
  id: 'session-1', user_id: 'member-a', workout_name: 'Tai Chi Basics',
  category: 'Tai Chi', duration_minutes: 20,
  completed_at: '2026-11-08T12:00:00.000Z', ...overrides,
});
const strength = (overrides = {}) => ({
  completion_id: 'completion-1', user_id: 'member-a', workout_title: 'Strength Foundations',
  difficulty: 'Beginner', duration_minutes: 30,
  completed_at: '2026-11-08T13:00:00.000Z', ...overrides,
});

test('empty history combines to no entries', () => {
  assert.deepEqual(progress.mergeHistory('member-a', [], []), []);
  assert.deepEqual(progress.mergeHistory('', [session()], [strength()]), []);
});

test('combines multiple workout sources while deduplicating repeated IDs', () => {
  const rows = progress.mergeHistory('member-a', [session(), session()], [strength(), strength()]);
  assert.equal(rows.length, 2);
  assert.equal(rows.reduce((sum, row) => sum + row.minutes, 0), 50);
  assert.deepEqual(rows.map(row => row.category).sort(), ['Strength', 'Tai Chi']);
});

test('history remains scoped to the requested member', () => {
  assert.deepEqual(progress.mergeHistory('member-a', [session({ user_id: 'member-b' })], [strength({ user_id: 'member-b' })]), []);
});

test('suppresses a likely same completion represented in both source tables', () => {
  const regular = session({ workout_name: 'Strength Foundations', category: 'Strength', duration_minutes: 30 });
  assert.equal(progress.mergeHistory('member-a', [regular], [strength({ completed_at: '2026-11-08T12:00:30.000Z' })]).length, 1);
});

test('only treats a missing workout_sessions table as optional', () => {
  assert.equal(progress.isMissingWorkoutSessionsTable({ code: 'PGRST205', message: "Could not find the table 'public.workout_sessions' in the schema cache" }), true);
  assert.equal(progress.isMissingWorkoutSessionsTable({ code: '42501', message: 'permission denied' }), false);
  assert.equal(progress.isMissingWorkoutSessionsTable({ code: 'PGRST205', message: "Could not find the table 'public.strength_workout_completions'" }), false);
});

test('Member Space loads the helper before app code and reads both member-filtered sources', () => {
  const html = fs.readFileSync(path.join(__dirname, '../app/index.html'), 'utf8');
  const app = fs.readFileSync(path.join(__dirname, '../app/app.js'), 'utf8');
  assert.ok(html.indexOf('/app/memberProgress.js') < html.indexOf('/app/app.js'));
  assert.match(app, /from\('workout_sessions'\)[\s\S]*?\.eq\('user_id',owner\)/);
  assert.match(app, /from\('strength_workout_completions'\)[\s\S]*?\.eq\('user_id',owner\)/);
  assert.match(app, /mergeHistory\(owner/);
  assert.match(app, /window\.location\.href='\/app\/strength\/'/);
  assert.doesNotMatch(app, /from\('strength_workout_completions'\)\.insert/);
});
