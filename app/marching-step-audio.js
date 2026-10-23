'use strict';
(()=>{
  const video=document.querySelector('.free-video');
  const $=id=>document.getElementById(id);
  if(!video||!$('marching-piano-volume'))return;

  const piano=new Audio('/app/tai-chi-audio/Soulanova_Soft_Piano.mp3');
  piano.loop=true;
  piano.preload='metadata';
  piano.volume=.25;
  let selectedPianoVolume=.25;

  function updatePianoVolume(){
    const finalCountdown =
      !video.paused &&
      video.currentTime >= 115 &&
      video.currentTime < 120;

    piano.volume = finalCountdown
      ? selectedPianoVolume * 0.2
      : selectedPianoVolume;
  }

  video.volume=.85;
  let pianoEnabled=true;

  function syncPiano(){
    if(!Number.isFinite(piano.duration)||piano.duration<=0)return;
    const target=video.currentTime%piano.duration;
    if(Math.abs(piano.currentTime-target)>0.75)
      piano.currentTime=target;
  }

  function playPiano(){
    if(!pianoEnabled||video.paused||video.ended)return;
    syncPiano();
    piano.play().catch(()=>{});
  }

  video.addEventListener('play',playPiano);
  video.addEventListener('pause',()=>piano.pause());
  video.addEventListener('ended',()=>{
    piano.pause();
    piano.currentTime=0;
  });
  video.addEventListener('seeked',()=>{
    syncPiano();
    if(!video.paused)playPiano();
  });
  piano.addEventListener('loadedmetadata',syncPiano);

  $('marching-ben-volume').addEventListener('input',e=>{
    video.volume=Number(e.target.value)/100;
    $('marching-ben-label').textContent=e.target.value+'%';
  });

  $('marching-piano-volume').addEventListener('input',e=>{
    selectedPianoVolume=Number(e.target.value)/100;
    updatePianoVolume();
    $('marching-piano-label').textContent=e.target.value+'%';
  });

  $('marching-piano-toggle').addEventListener('click',()=>{
    pianoEnabled=!pianoEnabled;
    $('marching-piano-toggle').textContent=pianoEnabled?'Piano: On':'Piano: Off';
    $('marching-piano-toggle').setAttribute('aria-pressed',String(pianoEnabled));
    if(pianoEnabled)playPiano();
    else piano.pause();
  });


  // Gentle five-second ending countdown.
  let countdownEnabled=true;
  let lastCountdownSecond=null;
  const AudioContextClass=window.AudioContext||window.webkitAudioContext;
  let chimeContext=null;

  function gentleChime(){
    if(!AudioContextClass)return;
    try{
      if(!chimeContext)chimeContext=new AudioContextClass();
      if(chimeContext.state==='suspended')chimeContext.resume().catch(()=>{});
      const now=chimeContext.currentTime;
      const osc=chimeContext.createOscillator();
      const gain=chimeContext.createGain();
      osc.type='sine';
      osc.frequency.value=660;
      gain.gain.setValueAtTime(0.0001,now);
      gain.gain.exponentialRampToValueAtTime(0.16,now+0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001,now+0.38);
      osc.connect(gain);
      gain.connect(chimeContext.destination);
      osc.start(now);
      osc.stop(now+0.4);
    }catch(err){console.warn('Countdown chime unavailable:',err);}
  }

  // Activate Web Audio from a user interaction (required by Safari).
  function activateChimeAudio(){
    if(!AudioContextClass)return;
    try{
      if(!chimeContext)chimeContext=new AudioContextClass();
      if(chimeContext.state==='suspended'){
        chimeContext.resume().catch(()=>{});
      }
    }catch(err){
      console.warn('Could not activate countdown audio:',err);
    }
  }

  // A click on the video or its native controls is a user gesture.
  video.addEventListener('pointerdown',activateChimeAudio);
  video.addEventListener('click',activateChimeAudio);
  video.addEventListener('keydown',activateChimeAudio);

  video.addEventListener('timeupdate',()=>{
    if(video.paused||video.seeking)return;
    updatePianoVolume();
    const second=Math.floor(video.currentTime);
    if(second>=115 && second<=119 &&
       second!==lastCountdownSecond && countdownEnabled){
      gentleChime();
    }
    lastCountdownSecond=second;
  });

  video.addEventListener('seeked',()=>{
    lastCountdownSecond=Math.floor(video.currentTime);
  });
  video.addEventListener('play',()=>{
    lastCountdownSecond=Math.floor(video.currentTime);
  });

  const toggle=document.getElementById('marching-countdown-toggle');
  if(toggle)toggle.addEventListener('click',()=>{
    countdownEnabled=!countdownEnabled;
    toggle.textContent=countdownEnabled?'Countdown sound: On':'Countdown sound: Off';
    toggle.setAttribute('aria-pressed',String(countdownEnabled));
  });

  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){
      piano.pause();
      video.pause();
    }
  });
})();
