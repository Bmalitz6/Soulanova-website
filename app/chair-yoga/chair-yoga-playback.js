(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SoulanovaChairYogaPlayback = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function validatePlaylist(levels, movements, loopCountsByLevel, assignmentRules = {}) {
    if (!Array.isArray(levels) || levels.length !== 3) throw new Error('Chair Yoga requires three approved levels.');
    const movementIds = new Set(movements.map(movement => movement.id));
    const workoutIds = [];
    for (const level of levels) {
      if (!level.id || !Array.isArray(level.workouts) || level.workouts.length !== 12) throw new Error('Each approved level must contain 12 workouts.');
      if (!Number.isInteger(loopCountsByLevel?.[level.id]) || loopCountsByLevel[level.id] < 1) throw new Error(`A valid loop count is required for ${level.id}.`);
      for (const workout of level.workouts) {
        workoutIds.push(workout.id);
        if (workout.approvalStatus !== 'owner_approved_2026-11-13') throw new Error(`Workout ${workout.id} is missing final owner approval.`);
        if (!Array.isArray(workout.movementIds) || workout.movementIds.length !== 12 || new Set(workout.movementIds).size !== 12) throw new Error(`Workout ${workout.id} must contain 12 distinct movement segments.`);
        if (workout.movementIds.some(id => !movementIds.has(id))) throw new Error(`Workout ${workout.id} refers to a missing Chair Yoga movement.`);
        for (const pair of assignmentRules.bilateralPairs || []) {
          const rightIndex = workout.movementIds.indexOf(pair.right);
          const leftIndex = workout.movementIds.indexOf(pair.left);
          if ((rightIndex >= 0) !== (leftIndex >= 0)) throw new Error(`Workout ${workout.id} omits a side of ${pair.family}.`);
          if (rightIndex >= 0 && leftIndex !== rightIndex + 1) throw new Error(`Workout ${workout.id} must place ${pair.family} right then left as adjacent segments.`);
        }
      }
    }
    if (workoutIds.length !== 36 || new Set(workoutIds).size !== 36) throw new Error('The proposal must contain 36 distinct complete workouts.');
    if (movements.length !== 36) throw new Error('Chair Yoga requires its complete 36-movement catalog.');
    const beginnerExcluded = new Set(assignmentRules.beginnerExcludedMovementIds || []);
    const intermediateExcluded = new Set(assignmentRules.intermediateExcludedMovementIds || []);
    for (const level of levels) for (const workout of level.workouts) {
      const excluded = level.id === 'beginner' ? beginnerExcluded : level.id === 'intermediate' ? intermediateExcluded : null;
      if (excluded && workout.movementIds.some(id => excluded.has(id))) throw new Error(`${level.name} workout ${workout.id} contains a movement reserved for a higher level.`);
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

  function getWorkoutProgress(snapshot, { currentTime = 0, duration = 0, mediaMatches = false } = {}) {
    const totalMovements = Math.max(0, Number(snapshot?.movementsTotal) || 0);
    const completed = new Set(snapshot?.completedMovementIndexes || []);
    const completedCount = completed.size;
    const movementIndex = Number(snapshot?.movementIndex);
    const currentMovementNumber = Number.isInteger(movementIndex) && movementIndex >= 0
      ? Math.min(totalMovements, movementIndex + 1)
      : 0;
    const movementLabel = `Movement ${currentMovementNumber} of ${totalMovements}`;
    if (!totalMovements) return { currentMovementNumber, movementLabel, completedCount, totalMovements, progress: 0 };
    if (snapshot.phase === 'complete') return { currentMovementNumber: totalMovements, movementLabel: `Movement ${totalMovements} of ${totalMovements}`, completedCount, totalMovements, progress: 1 };

    let activeMovementFraction = 0;
    const canTrackCurrent = ['playing', 'paused', 'resume-required'].includes(snapshot.phase)
      && snapshot.pausedFrom !== 'transitioning'
      && Number.isInteger(movementIndex)
      && movementIndex >= 0
      && !completed.has(movementIndex);
    if (canTrackCurrent && mediaMatches && Number.isFinite(currentTime) && Number.isFinite(duration) && duration > 0) {
      const pass = Math.max(1, Number(snapshot.pass) || 1);
      const loops = Math.max(1, Number(snapshot.loopsPerMovement) || 1);
      const videoFraction = Math.max(0, Math.min(1, currentTime / duration));
      activeMovementFraction = Math.max(0, Math.min(1, (pass - 1 + videoFraction) / loops));
    }
    const progress = Math.max(0, Math.min(1, (completedCount + activeMovementFraction) / totalMovements));
    return { currentMovementNumber, movementLabel, completedCount, totalMovements, progress };
  }

  function getNarrationForPass(movementRecord, pass, { allowPendingOwnerReview = false } = {}) {
    const asset = movementRecord?.loopScripts?.[String(pass)];
    const statusAllowed = asset?.audioStatus === 'owner-approved'
      || (allowPendingOwnerReview && asset?.audioStatus === 'generated_pending_owner_review');
    return asset && statusAllowed && asset.audioUrl
      && /^[a-f0-9]{64}$/i.test(asset.audioSha256 || '') ? asset : null;
  }

  function getApprovedNarrationForPass(movementRecord, pass) {
    return getNarrationForPass(movementRecord, pass);
  }

  function getBatchApprovedAsset(batchApproval, requestKey, type, audioUrl, sha256) {
    if (batchApproval?.memberPlaybackEnabled !== true
      || batchApproval.approvalStatus !== 'owner_approved_batch_for_member_playback'
      || batchApproval.approvedAssetCount !== 142
      || batchApproval.approvalId !== 'chair-yoga-miriam-batch-member-playback-2026-11-13'
      || batchApproval.voice?.voiceId !== 'VhxAIIZM8IRmnl5fyeyk'
      || batchApproval.voice?.model !== 'eleven_multilingual_v2'
      || batchApproval.voice?.speed !== 0.75
      || !requestKey || !type || !audioUrl || !/^[a-f0-9]{64}$/i.test(sha256 || '')) return null;
    const asset = batchApproval.approvedAssets?.find(item => item.requestKey === requestKey);
    if (!asset || asset.ownerBatchApproved !== true || asset.type !== type
      || asset.audioUrl !== audioUrl || asset.sha256?.toLowerCase() !== sha256.toLowerCase()) return null;
    return asset;
  }

  function getPlayableNarrationForPass(manifest, movementRecord, pass, { ownerPreview = false, batchApproval = null } = {}) {
    if (ownerPreview) return getNarrationForPass(movementRecord, pass, { allowPendingOwnerReview: true });
    if (manifest?.memberPlaybackEnabled !== true) return null;
    const approved = getApprovedNarrationForPass(movementRecord, pass);
    if (approved) return approved;
    const pending = getNarrationForPass(movementRecord, pass, { allowPendingOwnerReview: true });
    if (!pending || pending.audioStatus !== 'generated_pending_owner_review' || !movementRecord?.movementId) return null;
    const requestKey = `${movementRecord.movementId}:${pass}`;
    if (!getBatchApprovedAsset(batchApproval, requestKey, 'movement_loop', pending.audioUrl, pending.audioSha256)) return null;
    return pending;
  }

  async function playNarrationAligned(audio, video) {
    if (!audio || !video) return { ok: false, error: new Error('Narration media is unavailable.') };
    try {
      if (Number.isFinite(video.currentTime) && Number.isFinite(audio.duration) && audio.duration > 0) {
        audio.currentTime = Math.min(video.currentTime, Math.max(0, audio.duration - 0.05));
      }
      await audio.play();
      return { ok: true, error: null };
    } catch (error) {
      return { ok: false, error };
    }
  }

  function setNarrationVolume(audio, value) {
    const volume = Math.max(0, Math.min(1, Number(value) || 0));
    if (audio) audio.volume = volume;
    return volume;
  }

  function setNarrationMuted(audio, muted) {
    const next = Boolean(muted);
    if (audio) audio.muted = next;
    return next;
  }

  function createChairYogaPlayback({
    levels,
    movements,
    effects = {},
    loopCountsByLevel = { beginner: 2, intermediate: 3, advanced: 4 },
    transitionDurationMs = 5000,
    assignmentRules = {}
  }) {
    validatePlaylist(levels, movements, loopCountsByLevel, assignmentRules);
    const movementById = new Map(movements.map(movement => [movement.id, movement]));
    const levelById = new Map(levels.map(level => [level.id, level]));
    const completed = new Set();
    const schedule = effects.setTimeout || setTimeout;
    const cancel = effects.clearTimeout || clearTimeout;
    const now = effects.now || Date.now;
    let transitionTimer = null;
    let transitionDeadline = 0;
    let current = {
      phase: 'level-selection', levelId: null, programId: null, movementIndex: -1, pass: 0,
      pausedFrom: null, transitionRemainingMs: 0, error: null, generation: 0
    };
    let endedHandledForPass = 0;
    let videoReadyForEnd = true;

    function levelWorkouts(levelId = current.levelId) { return levelById.get(levelId)?.workouts || []; }
    function currentProgram() { return levelWorkouts().find(workout => workout.id === current.programId) || null; }
    function movementList() { return currentProgram()?.movementIds.map(id => movementById.get(id)) || []; }
    function currentMovement() { return movementList()[current.movementIndex] || null; }
    function currentLoopCount() { return loopCountsByLevel[current.levelId] || 0; }
    function actualTransitionRemaining() {
      return Math.max(0, current.phase === 'transitioning' ? transitionDeadline - now() : current.transitionRemainingMs);
    }
    function snapshot() {
      const movementsInProgram = movementList();
      const workouts = levelWorkouts();
      const programIndex = workouts.findIndex(workout => workout.id === current.programId);
      const remaining = current.phase === 'transitioning' ? actualTransitionRemaining() : current.transitionRemainingMs;
      return Object.freeze({
        ...current,
        transitionRemainingMs: remaining,
        transitionSecondsRemaining: Math.ceil(remaining / 1000),
        levelName: levelById.get(current.levelId)?.name || null,
        programsTotal: workouts.length,
        programIndex,
        currentProgram: currentProgram(),
        currentMovement: movementsInProgram[current.movementIndex] || null,
        nextMovement: movementsInProgram[current.movementIndex + 1] || null,
        previousMovement: movementsInProgram[current.movementIndex - 1] || null,
        movementsTotal: movementsInProgram.length,
        completedCount: completed.size,
        completedMovementIndexes: [...completed],
        loopsPerMovement: currentLoopCount(),
        passesPerWorkout: currentLoopCount()
      });
    }
    function emit() { effects.onStateChange?.(snapshot()); }
    function stopMedia() { effects.stopMedia?.({ generation: current.generation }); }
    function clearTransitionTimer() {
      if (transitionTimer !== null) cancel(transitionTimer);
      transitionTimer = null;
    }
    function startAt(index, { removeCurrentCompletion = false } = {}) {
      const list = movementList();
      if (index < 0 || index >= list.length) return false;
      clearTransitionTimer();
      stopMedia();
      current.generation++;
      current.movementIndex = index;
      current.pass = 1;
      current.phase = 'playing';
      current.pausedFrom = null;
      current.transitionRemainingMs = 0;
      transitionDeadline = 0;
      current.error = null;
      endedHandledForPass = 0;
      videoReadyForEnd = true;
      if (removeCurrentCompletion) completed.delete(index);
      emit();
      requestPlay('startPass', list[index], { pass: 1, loopCount: currentLoopCount(), generation: current.generation, userGesture: true });
      return true;
    }
    function requestPlay(effectName, movement, details) {
      const generation = details.generation;
      try {
        const result = effects[effectName]?.(movement, details);
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
      completed.clear();
      current = { ...current, phase: 'workout-selection', levelId, programId: null, movementIndex: -1, pass: 0, pausedFrom: null, transitionRemainingMs: 0, error: null, generation: current.generation + 1 };
      transitionDeadline = 0;
      endedHandledForPass = 0;
      emit();
      return true;
    }
    function start(programId) {
      const program = levelWorkouts().find(workout => workout.id === programId);
      if (!program) return false;
      clearTransitionTimer();
      stopMedia();
      completed.clear();
      current.programId = program.id;
      current.movementIndex = -1;
      current.pass = 0;
      current.phase = 'playing';
      current.pausedFrom = null;
      current.transitionRemainingMs = 0;
      current.error = null;
      transitionDeadline = 0;
      return startAt(0);
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
        startAt(current.movementIndex + 1);
        return;
      }
      transitionTimer = schedule(() => {
        transitionTimer = null;
        if (current.phase !== 'transitioning') return;
        current.transitionRemainingMs = actualTransitionRemaining();
        if (current.transitionRemainingMs <= 0) {
          startAt(current.movementIndex + 1);
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
        emit();
        requestPlay('resumeMedia', currentMovement(), { pass: current.pass, loopCount: currentLoopCount(), generation: current.generation, userGesture: true });
        return true;
      }
      return false;
    }
    function next() {
      if (!['playing', 'paused', 'resume-required', 'transitioning'].includes(current.phase)) return false;
      return startAt(current.movementIndex + 1);
    }
    function previous() {
      if (!['playing', 'paused', 'resume-required', 'transitioning'].includes(current.phase)) return false;
      return startAt(current.movementIndex - 1);
    }
    function restart() {
      if (!currentMovement()) return false;
      return startAt(current.movementIndex, { removeCurrentCompletion: true });
    }
    function markVideoPlaying(generation = current.generation, movementId = currentMovement()?.id) {
      if (generation !== current.generation || movementId !== currentMovement()?.id || current.phase !== 'playing') return false;
      videoReadyForEnd = true;
      return true;
    }
    function videoEnded(generation = current.generation, movementId = currentMovement()?.id) {
      if (generation !== current.generation || movementId !== currentMovement()?.id || current.phase !== 'playing' || !videoReadyForEnd) return false;
      if (endedHandledForPass === current.pass) return false;
      endedHandledForPass = current.pass;
      if (current.pass < currentLoopCount()) {
        current.pass++;
        videoReadyForEnd = false;
        current.error = null;
        emit();
        requestPlay('replayPass', currentMovement(), { pass: current.pass, loopCount: currentLoopCount(), generation: current.generation, userGesture: false });
        return true;
      }
      completed.add(current.movementIndex);
      stopMedia();
      current.error = null;
      if (current.movementIndex === movementList().length - 1) {
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
    function backToWorkouts() {
      clearTransitionTimer();
      stopMedia();
      current = { ...current, phase: 'workout-selection', programId: null, movementIndex: -1, pass: 0, pausedFrom: null, transitionRemainingMs: 0, error: null, generation: current.generation + 1 };
      transitionDeadline = 0;
      completed.clear();
      emit();
      return true;
    }
    function backToLevels() {
      clearTransitionTimer();
      stopMedia();
      current = { ...current, phase: 'level-selection', levelId: null, programId: null, movementIndex: -1, pass: 0, pausedFrom: null, transitionRemainingMs: 0, error: null, generation: current.generation + 1 };
      transitionDeadline = 0;
      completed.clear();
      emit();
      return true;
    }
    function getWorkoutSummary(levelId, programId) {
      const level = levelById.get(levelId);
      const workout = level?.workouts.find(item => item.id === programId);
      if (!workout) return null;
      const loopCount = loopCountsByLevel[levelId];
      const mediaSeconds = workout.movementIds.reduce((sum, id) => sum + movementById.get(id).durationSeconds, 0) * loopCount;
      const transitionSeconds = (workout.movementIds.length - 1) * transitionDurationMs / 1000;
      return { movementCount: workout.movementIds.length, loopCount, mediaSeconds, transitionSeconds, estimatedTotalSeconds: mediaSeconds + transitionSeconds };
    }
    function getLevelSummary(levelId) {
      const level = levelById.get(levelId);
      if (!level) return null;
      const workoutSummaries = level.workouts.map(workout => getWorkoutSummary(levelId, workout.id));
      return {
        workoutCount: level.workouts.length,
        loopsPerMovement: loopCountsByLevel[levelId],
        minEstimatedTotalSeconds: Math.min(...workoutSummaries.map(summary => summary.estimatedTotalSeconds)),
        maxEstimatedTotalSeconds: Math.max(...workoutSummaries.map(summary => summary.estimatedTotalSeconds)),
        workoutSummaries
      };
    }
    function getSnapshot() { return snapshot(); }

    return Object.freeze({ selectLevel, start, pause, resume, next, previous, restart, markVideoPlaying, videoEnded, playbackBlocked, backToWorkouts, backToLevels, getWorkoutSummary, getLevelSummary, getSnapshot });
  }

  return Object.freeze({ createChairYogaPlayback, createPauseEventGuard, getWorkoutProgress, getNarrationForPass, getApprovedNarrationForPass, getBatchApprovedAsset, getPlayableNarrationForPass, playNarrationAligned, setNarrationVolume, setNarrationMuted, validatePlaylist });
});
