'use strict';
(function(root){
 function createSoulStretchPlayback(options){
  const transitionSeconds=Number.isFinite(options.transitionSeconds)&&options.transitionSeconds>=0?options.transitionSeconds:5;
  let routine=null,playOrder=[],phase='idle',index=0,countdown=0,epoch=0,completionClaimed=false;
  const completedSegments=new Set(),completedMovements=new Set();
  function roundsFor(item){return Number.isInteger(item?.rounds)&&item.rounds>0?item.rounds:1;}
  function movementId(at=index){return playOrder[at]||null;}
  function snapshot(message=''){
   const ids=routine?.ids||[],roundLength=ids.length||1;
   return {phase,index,token:epoch,movementId:movementId(),nextMovementId:movementId(index+1),countdown,remaining:Math.max(0,playOrder.length-completedSegments.size),completedMovementIds:[...completedMovements],completedSegmentIndexes:[...completedSegments],total:playOrder.length,uniqueMovementCount:new Set(playOrder).size,round:Math.min(roundsFor(routine),Math.floor(index/roundLength)+1),rounds:roundsFor(routine),movementInRound:index%roundLength+1,requiresResume:phase==='resume-required',message};
  }
  function emit(message=''){options.onState?.(snapshot(message));}
  function stop(){epoch++;options.onStopMovement?.();}
  function complete(){
   if(completionClaimed)return;
   completionClaimed=true;phase='complete';countdown=0;stop();
   const allSegmentsCompleted=playOrder.length>0&&completedSegments.size===playOrder.length;
   options.onComplete?.({routine,completedMovementIds:[...completedMovements],completedSegmentIndexes:[...completedSegments],allSegmentsCompleted,allMovementsCompleted:allSegmentsCompleted,totalSegments:playOrder.length});
   emit();
  }
  function begin({resume=false,userGesture=false}={}){
   const id=movementId();if(!routine||!id||completionClaimed)return;
   const token=++epoch;phase='movement';countdown=0;emit();
   let result;
   try{result=options.onStartMovement?.(index,{id,resume,userGesture,token,round:snapshot().round,rounds:roundsFor(routine)});}
   catch{result=false;}
   Promise.resolve(result).then(ok=>{
    if(token!==epoch||phase!=='movement')return;
    if(ok===false){phase='resume-required';emit('Playback paused by the browser. Tap Resume to continue video and narration together.');}
   }).catch(()=>{
    if(token!==epoch||phase!=='movement')return;
    phase='resume-required';emit('Playback paused by the browser. Tap Resume to continue video and narration together.');
   });
  }
  function choose(item){
   stop();routine=item;const ids=Array.isArray(item?.ids)?item.ids:[],rounds=roundsFor(item);
   playOrder=(item.roundMovementIds||Array.from({length:rounds},()=>ids)).flat();index=0;countdown=0;completionClaimed=false;completedSegments.clear();completedMovements.clear();phase='ready';emit();
  }
  function start(){if(phase==='ready')begin({userGesture:true});else if(phase==='resume-required'||phase==='paused-movement')begin({resume:true,userGesture:true});else if(phase==='paused-transition'){phase='transition';emit();}}
  function videoEnded(){
   if(phase!=='movement'||!routine)return;
   completedSegments.add(index);completedMovements.add(movementId());
   if(index>=playOrder.length-1){complete();return;}
   phase='transition';countdown=transitionSeconds;stop();emit();
  }
  function tick(seconds=1){if(phase!=='transition')return;countdown=Math.max(0,countdown-Math.max(0,seconds));if(countdown===0){index++;begin({userGesture:false});}else emit();}
  function pause(){if(phase==='movement'){phase='paused-movement';stop();emit();}else if(phase==='transition'){phase='paused-transition';emit();}}
  function next(){
   if(!['movement','paused-movement','resume-required','transition','paused-transition','ready'].includes(phase)||!routine)return;
   if(index>=playOrder.length-1){complete();return;}
   stop();index++;begin({userGesture:true});
  }
  function previous(){if(!routine||index<=0||completionClaimed)return;stop();index--;begin({userGesture:true});}
  function restart(){if(!routine)return;stop();index=0;countdown=0;completionClaimed=false;completedSegments.clear();completedMovements.clear();begin({userGesture:true});}
  function fail(message='This approved movement could not load. Retry to try again, or choose Next.'){
   if(!routine||['complete','idle'].includes(phase))return;
   stop();phase='error';emit(message);
  }
  function retry(){if(phase!=='error')return;begin({userGesture:true});}
  function leave(){stop();routine=null;playOrder=[];phase='idle';index=0;countdown=0;completionClaimed=false;completedSegments.clear();completedMovements.clear();emit();}
  return {choose,start,videoEnded,tick,pause,next,previous,restart,fail,retry,leave,getState:snapshot};
 }
 const api={createSoulStretchPlayback};
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.SoulStretchPlayback=api;
})(typeof globalThis==='undefined'?this:globalThis);
