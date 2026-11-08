(() => {
  function getWorkoutStartPhase() {
    return 'warmup';
  }

  function getPlaybackButtonLabel(paused, needsGesture) {
    if (needsGesture) return 'Play';
    return paused ? 'Resume' : 'Pause';
  }

  function getAutoplayRecoveryMessage(hasNarration = false) {
    return `Your browser blocked automatic playback. Tap Play once to start the workout video${hasNarration ? ' and Bernard narration' : ''}.`;
  }

  function createStrengthPlaybackState() {
    return { currentSet: 1, completedSets: 0, completedExercises: 0, endClaimed: false };
  }

  function completeStrengthPlaybackSet(state, prescribedSets) {
    if (!state || state.endClaimed) return null;
    state.endClaimed = true;
    state.completedSets += 1;
    const totalSets = Math.max(1, Math.floor(Number(prescribedSets) || 1));
    const exerciseComplete = state.currentSet >= totalSets;
    if (exerciseComplete) state.completedExercises += 1;
    else state.currentSet += 1;
    return { currentSet: state.currentSet, completedSets: state.completedSets, completedExercises: state.completedExercises, exerciseComplete };
  }

  function releaseStrengthPlaybackEnd(state) {
    if (state) state.endClaimed = false;
  }

  function getStrengthActionAfterRest(exerciseComplete) {
    return exerciseComplete ? 'next-exercise' : 'replay-set';
  }

  const REST_DURATION_PRESETS = [15, 30, 45, 60, 90];
  function isValidCustomRestDuration(seconds) {
    return Number.isInteger(Number(seconds)) && Number(seconds) >= 10 && Number(seconds) <= 180 && Number(seconds) % 5 === 0;
  }

  function adjustCurrentRestRemaining(seconds, delta) {
    return Math.max(0, Math.min(180, Number(seconds) + Number(delta)));
  }

  function getWorkoutEquipment(exercises, catalog) {
    const required = new Set();
    const optional = new Set();
    let unspecifiedExerciseCount = 0;
    let allExplicitlyBodyweight = exercises.length > 0;
    for (const item of exercises) {
      const name = catalog.find(entry => entry.id === item.exerciseId)?.name || item.name || '';
      const source = `${name} ${item.instruction || ''}`.toLowerCase();
      let identified = false;
      if (/dumbbells?/.test(source)) { required.add('Dumbbells'); identified = true; }
      if (/stable support|use support|support as needed/.test(source)) { optional.add('Stable support'); identified = true; }
      const explicitBodyweight = /no (?:load|equipment) (?:is )?required/.test((item.instruction || '').toLowerCase());
      if (explicitBodyweight) identified = true;
      else allExplicitlyBodyweight = false;
      if (!identified) unspecifiedExerciseCount += 1;
    }
    return { required: [...required], optional: [...optional], unspecifiedExerciseCount, noEquipmentRequired: allExplicitlyBodyweight };
  }

  function getWorkoutDetailModel(workout, catalog, restOverride = null) {
    const exercises = workout.exercises.map(item => {
      const exercise = catalog.find(entry => entry.id === item.exerciseId);
      return {
        exerciseId: item.exerciseId,
        name: exercise?.name || item.name || `Exercise ${item.exerciseId}`,
        sets: item.sets,
        reps: item.reps,
        restSeconds: restOverride ?? item.restSeconds,
        prescribedRestSeconds: item.restSeconds,
        instruction: item.instruction || '',
      };
    });
    return {
      id: workout.id,
      title: workout.title,
      level: workout.level,
      estimatedMinutes: workout.estimatedMinutes,
      description: workout.description,
      guidance: workout.guidance,
      equipment: getWorkoutEquipment(workout.exercises, catalog),
      exercises,
      restOptions: ['plan', ...REST_DURATION_PRESETS, 'custom'],
      selectedRestSeconds: restOverride,
    };
  }

  function getStrengthRestPreview(workout, exerciseIndex, currentSet, exerciseComplete, catalog) {
    const current = workout.exercises[exerciseIndex];
    if (!current) return null;
    if (!exerciseComplete) {
      const exercise = catalog.find(entry => entry.id === current.exerciseId);
      return { kind: 'set', label: 'REST BETWEEN SETS', exerciseName: exercise?.name || current.name || 'Current exercise', thumbnail: exercise?.thumbnail || null, setNumber: currentSet, totalSets: current.sets };
    }
    const next = workout.exercises[exerciseIndex + 1];
    if (!next) return { kind: 'cooldown', label: 'UP NEXT', exerciseName: 'Narrated cool-down', thumbnail: null, sets: null, reps: null, equipment: null };
    const exercise = catalog.find(entry => entry.id === next.exerciseId);
    const equipment = getWorkoutEquipment([next], catalog);
    const items = [...equipment.required.map(item => `Required · ${item}`), ...equipment.optional.map(item => `Optional · ${item}`)];
    return { kind: 'exercise', label: 'UP NEXT', exerciseName: exercise?.name || next.name || 'Next exercise', thumbnail: exercise?.thumbnail || null, sets: next.sets, reps: next.reps, equipment: items.length ? items.join(' · ') : equipment.noEquipmentRequired ? 'No equipment required' : 'Equipment not specified' };
  }

  const api = { getWorkoutStartPhase, getPlaybackButtonLabel, getAutoplayRecoveryMessage, createStrengthPlaybackState, completeStrengthPlaybackSet, releaseStrengthPlaybackEnd, getStrengthActionAfterRest, REST_DURATION_PRESETS, isValidCustomRestDuration, adjustCurrentRestRemaining, getWorkoutEquipment, getWorkoutDetailModel, getStrengthRestPreview };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else globalThis.SoulStrengthPlayback = api;
})();
