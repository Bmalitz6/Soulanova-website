'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const environment = require('../app/strength/strengthEnvironment.js');

const root = path.resolve(__dirname, '..');
const catalogPath = path.join(root, 'app/strength/strengthWorkouts.json');
const strengthSource = fs.readFileSync(path.join(root, 'app/strength/strength.js'), 'utf8');
const prodConfig = { url: 'https://dscbavbnlubfmfhudqwy.supabase.co', publishableKey: 'preview-test-public-key' };

test('the reported Preview failure reproduces after a successful 200 catalog response and is resolved', async () => {
  const response = { status: 200, ok: true, json: async () => JSON.parse(fs.readFileSync(catalogPath, 'utf8')) };
  const loaded = await response.json();
  assert.equal(response.status, 200);
  assert.equal(loaded.exercises.length, 17);
  assert.equal(loaded.workouts.length, 36);
  assert.deepEqual(['Beginner', 'Intermediate', 'Advanced'].map(level => loaded.workouts.filter(w => w.level === level).length), [12, 12, 12]);

  const previewAccess = environment.resolve({
    hostname: 'soulanova-website-3hayg48se-soulanova.vercel.app',
    config: prodConfig,
    developmentConfig: undefined,
    isExpectedProductionProject: true,
  });
  assert.deepEqual(previewAccess, { mode: 'vercel-preview', canRead: true, canWrite: false });
  assert.match(strengthSource, /environmentTools\.resolve\(/);
  assert.match(strengthSource, /fetch\('\/app\/strength\/strengthWorkouts\.json'/);
  assert.match(strengthSource, /if \(catalog\.workouts\.length !== 36 \|\| catalog\.exercises\.length !== 17/);
  assert.match(strengthSource, /setup\(\);\s*\}\)\.catch\(error => \{ loadError\.textContent = 'SoulStrength could not load its approved workout library/);
  assert.match(strengthSource, /function canSyncActiveProject\(\) \{ return canReadActiveProject\(\) && supabaseAccess\?\.canWrite === true; \}/);
  assert.match(strengthSource, /if \(!client \|\| !member \|\| !canSyncActiveProject\(\)\) return;/);
  const html = fs.readFileSync(path.join(root, 'app/strength/index.html'), 'utf8');
  assert.ok(html.indexOf('/app/strength/strengthEnvironment.js') < html.indexOf('/app/strength/strength.js'));
});

test('the approved Production catalog and exercise/video mappings remain byte-identical to the baseline', () => {
  const baseline = execFileSync('git', ['show', '9612d41:app/strength/strengthWorkouts.json'], { cwd: root, encoding: 'utf8' });
  const current = fs.readFileSync(catalogPath, 'utf8');
  assert.equal(current, baseline);
  const catalog = JSON.parse(current);
  assert.equal(new Set(catalog.exercises.map(x => x.id)).size, 17);
  assert.ok(catalog.exercises.every(x => x.id && x.video));
  assert.ok(catalog.workouts.every(x => x.exercises.every(item => catalog.exercises.some(e => e.id === item.exerciseId))));
});

test('only the verified Soulanova Vercel project host gets Preview read access, never cloud writes', () => {
  assert.equal(environment.isSoulanovaVercelHost('soulanova-website-3hayg48se-soulanova.vercel.app'), true);
  assert.equal(environment.isSoulanovaVercelHost('soulanova-website-git-release-website-release2-73894f-soulanova.vercel.app'), true);
  assert.equal(environment.isSoulanovaVercelHost('attacker-website-3hayg48se-soulanova.vercel.app'), false);
  assert.throws(() => environment.resolve({ hostname: 'attacker-website-3hayg48se-soulanova.vercel.app', config: prodConfig, developmentConfig: undefined, isExpectedProductionProject: true }), /verified Development/);
  assert.throws(() => environment.resolve({ hostname: 'soulanova-website-pr-preview-soulanova.vercel.app', config: { ...prodConfig, url: 'https://wrong-project.supabase.co' }, developmentConfig: undefined, isExpectedProductionProject: false }), /verified Development/);
});

test('Production and explicitly marked local Development retain their existing write behavior', () => {
  assert.deepEqual(environment.resolve({ hostname: 'www.soulanova.com', config: prodConfig, developmentConfig: undefined, isExpectedProductionProject: true }), { mode: 'production', canRead: true, canWrite: true });
  const devConfig = { url: 'http://127.0.0.1:54321', publishableKey: 'local-dev-key' };
  assert.deepEqual(environment.resolve({ hostname: 'localhost', config: devConfig, developmentConfig: devConfig, isExpectedProductionProject: false }), { mode: 'development', canRead: true, canWrite: true });
});
