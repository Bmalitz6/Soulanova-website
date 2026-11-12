(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SoulanovaChairYogaPlayback = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function validatePlaylist(levels, movements, loopCountsByLevel) {
    if (!Array.isArray(levels) || levels.length !== 3) throw new Error('Chair Yoga requires three levels.');
    const ids = levels.flatMap(level => level.workoutIds || []);
    if (levels.some(level => !level.id || level.workoutIds?.length !== 12)) throw new Error('Each Chair Yoga level must contain 12 workouts.');
    if (ids.length !== 36 || new Set(ids).size !== 36) throw new Error('The proposed levels must map 36 unique movement workouts.');
    if (movements.length !== 36 || ids.some(id => !movements.some(item => item.id === id))) throw new Error('A level refers to a missing Chair Yoga movement.');
    for (const level of levels) {
      if (!Number.isInteger(loopCountsByLevel?.[level.id]) || loopCountsByLevel[level.id] < 1) throw new Error(`A valid loop count is required for ${level.id}.`);
    }
    return true;
  }

  function createPauseEventGuard() {
    let expectedPauseEvents = 0;
    return Object.freeze({
      expect() { expectedPauseEvents++; },
      consumeExpected() {
        if (expectedPauseEvents === 0) return false;
        expectedPauseEvents--;
        return true;
      }
    });
  }

  function createChairYogaPlayback({
    levels,
    movements,
    effects = {},
    loopCountsByLevel = { beginner: 2, intermediate: 3, advanced: 4 },
    transitionDurationMs = 5000
  }) {
    validatePlaylist(levels, movements, loopCountsByLevel);
    const movementById = new Map(movements.map(movement => [movement.id, movement]));
    const levelById = new Map(levels.map(level => [level.id, level]));
    const completed = new Set();
    const schedule = effects.setTimeout || setTimeout;
    const cancel = effects.clearTimeout || clearTimeout;
    const now = effects.now || Date.now;
    let transitionTimer = null;
    let transitionDeadline = 0;
    let current = {
      phase: 'level-selection', levelId: null, workoutIndex: -1, pass: 0,
      pausedFrom: null, transitionRemainingMs: 0, error: null, generation: 0
    };
    let endedHandledForPass = 0;
    let videoReadyForEnd = true;

    function workoutList() {
      const level = levelById.get(current.levelId);
      return level ? level.workoutIds.map(id => movementById.get(id)) : [];
    }
    function currentWorkout() { return workoutList()[current.workoutIndex] || null; }
    function currentLoopCount() { return loopCountsByLevel[current.levelId] || 0; }
    function actualTransitionRemaining() {
      return Math.max(0, current.phase === 'transitioning' ? transitionDeadline - now() : current.transitionRemainingMs);
    }
    function snapshot() {
      const list = workoutList();
      const remaining = current.phase === 'transitioning' ? actualTransitionRemaining() : current.transitionRemainingMs;
      return Object.freeze({
        ...current,
        transitionRemainingMs: remaining,
        transitionSecondsRemaining: Math.ceil(remaining / 1000),
        workoutsTotal: list.length,
        currentWorkout: list[current.workoutIndex] || null,
        nextWorkout: list[current.workoutIndex + 1] || null,
        previousWorkout: list[current.workoutIndex - 1] || null,
        completedCount: completed.size,
        completedWorkoutIds: [...completed],
        passesPerWorkout: currentLoopCount(),
        loopCount: currentLoopCount()
      });
    }
    function emit() { effects.onStateChange?.(snapshot()); }
    function stopMedia() { effects.stopMedia?.({ generation: current.generation }); }
    function clearTransitionTimer() {
      if (transitionTimer !== null) cancel(transitionTimer);
      transitionTimer = null;
    }
    function startAt(index, { removeCurrentCompletion = false } = {}) {
      const list = workoutList();
      if (index < 0 || index >= list.length) return false;
      clearTransitionTimer();
      stopMedia();
      current.generation++;
      current.workoutIndex = index;
      current.pass = 1;
      current.phase = 'playing';
      current.pausedFrom = null;
      current.transitionRemainingMs = 0;
      transitionDeadline = 0;
      current.error = null;
      endedHandledForPass = 0;
      videoReadyForEnd = true;
      const workout = list[index];
      if (removeCurrentCompletion) completed.delete(workout.id);
      emit();
      requestPlay('startPass', workout, { pass: 1, loopCount: currentLoopCount(), generation: current.generation, userGesture: true });
      return true;
    }
    function requestPlay(effectName, workout, details) {
      const generation = details.generation;
      try {
        const result = effects[effectName]?.(workout, details);
        if (result && typeof result.then === 'function') {
          result.then(ok => { if (ok === false) playbackBlocked(generation); })
            .catch(error => playbackBlocked(generation, error));
        } else if (result === false) playbackBlocked(generation);
      } catch (error) { playbackBlocked(generation, error); }
    }
    function playbackBlocked(generation, error) {
      if (generation !== current.generation || !['playing', 'resume-required'].includes(current.phase)) return false;
      effects.pauseMedia?.({ generation });
      current.phase = 'resume-required';
      current.error = error?.message || 'Playback needs a tap to resume.';
      emit();
      return true;
    }
    function selectLevel(levelId) {
      if (!levelById.has(levelId)) return false;
      clearTransitionTimer();
      stopMedia();
      current = { ...current, phase: 'playlist', levelId, workoutIndex: -1, pass: 0, pausedFrom: null, transitionRemainingMs: 0, error: null, generation: current.generation + 1 };
      transitionDeadline = 0;
      endedHandledForPass = 0;
      emit();
      return true;
    }
    function start(index = 0) {
      if (!levelById.has(current.levelId)) return false;
      return startAt(index);
    }
    function pause() {
      if (current.phase === 'transitioning') {
        current.transitionRemainingMs = actualTransitionRemaining();
        clearTransitionTimer();
        current.pausedFrom = 'transitioning';
        current.phase = 'paused';
        emit();
        return true;
      }
      if (current.phase === 'playing' || current.phase === 'resume-required') {
        effects.pauseMedia?.({ generation: current.generation });
        current.pausedFrom = 'playing';
        current.phase = 'paused';
        emit();
        return true;
      }
      return false;
    }
    function scheduleTransitionTick() {
      clearTransitionTimer();
      const remaining = actualTransitionRemaining();
      current.transitionRemainingMs = remaining;
      if (remaining <= 0) {
        transitionTimer = null;
        startAt(current.workoutIndex + 1);
        return;
      }
      transitionTimer = schedule(() => {
        transitionTimer = null;
        if (current.phase !== 'transitioning') return;
        current.transitionRemainingMs = actualTransitionRemaining();
        if (current.transitionRemainingMs <= 0) {
          startAt(current.workoutIndex + 1);
          return;
        }
        emit();
        scheduleTransitionTick();
      }, Math.min(1000, remaining));
    }
    function resume() {
      if (current.phase === 'paused' && current.pausedFrom === 'transitioning') {
        current.phase = 'transitioning';
        current.pausedFrom = null;
        transitionDeadline = now() + current.transitionRemainingMs;
        emit();
        scheduleTransitionTick();
        return true;
      }
      if (current.phase === 'paused' || current.phase === 'resume-required') {
        current.phase = 'playing';
        current.pausedFrom = null;
        current.error = null;
        const workout = currentWorkout();
        emit();
        requestPlay('resumeMedia', workout, { pass: current.pass, loopCount: currentLoopCount(), generation: current.generation, userGesture: true });
        return true;
      }
      return false;
    }
    function next() {
      if (!['playing', 'paused', 'resume-required', 'transitioning'].includes(current.phase)) return false;
      return startAt(current.workoutIndex + 1);
    }
    function previous() {
      if (!['playing', 'paused', 'resume-required', 'transitioning'].includes(current.phase)) return false;
      return startAt(current.workoutIndex - 1);
    }
    function restart() {
      if (!currentWorkout()) return false;
      return startAt(current.workoutIndex, { removeCurrentCompletion: true });
    }
    function markVideoPlaying(generation = current.generation, movementId = currentWorkout()?.id) {
      if (generation !== current.generation || movementId !== currentWorkout()?.id || current.phase !== 'playing') return false;
      videoReadyForEnd = true;
      return true;
    }
    function videoEnded(generation = current.generation, movementId = currentWorkout()?.id) {
      if (generation !== current.generation || movementId !== currentWorkout()?.id || current.phase !== 'playing' || !videoReadyForEnd) return false;
      if (endedHandledForPass === current.pass) return false;
      endedHandledForPass = current.pass;
      if (current.pass < currentLoopCount()) {
        current.pass++;
        videoReadyForEnd = false;
        current.error = null;
        emit();
        requestPlay('replayPass', currentWorkout(), { pass: current.pass, loopCount: currentLoopCount(), generation: current.generation, userGesture: false });
        return true;
      }
      completed.add(currentWorkout().id);
      stopMedia();
      current.error = null;
      if (current.workoutIndex === workoutList().length - 1) {
        clearTransitionTimer();
        current.phase = 'complete';
        current.pausedFrom = null;
        current.transitionRemainingMs = 0;
        emit();
      } else {
        current.phase = 'transitioning';
        current.pausedFrom = null;
        current.transitionRemainingMs = transitionDurationMs;
        transitionDeadline = now() + transitionDurationMs;
        emit();
        scheduleTransitionTick();
      }
      return true;
    }
    function backToLevels() {
      clearTransitionTimer();
      stopMedia();
      current = { ...current, phase: 'level-selection', levelId: null, workoutIndex: -1, pass: 0, pausedFrom: null, transitionRemainingMs: 0, error: null, generation: current.generation + 1 };
      transitionDeadline = 0;
      emit();
      return true;
    }
    function getLevelSummary(levelId) {
      const level = levelById.get(levelId);
      if (!level) return null;
      const list = level.workoutIds.map(id => movementById.get(id));
      const loopsPerMovement = loopCountsByLevel[levelId];
      const mediaSeconds = list.reduce((sum, item) => sum + item.durationSeconds * loopsPerMovement, 0);
      const transitionSeconds = Math.max(0, list.length - 1) * transitionDurationMs / 1000;
      return { workoutCount: list.length, loopsPerMovement, passesPerWorkout: loopsPerMovement, mediaSeconds, transitionSeconds, estimatedTotalSeconds: mediaSeconds + transitionSeconds };
    }
    function getSnapshot() { return snapshot(); }

    return Object.freeze({ selectLevel, start, pause, resume, next, previous, restart, markVideoPlaying, videoEnded, playbackBlocked, backToLevels, getLevelSummary, getSnapshot });
  }

  return Object.freeze({ createChairYogaPlayback, createPauseEventGuard, validatePlaylist });
});
