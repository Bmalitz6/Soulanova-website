'use strict';
(function(root){
 function createSoulStretchPlayback(options){
  const transitionSeconds=Number.isFinite(options.transitionSeconds)&&options.transitionSeconds>=0?options.transitionSeconds:5;
  let routine=null,phase='idle',index=0,countdown=0,epoch=0,completionClaimed=false;
  const completed=new Set();
  function movementId(at=index){return routine?.ids?.[at]||null;}
  function snapshot(message=''){
   return {phase,index,token:epoch,movementId:movementId(),nextMovementId:movementId(index+1),countdown,remaining:routine?Math.max(0,routine.ids.length-index-1):0,completedMovementIds:[...completed],total:routine?.ids?.length||0,requiresResume:phase==='resume-required',message};
  }
  function emit(message=''){options.onState?.(snapshot(message));}
  function stop(){epoch++;options.onStopMovement?.();}
  function complete(){
   if(completionClaimed)return;
   completionClaimed=true;phase='complete';countdown=0;stop();
   options.onComplete?.({routine,completedMovementIds:[...completed],allMovementsCompleted:Boolean(routine?.ids?.every(id=>completed.has(id)))});
   emit();
  }
  function begin({resume=false,userGesture=false}={}){
   const id=movementId();if(!routine||!id||completionClaimed)return;
   const token=++epoch;phase='movement';countdown=0;emit();
   let result;
   try{result=options.onStartMovement?.(index,{id,resume,userGesture,token});}
   catch{result=false;}
   Promise.resolve(result).then(ok=>{
    if(token!==epoch||phase!=='movement')return;
    if(ok===false){phase='resume-required';emit('Playback paused by the browser. Tap Resume to continue video and narration together.');}
   }).catch(()=>{
    if(token!==epoch||phase!=='movement')return;
    phase='resume-required';emit('Playback paused by the browser. Tap Resume to continue video and narration together.');
   });
  }
  function choose(item,{program=true}={}){
   stop();routine=item;index=0;countdown=0;completionClaimed=false;completed.clear();phase='ready';emit();
  }
  function start(){if(phase==='ready')begin({userGesture:true});else if(phase==='resume-required'||phase==='paused-movement')begin({resume:true,userGesture:true});else if(phase==='paused-transition'){phase='transition';emit();}}
  function videoEnded(){
   if(phase!=='movement'||!routine)return;
   completed.add(movementId());
   if(index>=routine.ids.length-1){complete();return;}
   phase='transition';countdown=transitionSeconds;stop();emit();
  }
  function tick(seconds=1){if(phase!=='transition')return;countdown=Math.max(0,countdown-Math.max(0,seconds));if(countdown===0){index++;begin({userGesture:false});}else emit();}
  function pause(){
   if(phase==='movement'){phase='paused-movement';stop();emit();}
   else if(phase==='transition'){phase='paused-transition';emit();}
  }
  function next(){
   if(!['movement','paused-movement','resume-required','transition','paused-transition','ready'].includes(phase)||!routine)return;
   if(index>=routine.ids.length-1){complete();return;}
   stop();index++;begin({userGesture:true});
  }
  function previous(){
   if(!routine||index<=0||completionClaimed)return;
   stop();index--;begin({userGesture:true});
  }
  function restart(){if(!routine)return;stop();index=0;countdown=0;completionClaimed=false;completed.clear();begin({userGesture:true});}
  function fail(message='This approved movement could not load. Retry to try again, or choose Next.'){
   if(!routine||['complete','idle'].includes(phase))return;
   stop();phase='error';emit(message);
  }
  function retry(){if(phase!=='error')return;begin({userGesture:true});}
  function leave(){stop();routine=null;phase='idle';index=0;countdown=0;completionClaimed=false;completed.clear();emit();}
  return {choose,start,videoEnded,tick,pause,next,previous,restart,fail,retry,leave,getState:snapshot};
 }
 const api={createSoulStretchPlayback};
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.SoulStretchPlayback=api;
})(typeof globalThis==='undefined'?this:globalThis);
