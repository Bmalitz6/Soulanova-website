'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const catalog = require('../app/chair-yoga/catalog.json');
const plan = require('../app/chair-yoga/chair-yoga-programs.json');
const narration = require('../app/chair-yoga/narration-drafts.json');
const player = require('../app/chair-yoga/chair-yoga-playback.js');
const { matrixCsv } = require('../scripts/export-chair-yoga-matrix.js');
const matrix = fs.readFileSync(path.join(__dirname, '../docs/chair-yoga/proposed-36-workout-matrix.csv'), 'utf8');
const route = fs.readFileSync(path.join(__dirname, '../app/chair-yoga/index.html'), 'utf8');
const ui = fs.readFileSync(path.join(__dirname, '../app/chair-yoga/chair-yoga.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../app/chair-yoga/chair-yoga.css'), 'utf8');
const dashboard = fs.readFileSync(path.join(__dirname, '../app/index.html'), 'utf8');
const narrationReviewPage = fs.readFileSync(path.join(__dirname, '../docs/chair-yoga/narration-audio-review.html'), 'utf8');
const narrationAudioManifest = require('../app/chair-yoga/narration/review-2026-11-12-paula/review-manifest.json');

function fakeClock() {
  let time = 0;
  let nextId = 1;
  const timers = new Map();
  return {
    now: () => time,
    setTimeout(callback, delay) { const id = nextId++; timers.set(id, { at: time + delay, callback }); return id; },
    clearTimeout(id) { timers.delete(id); },
    advance(ms) {
      const target = time + ms;
      while (true) {
        const next = [...timers.entries()].filter(([, timer]) => timer.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        const [id, timer] = next;
        timers.delete(id);
        time = timer.at;
        timer.callback();
      }
      time = target;
    },
    pending: () => timers.size
  };
}

function makeController(levelId) {
  const clock = fakeClock();
  const calls = [];
  const ctl = player.createChairYogaPlayback({
    levels: plan.levels,
    movements: catalog.movements,
    loopCountsByLevel: plan.playback.loopCountsByLevel,
    transitionDurationMs: plan.playback.transitionDurationSeconds * 1000,
    assignmentRules: plan.assignmentRules,
    effects: {
      now: clock.now,
      setTimeout: clock.setTimeout,
      clearTimeout: clock.clearTimeout,
      startPass: (movement, details) => calls.push(['start', movement.id, details.pass, details.loopCount]),
      replayPass: (movement, details) => calls.push(['replay', movement.id, details.pass, details.loopCount]),
      stopMedia: () => calls.push(['stop'])
    }
  });
  ctl.selectLevel(levelId);
  return { ctl, clock, calls };
}

function currentLevel(levelId) { return plan.levels.find(item => item.id === levelId); }
function finishMovement(ctl, loops) {
  for (let pass = 1; pass <= loops; pass++) {
    const snapshot = ctl.getSnapshot();
    assert.equal(snapshot.phase, 'playing');
    assert.equal(snapshot.pass, pass);
    assert.equal(ctl.videoEnded(snapshot.generation, snapshot.currentMovement.id), true);
    if (pass < loops) {
      const replay = ctl.getSnapshot();
      assert.equal(replay.pass, pass + 1);
      assert.equal(ctl.markVideoPlaying(replay.generation, replay.currentMovement.id), true);
    }
  }
}

function finishWholeWorkout(ctl, clock, program, loops) {
  ctl.start(program.id);
  assert.equal(ctl.getSnapshot().currentProgram.id, program.id);
  for (let index = 0; index < 12; index++) {
    const movement = ctl.getSnapshot().currentMovement;
    assert.equal(movement.id, program.movementIds[index]);
    finishMovement(ctl, loops);
    if (index < 11) {
      const transition = ctl.getSnapshot();
      assert.equal(transition.phase, 'transitioning');
      assert.equal(transition.nextMovement.id, program.movementIds[index + 1]);
      clock.advance(5000);
      const next = ctl.getSnapshot();
      assert.equal(next.phase, 'playing');
      assert.equal(next.movementIndex, index + 1);
      assert.equal(next.pass, 1);
    }
  }
  const completed = ctl.getSnapshot();
  assert.equal(completed.phase, 'complete');
  assert.equal(completed.completedCount, 12);
  assert.equal(completed.currentProgram.id, program.id);
  assert.equal(ctl.next(), false);
  return completed;
}

test('proposal exposes 12 complete workouts per level and leaves every assignment pending owner approval', () => {
  assert.equal(plan.proposalStatus, 'pending_owner_approval');
  assert.equal(plan.totalWorkouts, 36);
  assert.equal(plan.movementsPerWorkout, 12);
  assert.deepEqual(plan.playback.loopCountsByLevel, { beginner: 2, intermediate: 3, advanced: 4 });
  assert.equal(plan.playback.transitionDurationSeconds, 5);
  assert.equal(plan.levels.length, 3);
  assert.deepEqual(plan.levels.map(level => level.workouts.length), [12, 12, 12]);
  assert.ok(plan.levels.every(level => level.assignmentStatus === 'pending_owner_approval'));
  assert.ok(plan.levels.flatMap(level => level.workouts).every(workout => workout.approvalStatus === 'pending_owner_approval'));
});

test('the 36 named workouts each have a distinct ordered 12-movement sequence and use only the 36 catalog assets', () => {
  const workouts = plan.levels.flatMap(level => level.workouts);
  assert.equal(new Set(workouts.map(workout => workout.id)).size, 36);
  assert.equal(new Set(workouts.map(workout => workout.title)).size, 36);
  assert.equal(new Set(workouts.map(workout => workout.movementIds.join(','))).size, 36);
  assert.ok(workouts.every(workout => workout.movementIds.length === 12 && new Set(workout.movementIds).size === 12));
  assert.deepEqual([...new Set(workouts.flatMap(workout => workout.movementIds))].sort(), catalog.movements.map(item => item.id).sort());
  assert.equal(catalog.movements.length, 36);
});

test('proposed level boundaries keep advanced-only poses out of Beginner and Intermediate', () => {
  const beginnerExcluded = new Set(plan.assignmentRules.beginnerExcludedMovementIds);
  const intermediateExcluded = new Set(plan.assignmentRules.intermediateExcludedMovementIds);
  assert.ok(currentLevel('beginner').workouts.every(workout => workout.movementIds.every(id => !beginnerExcluded.has(id))));
  assert.ok(currentLevel('intermediate').workouts.every(workout => workout.movementIds.every(id => !intermediateExcluded.has(id))));
  assert.ok(plan.assignmentRules.designPrinciples.every(item => typeof item === 'string'));
});

test('every included unilateral movement appears with its paired side immediately after, Right then Left', () => {
  for (const workout of plan.levels.flatMap(level => level.workouts)) {
    for (const pair of plan.assignmentRules.bilateralPairs) {
      const right = workout.movementIds.indexOf(pair.right);
      const left = workout.movementIds.indexOf(pair.left);
      assert.equal(right >= 0, left >= 0, `${workout.id} ${pair.family} pair`);
      if (right >= 0) assert.equal(left, right + 1, `${workout.id} ${pair.family} order`);
    }
  }
  assert.equal(player.validatePlaylist(plan.levels, catalog.movements, plan.playback.loopCountsByLevel, plan.assignmentRules), true);
});

test('owner-review CSV exposes one complete ordered row per proposed workout and matches the source plan', () => {
  const rows = matrix.trimEnd().split('\n');
  assert.equal(rows.length, 37);
  assert.equal(matrix, matrixCsv(plan, catalog));
  assert.match(rows[0], /"proposal_status".*"ordered_movement_names"/);
  assert.ok(rows.slice(1).every(row => row.includes('PENDING OWNER APPROVAL')));
});

test('duration estimates use exact video durations, configured loops and eleven five-second transitions', () => {
  const summaries = {};
  for (const level of plan.levels) {
    const { ctl } = makeController(level.id);
    summaries[level.id] = ctl.getLevelSummary(level.id);
    assert.equal(summaries[level.id].workoutCount, 12);
    assert.equal(summaries[level.id].loopsPerMovement, plan.playback.loopCountsByLevel[level.id]);
    assert.ok(summaries[level.id].workoutSummaries.every(summary => summary.movementCount === 12 && summary.transitionSeconds === 55));
  }
  assert.ok(summaries.beginner.minEstimatedTotalSeconds >= 751 && summaries.beginner.maxEstimatedTotalSeconds <= 753.5);
  assert.ok(summaries.intermediate.minEstimatedTotalSeconds >= 1099 && summaries.intermediate.maxEstimatedTotalSeconds <= 1102.7);
  assert.ok(summaries.advanced.minEstimatedTotalSeconds >= 1447 && summaries.advanced.maxEstimatedTotalSeconds <= 1452);
  const special = catalog.movements.find(item => item.id === 'IMG_4286');
  assert.equal(special.durationSeconds, 30.2);
});

test('level selection exposes 12 workouts; choosing one starts its first exact movement and correct level', () => {
  const { ctl } = makeController('intermediate');
  assert.equal(ctl.getSnapshot().phase, 'workout-selection');
  assert.equal(ctl.getLevelSummary('intermediate').workoutCount, 12);
  const selected = currentLevel('intermediate').workouts[7];
  assert.equal(ctl.start(selected.id), true);
  const state = ctl.getSnapshot();
  assert.equal(state.phase, 'playing');
  assert.equal(state.currentProgram.id, selected.id);
  assert.equal(state.currentMovement.id, selected.movementIds[0]);
  assert.equal(state.levelName, 'Intermediate');
});

test('manual Next synchronizes the active movement counter and progress for all 36 workouts without crediting skips', () => {
  for (const level of plan.levels) for (const workout of level.workouts) {
    const { ctl } = makeController(level.id);
    ctl.start(workout.id);
    let state = ctl.getSnapshot();
    let progress = player.getWorkoutProgress(state, { currentTime: 14.5, duration: 29, mediaMatches: true });
    assert.equal(progress.currentMovementNumber, 1, `${workout.id} starts at movement 1`);
    assert.equal(progress.movementLabel, 'Movement 1 of 12', `${workout.id} start label`);
    assert.equal(progress.completedCount, 0, `${workout.id} starts with no completed movements`);
    assert.ok(progress.progress > 0, `${workout.id} active movement advances the progress bar`);

    assert.equal(ctl.next(), true, `${workout.id} manual Next succeeds while playing`);
    state = ctl.getSnapshot();
    progress = player.getWorkoutProgress(state, { currentTime: 14.5, duration: 29, mediaMatches: false });
    assert.equal(state.movementIndex, 1);
    assert.equal(state.currentMovement.id, workout.movementIds[1]);
    assert.equal(progress.currentMovementNumber, 2, `${workout.id} immediately displays movement 2`);
    assert.equal(progress.movementLabel, 'Movement 2 of 12', `${workout.id} Next label`);
    assert.equal(progress.completedCount, 0, `${workout.id} skipped first movement is not completed`);
    assert.equal(progress.progress, 0, `${workout.id} new video resets its active-segment progress`);
  }

  const { ctl } = makeController('beginner');
  const workout = currentLevel('beginner').workouts[0];
  ctl.start(workout.id);
  finishMovement(ctl, 2);
  let state = ctl.getSnapshot();
  assert.equal(state.phase, 'transitioning');
  let progress = player.getWorkoutProgress(state);
  assert.equal(progress.currentMovementNumber, 1);
  assert.equal(progress.completedCount, 1);
  assert.equal(progress.progress, 1 / 12);

  assert.equal(ctl.next(), true, 'Next during the black transition starts the upcoming movement immediately');
  state = ctl.getSnapshot();
  progress = player.getWorkoutProgress(state, { currentTime: 28, duration: 29, mediaMatches: false });
  assert.equal(state.phase, 'playing');
  assert.equal(state.currentMovement.id, workout.movementIds[1]);
  assert.equal(progress.currentMovementNumber, 2);
  assert.equal(progress.movementLabel, 'Movement 2 of 12');
  assert.equal(progress.completedCount, 1);
  assert.equal(progress.progress, 1 / 12, 'the transition-completed movement remains counted, not the next one');
});

test('visible movement counter text follows current index exactly through repeated Next clicks', () => {
  const { ctl } = makeController('beginner');
  const workout = currentLevel('beginner').workouts[0];
  ctl.start(workout.id);
  assert.equal(player.getWorkoutProgress(ctl.getSnapshot()).movementLabel, 'Movement 1 of 12');
  assert.equal(ctl.next(), true);
  assert.equal(player.getWorkoutProgress(ctl.getSnapshot()).movementLabel, 'Movement 2 of 12');
  assert.equal(ctl.next(), true);
  assert.equal(player.getWorkoutProgress(ctl.getSnapshot()).movementLabel, 'Movement 3 of 12');
  assert.equal(player.getWorkoutProgress(ctl.getSnapshot()).completedCount, 0, 'skipped movements remain incomplete');
});

test('complete workouts across all 36 proposals loop correctly, transition, and stop at workout completion', () => {
  for (const level of plan.levels) {
    const { ctl, clock, calls } = makeController(level.id);
    const loops = plan.playback.loopCountsByLevel[level.id];
    for (const workout of level.workouts) {
      const result = finishWholeWorkout(ctl, clock, workout, loops);
      assert.equal(result.completedCount, 12, `${workout.id} completed segment count`);
      assert.equal(result.phase, 'complete', `${workout.id} phase`);
      assert.equal(result.levelId, level.id, `${workout.id} remains in its level`);
      assert.equal(clock.pending(), 0);
    }
    assert.equal(calls.filter(call => call[0] === 'start').length, 12 * 12);
    assert.equal(calls.filter(call => call[0] === 'replay').length, 12 * 12 * (loops - 1));
  }
});

test('pause/resume freezes the video loop and transition countdown; Next skips and cancels its timer', () => {
  const { ctl, clock } = makeController('beginner');
  const workout = currentLevel('beginner').workouts[0];
  ctl.start(workout.id);
  assert.equal(ctl.pause(), true);
  assert.equal(ctl.getSnapshot().phase, 'paused');
  assert.equal(ctl.getSnapshot().pass, 1);
  let summary = player.getWorkoutProgress(ctl.getSnapshot());
  assert.equal(summary.currentMovementNumber, 1);
  assert.equal(summary.completedCount, 0);
  assert.equal(ctl.resume(), true);
  assert.equal(player.getWorkoutProgress(ctl.getSnapshot()).currentMovementNumber, 1);
  finishMovement(ctl, 2);
  assert.equal(ctl.getSnapshot().phase, 'transitioning');
  clock.advance(2100);
  assert.equal(ctl.pause(), true);
  assert.equal(ctl.getSnapshot().pausedFrom, 'transitioning');
  assert.equal(ctl.getSnapshot().transitionRemainingMs, 2900);
  clock.advance(10000);
  assert.equal(ctl.getSnapshot().phase, 'paused');
  assert.equal(ctl.resume(), true);
  clock.advance(1000);
  assert.equal(ctl.getSnapshot().phase, 'transitioning');
  assert.equal(ctl.next(), true);
  assert.equal(ctl.getSnapshot().movementIndex, 1);
  summary = player.getWorkoutProgress(ctl.getSnapshot());
  assert.equal(summary.currentMovementNumber, 2);
  assert.equal(summary.completedCount, 1);
  assert.equal(summary.progress, 1 / 12);
  clock.advance(5000);
  assert.equal(ctl.getSnapshot().movementIndex, 1);
});

test('Previous and Restart preserve the selected workout, and completion does not advance to another workout or level', () => {
  const { ctl, clock } = makeController('advanced');
  const workout = currentLevel('advanced').workouts[4];
  ctl.start(workout.id);
  assert.equal(ctl.next(), true); assert.equal(ctl.getSnapshot().movementIndex, 1);
  assert.equal(player.getWorkoutProgress(ctl.getSnapshot()).currentMovementNumber, 2);
  assert.equal(ctl.previous(), true); assert.equal(ctl.getSnapshot().movementIndex, 0);
  assert.equal(player.getWorkoutProgress(ctl.getSnapshot()).currentMovementNumber, 1);
  finishMovement(ctl, 4); assert.equal(ctl.getSnapshot().phase, 'transitioning');
  assert.equal(ctl.restart(), true); assert.equal(ctl.getSnapshot().pass, 1);
  assert.equal(player.getWorkoutProgress(ctl.getSnapshot()).currentMovementNumber, 1);
  const completed = finishWholeWorkout(ctl, clock, workout, 4);
  assert.equal(completed.phase, 'complete');
  assert.equal(completed.currentProgram.id, workout.id);
  assert.equal(ctl.getSnapshot().programsTotal, 12);
  const finalProgress = player.getWorkoutProgress(ctl.getSnapshot());
  assert.equal(finalProgress.currentMovementNumber, 12);
  assert.equal(finalProgress.movementLabel, 'Movement 12 of 12');
  assert.equal(finalProgress.completedCount, 12);
  assert.equal(finalProgress.progress, 1);
  assert.equal(ctl.start(currentLevel('advanced').workouts[5].id), true);
  assert.equal(ctl.getSnapshot().currentProgram.id, currentLevel('advanced').workouts[5].id);
});

test('Back to Workouts and Back to Levels are explicit controller states and cancel pending transitions', () => {
  const { ctl } = makeController('beginner');
  const workout = currentLevel('beginner').workouts[0];
  ctl.start(workout.id); finishMovement(ctl, 2);
  assert.equal(ctl.getSnapshot().phase, 'transitioning');
  assert.equal(ctl.backToWorkouts(), true);
  assert.equal(ctl.getSnapshot().phase, 'workout-selection');
  assert.equal(ctl.getSnapshot().programsTotal, 12);
  assert.equal(ctl.backToLevels(), true);
  assert.equal(ctl.getSnapshot().phase, 'level-selection');
  assert.equal(ctl.getSnapshot().levelId, null);
});

test('member navigation is direct and entire level/workout cards are single accessible buttons', () => {
  assert.match(dashboard, /id="chair-yoga-dashboard-entry" href="\/app\/chair-yoga\//);
  assert.match(dashboard, /<h3>Chair Yoga<\/h3>/);
  assert.doesNotMatch(dashboard, /id="chair-yoga-dashboard-entry"[^>]*data-wellness-category=/);
  assert.match(ui, /document\.createElement\('button'\)[\s\S]*card\.className = 'level-card'/);
  assert.match(ui, /const card = document\.createElement\('button'\); card\.type = 'button'; card\.className = 'workout-card'/);
  assert.doesNotMatch(ui, /card\.append\([^;]*button/i);
  assert.match(route, /id="back-to-levels"[^>]*>← Back to Levels/);
  assert.match(route, /id="back-to-workouts"[^>]*>← Back to Workouts/);
  assert.match(css, /button\.level-card:focus-visible/);
  assert.match(css, /\.workout-card:focus-visible/);
  assert.match(route, /href="\/docs\/chair-yoga\/proposed-36-workout-matrix\.csv"/);
});

test('pause/Up Next and completion screens use actual selected-workout movement names and thumbnails', () => {
  for (const id of ['transition-screen','transition-current','transition-up-next-label','transition-next','transition-thumbnail','transition-resume','transition-next-button','transition-status','completion-screen','completion-workouts','back-to-workouts','previous-workout','next-workout','restart-workout']) assert.match(route, new RegExp(`id="${id}"`));
  assert.match(ui, /snap\.nextMovement\.thumbnailUrl/);
  assert.match(ui, /snap\.currentProgram\?\.movementIds/);
  assert.match(ui, /getWorkoutProgress\(snap/);
  assert.match(ui, /Movement \$\{progress\.currentMovementNumber\} of \$\{progress\.totalMovements\}/);
  assert.match(ui, /\$\('#movement-counter'\)\.textContent = progress\.movementLabel/);
  assert.match(route, /id="movement-counter"[^>]*>Movement 1 of 12<\/span>/);
  assert.match(route, /aria-label="Workout progress by movement time; skipped movements are excluded"/);
  assert.match(ui, /Movement \$\{progress\.currentMovementNumber\} of \$\{progress\.totalMovements\}/);
  assert.match(ui, /video\.addEventListener\('loadedmetadata', updateProgress\)/);
  assert.match(ui, /video\.addEventListener\('seeked', updateProgress\)/);
  assert.match(ui, /FINAL MOVEMENT IN THIS WORKOUT/);
  assert.match(route, /WORKOUT COMPLETE/);
  assert.match(css, /\.transition-screen[^{]*\{[^}]*background:#000/);
  assert.match(css, /@media\(max-width:760px\)/);
  assert.match(css, /@media\(max-width:400px\)/);
  assert.match(route, /playsinline/);
});

test('all 36 movement scripts provide four distinct, duration-bounded loop cues keyed to catalog IDs', () => {
  assert.equal(narration.schemaVersion, 2);
  assert.equal(narration.drafts.length, 36);
  assert.equal(new Set(plan.levels.flatMap(level => level.workouts.flatMap(workout => workout.movementIds))).size, 36, 'the proposed matrix uses all 36 catalog movements');
  for (const movement of catalog.movements) {
    const record = narration.drafts.find(item => item.movementId === movement.id);
    assert.ok(record, `${movement.id} has narration scripts`);
    assert.equal(record.movementName, movement.name);
    assert.equal(record.videoUrl, movement.videoUrl);
    assert.equal(record.videoDurationSeconds, movement.durationSeconds);
    assert.deepEqual(Object.keys(record.loopScripts), ['1','2','3','4']);
    assert.equal(new Set(Object.values(record.loopScripts).map(loop => loop.script)).size, 4, `${movement.id} has a distinct cue for every loop`);
    for (let pass = 1; pass <= 4; pass++) {
      const loop = record.loopScripts[String(pass)];
      assert.ok(loop.script.length > 0);
      assert.equal(loop.cuePlan[0].atSeconds, 0);
      assert.ok(loop.estimatedSpokenSeconds < movement.durationSeconds, `${movement.id} loop ${pass} leaves quiet time`);
      assert.equal(loop.expectedAudioFilename, `${movement.id}_loop-${pass}.mp3`);
      assert.equal(loop.audioStatus, 'not_generated_pending_owner_review');
      assert.equal(loop.audioUrl, null);
      assert.equal(loop.audioSha256, null);
    }
    assert.equal(record.loopScripts['1'].script, record.script);
  }
  const rightSideIds = ['IMG_4286','IMG_4288','IMG_4294','IMG_4299','IMG_4303','IMG_4305','IMG_4307','IMG_4310','IMG_4312','IMG_4314','IMG_4316','IMG_4321'];
  const leftSideIds = ['IMG_4287','IMG_4289','IMG_4296','IMG_4300','IMG_4304','IMG_4306','IMG_4308','IMG_4311','IMG_4313','IMG_4315','IMG_4317','IMG_4322'];
  for (const id of rightSideIds) for (const loop of Object.values(narration.drafts.find(item => item.movementId === id).loopScripts)) assert.doesNotMatch(loop.script, /\bleft\b/i, `${id} must not narrate the opposite side`);
  for (const id of leftSideIds) for (const loop of Object.values(narration.drafts.find(item => item.movementId === id).loopScripts)) assert.doesNotMatch(loop.script, /\bright\b/i, `${id} must not narrate the opposite side`);
  for (const level of ['beginner','intermediate','advanced']) {
    assert.equal(narration.levelOpenings[level].audioStatus, 'not_generated_pending_owner_review');
    assert.equal(narration.levelClosings[level].audioStatus, 'not_generated_pending_owner_review');
    assert.ok(narration.levelOpenings[level].estimatedSpokenSeconds < 29);
    assert.ok(narration.levelClosings[level].estimatedSpokenSeconds < 29);
  }
});

test('narration remains separate, hash-gated and loop-specific; workout assignments remain pending approval', () => {
  assert.equal(narration.voiceApprovalStatus, 'pending_owner_approval');
  assert.equal(narration.bulkAudioStatus, 'not_started_pending_owner_review_of_voice_and_scripts');
  assert.equal(plan.proposalStatus, 'pending_owner_approval');
  assert.match(route, /member narration remains disabled until each loop recording is approved/);
  assert.match(ui, /getApprovedNarrationForPass\(narrationRecord\(workout\), pass\)/);
  assert.match(ui, /asset\.audioSha256\.toLowerCase\(\)/);
  assert.match(ui, /audioSha256/);
  assert.equal(narration.drafts.some(item => item.audioStatus === 'owner-approved'), false);
  assert.equal(narration.drafts.some(item => Object.values(item.loopScripts).some(loop => loop.audioStatus === 'owner-approved')), false);
});

test('narration resolver selects only the matching owner-approved loop recording with a valid hash', () => {
  const loop1 = { audioUrl: '/review/loop1.mp3', audioSha256: 'a'.repeat(64), audioStatus: 'owner-approved' };
  const loop2 = { audioUrl: '/review/loop2.mp3', audioSha256: 'b'.repeat(64), audioStatus: 'owner-approved' };
  const record = { loopScripts: { '1': loop1, '2': loop2 } };
  assert.equal(player.getApprovedNarrationForPass(record, 1), loop1);
  assert.equal(player.getApprovedNarrationForPass(record, 2), loop2);
  assert.equal(player.getApprovedNarrationForPass(record, 3), null);
  assert.equal(player.getApprovedNarrationForPass({ loopScripts: { '1': { ...loop1, audioStatus: 'pending' } } }, 1), null);
  assert.equal(player.getApprovedNarrationForPass({ loopScripts: { '1': { ...loop1, audioSha256: 'bad' } } }, 1), null);
});

test('Paula audition and Beginner demo files match review hashes and stay out of active workout mappings', () => {
  assert.equal(narrationAudioManifest.reviewStatus, 'pending_owner_listening_review');
  assert.equal(narrationAudioManifest.activeMemberAudio, false);
  assert.equal(narrationAudioManifest.creditAccounting.totalCreditsUsed, 17);
  assert.equal(narrationAudioManifest.creditAccounting.bulkNarrationGenerated, false);
  assert.equal(narrationAudioManifest.voice.preset, 'Paula');
  assert.equal(narrationAudioManifest.voice.model, 'eleven_multilingual_v2');
  assert.equal(narrationAudioManifest.demo.movementId, 'IMG_4285');
  assert.equal(narrationAudioManifest.demo.loopTracksAreDistinct, true);
  for (const asset of narrationAudioManifest.assets) {
    const file = path.join(__dirname, '../app/chair-yoga/narration/review-2026-11-12-paula', asset.filename);
    const bytes = fs.readFileSync(file);
    assert.equal(bytes.length, asset.bytes, `${asset.filename} size`);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), asset.sha256, `${asset.filename} hash`);
    assert.equal(asset.audioStatus, 'review_only_not_owner_approved');
  }
  for (const movement of narration.drafts) for (const loop of Object.values(movement.loopScripts)) {
    assert.equal(loop.audioStatus, 'not_generated_pending_owner_review');
    assert.equal(loop.audioUrl, null);
    assert.equal(loop.audioSha256, null);
  }
  assert.match(narrationReviewPage, /OWNER LISTENING REVIEW · NOT MEMBER NARRATION/);
  assert.match(narrationReviewPage, /Play complete Beginner demo/);
  assert.match(narrationReviewPage, /Include narration/);
  assert.match(narrationReviewPage, /Narration volume/);
  assert.match(narrationReviewPage, /video only; narration is off/);
  assert.match(narrationReviewPage, /video and matching narration starting together/);
});
