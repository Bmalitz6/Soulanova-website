'use strict';
(() => {
  const $ = selector => document.querySelector(selector);
  const root = $('#strength-app');
  const authRequired = $('#auth-required');
  const loadError = $('#load-error');
  const storagePrefix = 'soulanova-strength-web-v1:';
  let catalog;
  let client;
  let member;
  let level = 'Beginner';
  let selectedWorkout;
  let view = 'library';
  let phase = 'warmup';
  let exerciseIndex = 0;
  let setProgress;
  let paused = true;
  let timerHandle = null;
  let restRemaining = 0;
  let restDisplay = null;
  let restAction = null;
  let activeVideo = null;
  let activeAudio = null;
  const internalPauseVideos = new WeakSet();
  let activeCueId = null;
  let completedCueIds = new Set();
  let completionId = null;
  let pendingCompletion = null;
  let localCompletions = [];
  let localHistoryReadable = true;
  let remoteHistoryReady = false;
  const syncedCompletionIds = new Set();
  let workoutRestOverride = null;
  let detailCustomRestValue = '30';
  let strengthTransitioning = false;
  let strengthTransitionType = 'set';
  const progressTools = window.SoulStrengthProgress;
  const playbackTools = window.SoulStrengthPlayback;
  const environmentTools = window.SoulanovaStrengthEnvironment;
  let playbackNeedsGesture = false;
  let activeSupabaseUrl = null;
  let supabaseAccess = null;

  function canReadActiveProject() {
    return !!(client && activeSupabaseUrl && progressTools?.isExpectedSupabaseUrl(client.supabaseUrl, activeSupabaseUrl));
  }
  function canSyncActiveProject() { return canReadActiveProject() && supabaseAccess?.canWrite === true; }

  function setStatus(message) { $('#progress-status').textContent = message; }
  function makeButton(label, className, handler) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = className; button.textContent = label;
    button.addEventListener('click', handler);
    return button;
  }
  function mediaUrl(path) { return `/app/strength/media/${path}`; }
  function makeUuid() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
      const random = Math.random() * 16 | 0;
      return (char === 'x' ? random : (random & 3 | 8)).toString(16);
    });
  }
  function loadLocalCompletions() {
    try {
      const raw = localStorage.getItem(storagePrefix + member.id);
      localCompletions = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(localCompletions)) throw Error('Invalid completion data');
      localCompletions = localCompletions.filter(item => item?.user_id === member.id && typeof item.completion_id === 'string');
    } catch (error) {
      localHistoryReadable = false;
      localCompletions = [];
      setStatus('This browser could not read saved progress. Existing data was not overwritten.');
      console.warn('SoulStrength local completion history could not be read.', error);
      return false;
    }
    renderProgress();
    if (catalog && view === 'library') renderLibrary();
    return true;
  }
  function saveLocalCompletion(record) {
    if (!localHistoryReadable) return false;
    localCompletions = [record, ...localCompletions.filter(item => item.completion_id !== record.completion_id)].slice(0, 100);
    try { localStorage.setItem(storagePrefix + member.id, JSON.stringify(localCompletions)); }
    catch (error) {
      console.warn('SoulStrength local completion history could not be saved.', error);
      setStatus('Workout completed, but this browser could not save local progress. Keep this page open and retry sync.');
      return false;
    }
    renderProgress();
    return true;
  }
  function renderProgress() {
    const list = $('#progress-list'); list.replaceChildren();
    if (!localCompletions.length) { list.textContent = 'Your completed workouts will appear here.'; return; }
    localCompletions.forEach(record => {
      const row = document.createElement('div'); row.className = 'progress-item';
      const name = document.createElement('strong'); name.textContent = record.workout_title;
      const date = document.createElement('small'); date.textContent = `${record.difficulty} · ${new Date(record.completed_at).toLocaleDateString()}`;
      row.append(name, date); list.append(row);
    });
  }
  function renderLibrary() {
    view = 'library'; $('#library-view').hidden = false; $('#workout-detail').hidden = true; $('#player-view').hidden = true;
    const list = $('#workout-list'); list.replaceChildren();
    const workouts = catalog.workouts.filter(workout => workout.level === level);
    const recommended = progressTools?.getRecommendedWorkout(workouts, localCompletions);
    const counts = progressTools?.completionCounts(localCompletions) || {};
    workouts.forEach(workout => {
      const featured = catalog.exercises.find(exercise => exercise.id === workout.thumbnailExerciseId);
      const card = document.createElement('article'); card.className = 'workout-card';
      const copy = document.createElement('div');
      const title = document.createElement('h3'); title.textContent = workout.title;
      const desc = document.createElement('p'); desc.textContent = workout.description;
      const meta = document.createElement('small'); meta.textContent = `${workout.level} · ${workout.exercises.length} exercises · ${workout.estimatedMinutes} min`;
      const progress = document.createElement('small');
      const count = counts[workout.id] || 0;
      progress.className = 'workout-progress';
      progress.textContent = `${count ? `Completed ${count} ${count === 1 ? 'time' : 'times'}` : 'Not completed yet'}${recommended?.id === workout.id ? ' · Next recommended' : ''}`;
      const open = makeButton('View workout →', 'card-open', () => renderDetail(workout));
      copy.append(title, desc, meta, document.createElement('br'), progress, document.createElement('br'), open);
      const image = document.createElement('img'); image.src = mediaUrl(featured.thumbnail); image.alt = `${featured.name} exercise still`; image.loading = 'lazy';
      card.append(copy, image); list.append(card);
    });
  }
  function renderDetail(workout) {
    workoutRestOverride = null;
    stopMedia(); selectedWorkout = workout; view = 'detail'; $('#library-view').hidden = true; $('#player-view').hidden = true;
    const detail = $('#workout-detail'); detail.replaceChildren(); detail.hidden = false;
    let detailModel;
    try {
      detailModel = playbackTools.getWorkoutDetailModel(workout, catalog.exercises);
    } catch (error) {
      console.error('SoulStrength workout details failed to render.', error);
      const message = document.createElement('p'); message.className = 'notice error'; message.textContent = 'Workout details could not load. Refresh this Development page and try again.';
      const back = makeButton('← Workout list', 'button secondary', renderLibrary);
      detail.append(message, back);
      return;
    }
    const card = document.createElement('article'); card.className = 'detail-card';
    const back = makeButton('← Workout list', 'button secondary', renderLibrary);
    const eyebrow = document.createElement('p'); eyebrow.className = 'eyebrow'; eyebrow.textContent = `${detailModel.level.toUpperCase()} · ${detailModel.estimatedMinutes} MINUTES`;
    const heading = document.createElement('h2'); heading.textContent = detailModel.title;
    const description = document.createElement('p'); description.textContent = detailModel.description;
    const guidance = document.createElement('p'); guidance.textContent = detailModel.guidance;
    const equipment = detailModel.equipment;
    const equipmentSection = document.createElement('section'); equipmentSection.className = 'equipment-summary';
    const equipmentTitle = document.createElement('h3'); equipmentTitle.textContent = 'Equipment You’ll Need';
    const equipmentItems = document.createElement('div'); equipmentItems.className = 'equipment-items';
    if (equipment.noEquipmentRequired) { const item = document.createElement('p'); item.textContent = 'No equipment required'; equipmentItems.append(item); }
    equipment.required.forEach(name => { const item = document.createElement('p'); item.textContent = `Required · ${name}`; equipmentItems.append(item); });
    equipment.optional.forEach(name => { const item = document.createElement('p'); item.className = 'optional'; item.textContent = `Optional · ${name}`; equipmentItems.append(item); });
    if (equipment.unspecifiedExerciseCount) { const note = document.createElement('small'); note.textContent = `Equipment is not specified for ${equipment.unspecifiedExerciseCount} ${equipment.unspecifiedExerciseCount === 1 ? 'movement' : 'movements'}.`; equipmentItems.append(note); }
    equipmentSection.append(equipmentTitle, equipmentItems);
    const restSection = document.createElement('section'); restSection.className = 'rest-settings';
    const restTitle = document.createElement('h3'); restTitle.textContent = 'Rest Between Sets';
    const restHelp = document.createElement('p'); restHelp.textContent = 'Plan default uses each movement’s prescribed duration. An override applies between sets and exercises.';
    const restChoices = document.createElement('div'); restChoices.className = 'rest-setting-choices';
    const customInput = document.createElement('input'); customInput.type = 'number'; customInput.min = '10'; customInput.max = '180'; customInput.step = '5'; customInput.value = detailCustomRestValue; customInput.setAttribute('aria-label', 'Custom rest duration in seconds');
    const selectionLabel = document.createElement('p'); selectionLabel.className = 'rest-setting-summary';
    const restOptions = [{ label: 'Plan default', value: 'plan' }, ...playbackTools.REST_DURATION_PRESETS.map(seconds => ({ label: `${seconds}s`, value: String(seconds) })), { label: 'Custom', value: 'custom' }];
    function selectedRestSeconds() { return workoutRestOverride ?? (Number.isInteger(Number(detailCustomRestValue)) && playbackTools.isValidCustomRestDuration(detailCustomRestValue) && restChoices.querySelector('[aria-pressed="true"]')?.dataset.value === 'custom' ? Number(detailCustomRestValue) : null); }
    function updateRestDetail() {
      const selected = selectedRestSeconds();
      selectionLabel.textContent = selected === null ? `Plan default · ${[...new Set(detailModel.exercises.map(item => item.prescribedRestSeconds))].sort((a,b)=>a-b).join('s, ')}s as prescribed` : `Selected rest · ${selected} seconds between sets and exercises`;
      list.querySelectorAll('[data-plan-exercise]').forEach((row, index) => { const item = detailModel.exercises[index]; row.textContent = `${item.sets} sets · ${item.reps} · ${selected ?? item.prescribedRestSeconds}s rest`; });
      start.disabled = restChoices.querySelector('[aria-pressed="true"]')?.dataset.value === 'custom' && !playbackTools.isValidCustomRestDuration(detailCustomRestValue);
    }
    restOptions.forEach(option => {
      const button = makeButton(option.label, 'rest-setting-choice', () => {
        restChoices.querySelectorAll('button').forEach(choice => { choice.setAttribute('aria-pressed', String(choice === button)); choice.classList.toggle('selected', choice === button); });
        workoutRestOverride = option.value === 'plan' ? null : option.value === 'custom' ? (playbackTools.isValidCustomRestDuration(detailCustomRestValue) ? Number(detailCustomRestValue) : null) : Number(option.value);
        updateRestDetail();
      });
      button.dataset.value = option.value;
      button.setAttribute('aria-pressed', String(option.value === 'plan'));
      if (option.value === 'plan') button.classList.add('selected');
      restChoices.append(button);
    });
    customInput.addEventListener('input', () => { detailCustomRestValue = customInput.value; if (restChoices.querySelector('[aria-pressed="true"]')?.dataset.value === 'custom') workoutRestOverride = playbackTools.isValidCustomRestDuration(detailCustomRestValue) ? Number(detailCustomRestValue) : null; updateRestDetail(); });
    restSection.append(restTitle, restHelp, restChoices, customInput, selectionLabel);
    const list = document.createElement('ol'); list.className = 'exercise-list';
    detailModel.exercises.forEach(item => {
      const li = document.createElement('li'); li.className = 'detail-exercise';
      const name = document.createElement('strong'); name.textContent = item.name;
      const prescription = document.createElement('small'); prescription.dataset.planExercise = 'true'; prescription.textContent = `${item.sets} sets · ${item.reps} · ${item.restSeconds}s rest`;
      const cue = document.createElement('small'); cue.textContent = item.instruction;
      li.append(name, prescription, cue); list.append(li);
    });
    const start = makeButton('Start Workout', 'button primary', () => startWorkout(workout));
    card.append(back, eyebrow, heading, description, guidance, equipmentSection, restSection, list, start);
    updateRestDetail();
    detail.append(card); detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function appendPlayerShell(title, eyebrow) {
    const player = $('#player-view'); player.replaceChildren(); player.hidden = false;
    const card = document.createElement('article'); card.className = 'player-card';
    const head = document.createElement('div'); head.className = 'player-head';
    const copy = document.createElement('div');
    const label = document.createElement('p'); label.className = 'eyebrow'; label.textContent = eyebrow;
    const heading = document.createElement('h2'); heading.textContent = title;
    copy.append(label, heading);
    const exit = makeButton('Exit workout', 'button secondary', () => { stopMedia(); renderLibrary(); });
    head.append(copy, exit); card.append(head);
    player.append(card); return { player, card };
  }
  function startWorkout(workout) {
    selectedWorkout = workout; view = 'player'; phase = playbackTools.getWorkoutStartPhase(); exerciseIndex = 0;
    setProgress = playbackTools.createStrengthPlaybackState(); restAction = null; restRemaining = 0; strengthTransitioning = false;
    paused = true; completionId = makeUuid(); completedCueIds = new Set();
    playbackNeedsGesture = false;
    $('#workout-detail').hidden = true; $('#library-view').hidden = true; renderPhase();
    setPaused(false);
    $('#player-view').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function formatTime(seconds) { return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; }
  function narrationForCurrentTime(cues, videoTime) {
    const cueIndex = cues.findIndex((cue, index) => videoTime >= cue.startSeconds && videoTime < cue.startSeconds + cue.durationSeconds && !completedCueIds.has(cue.id));
    const cue = cueIndex < 0 ? null : cues[cueIndex];
    if (cue?.id !== activeCueId) {
      if (activeAudio) { activeAudio.pause(); activeAudio.currentTime = 0; }
      activeCueId = cue?.id ?? null;
      if (cue) {
        const cueAudio = activeAudio || new Audio(); activeAudio = cueAudio; cueAudio.pause(); cueAudio.preload = 'auto'; cueAudio.src = mediaUrl(cue.asset);
        const cueVideo = activeVideo;
        const offset = Math.max(0, videoTime - cue.startSeconds);
        cueAudio.onloadedmetadata = () => { if (activeAudio !== cueAudio || activeCueId !== cue.id) return; cueAudio.currentTime = Math.min(offset, cueAudio.duration || offset); if (!paused) cueAudio.play().catch(() => showPlaybackRecovery(cueVideo, cueAudio)); };
        cueAudio.onended = () => { completedCueIds.add(cue.id); if (activeAudio === cueAudio) activeCueId = null; };
        cueAudio.load();
        if (!paused) cueAudio.play().catch(() => showPlaybackRecovery(cueVideo, cueAudio));
        if (cueAudio.readyState >= 1) { cueAudio.currentTime = offset; if (!paused) cueAudio.play().catch(() => showPlaybackRecovery(cueVideo, cueAudio)); }
      }
    } else if (activeAudio && !paused && activeAudio.paused && activeAudio.readyState >= 2) {
      const expected = Math.max(0, videoTime - cue.startSeconds);
      if (Math.abs(activeAudio.currentTime - expected) > 0.9) activeAudio.currentTime = expected;
      const cueVideo = activeVideo; const cueAudio = activeAudio;
      cueAudio.play().catch(() => showPlaybackRecovery(cueVideo, cueAudio));
    }
    if (activeAudio && cue && videoTime >= cue.startSeconds + cue.durationSeconds) {
      activeAudio.pause(); activeAudio.currentTime = 0; completedCueIds.add(cue.id); activeCueId = null;
    }
    return cue;
  }
  function stopMedia() {
    if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
    if (activeVideo) { activeVideo.pause(); activeVideo.removeAttribute('src'); activeVideo.load(); activeVideo = null; }
    if (activeAudio) { activeAudio.pause(); activeAudio.removeAttribute('src'); activeAudio.load(); activeAudio = null; }
    activeCueId = null; paused = true; playbackNeedsGesture = false;
    strengthTransitioning = false;
  }
  function updatePlaybackToggle() {
    const toggle = $('#player-view .playback-toggle');
    if (toggle) toggle.textContent = playbackTools.getPlaybackButtonLabel(paused, playbackNeedsGesture);
  }
  function showPlaybackRecovery(video = activeVideo, audio = activeAudio) {
    if (!video || activeVideo !== video || (audio && activeAudio !== audio)) return;
    paused = true;
    playbackNeedsGesture = true;
    if (!video.paused) video.pause();
    if (audio && !audio.paused) audio.pause();
    if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
    updatePlaybackToggle();
    const narrated = phase === 'warmup' || phase === 'cooldown';
    setStatus(playbackTools.getAutoplayRecoveryMessage(narrated));
    const cue = $('#current-cue');
    if (cue) cue.textContent = narrated ? 'Tap Play to begin the warm-up video and Bernard narration.' : 'Tap Play to begin the exercise video.';
  }
  function pauseVideoForTransition(video) {
    if (!video || video.paused) return;
    internalPauseVideos.add(video);
    video.pause();
  }
  function setPaused(nextPaused) {
    paused = nextPaused;
    if (activeVideo) {
      if (paused) activeVideo.pause();
      else if (!(phase === 'strength' && restRemaining > 0)) {
        try {
          const video = activeVideo;
          const request = video.play();
          if (request && typeof request.catch === 'function') request.catch(() => showPlaybackRecovery(video));
        } catch {
          showPlaybackRecovery(activeVideo);
        }
      }
    }
    if (activeAudio) { if (paused) activeAudio.pause(); else if (activeVideo && (phase === 'warmup' || phase === 'cooldown')) narrationForCurrentTime(currentCues(), activeVideo.currentTime); }
    else if (!paused && activeVideo && (phase === 'warmup' || phase === 'cooldown')) narrationForCurrentTime(currentCues(), activeVideo.currentTime);
    if (paused && timerHandle) { clearInterval(timerHandle); timerHandle = null; }
    document.querySelectorAll('.rest-adjustments button').forEach(button => { button.disabled = paused; });
    if (phase === 'strength' && restRemaining > 0 && !paused) runRestTimer();
    updatePlaybackToggle();
  }
  function currentCues() { return phase === 'warmup' ? catalog.segments.warmupCues : catalog.segments.cooldownCues; }
  function setupVideo(source, cueList, label) {
    const video = document.createElement('video'); video.className = 'player-media'; video.playsInline = true; video.preload = 'metadata'; video.controls = true;
    video.setAttribute('aria-label', label); video.src = mediaUrl(source); activeVideo = video;
    video.addEventListener('timeupdate', () => { const cue = narrationForCurrentTime(cueList, video.currentTime); const copy = $('#current-cue'); if (copy) copy.textContent = cue ? `Bernard · ${decodeURIComponent(cue.fileName).replace(/\.mp3$/i, '')}` : 'Follow the movement at your own comfortable pace.'; });
    video.addEventListener('play', () => {
      if (activeVideo !== video) return;
      if (phase === 'strength' && restRemaining > 0) { pauseVideoForTransition(video); return; }
      playbackNeedsGesture = false;
      paused = false;
      updatePlaybackToggle();
      if (cueList.length) narrationForCurrentTime(cueList, video.currentTime);
    });
    video.addEventListener('pause', () => {
      if (internalPauseVideos.has(video)) { internalPauseVideos.delete(video); return; }
      if (activeVideo !== video || paused || video.ended) return;
      paused = true;
      if (activeAudio) activeAudio.pause();
      if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
      const toggle = $('#player-view .playback-toggle'); if (toggle) toggle.textContent = 'Resume';
    });
    video.addEventListener('seeking', () => { if (activeAudio) { activeAudio.pause(); activeAudio.currentTime = 0; } activeCueId = null; });
    video.addEventListener('play', () => { if (!paused && activeAudio?.paused) narrationForCurrentTime(cueList, video.currentTime); });
    video.addEventListener('playing', () => {
      if (activeVideo !== video || phase !== 'strength' || !strengthTransitioning) return;
      strengthTransitioning = false;
      const overlay = video.closest('.strength-video-frame')?.querySelector('.rest-screen');
      if (overlay) overlay.hidden = true;
    });
    video.addEventListener('ended', () => {
      if (activeVideo !== video) return;
      if (phase === 'warmup') { stopMedia(); phase = 'strength'; paused = false; renderPhase(); }
      else if (phase === 'cooldown') { stopMedia(); phase = 'completion'; saveCompletion(); renderPhase(); }
      else if (phase === 'strength') completeStrengthVideo(video);
    });
    return video;
  }
  function renderPhase() {
    if (!selectedWorkout) return;
    const phaseNames = { warmup: 'Narrated warm-up', strength: `Exercise ${Math.min(exerciseIndex + 1, selectedWorkout.exercises.length)} of ${selectedWorkout.exercises.length}`, cooldown: 'Narrated cool-down', completion: 'Workout complete' };
    const { card } = appendPlayerShell(phaseNames[phase], `${selectedWorkout.level.toUpperCase()} · ${selectedWorkout.title.toUpperCase()}`);
    if (phase === 'warmup' || phase === 'cooldown') {
      const source = phase === 'warmup' ? catalog.segments.warmupVideo : catalog.segments.cooldownVideo;
      const cues = currentCues(); const video = setupVideo(source, cues, `${phase} video with Bernard narration`);
      const cueText = document.createElement('p'); cueText.id = 'current-cue'; cueText.className = 'cue'; cueText.textContent = playbackNeedsGesture ? 'Tap Play to begin the video and Bernard narration.' : 'Starting the video and narration…';
      const seek = document.createElement('input'); seek.type = 'range'; seek.min = '0'; seek.max = '320'; seek.value = '0'; seek.setAttribute('aria-label', `${phase} position`);
      video.addEventListener('timeupdate', () => { seek.value = String(video.currentTime); });
      seek.addEventListener('input', () => { video.currentTime = Number(seek.value); });
      const controls = document.createElement('div'); controls.className = 'player-controls';
      const toggle = makeButton(playbackTools.getPlaybackButtonLabel(paused, playbackNeedsGesture), 'button primary playback-toggle', () => { setPaused(!paused); });
      const continueLabel = phase === 'warmup' ? 'Continue to exercises' : 'Continue to summary';
      const next = makeButton(continueLabel, 'button secondary', () => { stopMedia(); phase = phase === 'warmup' ? 'strength' : 'completion'; paused = false; if (phase === 'completion') saveCompletion(); renderPhase(); });
      controls.append(toggle, next); card.append(video, cueText, seek, controls);
      if (!paused) video.play().catch(() => showPlaybackRecovery(video));
    } else if (phase === 'strength') {
      const item = selectedWorkout.exercises[exerciseIndex];
      if (!item) { phase = 'cooldown'; renderPhase(); return; }
      const exercise = catalog.exercises.find(entry => entry.id === item.exerciseId);
      const video = setupVideo(exercise.video, [], `${exercise.name} instructor demonstration`); video.loop = false; video.controls = false;
      const videoFrame = document.createElement('div'); videoFrame.className = 'strength-video-frame';
      const instruction = document.createElement('p'); instruction.textContent = item.instruction;
      const plannedRest = workoutRestOverride ?? item.restSeconds;
      const wasCurrentSetCompleted = setProgress.endClaimed && setProgress.currentSet >= item.sets;
      const prescription = document.createElement('p'); prescription.className = 'eyebrow'; prescription.textContent = `EXERCISE ${exerciseIndex + 1} OF ${selectedWorkout.exercises.length} · SET ${setProgress.currentSet} OF ${item.sets}${wasCurrentSetCompleted ? ' COMPLETE' : ''} · ${item.reps}`;
      const count = document.createElement('p'); count.className = 'player-meta'; count.textContent = `${setProgress.completedSets} of ${selectedWorkout.exercises.reduce((sum, step) => sum + step.sets, 0)} sets complete · ${setProgress.completedExercises} exercises complete`;
      const toggle = makeButton(playbackTools.getPlaybackButtonLabel(paused, playbackNeedsGesture), 'button primary playback-toggle', () => { setPaused(!paused); });
      const rest = document.createElement('div'); rest.className = 'rest-screen'; rest.hidden = !(restRemaining || strengthTransitioning);
      const restAdjustments = document.createElement('div'); restAdjustments.className = 'rest-adjustments'; restAdjustments.hidden = !restRemaining;
      const preview = strengthTransitioning
        ? strengthTransitionType === 'exercise'
          ? playbackTools.getStrengthRestPreview(selectedWorkout, Math.max(0, exerciseIndex - 1), 1, true, catalog.exercises)
          : playbackTools.getStrengthRestPreview(selectedWorkout, exerciseIndex, setProgress.currentSet, false, catalog.exercises)
        : playbackTools.getStrengthRestPreview(selectedWorkout, exerciseIndex, setProgress.currentSet, Boolean(wasCurrentSetCompleted), catalog.exercises);
      if ((restRemaining || strengthTransitioning) && preview) {
        const restHeading = document.createElement('p'); restHeading.className = 'eyebrow'; restHeading.textContent = strengthTransitioning ? 'UP NEXT' : preview.label;
        const countdown = document.createElement('div'); countdown.className = 'timer'; countdown.textContent = strengthTransitioning ? 'Starting…' : formatTime(restRemaining); restDisplay = strengthTransitioning ? null : countdown;
        const restSetting = document.createElement('small'); restSetting.className = 'rest-setting-summary'; restSetting.textContent = workoutRestOverride === null ? `Plan default · ${item.restSeconds}s prescribed` : `Workout setting · ${workoutRestOverride}s`;
        const previewRow = document.createElement('div'); previewRow.className = 'rest-preview';
        if (preview.thumbnail) { const image = document.createElement('img'); image.src = mediaUrl(preview.thumbnail); image.alt = `${preview.exerciseName} exercise still`; previewRow.append(image); }
        const previewCopy = document.createElement('div'); previewCopy.className = 'rest-preview-copy';
        const previewName = document.createElement('strong'); previewName.textContent = preview.exerciseName; previewCopy.append(previewName);
        if (preview.kind === 'set') { const meta = document.createElement('small'); meta.textContent = `Up next · Set ${preview.setNumber} of ${preview.totalSets}`; previewCopy.append(meta); }
        if (preview.kind === 'exercise') { const meta = document.createElement('small'); meta.textContent = `${preview.sets} sets · ${preview.reps}`; const gear = document.createElement('small'); gear.textContent = preview.equipment; previewCopy.append(meta, gear); }
        previewRow.append(previewCopy);
        const minus = makeButton('−15 sec', 'button secondary', () => adjustCurrentRest(-15)); minus.setAttribute('aria-label', 'Reduce current rest by 15 seconds');
        const plus = makeButton('+15 sec', 'button secondary', () => adjustCurrentRest(15)); plus.setAttribute('aria-label', 'Add 15 seconds to current rest');
        const skip = makeButton('Skip Rest', 'rest-skip', finishStrengthRest); skip.disabled = paused;
        restAdjustments.append(minus, plus, skip);
        rest.append(restHeading, countdown);
        if (!strengthTransitioning) rest.append(restSetting);
        rest.append(previewRow);
      }
      video.hidden = Boolean(restRemaining);
      videoFrame.append(video, rest);
      const handsFree = document.createElement('p'); handsFree.className = 'cue'; handsFree.textContent = wasCurrentSetCompleted ? 'Set complete. The next exercise will begin automatically after rest.' : restRemaining ? 'Resting. The next set will begin automatically when the timer ends.' : 'One complete video records one set. Sets and exercises advance automatically.';
      card.append(prescription, videoFrame, restAdjustments, instruction, count, toggle, handsFree);
      if (!paused && !restRemaining) video.play().catch(() => showPlaybackRecovery(video));
    } else {
      const summary = document.createElement('p'); summary.textContent = `You completed ${setProgress.completedExercises} of ${selectedWorkout.exercises.length} exercises and ${setProgress.completedSets} sets in ${selectedWorkout.title}.`;
      const status = document.createElement('p'); status.className = 'cue'; status.textContent = remoteHistoryReady ? 'Progress synced to your Soulanova account across devices.' : 'Workout progress is saved in this browser. Account sync will retry when available.';
      const retry = makeButton('Retry account sync', 'button secondary', () => syncCompletion(true)); retry.hidden = remoteHistoryReady;
      const back = makeButton('Choose another workout', 'button primary', () => { stopMedia(); selectedWorkout = null; renderLibrary(); });
      card.append(summary, status, retry, back);
    }
  }
  function completeStrengthVideo(video) {
    if (phase !== 'strength' || activeVideo !== video || paused || restRemaining > 0 || !selectedWorkout) return;
    const item = selectedWorkout.exercises[exerciseIndex];
    if (!item) return;
    const result = playbackTools.completeStrengthPlaybackSet(setProgress, item.sets);
    if (!result) return;
    if (activeAudio) activeAudio.pause();
    restAction = playbackTools.getStrengthActionAfterRest(result.exerciseComplete);
    restRemaining = workoutRestOverride ?? item.restSeconds;
    if (restRemaining > 0) {
      renderPhase();
      runRestTimer();
      return;
    }
    finishStrengthRest();
  }
  function finishStrengthRest() {
    if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
    const action = restAction; restAction = null; restRemaining = 0;
    if (action === 'next-exercise') { strengthTransitioning = true; strengthTransitionType = 'exercise'; nextExercise(); return; }
    if (action === 'replay-set') {
      strengthTransitioning = true; strengthTransitionType = 'set';
      playbackTools.releaseStrengthPlaybackEnd(setProgress);
      renderPhase();
    }
  }
  function runRestTimer() {
    if (timerHandle) clearInterval(timerHandle); timerHandle = null;
    if (paused || restRemaining <= 0) return;
    timerHandle = setInterval(() => {
      restRemaining = Math.max(0, restRemaining - 1);
      if (restDisplay) restDisplay.textContent = restRemaining ? formatTime(restRemaining) : '0:00';
      if (restRemaining <= 0) { clearInterval(timerHandle); timerHandle = null; finishStrengthRest(); }
    }, 1000);
  }
  function adjustCurrentRest(delta) {
    if (paused || restRemaining <= 0) return;
    restRemaining = playbackTools.adjustCurrentRestRemaining(restRemaining, delta);
    if (restDisplay) restDisplay.textContent = formatTime(restRemaining);
    if (restRemaining <= 0) finishStrengthRest();
  }
  function nextExercise() {
    pauseVideoForTransition(activeVideo); if (activeAudio) activeAudio.pause();
    exerciseIndex++; setProgress.currentSet = 1; setProgress.endClaimed = false; restRemaining = 0; restAction = null;
    if (exerciseIndex >= selectedWorkout.exercises.length) { strengthTransitioning = false; phase = 'cooldown'; completedCueIds = new Set(); }
    renderPhase();
  }
  async function saveCompletion() {
    if (!selectedWorkout) return;
    const duration = selectedWorkout.estimatedMinutes;
    const record = { completion_id: completionId || makeUuid(), user_id: member.id, workout_id: selectedWorkout.id, workout_title: selectedWorkout.title, difficulty: selectedWorkout.level, duration_minutes: duration, completed_at: new Date().toISOString() };
    completionId = record.completion_id;
    pendingCompletion = record;
    const localSaved = saveLocalCompletion(record);
    await syncCompletion(false, record);
    if (!localSaved) setStatus('Browser history could not be read, so it was preserved. Account sync was attempted for this workout.');
  }
  async function syncCompletion(force, record) {
    if (!client || !member || !canSyncActiveProject()) return;
    try {
      const completion = record || pendingCompletion || localCompletions.find(item => item.completion_id === completionId);
      if (!completion) return;
      if (completion.user_id !== member.id) return;
      const { data: sessionData, error: sessionError } = await client.auth.getSession();
      if (sessionError || sessionData.session?.user?.id !== member.id) return;
      if (syncedCompletionIds.has(completion.completion_id)) return;
      const { error } = await client.from('strength_workout_completions').upsert(completion, { onConflict: 'completion_id', ignoreDuplicates: true });
      if (error) throw error;
      syncedCompletionIds.add(completion.completion_id);
      pendingCompletion = null;
      remoteHistoryReady = true; setStatus('Workout progress is saved to your signed-in account and available across Soulanova platforms.');
      if (view === 'library') renderLibrary();
      if (view === 'player' && phase === 'completion') renderPhase();
    } catch (error) {
      remoteHistoryReady = false;
      setStatus('This completion is saved in the browser. Account sync will retry when connectivity returns.');
      console.warn('SoulStrength account sync is unavailable.', error);
      if (force && view === 'player' && phase === 'completion') renderPhase();
    }
  }
  async function loadRemoteHistory() {
    if (!client || !member || !canReadActiveProject()) return;
    try {
      const { data, error } = await client.from('strength_workout_completions').select('completion_id,user_id,workout_id,workout_title,difficulty,duration_minutes,completed_at').eq('user_id', member.id).order('completed_at', { ascending: false });
      if (error) throw error;
      remoteHistoryReady = true;
      (data || []).forEach(record => syncedCompletionIds.add(record.completion_id));
      localCompletions = progressTools.mergeCompletionRecords(member.id, localCompletions, data || []);
      if (localHistoryReadable) { try { localStorage.setItem(storagePrefix + member.id, JSON.stringify(localCompletions)); } catch (error) { localHistoryReadable = false; console.warn('Merged SoulStrength history remains in memory only.', error); } }
      renderProgress(); if (view === 'library') renderLibrary(); setStatus('Account history loaded for this member across Soulanova platforms.');
      await retryPendingCompletions();
    } catch (error) {
      remoteHistoryReady = false;
      setStatus('Local browser progress is available. Account history could not sync now and will be retried when connectivity returns.');
      console.info('SoulStrength completion history table is not available in the current Supabase schema.', error?.message || error);
    }
  }
  async function retryPendingCompletions() {
    if (!canSyncActiveProject() || !member || !localHistoryReadable) return;
    const pending = progressTools.pendingCompletionRecords(member.id, localCompletions, syncedCompletionIds);
    for (const record of pending) await syncCompletion(false, record);
  }
  function setup() {
    $('#hero-image').src = mediaUrl(catalog.hero);
    document.querySelectorAll('[data-level]').forEach(button => button.addEventListener('click', () => {
      level = button.dataset.level;
      document.querySelectorAll('[data-level]').forEach(tab => tab.setAttribute('aria-selected', String(tab === button)));
      renderLibrary();
    }));
    $('#sign-out').addEventListener('click', async () => { if (client) await client.auth.signOut(); window.location.href = '/app/'; });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && !paused) { setPaused(true); setStatus('Workout paused while this page was in the background. Tap Resume when you return.'); }
      else if (!document.hidden) { void retryPendingCompletions(); void loadRemoteHistory(); }
    });
    window.addEventListener('online', () => { void retryPendingCompletions(); void loadRemoteHistory(); });
    if (!progressTools || !window.supabase) throw Error('The SoulStrength progress service is not available.');
    const config = window.SOULANOVA_SUPABASE;
    if (!environmentTools?.resolve) throw Error('The SoulStrength environment verifier is not available.');
    supabaseAccess = environmentTools.resolve({
      hostname: location.hostname,
      config,
      developmentConfig: window.SOULANOVA_SUPABASE_DEVELOPMENT,
      isExpectedProductionProject: Boolean(config?.url && progressTools.isExpectedSupabaseUrl(config.url, 'https://dscbavbnlubfmfhudqwy.supabase.co')),
    });
    activeSupabaseUrl = config.url;
    client = window.supabase.createClient(config.url, config.publishableKey, { auth: { flowType: 'pkce', autoRefreshToken: true, persistSession: true, detectSessionInUrl: true } });
    client.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) { member = null; localCompletions = []; localHistoryReadable = true; remoteHistoryReady = false; syncedCompletionIds.clear(); root.hidden = true; authRequired.hidden = false; }
      else if (member && session.user.id !== member.id) { member = session.user; localCompletions = []; localHistoryReadable = true; remoteHistoryReady = false; syncedCompletionIds.clear(); loadLocalCompletions(); renderLibrary(); void loadRemoteHistory(); }
    });
    client.auth.getUser().then(async ({ data, error }) => {
      if (error) throw error;
      if (!data.user) { authRequired.hidden = false; return; }
      member = data.user; $('#member-name').textContent = `Signed in as ${member.email || 'Soulanova member'}`;
      authRequired.hidden = true; root.hidden = false; renderLibrary(); loadLocalCompletions(); await loadRemoteHistory();
    }).catch(error => { loadError.textContent = 'Could not verify your member session. Return to the member sign-in page and try again.'; loadError.hidden = false; console.warn('SoulStrength member session could not be verified.', error); });
  }
  fetch('/app/strength/strengthWorkouts.json', { cache: 'no-cache' }).then(response => { if (!response.ok) throw Error(`Workout catalog unavailable (${response.status})`); return response.json(); }).then(data => {
    catalog = data;
    if (catalog.workouts.length !== 36 || catalog.exercises.length !== 17 || ['Beginner', 'Intermediate', 'Advanced'].some(name => catalog.workouts.filter(workout => workout.level === name).length !== 12)) throw Error('The approved SoulStrength catalog failed validation.');
    setup();
  }).catch(error => { loadError.textContent = 'SoulStrength could not load its approved workout library. Please try again later.'; loadError.hidden = false; console.error('SoulStrength library load failed.', error); });
})();
