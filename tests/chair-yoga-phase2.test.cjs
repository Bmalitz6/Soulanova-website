'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const catalog = require('../app/chair-yoga/catalog.json');
const plan = require('../app/chair-yoga/chair-yoga-programs.json');
const narration = require('../app/chair-yoga/narration-drafts.json');
const player = require('../app/chair-yoga/chair-yoga-playback.js');
const html = fs.readFileSync(path.join(__dirname, '../app/chair-yoga/index.html'), 'utf8');
const ui = fs.readFileSync(path.join(__dirname, '../app/chair-yoga/chair-yoga.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../app/chair-yoga/chair-yoga.css'), 'utf8');

test('proposed levels contain 12 distinct catalog movements each and cover all 36 in original catalog order references', () => {
  assert.equal(plan.proposalStatus, 'pending_owner_approval');
  assert.equal(plan.levels.length, 3);
  assert.equal(plan.levels.map(level => level.workoutIds.length).join(','), '12,12,12');
  const assigned = plan.levels.flatMap(level => level.workoutIds);
  assert.equal(new Set(assigned).size, 36);
  assert.deepEqual([...assigned].sort(), catalog.movements.map(item => item.id).sort());
  assert.equal(catalog.movements.length, 36);
  assert.deepEqual(catalog.movements.map(item => item.position), Array.from({ length: 36 }, (_, i) => i + 1));
  assert.deepEqual(catalog.movements.slice(-3).map(item => item.id), ['IMG_4321', 'IMG_4322', 'IMG_4323']);
  assert.ok(catalog.movements.every(item => item.mediaStatus === 'candidate_pending_owner_review'));
});

test('all 36 draft scripts are movement-specific, cue-timed, and fit within their actual video windows', () => {
  assert.equal(narration.generationStatus, 'not_generated');
  assert.equal(narration.voiceApprovalStatus, 'pending_owner_approval');
  assert.equal(narration.drafts.length, 36);
  for (const draft of narration.drafts) {
    assert.ok(draft.script.length > 0, draft.movementId);
    assert.equal(draft.audioUrl, undefined);
    assert.equal(draft.audioStatus, 'not_generated_pending_owner_approval');
    assert.equal(draft.cuePlan.length, 4, draft.movementId);
    assert.ok(draft.estimatedSpokenSeconds <= draft.videoDurationSeconds - 2, `${draft.movementId} timing`);
    assert.equal(catalog.movements.find(item => item.id === draft.movementId).name, draft.movementName);
  }
});

test('each movement replays twice then automatically advances through all 12 and completes once', () => {
  const calls = [];
  const ctl = player.createChairYogaPlayback({ levels: plan.levels, movements: catalog.movements, effects: {
    startPass: (workout, info) => calls.push(['start', workout.id, info.pass]),
    replayPass: (workout, info) => calls.push(['replay', workout.id, info.pass]),
    stopMedia: () => calls.push(['stop'])
  } });
  ctl.selectLevel('beginner'); ctl.start();
  let s = ctl.getSnapshot();
  assert.equal(s.phase, 'playing'); assert.equal(s.pass, 1); assert.equal(s.workoutIndex, 0);
  assert.equal(ctl.videoEnded(s.generation, s.currentWorkout.id), true);
  s = ctl.getSnapshot(); assert.equal(s.pass, 2); assert.equal(s.phase, 'playing');
  ctl.markVideoPlaying(s.generation, s.currentWorkout.id);
  assert.equal(ctl.videoEnded(s.generation, s.currentWorkout.id), true);
  s = ctl.getSnapshot(); assert.equal(s.phase, 'playing'); assert.equal(s.completedCount, 1);
  assert.equal(s.currentWorkout.id, 'IMG_4297'); assert.equal(s.workoutIndex, 1); assert.equal(s.pass, 1);
  assert.equal(ctl.videoEnded(s.generation - 1, 'IMG_4285'), false);
  for (let index = 1; index < 12; index++) {
    s = ctl.getSnapshot(); assert.equal(s.phase, 'playing'); assert.equal(s.workoutIndex, index);
    assert.equal(ctl.videoEnded(s.generation, s.currentWorkout.id), true);
    s = ctl.getSnapshot(); assert.equal(s.pass, 2); assert.equal(s.workoutIndex, index);
    ctl.markVideoPlaying(s.generation, s.currentWorkout.id);
    assert.equal(ctl.videoEnded(s.generation, s.currentWorkout.id), true);
  }
  s = ctl.getSnapshot(); assert.equal(s.phase, 'complete'); assert.equal(s.completedCount, 12);
  assert.equal(s.workoutIndex, 11); assert.equal(ctl.next(), false);
  assert.deepEqual(calls.filter(row => ['start','replay'].includes(row[0])).slice(0,3), [['start','IMG_4285',1],['replay','IMG_4285',2],['start','IMG_4297',1]]);
  assert.equal(calls.filter(row => row[0] === 'start').length, 12);
  assert.equal(calls.filter(row => row[0] === 'replay').length, 12);
});

test('two-pass estimates use exact clip durations and exclude member-controlled pauses', () => {
  const ctl = player.createChairYogaPlayback({ levels: plan.levels, movements: catalog.movements });
  const beginner = ctl.getLevelSummary('beginner');
  const intermediate = ctl.getLevelSummary('intermediate');
  const advanced = ctl.getLevelSummary('advanced');
  assert.equal(beginner.workoutCount, 12); assert.equal(beginner.estimatedTotalSeconds, 696);
  assert.equal(intermediate.workoutCount, 12); assert.equal(intermediate.estimatedTotalSeconds, 698.4);
  assert.equal(advanced.workoutCount, 12); assert.equal(advanced.estimatedTotalSeconds, 696);
  assert.equal(catalog.movements.find(item => item.id === 'IMG_4286').durationSeconds * 2, 60.4);
});

test('pause and resume retain pass and movement; automatic advance resumes after pass two', () => {
  const calls = [];
  const ctl = player.createChairYogaPlayback({ levels: plan.levels, movements: catalog.movements, effects: {
    startPass: () => calls.push('start'), replayPass: () => calls.push('replay'), pauseMedia: () => calls.push('pause'), resumeMedia: () => calls.push('resume')
  } });
  ctl.selectLevel('beginner'); ctl.start();
  assert.equal(ctl.pause(), true); assert.equal(ctl.getSnapshot().phase, 'paused');
  assert.equal(ctl.resume(), true); assert.equal(ctl.getSnapshot().phase, 'playing');
  let s = ctl.getSnapshot(); ctl.videoEnded(s.generation, s.currentWorkout.id); s = ctl.getSnapshot();
  assert.equal(s.pass, 2); assert.equal(s.workoutIndex, 0);
  ctl.markVideoPlaying(s.generation, s.currentWorkout.id); ctl.videoEnded(s.generation, s.currentWorkout.id);
  s = ctl.getSnapshot(); assert.equal(s.phase, 'playing'); assert.equal(s.workoutIndex, 1);
  assert.ok(calls.includes('pause')); assert.ok(calls.includes('resume'));
});

test('manual Next, Previous and Restart reset to pass one and preserve the level boundary', () => {
  const calls = [];
  const ctl = player.createChairYogaPlayback({ levels: plan.levels, movements: catalog.movements, effects: { startPass: (m, d) => calls.push([m.id,d.pass]) } });
  ctl.selectLevel('intermediate'); ctl.start(3);
  assert.equal(ctl.getSnapshot().workoutIndex, 3);
  ctl.next(); assert.equal(ctl.getSnapshot().workoutIndex, 4); assert.equal(ctl.getSnapshot().pass, 1);
  ctl.previous(); assert.equal(ctl.getSnapshot().workoutIndex, 3); assert.equal(ctl.getSnapshot().pass, 1);
  let s=ctl.getSnapshot(); ctl.videoEnded(s.generation,s.currentWorkout.id); assert.equal(ctl.getSnapshot().pass,2);
  ctl.restart(); assert.equal(ctl.getSnapshot().pass,1); assert.equal(ctl.getSnapshot().completedCount,0);
  ctl.selectLevel('advanced'); ctl.start(11); assert.equal(ctl.next(),false); assert.equal(ctl.getSnapshot().workoutIndex,11);
  assert.ok(calls.every(([,pass])=>pass===1));
});

test('stale ended events and duplicate pass-end callbacks cannot skip or double-complete workouts', () => {
  const ctl = player.createChairYogaPlayback({ levels: plan.levels, movements: catalog.movements });
  ctl.selectLevel('beginner'); ctl.start(); let s=ctl.getSnapshot();
  assert.equal(ctl.videoEnded(s.generation-1,s.currentWorkout.id),false);
  assert.equal(ctl.videoEnded(s.generation,'IMG_4297'),false);
  assert.equal(ctl.videoEnded(s.generation,s.currentWorkout.id),true);
  assert.equal(ctl.videoEnded(s.generation,s.currentWorkout.id),false);
  assert.equal(ctl.getSnapshot().pass,2);
  assert.equal(ctl.markVideoPlaying(s.generation,s.currentWorkout.id),true); assert.equal(ctl.getSnapshot().completedCount,0);
});

test('final workout reaches completion only after both passes and does not create member history', () => {
  const ctl = player.createChairYogaPlayback({ levels: plan.levels, movements: catalog.movements });
  ctl.selectLevel('advanced'); ctl.start(11); let s=ctl.getSnapshot();
  ctl.videoEnded(s.generation,s.currentWorkout.id); s=ctl.getSnapshot();
  assert.equal(s.phase,'playing'); assert.equal(s.pass,2);
  ctl.markVideoPlaying(s.generation,s.currentWorkout.id);
  ctl.videoEnded(s.generation,s.currentWorkout.id); s=ctl.getSnapshot();
  assert.equal(s.phase,'complete'); assert.equal(s.completedCount,1); assert.equal(s.currentWorkout.id,'IMG_4322');
  assert.equal(ctl.next(),false); assert.equal(ctl.getSnapshot().completedCount,1);
  assert.doesNotMatch(ui,/insert\(|\.from\([^)]*workout/i);
});

test('pause screen has current/next movement, thumbnail, Resume and manual Next Movement', () => {
  for (const id of ['transition-screen','transition-current','transition-up-next-label','transition-next','transition-thumbnail','transition-resume','transition-next-button','transition-status','completion-screen','previous-workout','next-workout','restart-workout','narration-volume']) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(html, /Next Movement/);
  assert.match(html, /Next Movement →/);
  assert.doesNotMatch(ui, /setInterval\(|tickTransition|transitionSecondsRemaining|movement-complete/);
  assert.match(ui, /phase === 'paused'/);
  assert.match(ui, /CURRENT MOVEMENT/);
  assert.match(ui, /UP NEXT/);
  assert.match(css, /@media\(max-width:760px\)/); assert.match(css, /@media\(max-width:400px\)/);
  assert.match(html, /playsinline/); assert.match(ui, /client\.auth\.getUser\(\)/); assert.match(ui, /crypto\.subtle\.digest\('SHA-256'/);
});

test('intentional source/stop pause events are consumed rather than pausing the next movement', () => {
  const guard = player.createPauseEventGuard();
  assert.equal(guard.consumeExpected(), false);
  guard.expect(); assert.equal(guard.consumeExpected(), true);
  assert.equal(guard.consumeExpected(), false);
  assert.match(ui, /function pauseVideoCommand\(\)/);
  assert.match(ui, /if \(pauseEventGuard\.consumeExpected\(\)\) return/);
  assert.match(ui, /video\.addEventListener\('ended', \(\) => controller\?\.videoEnded/);
});

test('narration is visibly gated until an approved, hashed audio asset exists', () => {
  assert.match(html, /Narration scripts await owner approval/);
  assert.match(html, /id="narration-enabled" type="checkbox" disabled/);
  assert.match(ui, /record\.audioStatus === 'owner-approved'/);
  assert.match(ui, /audioSha256/);
  assert.equal(narration.drafts.some(item => item.audioStatus === 'owner-approved'), false);
});
