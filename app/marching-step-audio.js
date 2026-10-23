'use strict';
(()=>{
  const video=document.querySelector('.free-video');
  const $=id=>document.getElementById(id);
  if(!video||!$('marching-piano-volume'))return;

  const piano=new Audio('/app/tai-chi-audio/Soulanova_Soft_Piano.mp3');
  piano.loop=true;
  piano.preload='metadata';
  piano.volume=.25;
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
    piano.volume=Number(e.target.value)/100;
    $('marching-piano-label').textContent=e.target.value+'%';
  });

  $('marching-piano-toggle').addEventListener('click',()=>{
    pianoEnabled=!pianoEnabled;
    $('marching-piano-toggle').textContent=pianoEnabled?'Piano: On':'Piano: Off';
    $('marching-piano-toggle').setAttribute('aria-pressed',String(pianoEnabled));
    if(pianoEnabled)playPiano();
    else piano.pause();
  });

  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){
      piano.pause();
      video.pause();
    }
  });
})();
