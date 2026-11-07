const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const playback = require('../app/strength/strengthPlayback.js');

const source = fs.readFileSync(path.join(__dirname, '../app/strength/strength.js'), 'utf8');
const page = fs.readFileSync(path.join(__dirname, '../app/strength/index.html'), 'utf8');
const stylesheet = fs.readFileSync(path.join(__dirname, '../app/strength/strength.css'), 'utf8');
const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, '../app/strength/strengthWorkouts.json'), 'utf8'));

test('the reviewed workout starts directly in the narrated warm-up', () => {
  assert.equal(playback.getWorkoutStartPhase(), 'warmup');
  assert.match(source, /makeButton\('Start Workout',[\s\S]*?startWorkout\(workout\)/);
  assert.match(source, /phase = playbackTools\.getWorkoutStartPhase\(\)/);
  assert.match(source, /renderPhase\(\);\s*setPaused\(false\);/);
  assert.doesNotMatch(source, /makeButton\('Start warm-up'/);
  assert.doesNotMatch(source, /makeButton\('Begin guided workout'/);
  assert.doesNotMatch(source, /phase === 'introduction'/);
});

test('autoplay failure presents a one-tap Play recovery while Pause and Resume labels remain accurate', () => {
  assert.equal(playback.getPlaybackButtonLabel(true, false), 'Resume');
  assert.equal(playback.getPlaybackButtonLabel(false, false), 'Pause');
  assert.equal(playback.getPlaybackButtonLabel(true, true), 'Play');
  assert.match(playback.getAutoplayRecoveryMessage(true), /Tap Play once.*video and Bernard narration/);
  assert.match(playback.getAutoplayRecoveryMessage(false), /Tap Play once.*video/);
  assert.match(source, /playbackNeedsGesture = true/);
  assert.match(source, /playbackNeedsGesture\);[\s\S]*?setPaused\(!paused\)/);
});

test('narration recovery pauses the active video and audio together without remounting the phase', () => {
  assert.match(source, /if \(!video\.paused\) video\.pause\(\)/);
  assert.match(source, /if \(audio && !audio\.paused\) audio\.pause\(\)/);
  assert.doesNotMatch(source, /function showPlaybackRecovery\([\s\S]{0,500}renderPhase\(\)/);
});

test('one natural video-ended event completes exactly one set and duplicate ended events are ignored', () => {
  const state = playback.createStrengthPlaybackState();
  assert.deepEqual(playback.completeStrengthPlaybackSet(state, 3), { currentSet: 2, completedSets: 1, completedExercises: 0, exerciseComplete: false });
  assert.equal(playback.completeStrengthPlaybackSet(state, 3), null);
  assert.equal(state.completedSets, 1);
});

test('prescribed sets govern progression and the final set queues the next exercise after rest', () => {
  const oneSet = playback.createStrengthPlaybackState();
  assert.deepEqual(playback.completeStrengthPlaybackSet(oneSet, 1), { currentSet: 1, completedSets: 1, completedExercises: 1, exerciseComplete: true });
  assert.equal(playback.getStrengthActionAfterRest(true), 'next-exercise');

  const threeSets = playback.createStrengthPlaybackState();
  playback.completeStrengthPlaybackSet(threeSets, 3);
  playback.releaseStrengthPlaybackEnd(threeSets);
  playback.completeStrengthPlaybackSet(threeSets, 3);
  playback.releaseStrengthPlaybackEnd(threeSets);
  assert.deepEqual(playback.completeStrengthPlaybackSet(threeSets, 3), { currentSet: 3, completedSets: 3, completedExercises: 1, exerciseComplete: true });
  assert.equal(playback.getStrengthActionAfterRest(false), 'replay-set');
});

test('website set playback is non-looping, counts natural ends, and advances without Complete Set or Next Exercise buttons', () => {
  assert.match(source, /video\.loop = false/);
  assert.match(source, /video\.addEventListener\('ended',[\s\S]*?completeStrengthVideo\(video\)/);
  assert.match(source, /completeStrengthPlaybackSet\(setProgress, item\.sets\)/);
  assert.match(source, /finishStrengthRest\(\)/);
  assert.match(source, /action === 'next-exercise'[\s\S]*?nextExercise\(\)/);
  assert.doesNotMatch(source, /makeButton\('Complete set'/i);
  assert.doesNotMatch(source, /makeButton\('Next exercise'/i);
});

test('workout equipment aggregation deduplicates explicit required and optional items without guessing', () => {
  const catalog = [
    { id: 'A', name: 'Goblet Squat', thumbnail: 'a.jpg' },
    { id: 'B', name: 'Standing Calf Raise', thumbnail: 'b.jpg' },
    { id: 'C', name: 'Side Bend', thumbnail: 'c.jpg' },
  ];
  const result = playback.getWorkoutEquipment([
    { exerciseId: 'A', instruction: 'Hold one dumbbell close to your chest.' },
    { exerciseId: 'B', instruction: 'Use a stable support if balance is uncertain.' },
    { exerciseId: 'C', instruction: 'Move gently through a comfortable range.' },
    { exerciseId: 'A', instruction: 'Hold one dumbbell close to your chest.' },
  ], catalog);
  assert.deepEqual(result, { required: ['Dumbbells'], optional: ['Stable support'], unspecifiedExerciseCount: 1, noEquipmentRequired: false });
  assert.equal(playback.getWorkoutEquipment([{ exerciseId: 'C', instruction: 'No load is required.' }], catalog).noEquipmentRequired, true);
});

test('rest previews show the next set, next exercise programming and final cool-down', () => {
  const catalog = [
    { id: 'A', name: 'Goblet Squat', thumbnail: 'a.jpg' },
    { id: 'B', name: 'Dumbbell Press', thumbnail: 'b.jpg' },
  ];
  const workout = { exercises: [
    { exerciseId: 'A', sets: 2, reps: '8–10', restSeconds: 60, instruction: 'No equipment is required.' },
    { exerciseId: 'B', sets: 3, reps: '10', restSeconds: 45, instruction: 'Press both dumbbells steadily.' },
  ] };
  assert.deepEqual(playback.getStrengthRestPreview(workout, 0, 2, false, catalog), { kind: 'set', label: 'REST BETWEEN SETS', exerciseName: 'Goblet Squat', thumbnail: 'a.jpg', setNumber: 2, totalSets: 2 });
  assert.deepEqual(playback.getStrengthRestPreview(workout, 0, 2, true, catalog), { kind: 'exercise', label: 'UP NEXT', exerciseName: 'Dumbbell Press', thumbnail: 'b.jpg', sets: 3, reps: '10', equipment: 'Required · Dumbbells' });
  assert.deepEqual(playback.getStrengthRestPreview(workout, 1, 3, true, catalog), { kind: 'cooldown', label: 'UP NEXT', exerciseName: 'Narrated cool-down', thumbnail: null, sets: null, reps: null, equipment: null });
});

test('all 17 website exercises use clean member names and instructions while provenance stays internal', () => {
  const internalNote = /user-confirmed|original gallery mapping|review\s*#|img_\d+|pinned master|historical|approved alternate/i;
  assert.equal(catalog.exercises.length, 17);
  for (const exercise of catalog.exercises) {
    assert.doesNotMatch(exercise.name, internalNote, exercise.id);
    assert.ok(exercise.video && exercise.approvalEvidence && exercise.sha256, `${exercise.id} video mapping and provenance remain`);
  }
  for (const workout of catalog.workouts) {
    assert.doesNotMatch(workout.title + workout.description, internalNote, workout.id);
    for (const item of workout.exercises) {
      assert.doesNotMatch(item.name, internalNote, `${workout.id}/${item.exerciseId} name`);
      assert.doesNotMatch(item.instruction, internalNote, `${workout.id}/${item.exerciseId} instruction`);
    }
  }
  assert.doesNotMatch(source, /exercise\.variationLabel|exercise\.reviewNumber|exercise\.sourceFile|exercise\.approvalEvidence/);
  assert.match(source, /previewName\.textContent = preview\.exerciseName/);
});

test('rest countdown and preview occupy the video frame and are removed from the lower duplicate section', () => {
  assert.match(source, /videoFrame\.append\(video, rest\)/);
  assert.match(source, /card\.append\(prescription, videoFrame, restAdjustments/);
  assert.match(stylesheet, /\.strength-video-frame \.rest-screen\{position:absolute;inset:0/);
  assert.match(stylesheet, /\.strength-video-frame \.player-media\[hidden\]\{display:none\}/);
  assert.match(stylesheet, /strength-video-frame\+\.rest-adjustments/);
  assert.match(source, /restAdjustments\.hidden = !restRemaining/);
});

test('rest expiry keeps an UP NEXT overlay until the new exercise video is actually playing', () => {
  assert.match(source, /action === 'next-exercise'\) \{ strengthTransitioning = true; strengthTransitionType = 'exercise'; nextExercise\(\)/);
  assert.match(source, /action === 'replay-set'[\s\S]*?strengthTransitioning = true; strengthTransitionType = 'set'/);
  assert.match(source, /video\.addEventListener\('playing'[\s\S]*?overlay\.hidden = true/);
  assert.match(source, /video\.hidden = Boolean\(restRemaining\)/);
  assert.match(source, /restAdjustments\.hidden = !restRemaining/);
});

test('rest adjustments affect only the active timer and zero triggers the automatic transition path', () => {
  assert.equal(playback.adjustCurrentRestRemaining(30, 15), 45);
  assert.equal(playback.adjustCurrentRestRemaining(10, -15), 0);
  assert.match(source, /if \(restRemaining <= 0\) finishStrengthRest\(\)/);
  assert.match(source, /if \(action === 'next-exercise'\) \{ strengthTransitioning = true; strengthTransitionType = 'exercise'; nextExercise\(\); return; \}/);
  assert.doesNotMatch(source, /restRemaining = activeRestDuration/);
});

test('selected Beginner and Intermediate workouts produce complete detail models and the page renders every section', () => {
  const plans = [
    catalog.workouts.find(workout => workout.id === 'beginner-foundations'),
    catalog.workouts.find(workout => workout.level === 'Beginner' && workout.id !== 'beginner-foundations'),
    catalog.workouts.find(workout => workout.level === 'Intermediate'),
  ];
  for (const plan of plans) {
    const model = playback.getWorkoutDetailModel(plan, catalog.exercises);
    assert.equal(model.title, plan.title);
    assert.equal(model.level, plan.level);
    assert.ok(model.equipment);
    assert.deepEqual(model.restOptions, ['plan', 15, 30, 45, 60, 90, 'custom']);
    assert.equal(model.exercises.length, plan.exercises.length);
    assert.ok(model.exercises.every(item => item.name && item.sets > 0 && item.reps && item.instruction));
    assert.ok(model.exercises.every((item, index) => item.prescribedRestSeconds === plan.exercises[index].restSeconds));
  }
  const foundation = playback.getWorkoutDetailModel(plans[0], catalog.exercises);
  assert.equal(foundation.title, 'Strength Foundations');
  assert.equal(foundation.exercises.length, 5);
  assert.ok(foundation.equipment.required.includes('Dumbbells'));
  assert.match(source, /playbackTools\.getWorkoutDetailModel\(workout, catalog\.exercises\)/);
  assert.match(source, /equipmentSection, restSection, list, start/);
  assert.match(source, /makeButton\('← Workout list',[\s\S]*?renderLibrary/);
  assert.match(source, /makeButton\('View workout →',[\s\S]*?renderDetail\(workout\)/);
  for (const script of ['strengthProgress.js', 'strengthPlayback.js']) assert.match(page, new RegExp(`${script}\\?v=20261107-workout-details`));
  assert.match(page, /strength\.js\?v=20261107-rest-overlay/);
});

test('detail model stays renderable if one selected exercise has no catalog mapping', () => {
  const incomplete = { id: 'test-workout', title: 'Fallback', level: 'Beginner', estimatedMinutes: 10, description: 'Test', guidance: 'Test', exercises: [{ exerciseId: 'missing', sets: 1, reps: '5', restSeconds: 30, instruction: 'Move gently.' }] };
  const model = playback.getWorkoutDetailModel(incomplete, []);
  assert.equal(model.exercises[0].name, 'Exercise missing');
  assert.equal(model.exercises.length, 1);
});

test('detail rendering logs helper-version errors and leaves a visible retry and back path', () => {
  assert.match(source, /try \{\s*detailModel = playbackTools\.getWorkoutDetailModel/);
  assert.match(source, /console\.error\('SoulStrength workout details failed to render\.'/);
  assert.match(source, /Workout details could not load\. Refresh this Development page and try again\./);
  assert.match(source, /detail\.append\(message, back\)/);
});
