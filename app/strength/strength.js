'use strict';
(() => {
  const $ = selector => document.querySelector(selector);
  const root = $('#strength-app');
  const authRequired = $('#auth-required');
  const loadError = $('#load-error');
  const storagePrefix = 'soulanova-strength-web-v1:';
  let catalog;
  let verifiedMedia;
  let authRevision=0;
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
  let playbackNeedsGesture = false;
  let activeSupabaseUrl = null;

  function canSyncActiveProject(){return false;}

  function setStatus(message) { $('#progress-status').textContent = message; }
  function makeButton(label, className, handler) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = className; button.textContent = label;
    button.addEventListener('click', handler);
    return button;
  }
  function mediaUrl(path){if(!/^(images|thumbnails|workout-thumbnails)\/[A-Za-z0-9_.-]+$/.test(path))throw Error('Only approved still assets may use this path.');return '/app/strength/media/'+path;}
  function makeUuid() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
      const random = Math.random() * 16 | 0;
      return (char === 'x' ? random : (random & 3 | 8)).toString(16);
    });
  }
  function loadLocalCompletions(){localCompletions=[];renderProgress();return false;}

  function saveLocalCompletion(){setStatus('Recording remains paused; existing history is unchanged.');return false;}

  function renderProgress(){$('#progress-list').replaceChildren();setStatus('Recording remains paused; existing local and cloud history is not read or changed.');}

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
      progress.textContent='Progress recording paused · Existing history unchanged';
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
      start.disabled=true;
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
      const asset=catalog.exercises.find(e=>e.id===item.exerciseId);if(asset){const image=document.createElement('img');image.src=mediaUrl(asset.thumbnail);image.alt=asset.name+' exercise icon';image.className='exercise-icon';li.append(image);}li.append(name,prescription,cue);if(asset&&window.SoulanovaPrograms.media(verifiedMedia.get(asset.id)))li.append(makeButton('View approved demonstration','button secondary',()=>showApprovedDemo(asset.id)));else{const note=document.createElement('small');note.textContent='Video pending final-master confirmation.';li.append(note);}list.append(li);
    });
    const start=makeButton('Guided session unavailable in this Preview','button primary',()=>startWorkout(workout));start.disabled=true;
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
  function startWorkout(){setStatus('Full guided sessions remain paused pending final-master and segment approval.');}

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
  async function saveCompletion(){setStatus('Recording remains paused; no completion is saved.');}

  async function syncCompletion(){return false;}

  async function loadRemoteHistory(){return false;}

  async function retryPendingCompletions(){return false;}

  async function verifiedOwner(){const expected=member?.id,revision=authRevision;if(!expected||!client)throw Error('Sign in required.');const {data,error}=await client.auth.getUser();if(error||data?.user?.is_anonymous||data?.user?.id!==expected||revision!==authRevision)throw Error('Member verification changed.');return expected;}
  async function showApprovedDemo(id){const revision=authRevision;try{await verifiedOwner();if(revision!==authRevision)return;const m=verifiedMedia.get(id),url=window.SoulanovaPrograms.media(m);if(!url)return;stopMedia();view='player';$('#library-view').hidden=true;$('#workout-detail').hidden=true;const {card}=appendPlayerShell(m.name,'APPROVED FINAL-MASTER DEMONSTRATION');const video=document.createElement('video');video.className='player-media';video.controls=true;video.playsInline=true;video.preload='metadata';video.src=url;video.setAttribute('aria-label',m.name+' approved demonstration');activeVideo=video;video.addEventListener('error',()=>setStatus('This demonstration could not load. No playback or completion is claimed.'));const note=document.createElement('p');note.textContent='Individual demonstration only. Use play, pause, seeking and volume. No completion is recorded.';card.append(video,note);card.scrollIntoView({block:'start'});}catch{if(revision===authRevision)void verifyMember();}}
  function renderReference(){const list=$('#reference-list');list.replaceChildren();for(const e of catalog.exercises){const card=document.createElement('article');card.className='reference-card';card.dataset.exerciseId=e.id;const image=document.createElement('img');image.src=mediaUrl(e.thumbnail);image.alt=e.name+' exercise icon';image.loading='lazy';const h=document.createElement('h3');h.textContent=e.name;const note=document.createElement('p');note.textContent=verifiedMedia.get(e.id)?.availability||'Video not enabled';card.append(image,h,note);if(window.SoulanovaPrograms.media(verifiedMedia.get(e.id)))card.append(makeButton('View approved demonstration','button secondary',()=>showApprovedDemo(e.id)));list.append(card);}}
  function clearMember(){stopMedia();authRevision++;member=null;root.hidden=true;authRequired.hidden=false;$('#workout-list').replaceChildren();$('#workout-detail').replaceChildren();$('#player-view').replaceChildren();$('#reference-list').replaceChildren();$('#reference-list').hidden=true;$('#reference-toggle').setAttribute('aria-expanded','false');}
  async function verifyMember(){clearMember();const revision=authRevision;try{const {data,error}=await client.auth.getUser();if(revision!==authRevision)return;if(error||!data?.user||data.user.is_anonymous)return;member=data.user;$('#member-name').textContent='Verified Soulanova member';authRequired.hidden=true;root.hidden=false;renderLibrary();renderReference();renderProgress();}catch{if(revision===authRevision){loadError.textContent='Existing member session could not be verified. Return to Overview to sign in.';loadError.hidden=false;}}}
  function setup(){
    $('#hero-image').src=mediaUrl(catalog.hero);
    const tabs=[...document.querySelectorAll('[data-level]')];tabs.forEach((button,index)=>{const image=document.createElement('img');image.src=mediaUrl(catalog.levelThumbnails[button.dataset.level.toLowerCase()]);image.alt='';image.width=76;image.height=76;button.prepend(image);button.tabIndex=index===0?0:-1;button.addEventListener('click',()=>{stopMedia();level=button.dataset.level;tabs.forEach(tab=>{tab.setAttribute('aria-selected',String(tab===button));tab.tabIndex=tab===button?0:-1;});renderLibrary();});button.addEventListener('keydown',event=>{const delta=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0;const target=event.key==='Home'?0:event.key==='End'?tabs.length-1:delta?(index+delta+tabs.length)%tabs.length:null;if(target!==null){event.preventDefault();tabs[target].click();tabs[target].focus();}});});
    $('#reference-toggle').addEventListener('click',()=>{const open=$('#reference-list').hidden;$('#reference-list').hidden=!open;$('#reference-toggle').setAttribute('aria-expanded',String(open));});
    $('#sign-out').addEventListener('click',async()=>{clearMember();await client?.auth.signOut();location.href='/app/#home';});document.addEventListener('visibilitychange',()=>{if(document.hidden)stopMedia();});addEventListener('pagehide',stopMedia);
    const config=window.SOULANOVA_SUPABASE;if(!config?.url||!config?.publishableKey||!window.supabase)throw Error('Existing member authentication is unavailable.');client=window.supabase.createClient(config.url,config.publishableKey,{auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true}});client.auth.onAuthStateChange(()=>{clearMember();setTimeout(verifyMember,0);});void verifyMember();
  }
  Promise.all([fetch('/app/strength/strengthWorkouts.json'),fetch('/app/programs/catalogs/programs.json')].map(async response=>{const r=await response;if(!r.ok)throw Error('Catalog unavailable.');return r.json();})).then(([data,restrictions])=>{
    catalog=data;verifiedMedia=new Map(restrictions.programs.strength.movements.map(m=>[m.id,m]));
    if (catalog.workouts.length !== 36 || catalog.exercises.length !== 17 || ['Beginner', 'Intermediate', 'Advanced'].some(name => catalog.workouts.filter(workout => workout.level === name).length !== 12)) throw Error('The approved SoulStrength catalog failed validation.');
    setup();
  }).catch(error => { loadError.textContent = 'SoulStrength could not load its approved workout library. Please try again later.'; loadError.hidden = false; console.error('SoulStrength library load failed.', error); });
})();
