const test = require('node:test');
const assert = require('node:assert/strict');
const progress = require('../app/strength/strengthProgress.js');

const record = (completion_id, user_id, workout_id, completed_at) => ({
  completion_id, user_id, workout_id, workout_title: workout_id, difficulty: 'Beginner', duration_minutes: 18, completed_at,
});

test('sync accepts only the exact HTTPS origin selected for the current environment', () => {
  const development = 'https://rhkaerduobytsmezllpe.supabase.co';
  const production = 'https://dscbavbnlubfmfhudqwy.supabase.co';
  assert.equal(progress.isExpectedSupabaseUrl(development, development), true);
  assert.equal(progress.isExpectedSupabaseUrl(production, production), true);
  assert.equal(progress.isExpectedSupabaseUrl(development, production), false);
  assert.equal(progress.isExpectedSupabaseUrl('http://dscbavbnlubfmfhudqwy.supabase.co', production), false);
  assert.equal(progress.isExpectedSupabaseUrl('not a url', production), false);
});

test('protected SoulStrength Vercel Preview is classified as Production during initialization', () => {
  const previewHost = 'soulanova-website-ri97xjx4w-soulanova.vercel.app';
  const production = 'https://dscbavbnlubfmfhudqwy.supabase.co';
  assert.equal(progress.isProductionWebsiteHost(previewHost), true);
  assert.equal(progress.isExpectedSupabaseUrl(production, 'https://dscbavbnlubfmfhudqwy.supabase.co'), true);
  assert.equal(progress.isProductionWebsiteHost('another-project-ri97xjx4w-soulanova.vercel.app'), false);
  assert.equal(progress.isProductionWebsiteHost('soulstrength-preview.vercel.app'), false);
});

test('completion merge is member-isolated and idempotent by stable completion id', () => {
  const local = [record('completion-a', 'member-a', 'beginner-one', '2026-11-06T12:00:00.000Z')];
  const remote = [
    record('completion-a', 'member-a', 'beginner-one', '2026-11-06T12:00:00.000Z'),
    record('completion-b', 'member-a', 'beginner-two', '2026-11-07T12:00:00.000Z'),
    record('completion-private', 'member-b', 'beginner-secret', '2026-11-07T13:00:00.000Z'),
  ];
  const merged = progress.mergeCompletionRecords('member-a', local, remote);
  assert.deepEqual(merged.map(item => item.completion_id), ['completion-b', 'completion-a']);
  assert.deepEqual(progress.completionCounts(merged), { 'beginner-two': 1, 'beginner-one': 1 });
});

test('recommendation selects the next uncompleted routine, then the least recently completed', () => {
  const workouts = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const records = [record('one', 'member-a', 'a', '2026-11-05T12:00:00.000Z')];
  assert.equal(progress.getRecommendedWorkout(workouts, records).id, 'b');
  records.push(record('two', 'member-a', 'b', '2026-11-06T12:00:00.000Z'), record('three', 'member-a', 'c', '2026-11-07T12:00:00.000Z'));
  assert.equal(progress.getRecommendedWorkout(workouts, records).id, 'a');
});

test('offline retry queue includes only unsynced completions owned by the active member', () => {
  const records = [
    record('synced', 'member-a', 'beginner-one', '2026-11-05T12:00:00.000Z'),
    record('pending', 'member-a', 'beginner-two', '2026-11-06T12:00:00.000Z'),
    record('other-member', 'member-b', 'beginner-three', '2026-11-06T13:00:00.000Z'),
  ];
  assert.deepEqual(progress.pendingCompletionRecords('member-a', records, new Set(['synced'])).map(item => item.completion_id), ['pending']);
});
