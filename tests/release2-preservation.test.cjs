'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function normalizeReviewedReleaseDelta(file, actual) {
  if (!['app/app.js', 'app/index.html', 'app/member-preview.css', '.vercelignore', 'app/strength/index.html', 'app/strength/strength.js'].includes(file)) return actual;
  let source = actual.toString('utf8');
  if (file === 'app/app.js') return Buffer.from(source
    .replace("let returnAfterSignIn=['/app/walking/','/app/walking/freestyle/'].includes(new URLSearchParams(location.search).get('next'))?new URLSearchParams(location.search).get('next'):null;\n", '')
    .replace("title:'SoulStretch'", "title:'Move with Ease'")
    .replace("mobility: {label:'SOULSTRETCH', cta:'Explore Stretching'", "mobility: {label:'STRETCH & MOBILITY', cta:'View Session'")
    .replace("  if(w.id==='mobility'){window.location.href='/app/stretching/';return;}\n\n", '')
    .replace("duration.textContent=w.id==='mobility'?'3 GUIDED ROUTINES':w.minutes+' MIN · '+w.category;", "duration.textContent=w.minutes+' MIN · '+w.category;")
    .replace("renderStats();if(user&&returnAfterSignIn&&!recoveryActive){const destination=returnAfterSignIn;returnAfterSignIn=null;window.location.replace(destination);}}", "renderStats();}"));
  if (file === 'app/index.html') {
    source = source.replace('<p><a href="/app/release2/">Release 2 Development review &amp; browser reminders</a></p>', '');
    source = source.replace('<a class="accessories-tab member-direct-link" href="/app/soulfuel/">SoulFuel</a><a class="accessories-tab member-direct-link" href="/app/walking/">SoulWalk</a>', '');
    source = source.replace('<a class="member-path" href="/app/strength/"><img src="/app/images/workouts/strength.jpg" width="600" height="338" alt="Soulanova movement instructor leading a gentle strength exercise" loading="lazy"><div><span class="eyebrow">MOVE AT YOUR PACE</span><h3>SoulStrength</h3><p>Go directly to the Beginner, Intermediate, or Advanced strength library.</p><strong>Choose your strength program ↗</strong></div></a>', '<a class="member-path" href="/app/?mode=signin#workouts"><img src="/app/images/workouts/strength.jpg" width="600" height="338" alt="Soulanova movement instructor leading a gentle strength exercise" loading="lazy"><div><span class="eyebrow">MOVE AT YOUR PACE</span><h3>Explore workouts</h3><p>Browse the existing movement library and choose a session that feels right.</p><strong>Find a workout ↗</strong></div></a>');
    source = source.replace(/\n<section aria-labelledby="member-programs-title">[\s\S]*?<\/section>(?=\n<section class="member-food")/, '');
    return Buffer.from(source);
  }
  if (file === 'app/member-preview.css') {
    const marker = '/* Direct member entries use one anchor for the entire card, including its image. */';
    assert.ok(source.includes(marker));
    return Buffer.from(source.slice(0, source.indexOf(marker)));
  }
  if (file === '.vercelignore') {
    const marker = '# SoulStretch source copies remain in this worktree and are excluded only';
    assert.ok(source.includes(marker));
    return Buffer.from(source.slice(0, source.indexOf(marker)));
  }
  if (file === 'app/strength/index.html') {
    const line = '  <script src="/app/strength/strengthEnvironment.js"></script>\n';
    assert.ok(source.includes(line));
    return Buffer.from(source.replace(line, ''));
  }
  if (file === 'app/strength/strength.js') {
    const baselineEnvironment = `  function canSyncActiveProject() {
    return !!(client && activeSupabaseUrl && progressTools?.isExpectedSupabaseUrl(client.supabaseUrl, activeSupabaseUrl));
  }`;
    source = source
      .replace('  const environmentTools = window.SoulanovaStrengthEnvironment;\n', '')
      .replace('  let supabaseAccess = null;\n', '')
      .replace(`  function canReadActiveProject() {
    return !!(client && activeSupabaseUrl && progressTools?.isExpectedSupabaseUrl(client.supabaseUrl, activeSupabaseUrl));
  }
  function canSyncActiveProject() { return canReadActiveProject() && supabaseAccess?.canWrite === true; }`, baselineEnvironment)
      .replace('!canReadActiveProject()) return;', '!canSyncActiveProject()) return;');
    const configStart = source.indexOf('    const config = window.SOULANOVA_SUPABASE;');
    const clientStart = source.indexOf('    client = window.supabase.createClient', configStart);
    assert.ok(configStart >= 0 && clientStart > configStart);
    return Buffer.from(source.slice(0, configStart) + `    const productionHost = ['soulanova.com', 'www.soulanova.com'].includes(location.hostname.toLowerCase());
    const config = window.SOULANOVA_SUPABASE;
    if (!config?.url || !config?.publishableKey) throw Error('A verified Supabase configuration is required for SoulStrength accounts.');
    if (productionHost && !progressTools.isExpectedSupabaseUrl(config.url, 'https://dscbavbnlubfmfhudqwy.supabase.co')) throw Error('SoulStrength Production must use the approved Production Supabase project.');
    if (!productionHost && window.SOULANOVA_SUPABASE_DEVELOPMENT !== config) throw Error('A verified Development Supabase configuration is required for non-production SoulStrength accounts.');
    activeSupabaseUrl = config.url;
` + source.slice(clientStart));
  }
  return Buffer.from(source);
}

test('baseline files stay exact except reviewed Release 2 deltas', () => {
  const files = execFileSync('git', ['ls-tree', '-r', '--name-only', '9612d41'], { cwd: root, encoding: 'utf8' }).trim().split('\n');
  for (const file of files) {
    const actual = normalizeReviewedReleaseDelta(file, fs.readFileSync(path.join(root, file)));
    const expected = execFileSync('git', ['show', '9612d41:' + file], { cwd: root, maxBuffer: 120 * 1024 * 1024 });
    assert.deepEqual(actual, expected, file);
  }
});

test('all 17 live Meditation sessions are retained with independent recorded controls', () => {
  const source = read('app/meditation.js');
  const sessions = JSON.parse(source.match(/const sessions=(\[.*\]);/)[1]);
  assert.equal(sessions.length, 17);
  assert.match(source, /playGeneration/);
  assert.match(source, /recordedOcean/);
  assert.match(source, /voiceVolume/);
});

test('Pilates remains absent from public offerings', () => {
  assert.doesNotMatch(read('index.html'), /pilates/i);
  assert.doesNotMatch(read('app/app.js'), /pilates/i);
  assert.doesNotMatch(read('accessories/index.html'), /pilates/i);
});

test('SoulWalk writes remain closed at both existing gates', () => {
  assert.match(read('app/walking/walking.js'), /const accountWritesEnabled=false/);
  assert.match(read('app/member-data.mjs'), /soulwalk:false/);
  assert.doesNotMatch(read('app/walking/walking.js'), /testWrites|TEST_WRITES/);
});

test('22-clip index preserves reviewed hashes and records only the explicit owner approval', () => {
  const rows = JSON.parse(read('docs/release2/soulstretch-review.json'));
  assert.equal(rows.length, 22);
  assert.equal(new Set(rows.map(row => row.filename)).size, 22);
  assert.ok(rows.every(row => row.movement && row.approval_status === 'Owner-approved for Production — exact reviewed SHA-256'));
  const prior = JSON.parse(read('docs/release2/soulstretch-review-preapproval.json'));
  assert.deepEqual(rows.map(row => [row.filename, row.movement, row.sha256]), prior.map(row => [row.filename, row.movement, row.sha256]));
});
