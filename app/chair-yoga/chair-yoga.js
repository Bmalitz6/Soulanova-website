'use strict';

(() => {
  const authGate = document.getElementById('auth-gate');
  const library = document.getElementById('member-library');
  const status = document.getElementById('member-status');
  const signOut = document.getElementById('sign-out');
  const levelSelection = document.getElementById('level-selection');
  const playlistView = document.getElementById('playlist-view');
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
  let timerId = null;
  let mediaCommand = false;
  let authRevision = 0;
  let listenersAdded = false;
  let narrationEnabled = true;
  let narrationMuted = false;
  let currentApprovedAudio = null;
  let narrationObjectUrl = null;

  const $ = (selector) => document.querySelector(selector);
  const byId = (id) => catalog?.movements.find(item => item.id === id) || null;
  const formatTime = seconds => {
    const total = Math.max(0, Math.round(Number(seconds) || 0));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  };
  const escapeText = value => String(value ?? '');

  function clearTransitionTimer() {
    if (timerId !== null) window.clearInterval(timerId);
    timerId = null;
  }
  function clearNarration() {
    narration.pause();
    narration.removeAttribute('src');
    narration.load();
    currentApprovedAudio = null;
    if (narrationObjectUrl) URL.revokeObjectURL(narrationObjectUrl);
    narrationObjectUrl = null;
  }
  function showSignedOut(message) {
    authRevision++;
    clearTransitionTimer();
    if (controller) controller.backToLevels();
    mediaCommand = true;
    video.pause();
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
    video.pause();
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
  function narrationApproved(record) {
    return Boolean(record && record.audioStatus === 'owner-approved' && record.audioUrl && /^[a-f0-9]{64}$/i.test(record.audioSha256 || ''));
  }
  async function verifyNarrationAsset(record, generation) {
    if (!narrationApproved(record)) return null;
    const response = await fetch(record.audioUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Narration request failed (${response.status}).`);
    const bytes = await response.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const hash = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
    if (hash !== record.audioSha256.toLowerCase()) throw new Error('Narration integrity check failed.');
    if (controller.getSnapshot().generation !== generation) return null;
    const blob = new Blob([bytes], { type: 'audio/mpeg' });
    narrationObjectUrl = URL.createObjectURL(blob);
    return narrationObjectUrl;
  }
  async function prepareNarration(workout, generation) {
    const record = narrationRecord(workout);
    if (!narrationApproved(record)) return false;
    try {
      const verifiedUrl = await verifyNarrationAsset(record, generation);
      if (!verifiedUrl || controller.getSnapshot().generation !== generation) return false;
      currentApprovedAudio = record;
      narration.src = verifiedUrl;
      narration.load();
      $('#narration-status').textContent = 'Approved narration is available for this movement.';
      $('#narration-enabled').disabled = false;
      $('#narration-volume').disabled = false;
      $('#narration-mute').disabled = false;
      return true;
    } catch (error) {
      if (controller.getSnapshot().generation === generation) {
        $('#narration-status').textContent = `${error.message} Narration is unavailable for this movement.`;
      }
      return false;
    }
  }
  async function playMedia(workout, { generation, pass, reloadSource = false } = {}) {
    if (controller.getSnapshot().generation !== generation) return false;
    const changed = setVideoSource(workout, generation);
    activeGeneration = generation;
    if (changed && narrationApproved(narrationRecord(workout))) {
      const ready = await prepareNarration(workout, generation);
      if (!ready) throw new Error('Approved narration could not be verified.');
    }
    if (controller.getSnapshot().generation !== generation) return false;
    if (!changed) {
      try { video.currentTime = 0; } catch { /* source may still be loading; browser starts at zero */ }
      if (currentApprovedAudio) narration.currentTime = 0;
    }
    const videoPlay = video.play();
    const audioPlay = currentApprovedAudio && narrationEnabled ? narration.play() : Promise.resolve();
    await Promise.all([videoPlay, audioPlay]);
    return controller.getSnapshot().generation === generation;
  }
  function pauseMedia({ generation } = {}) {
    if (generation !== activeGeneration) return;
    mediaCommand = true;
    video.pause();
    narration.pause();
    mediaCommand = false;
  }
  async function resumeMedia(workout, { generation } = {}) {
    if (generation !== activeGeneration || controller.getSnapshot().generation !== generation) return false;
    const videoPlay = video.play();
    const audioPlay = currentApprovedAudio && narrationEnabled ? narration.play() : Promise.resolve();
    await Promise.all([videoPlay, audioPlay]);
    return controller.getSnapshot().generation === generation;
  }
  function stopMedia({ generation } = {}) {
    if (generation !== activeGeneration) return;
    mediaCommand = true;
    video.pause();
    narration.pause();
    mediaCommand = false;
  }
  function addMediaListeners() {
    if (listenersAdded) return;
    listenersAdded = true;
    video.addEventListener('playing', () => { const s = controller?.getSnapshot(); if (s?.phase === 'playing') controller.markVideoPlaying(activeGeneration, activeMovementId); });
    video.addEventListener('ended', () => controller?.videoEnded(activeGeneration, activeMovementId));
    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('seeking', syncNarrationToVideo);
    video.addEventListener('error', () => {
      const snap = controller?.getSnapshot();
      if (snap?.phase === 'playing') controller.playbackBlocked(snap.generation, new Error('This movement video could not load.'));
    });
    video.addEventListener('pause', () => {
      if (!mediaCommand && document.visibilityState === 'visible' && controller?.getSnapshot().phase === 'playing') controller.pause();
    });
    narration.addEventListener('timeupdate', syncVideoToNarration);
    $('#back-to-levels').addEventListener('click', () => showLevelSelection());
    $('#start-level').addEventListener('click', () => startPlaylistAt(0));
    $('#previous-workout').addEventListener('click', () => controller.previous());
    $('#next-workout').addEventListener('click', () => controller.next());
    $('#pause-workout').addEventListener('click', () => {
      const phase = controller.getSnapshot().phase;
      if (['playing', 'transition'].includes(phase)) controller.pause();
      else controller.resume();
    });
    $('#restart-workout').addEventListener('click', () => controller.restart());
    $('#transition-resume').addEventListener('click', () => controller.resume());
    $('#transition-next-button').addEventListener('click', () => controller.next());
    $('#error-resume').addEventListener('click', () => controller.resume());
    $('#completion-levels').addEventListener('click', () => showLevelSelection());
    $('#narration-enabled').addEventListener('change', event => {
      narrationEnabled = event.currentTarget.checked;
      if (!narrationEnabled) narration.pause();
      else if (controller?.getSnapshot().phase === 'playing' && currentApprovedAudio) narration.play().catch(() => {});
    });
    $('#narration-volume').addEventListener('input', event => { narration.volume = Number(event.currentTarget.value); });
    $('#narration-mute').addEventListener('click', () => {
      narrationMuted = !narrationMuted;
      narration.muted = narrationMuted;
      $('#narration-mute').textContent = narrationMuted ? 'Unmute narration' : 'Mute narration';
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && controller?.getSnapshot().phase === 'playing') controller.pause();
    });
  }
  function syncNarrationToVideo() {
    if (!currentApprovedAudio || narration.paused || !Number.isFinite(video.currentTime)) return;
    const delta = Math.abs(narration.currentTime - video.currentTime);
    if (delta > 0.35 && narration.duration > 0) narration.currentTime = Math.min(video.currentTime, Math.max(0, narration.duration - 0.05));
  }
  function syncVideoToNarration() {
    if (!currentApprovedAudio || video.paused || !Number.isFinite(narration.currentTime)) return;
    const delta = Math.abs(video.currentTime - narration.currentTime);
    if (delta > 0.5 && video.duration > 0) {
      try { video.currentTime = Math.min(narration.currentTime, video.duration); } catch { /* native seek will be retried on next media event */ }
    }
  }
  function updateProgress() {
    const snap = controller?.getSnapshot();
    const workout = snap?.currentWorkout;
    if (!workout || !Number.isFinite(video.duration) || video.duration <= 0) return;
    const ratio = (Math.max(0, snap.pass - 1) + Math.min(1, video.currentTime / video.duration)) / 2;
    $('#workout-progress').value = ratio;
    $('#pass-label').textContent = `Pass ${snap.pass} of 2 · ${formatTime(Math.max(0, video.duration - video.currentTime))} left in this pass`;
  }
  function renderLevelCards() {
    levelList.replaceChildren();
    for (const level of programs.levels) {
      const first = byId(level.workoutIds[0]);
      const summary = controller.getLevelSummary(level.id);
      const card = document.createElement('article');
      card.className = 'level-card';
      const image = document.createElement('img'); image.src = first.thumbnailUrl; image.alt = '';
      const copy = document.createElement('div'); copy.className = 'level-card-copy';
      const heading = document.createElement('h3'); heading.textContent = level.name;
      const description = document.createElement('p'); description.textContent = level.description;
      const meta = document.createElement('p'); meta.textContent = `12 workouts · 2 passes each · about ${formatTime(summary.estimatedTotalSeconds)} including transitions`;
      const button = document.createElement('button'); button.type = 'button'; button.className = 'button primary'; button.textContent = 'View 12-workout playlist';
      button.addEventListener('click', () => openPlaylist(level.id));
      copy.append(heading, description, meta, button); card.append(image, copy); levelList.append(card);
    }
  }
  function renderPlaylist(levelId) {
    currentLevel = programs.levels.find(level => level.id === levelId);
    if (!currentLevel) return;
    controller.selectLevel(levelId);
    const summary = controller.getLevelSummary(levelId);
    $('#playlist-heading').textContent = `${currentLevel.name} Chair Yoga`;
    $('#playlist-eyebrow').textContent = 'PROPOSED LEVEL · 12 WORKOUTS';
    $('#playlist-summary').textContent = `${currentLevel.description} · About ${formatTime(summary.estimatedTotalSeconds)} including transitions. Each movement plays twice.`;
    workoutList.replaceChildren();
    currentLevel.workoutIds.forEach((id, index) => {
      const movement = byId(id);
      const card = document.createElement('button'); card.type = 'button'; card.className = 'workout-card';
      card.setAttribute('aria-label', `Start at workout ${index + 1}, ${movement.name}, two passes, about ${formatTime(movement.durationSeconds * 2)}`);
      const img = document.createElement('img'); img.src = movement.thumbnailUrl; img.alt = '';
      const copy = document.createElement('div'); copy.className = 'workout-card-copy';
      const order = document.createElement('small'); order.textContent = `WORKOUT ${index + 1} OF 12`;
      const title = document.createElement('h3'); title.textContent = movement.name;
      const duration = document.createElement('small'); duration.textContent = `2 passes · about ${formatTime(movement.durationSeconds * 2)}`;
      copy.append(order, title, duration); card.append(img, copy);
      card.addEventListener('click', () => startPlaylistAt(index));
      workoutList.append(card);
    });
  }
  function openPlaylist(levelId) {
    renderPlaylist(levelId);
    levelSelection.hidden = true;
    playerView.hidden = true;
    playlistView.hidden = false;
  }
  function startPlaylistAt(index) {
    playlistView.hidden = true;
    levelSelection.hidden = true;
    playerView.hidden = false;
    controller.start(index);
  }
  function showLevelSelection() {
    clearTransitionTimer();
    if (controller && ['playing','paused','resume-required','transition','transition-paused'].includes(controller.getSnapshot().phase)) controller.backToLevels();
    playerView.hidden = true;
    playlistView.hidden = true;
    levelSelection.hidden = false;
  }
  function renderSequence(snap) {
    const strip = $('#player-sequence'); strip.replaceChildren();
    const level = programs.levels.find(item => item.id === snap.levelId);
    const ids = level?.workoutIds || [];
    $('#up-next-copy').textContent = snap.nextWorkout ? `Up next: ${snap.nextWorkout.name}. ${snap.workoutsTotal - snap.workoutIndex - 1} workouts remain after this one.` : 'This is the final workout in the level.';
    ids.forEach((id, index) => {
      const m = byId(id);
      const item = document.createElement('div'); item.className = 'sequence-card';
      item.setAttribute('aria-current', String(index === snap.workoutIndex));
      const img = document.createElement('img'); img.src = m.thumbnailUrl; img.alt = '';
      const title = document.createElement('strong'); title.textContent = `${index + 1}. ${m.name}`;
      const meta = document.createElement('small'); meta.textContent = snap.completedWorkoutIds.includes(id) ? 'Completed' : `${formatTime(m.durationSeconds * 2)} · 2 passes`;
      item.append(img, title, meta); strip.append(item);
    });
  }
  function renderState(snap) {
    if (!snap.levelId || snap.phase === 'level-selection') {
      playerView.hidden = true; playlistView.hidden = true; levelSelection.hidden = false; return;
    }
    if (snap.phase === 'playlist') {
      playerView.hidden = true; levelSelection.hidden = true; playlistView.hidden = false; return;
    }
    if (snap.phase === 'complete') {
      playerView.hidden = false; playlistView.hidden = true; levelSelection.hidden = true;
      transitionScreen.hidden = true; playbackError.hidden = true; completionScreen.hidden = false;
      $('#completion-summary').textContent = `${snap.completedCount} of 12 workouts completed. No member history was written by this preview.`;
      $('#player-heading').textContent = 'Level complete';
      $('#player-eyebrow').textContent = `${currentLevel?.name || ''} · PLAYLIST COMPLETE`;
      renderSequence(snap); clearTransitionTimer(); return;
    }
    playerView.hidden = false; levelSelection.hidden = true; playlistView.hidden = true;
    completionScreen.hidden = true;
    const workout = snap.currentWorkout;
    if (!workout) return;
    $('#player-heading').textContent = workout.name;
    $('#player-eyebrow').textContent = `${currentLevel?.name || 'CHAIR YOGA'} · WORKOUT ${snap.workoutIndex + 1} OF 12`;
    $('#player-meta').textContent = `2 passes · about ${formatTime(workout.durationSeconds * 2)} · Miriam demonstration`;
    $('#player-position').textContent = `${snap.completedCount} of 12 complete`;
    $('#pass-label').textContent = `Pass ${snap.pass || 1} of 2`;
    $('#completed-count').textContent = `${snap.completedCount} of 12 workouts completed`;
    $('#workout-progress').value = snap.pass === 2 ? 0.5 : 0;
    previousButton.disabled = snap.workoutIndex <= 0;
    nextButton.disabled = snap.workoutIndex >= snap.workoutsTotal - 1;
    $('#pause-workout').textContent = snap.phase === 'paused' || snap.phase === 'resume-required' ? 'Resume' : snap.phase === 'transition' ? 'Pause countdown' : 'Pause';
    $('#restart-workout').disabled = false;
    const isOverlay = ['paused','resume-required','transition','transition-paused'].includes(snap.phase);
    transitionScreen.hidden = !isOverlay || snap.phase === 'resume-required';
    playbackError.hidden = snap.phase !== 'resume-required';
    $('#playback-error-message').textContent = snap.error || 'Playback needs a tap to resume.';
    $('#transition-eyebrow').textContent = snap.phase === 'transition' ? `NEXT WORKOUT IN ${snap.transitionSecondsRemaining}` : snap.phase === 'transition-paused' ? 'COUNTDOWN PAUSED' : snap.phase === 'resume-required' ? 'TAP TO RESUME' : 'WORKOUT PAUSED';
    $('#transition-current').textContent = `CURRENT WORKOUT: ${workout.name}`;
    $('#transition-next').textContent = snap.nextWorkout?.name || 'Level complete';
    const nextImage = $('#transition-thumbnail');
    if (snap.nextWorkout) { nextImage.src = snap.nextWorkout.thumbnailUrl; nextImage.alt = `Next workout: ${snap.nextWorkout.name}`; nextImage.hidden = false; }
    else { nextImage.hidden = true; nextImage.removeAttribute('src'); nextImage.alt = ''; }
    $('#transition-countdown').textContent = snap.phase === 'transition' ? `Starting in ${snap.transitionSecondsRemaining} seconds` : snap.phase === 'transition-paused' ? 'Resume to continue the transition.' : `Pass ${snap.pass} of 2 · ${snap.nextWorkout ? 'Ready when you are.' : 'Final workout.'}`;
    $('#transition-resume').hidden = snap.phase === 'transition';
    $('#transition-resume').textContent = snap.phase === 'transition-paused' ? 'Resume countdown' : 'Resume workout';
    $('#transition-next-button').hidden = !snap.nextWorkout;
    $('#transition-next-button').textContent = snap.phase === 'transition' || snap.phase === 'transition-paused' ? 'Start next workout' : 'Next workout';
    if (snap.phase === 'transition') {
      if (timerId === null) timerId = window.setInterval(() => controller.tickTransition(), 1000);
    } else clearTransitionTimer();
    renderSequence(snap);
    updateProgress();
  }
  function showMemberLibrary(user) {
    authGate.hidden = true; library.hidden = false; status.textContent = user.email || 'Signed in'; signOut.hidden = false;
    levelSelection.hidden = false; playlistView.hidden = true; playerView.hidden = true;
    renderLevelCards(); addMediaListeners();
  }
  async function openMemberLibrary(user) {
    if (!user) return showSignedOut('Not signed in');
    const revision = ++authRevision;
    try {
      const [catalogResponse, programResponse, narrationResponse] = await Promise.all([
        fetch('/app/chair-yoga/catalog.json', { cache: 'no-store' }),
        fetch('/app/chair-yoga/chair-yoga-programs.json', { cache: 'no-store' }),
        fetch('/app/chair-yoga/narration-drafts.json', { cache: 'no-store' })
      ]);
      if (![catalogResponse, programResponse, narrationResponse].every(response => response.ok)) throw new Error('The Chair Yoga library files could not be loaded.');
      const [nextCatalog, nextPrograms, nextNarration] = await Promise.all([catalogResponse.json(), programResponse.json(), narrationResponse.json()]);
      if (revision !== authRevision) return;
      if (nextCatalog.libraryStatus !== 'preview_candidates_pending_owner_review' || nextCatalog.movements.length !== 36 || nextCatalog.excludedOnHold?.length) throw new Error('The 36-video movement catalog did not pass its integrity check.');
      if (nextPrograms.proposalStatus !== 'pending_owner_approval') throw new Error('The level proposals are missing their review status.');
      catalog = nextCatalog; programs = nextPrograms; narrationDrafts = nextNarration;
      controller = window.SoulanovaChairYogaPlayback.createChairYogaPlayback({
        levels: programs.levels,
        movements: catalog.movements,
        passesPerWorkout: programs.playback.passesPerWorkout,
        transitionSeconds: programs.playback.transitionSeconds,
        effects: {
          onStateChange: renderState,
          startPass: (workout, details) => playMedia(workout, details),
          replayPass: (workout, details) => playMedia(workout, details),
          resumeMedia,
          pauseMedia,
          stopMedia
        }
      });
      showMemberLibrary(user);
      if (currentLevel) controller.selectLevel(currentLevel.id);
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
