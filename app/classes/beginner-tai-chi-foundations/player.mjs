import { validateClass, playbackState, clock } from './timeline.mjs';
const $=id=>document.getElementById(id);
const video=$('classVideo'), list=$('movementList'), playlist=$('playlist');
let data, runningFrame=false, currentCategory='tai_chi', metadataReady=false;
const categories={tai_chi:'Tai Chi',strength:'Strength',stretching:'Stretching'};
const mobile=matchMedia('(max-width:800px)');
function syncResponsive(){playlist.open=!mobile.matches;}
syncResponsive();mobile.addEventListener('change',syncResponsive);
function setStatus(message){$('playbackStatus').textContent=message;}
function rowFor(m,i){
 const row=document.createElement('li');row.className='movement-row';
 const button=document.createElement('button');button.className='movement-button';button.dataset.movement=m.id;
 button.setAttribute('aria-label',`Jump to ${m.name} full practice`);
 const number=document.createElement('span');number.className='movement-number';number.textContent=String(i+1).padStart(2,'0');
 const copy=document.createElement('span');copy.className='movement-copy';
 const name=document.createElement('span');name.className='movement-name';name.textContent=m.name;
 const meta=document.createElement('span');meta.className='movement-meta';meta.textContent=`${Math.round(m.end-m.start)} seconds of practice`;
 const state=document.createElement('span');state.className='movement-state';
 copy.append(name,meta,state);button.append(number,copy);row.append(button);
 button.addEventListener('click',()=>{if(!data.media?.src)return;video.currentTime=m.start;render();});
 return row;
}
function render(){
 if(!data)return;
 const s=playbackState(data,video.currentTime||0);const active=data.movements.find(m=>m.id===s.activeId);const next=data.movements.find(m=>m.id===s.nextId);
 $('countdown').textContent=clock(s.remaining);$('countdownAccessible').textContent=`${clock(s.remaining)} class time remaining`;
 $('countdownCard').hidden=Boolean(data.media?.bakedTimer);$('bakedClockNote').hidden=!data.media?.bakedTimer;
 $('seek').value=String(s.position);$('seek').setAttribute('aria-valuetext',`${clock(s.remaining)} remaining`);
 const phaseText={opening:['SETTLE IN','Opening bow'],practice:['YOUR CURRENT MOVEMENT',active?.name],transition:['TRANSITION PREVIEW',active?.name],closing:['RETURN TO STILLNESS','Closing bow'],completed:['PRACTICE COMPLETE','Thank you for moving with us']};
 const [label,name]=phaseText[s.phase];$('phaseLabel').textContent=label;$('phaseName').textContent=name;
 $('mobileCurrent').textContent=s.phase==='transition'?`${active.name} · Next: ${next.name}`:active?.name||name;
 for(const [i,m] of data.movements.entries()){
  const button=list.querySelector(`[data-movement="${m.id}"]`);const completed=s.completedIds.includes(m.id),isActive=m.id===s.activeId,isNext=m.id===s.nextId;
  button.classList.toggle('is-completed',completed);button.classList.toggle('is-next',isNext);
  if(isActive)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');
  button.querySelector('.movement-number').textContent=completed?'✓':String(i+1).padStart(2,'0');
  button.querySelector('.movement-state').textContent=isActive?(s.phase==='transition'?'Transition':'Now'):isNext?'Up next':completed?'Completed':'';
 }
 $('playlistProgress').textContent=s.phase==='completed'?'Your full practice is complete.':s.phase==='opening'?'Settle in. Begin with a bow.':`${s.completedIds.length} of ${data.movements.length} movements complete`;
 $('nextLabel').textContent=s.phase==='opening'?'FIRST UP':s.phase==='closing'?'FINISH WITH A BOW':s.phase==='completed'?'A MOMENT FOR YOU':'UP NEXT';
 $('nextName').textContent=next?.name||(s.phase==='completed'?'Rest and notice how you feel':'Closing bow');
 $('nextDescription').textContent=s.phase==='transition'?'Watch the preview and prepare. The next movement becomes active when full practice begins.':s.phase==='opening'?'The opening bow is part of your practice. There is no need to rush.':s.phase==='completed'?'Replay whenever you are ready.':next?'Your class flows into the next movement with time to settle.':'Let your breathing settle as the class comes to a close.';
 $('playText').textContent=video.ended?'Replay practice':video.paused?(s.position>0?'Resume practice':'Begin practice'):'Pause';$('playIcon').textContent=video.paused?'▶':'Ⅱ';$('playPause').setAttribute('aria-label',video.ended?'Replay class':video.paused?'Play class':'Pause class');
 $('stage').dataset.phase=s.phase;$('stage').dataset.activeMovement=s.activeId||'';$('stage').dataset.nextMovement=s.nextId||'';
}
function frameTick(){render();if(!video.paused&&!video.ended){if(video.requestVideoFrameCallback)video.requestVideoFrameCallback(frameTick);else requestAnimationFrame(frameTick);}else runningFrame=false;}
function animate(){if(!runningFrame){runningFrame=true;frameTick();}}
async function loadCategory(category){
 video.pause();currentCategory=category;metadataReady=false;
 for(const b of document.querySelectorAll('[data-category]'))b.setAttribute('aria-pressed',String(b.dataset.category===category));
 const response=await fetch('./class.json');if(!response.ok)throw Error('Class configuration unavailable');
 data=validateClass(await response.json());$('classTitle').textContent=data.title;$('classSubtitle').textContent=data.subtitle;
 list.replaceChildren(...data.movements.map(rowFor));$('movementCount').textContent=data.movements.length;$('seek').max=data.duration;
 const available=Boolean(data.media?.src);$('emptyMedia').hidden=available;video.hidden=!available;
 $('playPause').disabled=!available;$('seek').disabled=!available;$('mute').disabled=!available;$('fullscreen').disabled=!available;
 if(available){video.src=data.media.src;video.load();setStatus('Ready when you are');}
 else {video.removeAttribute('src');video.load();$('emptyMessage').textContent=`${categories[category]} uses the shared playlist model. Approved class media has not been configured; this is a layout template, not a produced workout.`;setStatus('Template preview');}
 render();
}
$('playPause').addEventListener('click',async()=>{
 if(!data?.media?.src)return;
 if(video.ended)video.currentTime=0;
 try{if(video.paused)await video.play();else video.pause();}catch{setStatus('Select play again to begin.');}
});
$('seek').addEventListener('input',event=>{if(data?.media?.src){video.currentTime=Number(event.target.value);render();}});
$('mute').addEventListener('click',()=>{video.muted=!video.muted;$('mute').textContent=video.muted?'Sound off':'Sound on';$('mute').setAttribute('aria-label',video.muted?'Unmute audio':'Mute audio');});
$('volume').addEventListener('input',event=>{video.volume=Number(event.target.value);video.muted=video.volume===0;});
$('fullscreen').addEventListener('click',()=>{if(document.fullscreenElement)document.exitFullscreen();else {if($('stage').requestFullscreen)$('stage').requestFullscreen();else video.webkitEnterFullscreen?.();}});
for(const button of document.querySelectorAll('[data-category]'))button.addEventListener('click',()=>loadCategory(button.dataset.category).catch(showError));
function showError(error){setStatus(error.message);$('playPause').disabled=true;}
video.addEventListener('loadedmetadata',()=>{
 if(!data?.media?.src)return;
 if(Math.abs(video.duration-data.duration)>.1){showError(Error('Video duration does not match this class timeline.'));return;}
 metadataReady=true;render();
});
for(const event of ['timeupdate','seeking','seeked','durationchange','ended','pause','ratechange'])video.addEventListener(event,render);
video.addEventListener('play',()=>{setStatus('Move at your own pace');animate();});
video.addEventListener('waiting',()=>setStatus('Buffering · countdown follows playback'));
video.addEventListener('playing',()=>setStatus('Move at your own pace'));
video.addEventListener('pause',()=>{if(data?.media?.src)setStatus(video.ended?'Practice complete':'Paused');});
video.addEventListener('seeked',()=>{if(data?.media?.src)setStatus(video.ended?'Practice complete':video.paused?'Paused':'Move at your own pace');});
video.addEventListener('ended',()=>{setStatus('Practice complete');render();});
video.addEventListener('error',()=>{if(data?.media?.src)showError(Error('The class video could not be opened. Please try again.'));});
$('stage').addEventListener('keydown',event=>{
 if(event.target.matches('input,button')||!data?.media?.src)return;
 if(event.code==='Space'){event.preventDefault();$('playPause').click();}
 if(event.code==='ArrowRight'){event.preventDefault();video.currentTime=Math.min(data.duration,video.currentTime+5);}
 if(event.code==='ArrowLeft'){event.preventDefault();video.currentTime=Math.max(0,video.currentTime-5);}
});
await loadCategory('tai_chi').catch(showError);
