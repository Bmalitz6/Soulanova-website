'use strict';
(() => {
  const video = document.getElementById('single-whip-video');
  const $ = id => document.getElementById(id);

  if (!video || !$('whip-ben-volume') ||
      !$('whip-piano-volume') ||
      !$('whip-piano-toggle')) return;

  const piano = new Audio(
    '/app/tai-chi-audio/Soulanova_Soft_Piano.mp3'
  );

  piano.loop = true;
  piano.preload = 'metadata';

  let pianoEnabled = true;
  let pianoVolume = 0.25;

  video.volume = 0.85;

  function updatePianoVolume() {
    // Quiet the piano during the final five chimes.
    piano.volume = video.currentTime >= 115
      ? pianoVolume * 0.2
      : pianoVolume;
  }

  function syncPiano() {
    if (Number.isFinite(piano.duration) &&
        piano.duration > 0) {
      const position = video.currentTime % piano.duration;
      if (Math.abs(piano.currentTime - position) > 0.75)
        piano.currentTime = position;
    }
  }

  // Pause this lesson when another free lesson starts.
  document.querySelectorAll('video.free-video').forEach(other => {
    if (other === video) return;
    other.addEventListener('play', () => {
      if (!video.paused) video.pause();
    });
  });

  video.addEventListener('play', () => {
    document.querySelectorAll('video.free-video')
      .forEach(other => {
        if (other !== video) other.pause();
      });
    syncPiano();
    updatePianoVolume();
    if (pianoEnabled) piano.play().catch(() => {});
  });

  video.addEventListener('pause', () => piano.pause());

  video.addEventListener('ended', () => {
    piano.pause();
    piano.currentTime = 0;
  });

  video.addEventListener('seeked', () => {
    syncPiano();
    updatePianoVolume();
  });

  video.addEventListener('timeupdate', updatePianoVolume);
  piano.addEventListener('loadedmetadata', syncPiano);

  $('whip-ben-volume').addEventListener('input', e => {
    video.volume = Number(e.target.value) / 100;
    $('whip-ben-label').textContent = e.target.value + '%';
  });

  $('whip-piano-volume').addEventListener('input', e => {
    pianoVolume = Number(e.target.value) / 100;
    updatePianoVolume();
    $('whip-piano-label').textContent = e.target.value + '%';
  });

  $('whip-piano-toggle').addEventListener('click', () => {
    pianoEnabled = !pianoEnabled;
    const button = $('whip-piano-toggle');
    button.textContent = pianoEnabled ? 'Piano: On' : 'Piano: Off';
    button.setAttribute('aria-pressed', String(pianoEnabled));

    if (!pianoEnabled) piano.pause();
    else if (!video.paused) piano.play().catch(() => {});
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      video.pause();
      piano.pause();
    }
  });
})();
