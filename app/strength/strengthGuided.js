'use strict';
(function(root){
 function createSession(workout,isAvailable){
  const steps=workout.exercises.flatMap((exercise,exerciseIndex)=>Array.from({length:exercise.sets},(_,set)=>({...exercise,exerciseIndex,set:set+1})));
  let index=0,phase='ready';const completed=new Set();
  const state=()=>({phase,index,total:steps.length,step:steps[index],available:!!steps[index]&&isAvailable(steps[index].exerciseId),completed:completed.size,allCompleted:steps.length>0&&completed.size===steps.length});
  return {state,start(){if(phase==='ready')phase='playing';return state();},pause(){if(phase==='playing')phase='paused';return state();},resume(){if(phase==='paused')phase='playing';return state();},ended(){if(phase!=='playing'||!isAvailable(steps[index]?.exerciseId))return state();completed.add(index);if(index===steps.length-1)phase='complete';else index++;return state();},next(){if(phase==='ready'||phase==='complete')return state();if(index===steps.length-1)phase='complete';else index++;return state();},previous(){if(phase!=='ready'&&index>0){index--;phase='paused';}return state();},stop(){phase='stopped';return state();}};
 }
 function mount({workout,exercises,media,container,allowed,exit,restOverride}){
  const url=id=>root.SoulanovaPrograms.media(media.get(id));
  const session=createSession(workout,id=>!!url(id));let video=null,disposed=false,restTimer=null,rest=0;
  const stopVideo=()=>{if(video){video.onended=null;video.onerror=null;video.pause();video.removeAttribute('src');video.load();video=null;}};
  const clearRest=()=>{clearInterval(restTimer);restTimer=null;rest=0;};
  const button=(label,action)=>{const b=document.createElement('button');b.type='button';b.className='button secondary';b.textContent=label;b.onclick=action;return b;};
  function render(){
   if(disposed||!allowed()){dispose();return;}stopVideo();container.replaceChildren();container.hidden=false;const s=session.state(),card=document.createElement('article');card.className='player-card';
   const h=document.createElement('h2');h.textContent=workout.title;const note=document.createElement('p');note.className='notice';note.textContent='Practice selection from the original plan. Guided exercise playback · approved videos only. Warm-up and cool-down are not included. Unavailable or skipped sets do not count as completed. Progress is not saved.';card.append(h,note);
   const summary=document.createElement('p');summary.setAttribute('role','status');summary.textContent=s.phase==='complete'?(s.allCompleted?(workout.practiceOnly?'Approved practice complete. ':'Workout exercise sets complete. '):'Session ended · Workout incomplete. ')+`${s.completed} of ${s.total} sets completed.`:`Set ${s.index+1} of ${s.total} · ${s.completed} completed`;card.append(summary);
   if(!['complete','stopped'].includes(s.phase)){
    const e=exercises.find(e=>e.id===s.step.exerciseId),name=document.createElement('h3');name.textContent=(e?.name||s.step.exerciseId)+` · Set ${s.step.set}`;const instruction=document.createElement('p');instruction.textContent=s.step.instruction||'';const reps=document.createElement('p');reps.textContent=`${s.step.reps} · ${restOverride??s.step.restSeconds}s rest`;card.append(name,reps,instruction);
    if(s.available){video=document.createElement('video');video.className='player-media';video.playsInline=true;video.preload='metadata';video.src=url(s.step.exerciseId);video.setAttribute('aria-label',name.textContent);card.append(video);const status=document.createElement('p');status.setAttribute('role','status');card.append(status);
     video.onended=()=>{if(!allowed()||disposed||session.state().phase!=='playing')return;const prior=session.state();session.ended();const after=session.state();summary.textContent=`Rest after set ${prior.index+1} of ${after.total} · ${after.completed} completed`;if(after.phase==='complete'){render();return;}rest=restOverride??prior.step.restSeconds;stopVideo();status.textContent=`Rest · ${rest} seconds`;restTimer=setInterval(()=>{if(session.state().phase==='paused')return;rest=Math.max(0,rest-1);status.textContent=`Rest · ${rest} seconds`;if(!rest){clearRest();render();}},1000);};
     video.onerror=()=>{session.pause();pause.disabled=true;resume.disabled=false;status.textContent='Approved video could not load. No set was recorded. Retry with Resume, or use Next to skip.';};
     if(s.phase==='playing'){const current=video;video.play().catch(()=>{if(disposed||video!==current)return;session.pause();pause.disabled=true;resume.disabled=false;status.textContent='Tap Resume to start playback.';});}
    }else{const missing=document.createElement('p');missing.className='notice';missing.textContent='Video unavailable — final-master approval required. Use Next to skip this set; it will not be counted.';card.append(missing);}
    const controls=document.createElement('div');controls.className='guided-controls';const prev=button('Previous',()=>{clearRest();session.previous();render();});prev.disabled=s.index===0;
    const pause=button('Pause',()=>{session.pause();video?.pause();pause.disabled=true;resume.disabled=false;});const resume=button('Resume',()=>{session.resume();pause.disabled=false;resume.disabled=true;if(video)video.play().catch(()=>{session.pause();pause.disabled=true;resume.disabled=false;});else if(!restTimer)render();});pause.disabled=s.phase!=='playing';resume.disabled=s.phase!=='paused';
    const next=button('Next',()=>{clearRest();session.next();render();});controls.append(prev,pause,resume,next);card.append(controls);
   }
   card.append(button('Back to workout',()=>{dispose();exit();}));container.append(card);
  }
  function dispose(){if(disposed)return;disposed=true;clearRest();stopVideo();session.stop();if(root.SoulanovaMemberNavigation?.getGuard?.()===guard)root.SoulanovaMemberNavigation.setGuard(null);}
  const guard=()=>!disposed&&!['complete','stopped'].includes(session.state().phase);root.SoulanovaMemberNavigation?.setGuard(guard);
  session.start();render();return {dispose,state:session.state,pause(){session.pause();video?.pause();const buttons=container.querySelectorAll('button');for(const b of buttons){if(b.textContent==='Pause')b.disabled=true;if(b.textContent==='Resume')b.disabled=false;}}};
 }
 const api={createSession,mount};if(typeof module==='object'&&module.exports)module.exports=api;else root.SoulanovaStrengthGuided=api;
})(globalThis);
