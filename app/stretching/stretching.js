'use strict';
(()=>{
 const $=id=>document.getElementById(id),video=$('demo'),audio=$('narration-audio');
 const {movements,routines}=window.SoulStretchCatalog,guidance=window.SoulStretchGuidance,progress=window.SoulStretchProgress;
 const rawTransition=Number(window.SOULSTRETCH_TRANSITION_SECONDS),transitionSeconds=Number.isFinite(rawTransition)?Math.min(30,Math.max(0,rawTransition)):5;
 let member=null,routine=null,selectedMovement=null,interval=null,transitionInterval=null,transitionLast=0,filter='All',completed=[],selectedLevel='Beginner',selectedBodyArea='All',launchAsProgram=true;
 let authRevision=0,historyReady=false,completionId=null,playbackCompletionClaimed=false,internalVideoPause=false,wakeLock=null,lastSequenceKey='';
 const practiced=new Set();
 const playback=window.SoulStretchPlayback.createSoulStretchPlayback({
  transitionSeconds,
  onState:renderPlaybackState,
  onStartMovement:playMovement,
  onStopMovement:stopMovementMedia,
  onComplete:finishRoutine
 });
 function movement(id){return movements.find(m=>m.id===id)||null;}
 function current(){return playback.getState().movementId?movement(playback.getState().movementId):selectedMovement;}
 function src(m){return window.SoulStretchCatalog.mediaUrl(m.file,m.sha256,window.SOULANOVA_SOULSTRETCH_PUBLIC_BASE);}
 function clock(seconds){const s=Math.max(0,Math.ceil(seconds));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
 function releaseWakeLock(){if(wakeLock){const lock=wakeLock;wakeLock=null;void lock.release?.().catch?.(()=>{});}}
 async function requestWakeLock(){try{if(navigator.wakeLock?.request){const lock=await navigator.wakeLock.request('screen');if(['idle','complete'].includes(playback.getState().phase)){await lock.release();return;}wakeLock=lock;}}catch{wakeLock=null;}}
 function stopTransitionClock(){if(transitionInterval){clearInterval(transitionInterval);transitionInterval=null;}}
 function syncTransitionClock(state){
  if(state.phase!=='transition'){stopTransitionClock();return;}
  if(transitionInterval)return;
  transitionLast=performance.now();
  transitionInterval=setInterval(()=>{const now=performance.now(),delta=(now-transitionLast)/1000;transitionLast=now;playback.tick(Math.min(.5,Math.max(0,delta)));},100);
 }
 function updateTimer(){
  const m=current();if(!m)return;
  const duration=Number.isFinite(video.duration)&&video.duration>0?video.duration:m.seconds;
  const time=Math.max(0,Math.min(duration,video.currentTime||0));
  $('clock').textContent=clock(Math.max(0,duration-time));
  $('fill').style.width=`${Math.max(0,Math.min(100,time/duration*100))}%`;
 }
 function renderGuidance(m){
  const box=$('guidance');box.replaceChildren();const cue=guidance[m.id];
  for(const [label,key] of [['Starting position','start'],['Form','form'],['Breathing','breathing'],['Gentle core','core'],['Transition','transition']]){
   const p=document.createElement('p'),strong=document.createElement('strong');strong.textContent=label;p.append(strong,document.createTextNode(cue[key]));box.append(p);
  }
 }
 function setMovement(m){
  if(!m)return;selectedMovement=m;const cue=guidance[m.id],state=playback.getState();
  $('movement-name').textContent=m.name;
  $('instruction').textContent=m.instruction;
  $('position').textContent=routine?`${routine.level||'SoulStretch'} · ${routine.title} · Movement ${state.index+1} of ${routine.ids.length}`:`${m.category} · ${m.seconds.toFixed(1)} second approved demonstration`;
  renderGuidance(m);
  audio.pause();audio.removeAttribute('src');audio.load();
  const narration=$('narration-enabled'),volume=$('narration-volume');
  const hasAudio=cue.audioStatus==='owner-approved'&&!!cue.audioUrl&&/^[a-f0-9]{64}$/i.test(cue.audioSha256||'');
  narration.disabled=!hasAudio;volume.disabled=!hasAudio;narration.checked=hasAudio;
  $('narration-status').textContent=hasAudio?'Approved Miriam narration follows this movement.':cue.audioStatus==='generated_unreviewed'?'Recording ready for owner listening review. Narration playback stays off until this recording is approved.':'Narration coming soon. Written movement guidance is available now.';
  if(hasAudio){audio.src=cue.audioUrl;audio.volume=Number(volume.value)/100;}
  if(!video.paused){internalVideoPause=true;video.pause();queueMicrotask(()=>{internalVideoPause=false;});}
  video.removeAttribute('src');video.load();video.src=src(m);video.load();
  video.currentTime=0;updateTimer();renderSequence(state);
 }
 function renderSequence(state=playback.getState()){
  const key=`${routine?.id||'none'}:${state.phase}:${state.index}:${state.completedMovementIds.join(',')}`;if(key===lastSequenceKey)return;lastSequenceKey=key;
  const list=$('sequence-list');list.replaceChildren();
  if(!routine){$('sequence-summary').textContent='Choose a program to see its movement order.';return;}
  $('sequence-summary').textContent=`${state.total} movements · ${state.completedMovementIds.length} completed · ${state.remaining} remaining`;
  routine.ids.forEach((id,i)=>{
   const m=movement(id),li=document.createElement('li'),img=document.createElement('img'),copy=document.createElement('span'),name=document.createElement('strong'),status=document.createElement('small');
   li.className='sequence-item';if(i===state.index&&!['complete','idle'].includes(state.phase))li.classList.add('is-current');
   if(state.completedMovementIds.includes(id))li.classList.add('is-complete');if(i>state.index)li.classList.add('is-upcoming');
   img.src=m.thumbnail;img.alt='';img.loading='lazy';name.textContent=`${String(i+1).padStart(2,'0')} · ${m.name}`;
   status.textContent=state.completedMovementIds.includes(id)?'Complete':i===state.index&&state.phase==='ready'?'Ready':i===state.index?'Now playing':i===state.index+1?'Up next':'Upcoming';
   copy.append(name,status);li.append(img,copy);list.append(li);
  });
 }
 function renderPlaybackState(state){
  const phase=state.phase,transition=phase==='transition'||phase==='paused-transition';
  if(phase==='ready'&&state.movementId&&selectedMovement?.id!==state.movementId)setMovement(movement(state.movementId));
  $('player').hidden=phase==='idle';$('routines').hidden=phase!=='idle';
  $('video-stage').classList.toggle('is-transitioning',transition);
  $('video-stage').classList.toggle('is-complete',phase==='complete');
  $('video-frame').classList.toggle('is-fading',transition||phase==='complete');
  $('transition-screen').hidden=!transition;
  $('completion-screen').hidden=phase!=='complete';
  $('playback-error').hidden=phase!=='error';
  if(transition){
   const next=movement(state.nextMovementId);$('next-title').textContent=next?.name||'Next movement';
   $('next-thumbnail').src=next?.thumbnail||'';$('next-thumbnail').alt=next?`${next.name} demonstration thumbnail`:'';
   $('transition-countdown').textContent=phase==='paused-transition'?'Paused':`Starting in ${Math.max(1,Math.ceil(state.countdown))} second${Math.ceil(state.countdown)===1?'':'s'}`;
   if(!$('transition-screen').classList.contains('is-visible'))requestAnimationFrame(()=>$('transition-screen').classList.add('is-visible'));
   $('timer-state').textContent=phase==='paused-transition'?'Transition paused. Resume when ready.':'Moving to the next exercise automatically.';
  }else{$('transition-screen').classList.remove('is-visible');}
  if(phase==='movement'){$('toggle').textContent='Pause';$('timer-state').textContent='Move at a comfortable pace.';}
  else if(phase==='paused-movement'){$('toggle').textContent='Resume';$('timer-state').textContent='Paused. Resume to continue video and narration together.';}
  else if(phase==='resume-required'){$('toggle').textContent='Resume';$('timer-state').textContent=state.message||'Playback was blocked. Tap Resume to continue.';}
  else if(phase==='transition')$('toggle').textContent='Pause transition';
  else if(phase==='paused-transition')$('toggle').textContent='Resume transition';
  else if(phase==='ready'){$('toggle').textContent='Start workout';$('timer-state').textContent='Press Start once. The program will advance automatically.';}
  else if(phase==='error'){$('toggle').textContent='Retry movement';$('playback-error-message').textContent=state.message||'This approved movement could not load. Retry or skip to continue.';}
  else if(phase==='complete'){$('toggle').textContent='Workout complete';}
  const idx=state.index; $('previous').disabled=idx<=0||phase==='complete'||phase==='idle';
  $('next').disabled=phase==='complete'||phase==='idle';
  $('next').textContent=idx>=state.total-1?'Finish':'Next movement';
  $('restart').disabled=phase==='idle';
  syncTransitionClock(state);renderSequence(state);
 }
 async function playMovement(index,{id,resume,userGesture,token}){
  const m=movement(id);if(!m)return false;
  if(!resume&&selectedMovement?.id!==id)setMovement(m);
  if(!resume){video.currentTime=0;audio.currentTime=0;}
  if(userGesture)void requestWakeLock();
  $('video-frame').classList.remove('is-fading');$('transition-screen').classList.remove('is-visible');
  const shouldNarrate=audio.src&&$('narration-enabled').checked;
  try{
   const attempts=[Promise.resolve(video.play())];
   if(shouldNarrate){audio.currentTime=Math.min(video.currentTime||0,Number.isFinite(audio.duration)?audio.duration:video.currentTime||0);attempts.push(Promise.resolve(audio.play()));}
   const results=await Promise.allSettled(attempts);
   if(playback.getState().token!==token)return false;
   const ok=results.every(result=>result.status==='fulfilled');
   if(!ok){internalVideoPause=true;video.pause();audio.pause();queueMicrotask(()=>{internalVideoPause=false;});return false;}
   updateTimer();return true;
  }catch{if(playback.getState().token===token){internalVideoPause=true;video.pause();audio.pause();queueMicrotask(()=>{internalVideoPause=false;});}return false;}
 }
 function stopMovementMedia(){audio.pause();if(!video.paused){internalVideoPause=true;video.pause();queueMicrotask(()=>{internalVideoPause=false;});}}
 function beginRoutine(item,isProgram=true){
  routine=item;launchAsProgram=isProgram;completionId=crypto.randomUUID();playbackCompletionClaimed=false;practiced.clear();
  $('player').hidden=false;$('routines').hidden=true;playback.choose(item,{program:isProgram});
  window.scrollTo({top:0,behavior:'smooth'});
 }
 function routineCard(item){
  const first=movement(item.ids[0]),card=document.createElement('button');card.type='button';card.className='routine';
  const image=document.createElement('img');image.className='routine-thumbnail';image.src=first.thumbnail;image.alt=`${first.name} still from this program`;image.loading='lazy';
  const copy=document.createElement('span');copy.className='routine-copy';
  const tag=document.createElement('span');tag.className='eyebrow';tag.textContent=`${item.category} · ${item.minutes} min · ${item.ids.length} movements`;
  const title=document.createElement('strong');title.className='routine-title';title.textContent=item.title;
  const desc=document.createElement('span');desc.className='routine-description';desc.textContent=item.description;
  const meta=document.createElement('span');meta.className='routine-meta';meta.textContent=`${item.difficulty} · Start program →`;
  copy.append(tag,title,desc,meta);card.append(image,copy);card.setAttribute('aria-label',`Start ${item.title}, ${item.minutes} minutes, ${item.ids.length} movements`);card.addEventListener('click',()=>beginRoutine(item,true));return card;
 }
 function renderLevelTabs(){const tabs=$('level-tabs');tabs.replaceChildren();for(const level of ['Beginner','Intermediate','Advanced']){const tab=document.createElement('button');tab.type='button';tab.className='program-tab';tab.textContent=level;tab.setAttribute('aria-pressed',String(selectedLevel===level));tab.addEventListener('click',()=>{selectedLevel=level;renderLevelTabs();renderRoutines();});tabs.append(tab);}}
 function renderRoutines(){const list=$('routine-list');list.replaceChildren();for(const item of routines.filter(r=>r.collection==='level'&&r.level===selectedLevel))list.append(routineCard(item));}
 function renderBodyAreas(){const items=routines.filter(r=>r.collection==='body-area'),areas=['All',...new Set(items.map(r=>r.category))],tabs=$('body-area-tabs');tabs.replaceChildren();for(const area of areas){const tab=document.createElement('button');tab.type='button';tab.className='program-tab';tab.textContent=area;tab.setAttribute('aria-pressed',String(selectedBodyArea===area));tab.addEventListener('click',()=>{selectedBodyArea=area;renderBodyAreas();});tabs.append(tab);}const list=$('body-routine-list');list.replaceChildren();for(const item of items.filter(r=>selectedBodyArea==='All'||r.category===selectedBodyArea))list.append(routineCard(item));}
 function renderFilters(){const cats=['All','Upper body','Hips','Lower body'],box=$('filters');box.replaceChildren();cats.forEach(c=>{const b=document.createElement('button');b.className='filter'+(filter===c?' active':'');b.textContent=c;b.setAttribute('aria-pressed',String(filter===c));b.addEventListener('click',()=>{filter=c;renderFilters();renderMovements();});box.append(b);});}
 function renderMovements(){const box=$('movements');box.replaceChildren();movements.filter(m=>m.category===filter||filter==='All').forEach(m=>{const row=document.createElement('article');row.className='movement';const copy=document.createElement('div'),name=document.createElement('strong'),meta=document.createElement('small'),image=document.createElement('img'),button=document.createElement('button');name.textContent=m.name;meta.textContent=`${m.category} · ${m.seconds.toFixed(1)}s approved demonstration`;image.src=m.thumbnail;image.alt=`${m.name} still`;image.loading='lazy';button.className='quiet';button.textContent='View movement';button.setAttribute('aria-label',`View ${m.name} demonstration`);button.addEventListener('click',()=>beginRoutine({id:`movement-${m.id}`,title:m.name,level:m.category,ids:[m.id]},false));copy.append(name,document.createElement('br'),meta);row.append(image,copy,button);box.append(row);});}
 async function saveCompletion(item,expected,revision){
  if(!historyReady){$('history-status').textContent='Workout completed. Saving is paused because existing history could not be read; nothing was overwritten.';return;}
  if(!navigator.locks){$('history-status').textContent='Workout completed. This browser cannot safely coordinate history across tabs; existing history was preserved.';return;}
  try{await navigator.locks.request('soulanova-stretch-history:'+(expected||'guest'),()=>{if((member?.id||null)!==expected||authRevision!==revision)return;const result=progress.append(localStorage,expected,item);completed=result.entries;renderHistory();$('history-status').textContent=(expected?'Saved for this member on this browser.':'Saved as guest history on this browser.')+' Cloud saving remains paused; history is not cross-device synced.';});}catch{$('history-status').textContent='Workout completed, but local history could not be saved. Existing data was preserved; refresh to retry.';}
 }
 function renderHistory(){const box=$('history-list');box.replaceChildren();completed.slice(0,100).forEach(item=>{const row=document.createElement('div');row.className='history-row';row.textContent=`${item.title} · ${new Date(item.completedAt).toLocaleDateString()}`;box.append(row);});}
 function finishRoutine(result){
  releaseWakeLock();stopTransitionClock();
  const done=result.routine,all=result.allMovementsCompleted;
  $('completion-title').textContent=all?'Workout Complete':'Session Ended';
  $('completion-summary').textContent=all?`You completed all ${done.ids.length} movements in ${done.title}.`:`${result.completedMovementIds.length} of ${done.ids.length} movements completed. Skipped movements were not added to history.`;
  if(launchAsProgram&&all&&!playbackCompletionClaimed){playbackCompletionClaimed=true;const seconds=done.ids.reduce((sum,id)=>sum+(movement(id)?.seconds||0),0);const item={completionId,routineId:done.id,title:done.title,completedAt:new Date().toISOString(),movementCount:done.ids.length,minutes:Math.max(1,Math.ceil(seconds/60)),practicedSeconds:Math.round(seconds)};void saveCompletion(item,member?.id||null,authRevision);}
  else if(launchAsProgram&&!all)$('history-status').textContent='Program ended before every movement finished. No completion was recorded.';
 }
 function renderHistoryFromStorage(userId){try{completed=progress.read(localStorage,userId);historyReady=true;$('history-status').textContent='History is local to this browser. Cloud saving remains paused.';}catch{completed=[];historyReady=false;$('history-status').textContent='Existing browser history could not be read. Saving is paused; no data was overwritten.';}renderHistory();}
 $('toggle').addEventListener('click',()=>{
  const phase=playback.getState().phase;
  if(phase==='movement')playback.pause();else if(phase==='transition')playback.pause();else if(phase==='ready'||phase==='paused-movement'||phase==='paused-transition'||phase==='resume-required')playback.start();else if(phase==='error')playback.retry();
 });
 $('next').addEventListener('click',()=>playback.next());$('previous').addEventListener('click',()=>playback.previous());$('restart').addEventListener('click',()=>{completionId=crypto.randomUUID();playbackCompletionClaimed=false;playback.restart();});$('completion-restart').addEventListener('click',()=>{completionId=crypto.randomUUID();playbackCompletionClaimed=false;playback.restart();});$('transition-next').addEventListener('click',()=>playback.next());$('retry').addEventListener('click',()=>playback.retry());
 $('return').addEventListener('click',()=>{playback.leave();routine=null;selectedMovement=null;releaseWakeLock();$('player').hidden=true;$('routines').hidden=false;$('video-frame').classList.remove('is-fading');});
 video.addEventListener('timeupdate',updateTimer);video.addEventListener('durationchange',updateTimer);video.addEventListener('playing',()=>{if(playback.getState().phase==='movement')$('timer-state').textContent='Move at a comfortable pace.';});video.addEventListener('ended',()=>playback.videoEnded());
 video.addEventListener('pause',()=>{if(internalVideoPause)return;const atClipEnd=video.ended||(Number.isFinite(video.duration)&&video.duration>0&&video.currentTime>=video.duration-.1);if(atClipEnd)return;const phase=playback.getState().phase;if(phase==='movement')playback.pause();});
 video.addEventListener('error',()=>playback.fail('This approved movement could not load. Check your connection, then retry or choose Next.'));
 video.addEventListener('seeking',()=>{if(audio.src&&Number.isFinite(audio.duration))audio.currentTime=Math.min(video.currentTime,audio.duration);updateTimer();});
 video.addEventListener('timeupdate',()=>{if(audio.src&&$('narration-enabled').checked&&Number.isFinite(audio.duration)&&Math.abs(audio.currentTime-video.currentTime)>1.25)audio.currentTime=Math.min(video.currentTime,audio.duration);});
 $('narration-enabled').addEventListener('change',()=>{if(!audio.src)return;if($('narration-enabled').checked&&playback.getState().phase==='movement'){audio.currentTime=Math.min(video.currentTime,audio.duration||video.currentTime);void audio.play().catch(()=>{$('narration-status').textContent='Narration could not resume. Tap Resume to restart video and narration together.';playback.pause();});}else audio.pause();});
 $('narration-volume').addEventListener('input',()=>{audio.volume=Number($('narration-volume').value)/100;});
 $('playback-error-message').textContent='This approved movement could not load. Retry to try again, or choose Next.';
 document.addEventListener('visibilitychange',()=>{if(document.hidden){const phase=playback.getState().phase;if(phase==='movement'||phase==='transition')playback.pause();releaseWakeLock();}else if(playback.getState().phase==='movement')void requestWakeLock();});
 function applyMember(user){const prior=member?.id||null,next=user?.id||null;authRevision++;if(prior!==next){playback.leave();routine=null;completionId=null;practiced.clear();$('player').hidden=true;$('routines').hidden=false;releaseWakeLock();}member=user||null;renderHistoryFromStorage(next);$('identity').textContent=next?'Signed in. Completion history is private to this member on this browser.':'Guest practice. Sign in through Member space to use member-specific local history.';}
 let client=null;const cfg=window.SOULANOVA_SUPABASE||{};
 if(cfg.url&&cfg.publishableKey&&window.supabase){client=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true}});client.auth.onAuthStateChange((_event,session)=>applyMember(session?.user));const revision=authRevision;client.auth.getUser().then(({data,error})=>{if(revision!==authRevision)return;if(error)$('identity').textContent='Sign-in could not be verified. Saving is paused.';else applyMember(data?.user);}).catch(()=>{if(revision===authRevision)$('identity').textContent='Sign-in could not be verified. Saving is paused.';});}else $('identity').textContent='Member connection is unavailable. Saving is paused.';
 renderLevelTabs();renderRoutines();renderBodyAreas();renderFilters();renderMovements();
})();
