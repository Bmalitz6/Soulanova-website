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

function makeController(levelId, overrides = {}) {
  const clock = fakeClock();
  const calls = [];
  const ctl = player.createChairYogaPlayback({
    levels: plan.levels,
    movements: catalog.movements,
    loopCountsByLevel: plan.playback.loopCountsByLevel,
    transitionDurationMs: plan.playback.transitionDurationSeconds * 1000,
    effects: {
      now: clock.now,
      setTimeout: clock.setTimeout,
      clearTimeout: clock.clearTimeout,
      startPass: (movement, details) => calls.push(['start', movement.id, details.pass, details.loopCount]),
      replayPass: (movement, details) => calls.push(['replay', movement.id, details.pass, details.loopCount]),
      stopMedia: () => calls.push(['stop']),
      ...overrides.effects
    }
  });
  ctl.selectLevel(levelId);
  return { ctl, clock, calls };
}

function endOnePass(ctl) {
  const s = ctl.getSnapshot();
  assert.equal(ctl.videoEnded(s.generation, s.currentWorkout.id), true);
  return ctl.getSnapshot();
}

function finishCurrentMovement(ctl, loops) {
  for (let pass = 1; pass <= loops; pass++) {
    const s = ctl.getSnapshot();
    assert.equal(s.phase, 'playing');
    assert.equal(s.pass, pass);
    assert.equal(ctl.videoEnded(s.generation, s.currentWorkout.id), true);
    if (pass < loops) {
      const replay = ctl.getSnapshot();
      assert.equal(replay.phase, 'playing');
      assert.equal(replay.pass, pass + 1);
      assert.equal(ctl.markVideoPlaying(replay.generation, replay.currentWorkout.id), true);
    }
  }
}

test('proposed level assignments remain pending and preserve all 36 ordered catalog references', () => {
  assert.equal(plan.proposalStatus, 'pending_owner_approval');
  assert.deepEqual(plan.playback.loopCountsByLevel, { beginner: 2, intermediate: 3, advanced: 4 });
  assert.equal(plan.playback.transitionDurationSeconds, 5);
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

test('all 36 movement-specific narration drafts remain ungenerated and pending owner approval', () => {
  assert.equal(narration.generationStatus, 'not_generated');
  assert.equal(narration.voiceApprovalStatus, 'pending_owner_approval');
  assert.equal(narration.drafts.length, 36);
  assert.match(narration.passBehavior, /Beginner 2 loops, Intermediate 3 loops, Advanced 4 loops/);
  for (const draft of narration.drafts) {
    assert.ok(draft.script.length > 0, draft.movementId);
    assert.equal(draft.audioUrl, undefined);
    assert.equal(draft.audioStatus, 'not_generated_pending_owner_approval');
    assert.equal(draft.cuePlan.length, 4, draft.movementId);
    assert.ok(draft.estimatedSpokenSeconds <= draft.videoDurationSeconds - 2, `${draft.movementId} timing`);
    assert.equal(catalog.movements.find(item => item.id === draft.movementId).name, draft.movementName);
  }
});

test('level-specific estimates use actual clip lengths and include eleven five-second transitions', () => {
  const { ctl } = makeController('beginner');
  const beginner = ctl.getLevelSummary('beginner');
  const intermediate = ctl.getLevelSummary('intermediate');
  const advanced = ctl.getLevelSummary('advanced');
  assert.equal(beginner.workoutCount, 12);
  assert.equal(beginner.loopsPerMovement, 2);
  assert.equal(beginner.mediaSeconds, 696);
  assert.equal(beginner.transitionSeconds, 55);
  assert.equal(beginner.estimatedTotalSeconds, 751);
  assert.equal(intermediate.loopsPerMovement, 3);
  assert.equal(intermediate.mediaSeconds, 1047.6);
  assert.equal(intermediate.transitionSeconds, 55);
  assert.ok(Math.abs(intermediate.estimatedTotalSeconds - 1102.6) < 0.0001);
  assert.equal(advanced.loopsPerMovement, 4);
  assert.equal(advanced.mediaSeconds, 1392);
  assert.equal(advanced.transitionSeconds, 55);
  assert.equal(advanced.estimatedTotalSeconds, 1447);
  assert.equal(catalog.movements.find(item => item.id === 'IMG_4286').durationSeconds * 4, 120.8);
});

test('all three complete 12-movement levels repeat the approved number of loops, transition for five seconds, and complete', () => {
  for (const [levelId, loops] of Object.entries(plan.playback.loopCountsByLevel)) {
    const { ctl, clock, calls } = makeController(levelId);
    ctl.start();
    assert.equal(ctl.getSnapshot().loopCount, loops);
    for (let index = 0; index < 12; index++) {
      assert.equal(ctl.getSnapshot().workoutIndex, index);
      finishCurrentMovement(ctl, loops);
      if (index < 11) {
        let s = ctl.getSnapshot();
        assert.equal(s.phase, 'transitioning');
        assert.equal(s.transitionSecondsRemaining, 5);
        assert.equal(s.nextWorkout.id, plan.levels.find(item => item.id === levelId).workoutIds[index + 1]);
        clock.advance(4999);
        s = ctl.getSnapshot();
        assert.equal(s.phase, 'transitioning');
        assert.equal(s.workoutIndex, index);
        clock.advance(1);
        assert.equal(ctl.getSnapshot().phase, 'playing');
        assert.equal(ctl.getSnapshot().workoutIndex, index + 1);
        assert.equal(ctl.getSnapshot().pass, 1);
      } else {
        const final = ctl.getSnapshot();
        assert.equal(final.phase, 'complete');
        assert.equal(final.completedCount, 12);
        assert.equal(final.workoutIndex, 11);
        assert.equal(ctl.next(), false);
      }
    }
    assert.equal(calls.filter(row => row[0] === 'start').length, 12);
    assert.equal(calls.filter(row => row[0] === 'replay').length, 12 * (loops - 1));
    assert.equal(clock.pending(), 0);
  }
});

test('pause freezes and resume continues the transition countdown without losing its remainder', () => {
  const { ctl, clock } = makeController('beginner');
  ctl.start(); finishCurrentMovement(ctl, 2);
  assert.equal(ctl.getSnapshot().phase, 'transitioning');
  clock.advance(2100);
  assert.equal(ctl.pause(), true);
  let s = ctl.getSnapshot();
  assert.equal(s.phase, 'paused');
  assert.equal(s.pausedFrom, 'transitioning');
  assert.equal(s.transitionRemainingMs, 2900);
  clock.advance(10000);
  assert.equal(ctl.getSnapshot().phase, 'paused');
  assert.equal(ctl.getSnapshot().workoutIndex, 0);
  assert.equal(ctl.resume(), true);
  clock.advance(2899);
  assert.equal(ctl.getSnapshot().phase, 'transitioning');
  clock.advance(1);
  assert.equal(ctl.getSnapshot().phase, 'playing');
  assert.equal(ctl.getSnapshot().workoutIndex, 1);
});

test('pause and resume during a movement retain the loop and manual Next skips forward', () => {
  const { ctl, calls } = makeController('intermediate');
  ctl.start();
  assert.equal(ctl.pause(), true);
  assert.equal(ctl.getSnapshot().phase, 'paused');
  assert.equal(ctl.getSnapshot().pass, 1);
  assert.equal(ctl.resume(), true);
  assert.equal(ctl.getSnapshot().phase, 'playing');
  let s = endOnePass(ctl);
  assert.equal(s.pass, 2);
  ctl.markVideoPlaying(s.generation, s.currentWorkout.id);
  assert.equal(ctl.next(), true);
  assert.equal(ctl.getSnapshot().workoutIndex, 1);
  assert.equal(ctl.getSnapshot().pass, 1);
  assert.ok(calls.some(row => row[0] === 'start' && row[1] === 'IMG_4287'));
});

test('manual Next cancels an active transition timer, Previous and Restart reset loops, and levels never auto-switch', () => {
  const { ctl, clock } = makeController('advanced');
  ctl.start(3); finishCurrentMovement(ctl, 4);
  assert.equal(ctl.getSnapshot().phase, 'transitioning');
  assert.equal(ctl.next(), true);
  assert.equal(ctl.getSnapshot().workoutIndex, 4);
  assert.equal(ctl.getSnapshot().pass, 1);
  clock.advance(5000);
  assert.equal(ctl.getSnapshot().workoutIndex, 4);
  assert.equal(ctl.previous(), true);
  assert.equal(ctl.getSnapshot().workoutIndex, 3);
  endOnePass(ctl);
  assert.equal(ctl.getSnapshot().pass, 2);
  assert.equal(ctl.restart(), true);
  assert.equal(ctl.getSnapshot().pass, 1);
  assert.equal(ctl.getSnapshot().completedCount, 0);
  ctl.start(11); finishCurrentMovement(ctl, 4);
  assert.equal(ctl.getSnapshot().phase, 'complete');
  assert.equal(ctl.getSnapshot().levelId, 'advanced');
});

test('stale video end events cannot skip a movement during the Up Next countdown', () => {
  const { ctl, clock } = makeController('beginner');
  ctl.start();
  const first = ctl.getSnapshot();
  finishCurrentMovement(ctl, 2);
  const transitioning = ctl.getSnapshot();
  assert.equal(transitioning.phase, 'transitioning');
  assert.equal(ctl.videoEnded(first.generation, first.currentWorkout.id), false);
  assert.equal(ctl.videoEnded(transitioning.generation, transitioning.currentWorkout.id), false);
  assert.equal(ctl.getSnapshot().workoutIndex, 0);
  clock.advance(5000);
  assert.equal(ctl.getSnapshot().workoutIndex, 1);
});

test('member-facing transition shows next name and real thumbnail on black; pause controls and responsive layouts remain', () => {
  for (const id of ['transition-screen','transition-current','transition-up-next-label','transition-next','transition-thumbnail','transition-resume','transition-next-button','transition-status','completion-screen','previous-workout','next-workout','restart-workout','narration-volume']) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(html, /Next Movement/);
  assert.match(ui, /snap\.nextWorkout\.thumbnailUrl/);
  assert.match(ui, /Next movement starts in \$\{snap\.transitionSecondsRemaining\} seconds/);
  assert.match(ui, /snap\.phase === 'transitioning'/);
  assert.match(ui, /controller\.pause\(\)/);
  assert.match(ui, /controller\.resume\(\)/);
  assert.match(css, /\.transition-screen[^{]*\{[^}]*background:#000/);
  assert.match(css, /@media\(max-width:760px\)/);
  assert.match(css, /@media\(max-width:400px\)/);
  assert.match(html, /playsinline/);
});

test('narration remains disabled until an approved, hash-verified movement recording exists', () => {
  assert.match(html, /Narration scripts await owner approval/);
  assert.match(html, /id="narration-enabled" type="checkbox" disabled/);
  assert.match(ui, /record\.audioStatus === 'owner-approved'/);
  assert.match(ui, /audioSha256/);
  assert.equal(narration.drafts.some(item => item.audioStatus === 'owner-approved'), false);
});
