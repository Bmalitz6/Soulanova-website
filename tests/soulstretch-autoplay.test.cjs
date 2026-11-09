'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const playbackTools=require('../app/stretching/stretchingPlayback.js');
const catalog=require('../app/stretching/stretchingCatalog.js');
const guidance=require('../app/stretching/stretchingGuidance.js');
const root=path.resolve(__dirname,'..');

function make(routine,options={}){
 const events=[],states=[],starts=[];let completion=null,answerIndex=0;
 const answers=options.startAnswers||[];
 const controller=playbackTools.createSoulStretchPlayback({
  transitionSeconds:options.transitionSeconds,
  onState:s=>states.push(s),
  onStartMovement:(index,meta)=>{starts.push({id:meta.id,index,token:meta.token,resume:meta.resume,userGesture:meta.userGesture,audioUrl:guidance[meta.id]?.audioUrl});events.push(`start:${meta.id}`);return answers[answerIndex++]??true;},
  onStopMovement:()=>events.push('stop'),
  onComplete:result=>{completion=result;events.push('complete');}
 });
 controller.choose(routine);return {controller,events,states,starts,get completion(){return completion;}};
}
const routine={id:'autoplay-fixture',title:'Autoplay Fixture',level:'Beginner',ids:['overhead-reset','forward-fold','calf-a']};
const flush=async()=>{await Promise.resolve();await Promise.resolve();};

test('one Start begins the first matching Miriam track and video-ended advances automatically',async()=>{
 const h=make(routine);h.controller.start();await flush();
 assert.equal(h.controller.getState().phase,'movement');assert.deepEqual(h.starts.map(x=>x.id),['overhead-reset']);
 assert.equal(h.starts[0].audioUrl,guidance['overhead-reset'].audioUrl);
 h.controller.videoEnded();
 assert.equal(h.controller.getState().phase,'transition');assert.equal(h.controller.getState().nextMovementId,'forward-fold');assert.equal(h.controller.getState().countdown,5);
 h.controller.tick(5);await flush();
 assert.equal(h.controller.getState().phase,'movement');assert.deepEqual(h.starts.map(x=>x.id),['overhead-reset','forward-fold']);
 assert.equal(h.starts[1].audioUrl,guidance['forward-fold'].audioUrl);
});

test('the actual video-ended event starts a five-second fade transition even before estimated clip duration',()=>{
 const h=make(routine);h.controller.start();const stopsBeforeEnd=h.events.filter(x=>x==='stop').length;h.controller.videoEnded();
 assert.equal(h.controller.getState().phase,'transition');assert.equal(h.controller.getState().countdown,5);
 assert.equal(h.events.filter(x=>x==='stop').length,stopsBeforeEnd+1);
});

test('transition countdown pauses/resumes and starts the next movement at zero',async()=>{
 const h=make(routine);h.controller.start();h.controller.videoEnded();h.controller.tick(2);
 assert.equal(h.controller.getState().countdown,3);h.controller.pause();h.controller.tick(20);
 assert.equal(h.controller.getState().phase,'paused-transition');assert.equal(h.controller.getState().countdown,3);
 h.controller.start();h.controller.tick(2.99);assert.equal(h.starts.length,1);h.controller.tick(.01);await flush();
 assert.deepEqual(h.starts.map(x=>x.id),['overhead-reset','forward-fold']);
});

test('manual Next is an immediate optional override; it does not falsely count a skipped movement',async()=>{
 const h=make(routine);h.controller.start();h.controller.next();await flush();
 assert.deepEqual(h.starts.map(x=>x.id),['overhead-reset','forward-fold']);
 assert.deepEqual(h.controller.getState().completedMovementIds,[]);
});

test('Next preview movement IDs map to the correct titles and approved thumbnails',()=>{
 const h=make(routine);h.controller.start();h.controller.videoEnded();const state=h.controller.getState();
 const next=catalog.movements.find(m=>m.id===state.nextMovementId);
 assert.equal(next.name,'Standing forward fold');assert.equal(next.thumbnail,'/app/stretching/thumbnails/forward-fold.jpg');
 assert.equal(state.remaining,2);
});

test('narration and movement stop before every next movement and never overlap',async()=>{
 const h=make(routine);h.controller.start();h.controller.videoEnded();h.controller.tick(5);await flush();
 const stop=h.events.lastIndexOf('stop'),start=h.events.lastIndexOf('start:forward-fold');assert.ok(stop>=0&&stop<start);
 h.controller.videoEnded();h.controller.tick(5);await flush();assert.equal(h.starts[2].audioUrl,guidance['calf-a'].audioUrl);
 const secondStop=h.events.lastIndexOf('stop');assert.ok(secondStop<h.events.lastIndexOf('start:calf-a'));
});

test('browser-blocked automatic playback presents a Resume state and retries in the user gesture',async()=>{
 const h=make(routine,{startAnswers:[false,true]});h.controller.start();await flush();
 assert.equal(h.controller.getState().phase,'resume-required');assert.equal(h.controller.getState().requiresResume,true);
 h.controller.start();await flush();assert.equal(h.controller.getState().phase,'movement');assert.equal(h.starts[1].resume,true);
});

test('pause/resume preserves the current movement and avoids resetting its playhead',async()=>{
 const h=make(routine);h.controller.start();await flush();h.controller.pause();
 assert.equal(h.controller.getState().phase,'paused-movement');h.controller.start();await flush();
 assert.equal(h.starts[1].id,'overhead-reset');assert.equal(h.starts[1].resume,true);
});

test('Previous and Restart restart the selected sequence without duplicate completion claims',async()=>{
 const h=make(routine);h.controller.start();h.controller.next();await flush();h.controller.previous();await flush();
 assert.equal(h.controller.getState().movementId,'overhead-reset');h.controller.restart();await flush();
 assert.equal(h.controller.getState().movementId,'overhead-reset');assert.deepEqual(h.controller.getState().completedMovementIds,[]);
});

test('all completed movements show completion once and expose an exact history-safe result',async()=>{
 const h=make(routine);h.controller.start();await flush();h.controller.videoEnded();h.controller.tick(5);await flush();h.controller.videoEnded();h.controller.tick(5);await flush();h.controller.videoEnded();
 h.controller.videoEnded();assert.equal(h.controller.getState().phase,'complete');assert.equal(h.events.filter(x=>x==='complete').length,1);
 assert.deepEqual(h.completion.completedMovementIds,routine.ids);assert.equal(h.completion.allMovementsCompleted,true);
});

test('skipped movements and video-load failures never create false completion',()=>{
 const h=make(routine);h.controller.start();h.controller.next();h.controller.next();h.controller.next();
 assert.equal(h.controller.getState().phase,'complete');assert.equal(h.completion.allMovementsCompleted,false);
 const e=make(routine);e.controller.start();e.controller.fail('video missing');assert.equal(e.controller.getState().phase,'error');
 e.controller.retry();assert.equal(e.controller.getState().phase,'movement');
});

test('all 24 programs use a matching approved movement thumbnail and full instructor still',()=>{
 assert.equal(catalog.routines.length,24);
 for(const routine of catalog.routines){const m=catalog.movements.find(x=>x.id===routine.ids[0]);assert.ok(m?.thumbnail,routine.id);const file=path.join(root,m.thumbnail.slice(1));const bytes=fs.readFileSync(file);assert.ok(bytes.length>1000&&bytes.length<100000,`${routine.id} thumbnail size`);assert.equal(bytes.toString('hex',0,2),'ffd8',`${routine.id} JPEG`);}
 for(const m of catalog.movements){const bytes=fs.readFileSync(path.join(root,m.thumbnail.slice(1)));assert.equal(bytes.toString('hex',0,2),'ffd8',m.id);}
});

test('page wiring has visual transition, next thumbnail, sequence, restart, recovery and mobile layout',()=>{
 const html=fs.readFileSync(path.join(root,'app/stretching/index.html'),'utf8'),js=fs.readFileSync(path.join(root,'app/stretching/stretching.js'),'utf8'),css=fs.readFileSync(path.join(root,'app/stretching/stretching.css'),'utf8');
 assert.match(html,/stretchingPlayback\.js/);for(const id of ['transition-screen','next-title','next-thumbnail','transition-countdown','sequence-list','completion-screen','retry','restart'])assert.match(html,new RegExp(`id="${id}"`));
 assert.match(js,/addEventListener\('ended',\(\)=>playback\.videoEnded\(\)\)/);assert.match(js,/video\.ended\|\|\(Number\.isFinite\(video\.duration\)&&video\.duration>0&&video\.currentTime>=video\.duration-\.1\)/);assert.match(js,/Approved Miriam narration follows this movement/);assert.match(js,/narration\.disabled=!hasAudio/);assert.match(js,/playback\.tick/);assert.match(js,/playback\.next/);assert.match(js,/screen/);
 assert.doesNotMatch(html,/<video[^>]*\bloop\b/);assert.match(css,/@media\(max-width:700px\)/);assert.match(css,/prefers-reduced-motion/);assert.match(css,/background:#000/);assert.match(css,/\.is-fading/);
});

test('page integration starts matching video and Miriam audio, controls them together, and autoplays the sequence',async()=>{
 const elements=new Map(),timers=new Map(),mediaEvents=[];let now=0,nextTimer=0;
 class Element{
  constructor(id=''){this.id=id;this.handlers={};this.children=[];this.paused=true;this.currentTime=0;this.duration=30;this.volume=1;this.src='';this.value=id==='narration-volume'?'75':'';this.disabled=false;this.checked=false;this.hidden=false;this.muted=id==='demo';this.textContent='';this.style={};this.attributes={};this.classList={tokens:new Set(),toggle:(v,on)=>{if(on===undefined)on=!this.classList.tokens.has(v);on?this.classList.tokens.add(v):this.classList.tokens.delete(v);return on;},add:v=>this.classList.tokens.add(v),remove:v=>this.classList.tokens.delete(v),contains:v=>this.classList.tokens.has(v)};}
  addEventListener(type,fn){(this.handlers[type]??=[]).push(fn)}
  dispatch(type){return (this.handlers[type]||[]).map(fn=>fn({target:this}))}
  append(...items){this.children.push(...items)} replaceChildren(...items){this.children=[...items]}
  setAttribute(k,v){this.attributes[k]=v} removeAttribute(k){delete this.attributes[k];if(k==='src'){this.src='';this.currentTime=0}}
  load(){this.currentTime=0} play(){mediaEvents.push(`play:${this.id}:${this.src}`);this.paused=false;return Promise.resolve()} pause(){if(!this.paused){mediaEvents.push(`pause:${this.id}:${this.src}`);this.paused=true;this.dispatch('pause')}}
 }
 const document={hidden:false,getElementById(id){if(!elements.has(id))elements.set(id,new Element(id));return elements.get(id)},createElement(){return new Element()},createTextNode(text){const e=new Element();e.textContent=text;return e},addEventListener(){}};
 const context={document,window:{SoulStretchCatalog:catalog,SoulStretchGuidance:guidance,SoulStretchProgress:require('../app/stretching/stretchingProgress.js'),SoulStretchPlayback:playbackTools,SOULANOVA_SOULSTRETCH_PUBLIC_BASE:'https://media.example.invalid/soulstretch/',scrollTo(){}},navigator:{},localStorage:{getItem(){return null},setItem(){}},crypto:{randomUUID(){return'00000000-0000-4000-8000-000000000123'}},performance:{now(){return now}},URL,setInterval(fn){const id=++nextTimer;timers.set(id,fn);return id},clearInterval(id){timers.delete(id)},queueMicrotask(fn){fn()},requestAnimationFrame(fn){fn()},console};
 vm.runInNewContext(fs.readFileSync(path.join(root,'app/stretching/stretching.js'),'utf8'),context);
 const card=elements.get('routine-list').children[0],selected=catalog.routines.find(r=>r.collection==='level'&&r.level==='Beginner');card.dispatch('click');
 const first=selected.ids[0],firstMovement=catalog.movements.find(m=>m.id===first);assert.equal(elements.get('movement-name').textContent,firstMovement.name);assert.equal(elements.get('narration-enabled').checked,true);
 await Promise.all(elements.get('toggle').dispatch('click'));await Promise.resolve();await Promise.resolve();
 assert.equal(elements.get('demo').paused,false);assert.equal(elements.get('narration-audio').paused,false);assert.equal(elements.get('narration-audio').src,guidance[first].audioUrl);assert.equal(elements.get('demo').src,`https://media.example.invalid/soulstretch/${firstMovement.sha256}/${encodeURIComponent(firstMovement.file)}`);
 elements.get('narration-enabled').checked=false;elements.get('narration-enabled').dispatch('change');assert.equal(elements.get('narration-audio').paused,true);assert.equal(elements.get('demo').paused,false);
 elements.get('narration-enabled').checked=true;elements.get('narration-enabled').dispatch('change');assert.equal(elements.get('narration-audio').paused,false);
 elements.get('narration-volume').value='40';elements.get('narration-volume').dispatch('input');assert.equal(elements.get('narration-audio').volume,.4);
 elements.get('demo').currentTime=6;elements.get('demo').dispatch('seeking');assert.equal(elements.get('narration-audio').currentTime,6);
 elements.get('toggle').dispatch('click');assert.equal(elements.get('demo').paused,true);assert.equal(elements.get('narration-audio').paused,true);elements.get('toggle').dispatch('click');await Promise.resolve();await Promise.resolve();assert.equal(elements.get('demo').paused,false);assert.equal(elements.get('narration-audio').paused,false);assert.equal(elements.get('demo').currentTime,6);
 elements.get('demo').dispatch('ended');
 const nextId=selected.ids[1],nextMovement=catalog.movements.find(m=>m.id===nextId);assert.equal(elements.get('transition-screen').hidden,false);assert.equal(elements.get('next-title').textContent,nextMovement.name);assert.equal(elements.get('next-thumbnail').src,nextMovement.thumbnail);assert.equal(elements.get('narration-audio').paused,true);assert.equal(elements.get('demo').paused,true);
 elements.get('toggle').dispatch('click');assert.equal(elements.get('transition-countdown').textContent,'Paused');
 assert.equal([...timers.values()].length,0);elements.get('toggle').dispatch('click');assert.equal(elements.get('transition-countdown').textContent.startsWith('Starting in'),true);
 for(let n=0;n<10;n++){now+=500;for(const tick of [...timers.values()])tick();}
 await Promise.resolve();await Promise.resolve();assert.equal(elements.get('movement-name').textContent,nextMovement.name);assert.equal(elements.get('demo').paused,false);assert.equal(elements.get('narration-audio').paused,false);assert.equal(elements.get('narration-audio').src,guidance[nextId].audioUrl);
 const stops=mediaEvents.map((event,index)=>event.startsWith('pause:narration-audio:')?index:-1).filter(index=>index>=0),nextPlay=mediaEvents.findIndex(event=>event===`play:narration-audio:${guidance[nextId].audioUrl}`);assert.ok(stops.some(index=>index<nextPlay));
 elements.get('next').dispatch('click');await Promise.resolve();await Promise.resolve();assert.equal(elements.get('movement-name').textContent,catalog.movements.find(m=>m.id===selected.ids[2]).name);
});
