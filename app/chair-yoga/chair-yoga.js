'use strict';

(() => {
  const authGate = document.getElementById('auth-gate');
  const library = document.getElementById('member-library');
  const status = document.getElementById('member-status');
  const signOut = document.getElementById('sign-out');
  const video = document.getElementById('chair-yoga-video');
  const title = document.getElementById('player-heading');
  const meta = document.getElementById('player-meta');
  const position = document.getElementById('player-position');
  const errorBox = document.getElementById('video-error');
  const previous = document.getElementById('previous-movement');
  const next = document.getElementById('next-movement');
  const play = document.getElementById('play-movement');
  const list = document.getElementById('movement-list');
  const search = document.getElementById('movement-search');
  const emptySearch = document.getElementById('empty-search');
  let client = null;
  let movements = [];
  let currentIndex = -1;
  let authRevision = 0;
  let listenersAdded = false;

  function showSignedOut(message) {
    authRevision++;
    movements = [];
    currentIndex = -1;
    library.hidden = true;
    authGate.hidden = false;
    status.textContent = message;
    signOut.hidden = true;
    video.pause();
    video.removeAttribute('src');
    video.load();
    list.replaceChildren();
    updateControls();
  }

  function formatDuration(seconds) {
    const total = Math.round(Number(seconds));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  }

  function updateControls() {
    previous.disabled = currentIndex <= 0;
    next.disabled = currentIndex < 0 || currentIndex >= movements.length - 1;
    play.disabled = currentIndex < 0;
    play.textContent = video.paused ? 'Play movement' : 'Pause movement';
    position.textContent = currentIndex < 0 ? '' : `Movement ${currentIndex + 1} of ${movements.length}`;
  }

  function selectMovement(index, { scroll = false } = {}) {
    if (index < 0 || index >= movements.length) return;
    currentIndex = index;
    const movement = movements[index];
    video.pause();
    video.src = movement.videoUrl;
    video.poster = movement.thumbnailUrl;
    video.setAttribute('aria-label', `${movement.name} demonstration by Miriam`);
    video.load();
    title.textContent = movement.name;
    meta.textContent = `${formatDuration(movement.durationSeconds)} · Chair Yoga with Miriam · Preview candidate`;
    errorBox.hidden = true;
    errorBox.textContent = '';
    for (const card of list.querySelectorAll('.movement-card')) {
      card.setAttribute('aria-current', String(Number(card.dataset.index) === currentIndex));
    }
    updateControls();
    if (scroll) document.querySelector('.player-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderMovements() {
    const query = search.value.trim().toLocaleLowerCase();
    const shown = movements.map((movement, index) => ({ movement, index }))
      .filter(({ movement }) => movement.name.toLocaleLowerCase().includes(query));
    list.replaceChildren();
    for (const { movement, index } of shown) {
      const card = document.createElement('button');
      card.className = 'movement-card';
      card.type = 'button';
      card.dataset.index = String(index);
      card.setAttribute('aria-current', String(index === currentIndex));
      card.setAttribute('aria-label', `Load ${movement.name}, ${formatDuration(movement.durationSeconds)}`);
      const image = document.createElement('img');
      image.src = movement.thumbnailUrl;
      image.alt = '';
      image.loading = 'lazy';
      const name = document.createElement('span');
      name.textContent = movement.name;
      const duration = document.createElement('small');
      duration.textContent = `${formatDuration(movement.durationSeconds)} · Movement ${index + 1}`;
      card.append(image, name, duration);
      card.addEventListener('click', () => selectMovement(index, { scroll: true }));
      list.append(card);
    }
    emptySearch.hidden = shown.length > 0;
  }

  function attachPlayerEvents() {
    if (listenersAdded) return;
    listenersAdded = true;
    search.addEventListener('input', renderMovements);
    previous.addEventListener('click', () => selectMovement(currentIndex - 1));
    next.addEventListener('click', () => selectMovement(currentIndex + 1));
    play.addEventListener('click', async () => {
      if (video.paused) {
        try { await video.play(); }
        catch {
          errorBox.textContent = 'Playback was blocked. Press Play in the video controls to continue.';
          errorBox.hidden = false;
        }
      } else video.pause();
    });
    video.addEventListener('play', updateControls);
    video.addEventListener('pause', updateControls);
    video.addEventListener('ended', updateControls);
    video.addEventListener('error', () => {
      errorBox.textContent = 'This movement could not load. Check your connection and choose another movement or retry.';
      errorBox.hidden = false;
    });
  }

  async function openMemberLibrary(user) {
    if (!user) return showSignedOut('Not signed in');
    if (library.hidden === false && movements.length) return;
    const revision = ++authRevision;
    try {
      const response = await fetch('/app/chair-yoga/catalog.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`Library request failed (${response.status}).`);
      const catalog = await response.json();
      if (revision !== authRevision) return;
      if (catalog.libraryStatus !== 'preview_candidates_pending_owner_review' || !Array.isArray(catalog.movements)) {
        throw new Error('The Chair Yoga candidate catalog is unavailable.');
      }
      if (catalog.movements.length !== 36 || catalog.excludedOnHold?.length || catalog.movements.some(item => ['IMG_4321', 'IMG_4322'].includes(item.id) && !item.videoUrl)) {
        throw new Error('The Chair Yoga candidate catalog did not pass its 36-movement integrity check.');
      }
      movements = catalog.movements;
      authGate.hidden = true;
      library.hidden = false;
      status.textContent = user.email || 'Signed in';
      signOut.hidden = false;
      attachPlayerEvents();
      renderMovements();
      selectMovement(0);
    } catch (error) {
      if (revision !== authRevision) return;
      status.textContent = 'Chair Yoga library unavailable';
      authGate.hidden = false;
      library.hidden = true;
      authGate.querySelector('h1').textContent = 'Library unavailable';
      authGate.querySelector('p:not(.eyebrow)').textContent = error.message || 'Please return to the member dashboard and try again.';
    }
  }

  async function init() {
    const config = window.SOULANOVA_SUPABASE || {};
    if (!config.url || !config.publishableKey || !window.supabase) {
      return showSignedOut('Member sign-in is unavailable right now.');
    }
    client = window.supabase.createClient(config.url, config.publishableKey, {
      auth: { flowType: 'pkce', detectSessionInUrl: true, autoRefreshToken: true, persistSession: true }
    });
    client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') showSignedOut('Not signed in');
      if (event === 'SIGNED_IN' && session?.user) openMemberLibrary(session.user);
    });
    try {
      const { data, error } = await client.auth.getUser();
      if (error) throw error;
      await openMemberLibrary(data.user);
    } catch {
      showSignedOut('Sign in to your Soulanova account to view Chair Yoga.');
    }
  }

  signOut.addEventListener('click', async () => {
    signOut.disabled = true;
    const { error } = await client.auth.signOut();
    signOut.disabled = false;
    if (error) status.textContent = 'Could not sign out. Please try again.';
  });

  init();
})();
