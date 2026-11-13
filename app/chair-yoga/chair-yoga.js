'use strict';

(() => {
  const authGate = document.getElementById('auth-gate');
  const library = document.getElementById('member-library');
  const status = document.getElementById('member-status');
  const signOut = document.getElementById('sign-out');
  const levelSelection = document.getElementById('level-selection');
  const workoutSelection = document.getElementById('workout-selection');
  const playerView = document.getElementById('player-view');
  const levelList = document.getElementById('level-list');
  const workoutList = document.getElementById('workout-list');
  const video = document.getElementById('chair-yoga-video');
  const narration = document.getElementById('chair-yoga-narration');
  const transitionScreen = document.getElementById('transition-screen');
  const completionScreen = document.getElementById('completion-screen');
  const playbackError = document.getElementById('playback-error');
  const nextButton = document.getElementById('next-workout');
  const previousButton = document.getElementById('previous-workout');
  let client = null;
  let catalog = null;
  let programs = null;
  let narrationDrafts = null;
  let controller = null;
  let currentLevel = null;
  let activeMovementId = null;
  let activeGeneration = 0;
  let playingGeneration = 0;
  let mediaCommand = false;
  let authRevision = 0;
  let listenersAdded = false;
  let narrationEnabled = true;
  let narrationMuted = false;
  let currentApprovedAudio = null;
  let currentApprovedAudioPass = null;
  let narrationObjectUrl = null;
  const ownerAudioReviewRequested = window.location.hostname.endsWith('-soulanova.vercel.app')
    && new URLSearchParams(window.location.search).get('owner-audio-review') === '1';
  let ownerAudioReviewMode = false;
  const pauseEventGuard = window.SoulanovaChairYogaPlayback.createPauseEventGuard();

  const $ = (selector) => document.querySelector(selector);
  const byId = (id) => catalog?.movements.find(item => item.id === id) || null;
  const formatTime = seconds => {
    const total = Math.max(0, Math.round(Number(seconds) || 0));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  };
  const escapeText = value => String(value ?? '');
  function pauseVideoCommand() {
    if (video.paused) return;
    pauseEventGuard.expect();
    video.pause();
  }

  function clearNarration() {
    narration.pause();
    narration.removeAttribute('src');
    narration.load();
    $('#narration-enabled').disabled = true;
    $('#narration-volume').disabled = true;
    $('#narration-mute').disabled = true;
    $('#narration-resume').hidden = true;
    currentApprovedAudio = null;
    currentApprovedAudioPass = null;
    if (narrationObjectUrl) URL.revokeObjectURL(narrationObjectUrl);
    narrationObjectUrl = null;
  }
  function showSignedOut(message) {
    authRevision++;
    if (controller) controller.backToLevels();
    mediaCommand = true;
    pauseVideoCommand();
    video.removeAttribute('src');
    video.load();
    mediaCommand = false;
    activeMovementId = null;
    clearNarration();
    library.hidden = true;
    authGate.hidden = false;
    status.textContent = message;
    signOut.hidden = true;
  }
  function setVideoSource(workout, generation) {
    if (activeMovementId === workout.id && video.currentSrc) {
      activeGeneration = generation;
      return false;
    }
    mediaCommand = true;
    pauseVideoCommand();
    clearNarration();
    activeMovementId = workout.id;
    activeGeneration = generation;
    video.src = workout.videoUrl;
    video.poster = workout.thumbnailUrl;
    video.muted = true;
    video.setAttribute('aria-label', `${workout.name} demonstration by Miriam`);
    video.load();
    mediaCommand = false;
    return true;
  }
  function narrationRecord(workout) {
    return narrationDrafts?.drafts?.find(item => item.movementId === workout.id) || null;
  }
  function narrationForPass(workout, pass) {
    return window.SoulanovaChairYogaPlayback.getNarrationForPass(narrationRecord(workout), pass, {
      allowPendingOwnerReview: ownerAudioReviewMode
    });
  }
  async function verifyNarrationAsset(asset, generation, pass) {
    if (!window.SoulanovaChairYogaPlayback.getNarrationForPass({ loopScripts: { [String(pass)]: asset } }, pass, {
      allowPendingOwnerReview: ownerAudioReviewMode
    })) return null;
    const response = await fetch(asset.audioUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Narration request failed (${response.status}).`);
    const bytes = await response.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const hash = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
    if (hash !== asset.audioSha256.toLowerCase()) throw new Error('Narration integrity check failed.');
    if (controller.getSnapshot().generation !== generation) return null;
    const blob = new Blob([bytes], { type: 'audio/mpeg' });
    narrationObjectUrl = URL.createObjectURL(blob);
    return narrationObjectUrl;
  }
  async function prepareNarration(workout, generation, pass) {
    const asset = narrationForPass(workout, pass);
    if (!asset) return false;
    try {
      const verifiedUrl = await verifyNarrationAsset(asset, generation, pass);
      if (!verifiedUrl || controller.getSnapshot().generation !== generation) return false;
      currentApprovedAudio = asset;
      currentApprovedAudioPass = pass;
      narration.src = verifiedUrl;
      narration.load();
      $('#narration-status').textContent = ownerAudioReviewMode
        ? 'Owner listening review only: this movement and loop narration is loaded and hash-verified. Member playback remains disabled.'
        : 'Approved narration is available for this movement.';
      $('#narration-enabled').disabled = false;
      $('#narration-volume').disabled = false;
      $('#narration-mute').disabled = false;
      return true;
    } catch (error) {
      if (controller.getSnapshot().generation === generation) {
        $('#narration-status').textContent = `${error.message} Narration is unavailable for this movement.`;
        $('#narration-enabled').disabled = true;
        $('#narration-volume').disabled = true;
        $('#narration-mute').disabled = true;
      }
      return false;
    }
  }
  async function playMedia(workout, { generation, pass, reloadSource = false } = {}) {
    if (controller.getSnapshot().generation !== generation) return false;
    const changed = setVideoSource(workout, generation);
    activeGeneration = generation;
    if (!changed && currentApprovedAudioPass !== pass) clearNarration();
    const asset = narrationForPass(workout, pass);
    if (asset && (changed || currentApprovedAudioPass !== pass)) {
      const ready = await prepareNarration(workout, generation, pass);
      if (!ready) {
        narrationEnabled = false;
        $('#narration-enabled').checked = false;
      }
    } else if (!asset && currentApprovedAudioPass !== pass) {
      clearNarration();
      $('#narration-status').textContent = ownerAudioReviewMode
        ? 'No verified narration exists for this movement and loop.'
        : 'Loop-specific narration is pending owner approval.';
      $('#narration-enabled').disabled = true;
      $('#narration-volume').disabled = true;
      $('#narration-mute').disabled = true;
    }
    if (controller.getSnapshot().generation !== generation) return false;
    if (!changed) {
      try { video.currentTime = 0; } catch { /* source may still be loading; browser starts at zero */ }
      if (currentApprovedAudio) narration.currentTime = 0;
    }
    const videoPlay = video.play();
    const audioPlay = currentApprovedAudio && narrationEnabled ? playNarrationSafely() : Promise.resolve();
    await Promise.all([videoPlay, audioPlay]);
    return controller.getSnapshot().generation === generation;
  }
  function pauseMedia({ generation } = {}) {
    if (generation !== activeGeneration) return;
    mediaCommand = true;
    pauseVideoCommand();
    narration.pause();
    mediaCommand = false;
  }
  async function resumeMedia(workout, { generation } = {}) {
    if (generation !== activeGeneration || controller.getSnapshot().generation !== generation) return false;
    const videoPlay = video.play();
    const audioPlay = currentApprovedAudio && narrationEnabled ? playNarrationSafely() : Promise.resolve();
    await Promise.all([videoPlay, audioPlay]);
    return controller.getSnapshot().generation === generation;
  }
  async function playNarrationSafely() {
    if (!currentApprovedAudio || !narrationEnabled) return true;
    const attempt = await window.SoulanovaChairYogaPlayback.playNarrationAligned(narration, video);
    if (attempt.ok) {
      $('#narration-resume').hidden = true;
      $('#narration-status').textContent = ownerAudioReviewMode
        ? 'Owner listening review only: playing hash-verified narration. Member playback remains disabled.'
        : 'Playing approved movement narration.';
      return true;
    }
    $('#narration-resume').hidden = false;
    $('#narration-status').textContent = `The browser blocked narration autoplay. Tap “Play narration” to sync it with the current video position. ${attempt.error?.message || ''}`.trim();
    return false;
  }
  function stopMedia({ generation } = {}) {
    if (generation !== activeGeneration) return;
    mediaCommand = true;
    pauseVideoCommand();
    narration.pause();
    mediaCommand = false;
  }
  function addMediaListeners() {
    if (listenersAdded) return;
    listenersAdded = true;
    video.addEventListener('playing', () => { playingGeneration = activeGeneration; const s = controller?.getSnapshot(); if (s?.phase === 'playing') controller.markVideoPlaying(activeGeneration, activeMovementId); });
    video.addEventListener('ended', () => controller?.videoEnded(activeGeneration, activeMovementId));
    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('loadedmetadata', updateProgress);
    video.addEventListener('durationchange', updateProgress);
    video.addEventListener('seeked', updateProgress);
    video.addEventListener('seeking', syncNarrationToVideo);
    video.addEventListener('error', () => {
      const snap = controller?.getSnapshot();
      if (snap?.phase === 'playing') controller.playbackBlocked(snap.generation, new Error('This movement video could not load.'));
    });
    video.addEventListener('pause', () => {
      if (pauseEventGuard.consumeExpected()) return;
      const snap = controller?.getSnapshot();
      const atEnd = video.ended || (Number.isFinite(video.duration) && video.duration > 0 && video.currentTime >= video.duration - 0.05);
      if (!atEnd && !mediaCommand && document.visibilityState === 'visible' && snap?.phase === 'playing' && snap.generation === playingGeneration) controller.pause();
    });
    $('#back-to-levels').addEventListener('click', () => showLevelSelection());
    $('#back-to-workouts').addEventListener('click', () => showWorkoutSelection());
    $('#completion-workouts').addEventListener('click', () => showWorkoutSelection());
    $('#previous-workout').addEventListener('click', () => controller.previous());
    $('#next-workout').addEventListener('click', () => controller.next());
    $('#pause-workout').addEventListener('click', () => {
      const phase = controller.getSnapshot().phase;
      if (phase === 'playing' || phase === 'transitioning') controller.pause();
      else controller.resume();
    });
    $('#restart-workout').addEventListener('click', () => controller.restart());
    $('#transition-resume').addEventListener('click', () => controller.resume());
    $('#transition-next-button').addEventListener('click', () => controller.next());
    $('#error-resume').addEventListener('click', () => controller.resume());
    $('#narration-enabled').addEventListener('change', event => {
      narrationEnabled = event.currentTarget.checked;
      if (!narrationEnabled) narration.pause();
      else if (controller?.getSnapshot().phase === 'playing' && currentApprovedAudio) playNarrationSafely();
    });
    $('#narration-resume').addEventListener('click', () => playNarrationSafely());
    $('#narration-volume').addEventListener('input', event => { window.SoulanovaChairYogaPlayback.setNarrationVolume(narration, event.currentTarget.value); });
    $('#narration-mute').addEventListener('click', () => {
      narrationMuted = !narrationMuted;
      narrationMuted = window.SoulanovaChairYogaPlayback.setNarrationMuted(narration, narrationMuted);
      $('#narration-mute').textContent = narrationMuted ? 'Unmute narration' : 'Mute narration';
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && ['playing', 'transitioning'].includes(controller?.getSnapshot().phase)) controller.pause();
    });
  }
  function syncNarrationToVideo() {
    if (!currentApprovedAudio || narration.paused || !Number.isFinite(video.currentTime)) return;
    const delta = Math.abs(narration.currentTime - video.currentTime);
    if (delta > 0.35 && narration.duration > 0) narration.currentTime = Math.min(video.currentTime, Math.max(0, narration.duration - 0.05));
  }
  function renderWorkoutProgress(snap) {
    if (!snap?.currentProgram) return;
    const movement = snap.currentMovement;
    const expectedSource = movement?.videoUrl ? new URL(movement.videoUrl, window.location.href).href : '';
    const mediaMatches = Boolean(expectedSource && activeGeneration === snap.generation && video.currentSrc === expectedSource && video.readyState >= 1);
    const progress = window.SoulanovaChairYogaPlayback.getWorkoutProgress(snap, {
      currentTime: video.currentTime,
      duration: video.duration,
      mediaMatches
    });
    $('#player-position').textContent = `Movement ${progress.currentMovementNumber} of ${progress.totalMovements}`;
    $('#movement-counter').textContent = progress.movementLabel;
    const progressBar = $('#workout-progress');
    progressBar.value = progress.progress;
    progressBar.setAttribute('aria-valuetext', `Movement ${progress.currentMovementNumber} of ${progress.totalMovements}; ${progress.completedCount} movements completed; skipped movements are excluded from progress`);

    if (snap.phase === 'complete') {
      $('#pass-label').textContent = 'Workout complete';
    } else if (snap.phase === 'transitioning' || (snap.phase === 'paused' && snap.pausedFrom === 'transitioning')) {
      $('#pass-label').textContent = `Movement complete · ${snap.loopsPerMovement} loops`;
    } else if (mediaMatches) {
      $('#pass-label').textContent = `Loop ${snap.pass} of ${snap.loopsPerMovement} · ${formatTime(Math.max(0, video.duration - video.currentTime))} left in this loop`;
    } else {
      $('#pass-label').textContent = `Loop ${snap.pass || 1} of ${snap.loopsPerMovement} · Loading movement`;
    }
  }
  function updateProgress() {
    const snap = controller?.getSnapshot();
    if (snap) renderWorkoutProgress(snap);
  }
  function formatEstimate(summary) {
    const minimum = formatTime(summary.minEstimatedTotalSeconds);
    const maximum = formatTime(summary.maxEstimatedTotalSeconds);
    return minimum === maximum ? minimum : `${minimum}–${maximum}`;
  }
  function renderLevelCards() {
    levelList.replaceChildren();
    for (const level of programs.levels) {
      const firstWorkout = level.workouts[0];
      const first = byId(firstWorkout.movementIds[0]);
      const summary = controller.getLevelSummary(level.id);
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'level-card';
      card.setAttribute('aria-label', `Open ${level.name}: 12 complete workouts, 12 movements each, ${summary.loopsPerMovement} loops per movement, about ${formatEstimate(summary)} including transitions`);
      const image = document.createElement('img'); image.src = first.thumbnailUrl; image.alt = '';
      const copy = document.createElement('div'); copy.className = 'level-card-copy';
      const heading = document.createElement('h3'); heading.textContent = level.name;
      const description = document.createElement('p'); description.textContent = level.description;
      const meta = document.createElement('p'); meta.textContent = `12 workouts · 12 movements each · ${summary.loopsPerMovement} loops · about ${formatEstimate(summary)} per workout`;
      const cta = document.createElement('strong'); cta.textContent = 'View 12 workouts →';
      copy.append(heading, description, meta, cta); card.append(image, copy);
      card.addEventListener('click', () => openWorkouts(level.id));
      levelList.append(card);
    }
  }
  function renderWorkouts(levelId) {
    currentLevel = programs.levels.find(level => level.id === levelId);
    if (!currentLevel) return;
    controller.selectLevel(levelId);
    const summary = controller.getLevelSummary(levelId);
    $('#workout-selection-heading').textContent = `${currentLevel.name} Chair Yoga`;
    $('#workout-selection-eyebrow').textContent = '12 OWNER-APPROVED COMPLETE WORKOUTS';
    $('#workout-selection-summary').textContent = `${currentLevel.description} Each workout contains 12 movements, uses ${summary.loopsPerMovement} loops per movement, and takes about ${formatEstimate(summary)} including eleven five-second transitions.`;
    workoutList.replaceChildren();
    currentLevel.workouts.forEach((workout, index) => {
      const movement = byId(workout.movementIds[0]);
      const workoutSummary = controller.getWorkoutSummary(levelId, workout.id);
      const card = document.createElement('button'); card.type = 'button'; card.className = 'workout-card';
      card.setAttribute('aria-label', `Start ${currentLevel.name} workout ${index + 1}: ${workout.title}. ${workout.emphasis} 12 movements, ${summary.loopsPerMovement} loops per movement, about ${formatTime(workoutSummary.estimatedTotalSeconds)} including transitions.`);
      const img = document.createElement('img'); img.src = movement.thumbnailUrl; img.alt = '';
      const copy = document.createElement('div'); copy.className = 'workout-card-copy';
      const order = document.createElement('small'); order.textContent = `WORKOUT ${String(index + 1).padStart(2, '0')} OF 12`;
      const title = document.createElement('h3'); title.textContent = workout.title;
      const focus = document.createElement('p'); focus.textContent = workout.emphasis;
      const duration = document.createElement('small'); duration.textContent = `12 movements · ${summary.loopsPerMovement} loops each · about ${formatTime(workoutSummary.estimatedTotalSeconds)}`;
      copy.append(order, title, focus, duration); card.append(img, copy);
      card.addEventListener('click', () => startWorkout(workout.id));
      workoutList.append(card);
    });
  }
  function openWorkouts(levelId) {
    renderWorkouts(levelId);
    levelSelection.hidden = true;
    playerView.hidden = true;
    workoutSelection.hidden = false;
  }
  function startWorkout(workoutId) {
    workoutSelection.hidden = true;
    levelSelection.hidden = true;
    playerView.hidden = false;
    controller.start(workoutId);
  }
  function showLevelSelection() {
    if (controller && controller.getSnapshot().phase !== 'level-selection') controller.backToLevels();
    playerView.hidden = true;
    workoutSelection.hidden = true;
    levelSelection.hidden = false;
  }
  function showWorkoutSelection() {
    if (controller && controller.getSnapshot().levelId) {
      const selectedLevelId = controller.getSnapshot().levelId;
      if (controller.getSnapshot().phase !== 'workout-selection') controller.backToWorkouts();
      currentLevel = programs.levels.find(level => level.id === selectedLevelId) || null;
      if (currentLevel) renderWorkouts(currentLevel.id);
    }
    playerView.hidden = true;
    levelSelection.hidden = true;
    workoutSelection.hidden = false;
  }
  function renderSequence(snap) {
    const strip = $('#player-sequence'); strip.replaceChildren();
    const ids = snap.currentProgram?.movementIds || [];
    $('#up-next-copy').textContent = snap.nextMovement ? `Up next: ${snap.nextMovement.name}. ${ids.length - snap.movementIndex - 1} movements remain in ${snap.currentProgram.title}.` : `This is the final movement in ${snap.currentProgram?.title || 'this workout'}.`;
    ids.forEach((id, index) => {
      const m = byId(id);
      const item = document.createElement('div'); item.className = 'sequence-card';
      item.setAttribute('aria-current', String(index === snap.movementIndex));
      const img = document.createElement('img'); img.src = m.thumbnailUrl; img.alt = '';
      const title = document.createElement('strong'); title.textContent = `${index + 1}. ${m.name}`;
      const meta = document.createElement('small'); meta.textContent = snap.completedMovementIndexes.includes(index) ? 'Completed' : `${formatTime(m.durationSeconds * snap.loopsPerMovement)} · ${snap.loopsPerMovement} loops`;
      item.append(img, title, meta); strip.append(item);
    });
  }
  function renderState(snap) {
    if (!snap.levelId || snap.phase === 'level-selection') {
      playerView.hidden = true; workoutSelection.hidden = true; levelSelection.hidden = false; return;
    }
    if (snap.phase === 'workout-selection') {
      playerView.hidden = true; levelSelection.hidden = true; workoutSelection.hidden = false; return;
    }
    if (snap.phase === 'complete') {
      playerView.hidden = false; workoutSelection.hidden = true; levelSelection.hidden = true;
      transitionScreen.hidden = true; playbackError.hidden = true; completionScreen.hidden = false;
      $('#completion-summary').textContent = `${snap.currentProgram.title}: all 12 movements completed after ${snap.loopsPerMovement} loops per movement. No member history is written by this Preview.`;
      $('#player-heading').textContent = 'Workout complete';
      $('#player-eyebrow').textContent = `${snap.levelName} · ${snap.currentProgram.title} · COMPLETE`;
      renderWorkoutProgress(snap);
      renderSequence(snap); return;
    }
    playerView.hidden = false; levelSelection.hidden = true; workoutSelection.hidden = true;
    completionScreen.hidden = true;
    const movement = snap.currentMovement;
    const program = snap.currentProgram;
    if (!movement || !program) return;
    $('#player-heading').textContent = movement.name;
    $('#player-eyebrow').textContent = `${snap.levelName} · ${program.title} · MOVEMENT ${snap.movementIndex + 1} OF 12`;
    $('#player-meta').textContent = `${snap.loopsPerMovement} loops · ${formatTime(movement.durationSeconds * snap.loopsPerMovement)} video time for this movement · Miriam demonstration`;
    renderWorkoutProgress(snap);
    previousButton.disabled = snap.movementIndex <= 0;
    nextButton.disabled = snap.movementIndex >= snap.movementsTotal - 1;
    $('#pause-workout').textContent = snap.phase === 'paused' || snap.phase === 'resume-required' ? 'Resume' : 'Pause';
    $('#pause-workout').disabled = snap.phase === 'complete';
    $('#restart-workout').disabled = false;
    const isPaused = snap.phase === 'paused';
    const isTransitioning = snap.phase === 'transitioning';
    transitionScreen.hidden = !(isPaused || isTransitioning);
    playbackError.hidden = snap.phase !== 'resume-required';
    $('#playback-error-message').textContent = snap.error || 'Playback needs a tap to resume.';
    $('#transition-eyebrow').textContent = isTransitioning ? 'MOVEMENT COMPLETE' : 'MOVEMENT PAUSED';
    $('#transition-current').textContent = isTransitioning ? `COMPLETED: ${movement.name}` : `CURRENT MOVEMENT: ${movement.name}`;
    $('#transition-up-next-label').textContent = snap.nextMovement ? 'UP NEXT' : 'FINAL MOVEMENT IN THIS WORKOUT';
    $('#transition-next').textContent = snap.nextMovement?.name || 'Workout complete';
    const nextImage = $('#transition-thumbnail');
    if (snap.nextMovement) { nextImage.src = snap.nextMovement.thumbnailUrl; nextImage.alt = `Next movement: ${snap.nextMovement.name}`; nextImage.hidden = false; }
    else { nextImage.hidden = true; nextImage.removeAttribute('src'); nextImage.alt = ''; }
    $('#transition-status').textContent = isTransitioning
      ? `Next movement starts in ${snap.transitionSecondsRemaining} seconds. Pause if you need more time to change position safely.`
      : snap.pausedFrom === 'transitioning'
        ? `Transition paused with ${snap.transitionSecondsRemaining} seconds remaining.`
        : `Loop ${snap.pass} of ${snap.passesPerWorkout} · Playback position is preserved.`;
    $('#transition-resume').hidden = !isPaused;
    $('#transition-resume').textContent = snap.pausedFrom === 'transitioning' ? 'Resume transition' : 'Resume movement';
    $('#transition-next-button').hidden = !snap.nextMovement || !(isPaused || isTransitioning);
    $('#transition-next-button').textContent = 'Next Movement';
    renderSequence(snap);
  }
  function showMemberLibrary(user) {
    authGate.hidden = true; library.hidden = false; status.textContent = user.email || 'Signed in'; signOut.hidden = false;
    levelSelection.hidden = false; workoutSelection.hidden = true; playerView.hidden = true;
    renderLevelCards(); addMediaListeners();
  }
  async function openMemberLibrary(user) {
    if (!user) return showSignedOut('Not signed in');
    const revision = ++authRevision;
    try {
      const [catalogResponse, programResponse, narrationResponse, ownerReviewResponse] = await Promise.all([
        fetch('/app/chair-yoga/catalog.json', { cache: 'no-store' }),
        fetch('/app/chair-yoga/chair-yoga-programs.json', { cache: 'no-store' }),
        fetch('/app/chair-yoga/narration-drafts.json', { cache: 'no-store' }),
        fetch('/api/chair-yoga-owner-review', { cache: 'no-store' }).catch(() => null)
      ]);
      if (![catalogResponse, programResponse, narrationResponse].every(response => response.ok)) throw new Error('The Chair Yoga library files could not be loaded.');
      const [nextCatalog, nextPrograms, nextNarration, ownerReviewConfig] = await Promise.all([
        catalogResponse.json(), programResponse.json(), narrationResponse.json(),
        ownerReviewResponse?.ok ? ownerReviewResponse.json() : Promise.resolve({ enabled: false })
      ]);
      ownerAudioReviewMode = ownerAudioReviewRequested && ownerReviewConfig.enabled === true;
      if (revision !== authRevision) return;
      if (nextCatalog.libraryStatus !== 'preview_candidates_pending_owner_review' || nextCatalog.movements.length !== 36 || nextCatalog.excludedOnHold?.length) throw new Error('The 36-video movement catalog did not pass its integrity check.');
      if (nextPrograms.schemaVersion !== 2 || nextPrograms.proposalStatus !== 'owner_approved_2026-11-13' || nextPrograms.totalWorkouts !== 36 || nextPrograms.movementsPerWorkout !== 12 || nextPrograms.ownerApproval?.status !== 'owner_approved_2026-11-13') throw new Error('The 36-workout matrix is incomplete or is missing final owner approval.');
      catalog = nextCatalog; programs = nextPrograms; narrationDrafts = nextNarration;
      narration.volume = Number($('#narration-volume').value);
      $('#narration-status').textContent = ownerAudioReviewMode
        ? 'SSO-protected owner listening mode is active for this Preview. Generated narration remains disabled for members until separately approved.'
        : 'Member narration remains disabled until the generated recordings receive explicit owner approval.';
      $('#narration-enabled').checked = true;
      controller = window.SoulanovaChairYogaPlayback.createChairYogaPlayback({
        levels: programs.levels,
        movements: catalog.movements,
        loopCountsByLevel: programs.playback.loopCountsByLevel,
        transitionDurationMs: programs.playback.transitionDurationSeconds * 1000,
        assignmentRules: programs.assignmentRules,
        effects: {
          onStateChange: renderState,
          startPass: (workout, details) => playMedia(workout, details),
          replayPass: (workout, details) => playMedia(workout, details),
          resumeMedia,
          pauseMedia,
          stopMedia
        }
      });
      currentLevel = null;
      showMemberLibrary(user);
    } catch (error) {
      if (revision !== authRevision) return;
      status.textContent = 'Chair Yoga library unavailable'; authGate.hidden = false; library.hidden = true;
      authGate.querySelector('h1').textContent = 'Library unavailable';
      authGate.querySelector('p:not(.eyebrow)').textContent = error.message || 'Please return to the member dashboard and try again.';
    }
  }
  async function init() {
    const config = window.SOULANOVA_SUPABASE || {};
    if (!config.url || !config.publishableKey || !window.supabase) return showSignedOut('Member sign-in is unavailable right now.');
    client = window.supabase.createClient(config.url, config.publishableKey, { auth: { flowType: 'pkce', detectSessionInUrl: true, autoRefreshToken: true, persistSession: true } });
    client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') showSignedOut('Not signed in');
      if (event === 'SIGNED_IN' && session?.user) openMemberLibrary(session.user);
    });
    try {
      const { data, error } = await client.auth.getUser();
      if (error) throw error;
      await openMemberLibrary(data.user);
    } catch { showSignedOut('Sign in to your Soulanova account to view Chair Yoga.'); }
  }
  signOut.addEventListener('click', async () => {
    signOut.disabled = true;
    const { error } = await client.auth.signOut();
    signOut.disabled = false;
    if (error) status.textContent = 'Sign out failed. Please try again.';
  });
  function seekNarrationToVideo() {
    if (!currentApprovedAudio || !Number.isFinite(narration.duration)) return;
    narration.currentTime = Math.min(video.currentTime, Math.max(0, narration.duration - 0.05));
  }
  video.addEventListener('seeking', seekNarrationToVideo);
  video.addEventListener('timeupdate', () => {
    if (currentApprovedAudio && !narration.paused && Math.abs(video.currentTime - narration.currentTime) > 0.5) seekNarrationToVideo();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && controller?.getSnapshot().phase === 'playing') controller.pause();
  });
  init();
})();
