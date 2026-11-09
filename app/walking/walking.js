import {bounded,requireMember,insertOnce} from '/app/member-data.mjs';
import {briskMinutes as brisk,treadmillLevels,outdoorEffortGuidance,phaseAt,accountChangeState} from '/app/walking/training.mjs';
import {buildWalkSession,createWalkSaveHandler,walkSaveErrorMessage} from '/app/walking/save.mjs';
import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const $=id=>document.getElementById(id),db=createClient(window.SOULANOVA_SUPABASE.url,window.SOULANOVA_SUPABASE.publishableKey,{auth:{flowType:'pkce',detectSessionInUrl:true,autoRefreshToken:true,persistSession:true}});
let saving=false,walkId=crypto.randomUUID(),owner=null,authRevision=0,historyRevision=0;
let week=0,weekWindowStart=0,elapsed=0,startedAt=0,timer=null,running=false,finished=false,watch=null,miles=0,lastPosition=null,events=new Set(),saved=false,mode='outdoor',treadmillLevel='beginner',manualPhase=null,gpsOptOutForSession=false,gpsRestartOnForeground=false;
const accountWritesEnabled=false;
const cueFiles={start:'start.mp3',brisk:'brisk.mp3',half:'halfway.mp3',cool:'cooldown.mp3',done:'finish.mp3'};let activeCue=null;
const total=()=>600+brisk[week]*60;
const format=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
const phaseNames={warmup:'Warm-up',steady:'Steady walk',brisk:'Brisk walk',cooldown:'Cool-down'};
const valueOf=id=>$(id).value.trim()===''?null:Number($(id).value);
function formatRange(range){return range[0]===range[1]?String(range[0]):`${range[0]}–${range[1]}`;}
function recommendation(level,phase){const item=treadmillLevels[level]?.phases[phase];return item?`${formatRange(item.speed)} mph · ${formatRange(item.incline)}% incline`:'—';}
function effort(level,phase){return outdoorEffortGuidance[level]?.[phase]||'—';}
function weekWindowSize(){return window.matchMedia('(max-width: 680px)').matches?4:6;}
function clearEnteredMetrics(){for(const id of ['steps','treadmill-distance','treadmill-speed','treadmill-incline','manual-speed','manual-incline'])$(id).value='';}
function renderGuidance(){
 $('level-panel').hidden=false;$('treadmill-options').hidden=mode!=='treadmill';$('outdoor-effort-options').hidden=mode!=='outdoor';$('gps-control').hidden=mode!=='outdoor';
 $('choose-level-subtitle').textContent=mode==='treadmill'?'Optional speed and incline ranges; adjust the machine by hand.':'Comfortable, effort-based cues for each walking phase.';document.querySelectorAll('input[name="level-chip"] + span small').forEach((el,index)=>{el.textContent=mode==='outdoor'?['Easy effort','Steady effort','Strong effort'][index]:['Gentle start','Steady build','Confident pace'][index];});
 $('gps').disabled=mode!=='outdoor'||saving;if(mode==='outdoor')$('gps').checked=!gpsOptOutForSession;else $('gps').checked=false;
 $('guidance-card-title').textContent=mode==='treadmill'?'Treadmill Guidance':'Outdoor Walk';
 $('guidance-card-subtitle').textContent=mode==='treadmill'?`${treadmillLevels[treadmillLevel].label} · optional pace and incline`:`${treadmillLevels[treadmillLevel].label} · effort-based pace cues`;
 const status=phaseAt(week,elapsed),current=status.current,next=status.next;
 if(current){$('current-phase-name').textContent=phaseNames[current];$('current-recommendation').textContent=recommendation(treadmillLevel,current);}
 else{$('current-phase-name').textContent='Completed';$('current-recommendation').textContent='—';}
 $('next-phase-name').textContent=next?phaseNames[next]:'No next phase';$('next-recommendation').textContent=next?recommendation(treadmillLevel,next):'—';$('effort-current').textContent=effort(treadmillLevel,'warmup');$('effort-next').textContent=effort(treadmillLevel,'brisk');
}
function renderActuals(){
 const actualDistance=mode==='treadmill'?valueOf('treadmill-distance'):null;
 const displayDistance=mode==='treadmill'?actualDistance:(miles>0?miles:null);
 $('miles').textContent=displayDistance===null?'—':displayDistance.toFixed(2);
 $('distance-note').textContent=mode==='treadmill'?'Actual value entered from treadmill':'GPS estimate · outdoors';
 $('steps-display').textContent=$('steps').value||'—';
 if(mode==='treadmill'){
  const parts=[];
  if(actualDistance!==null)parts.push(`${actualDistance.toFixed(2)} mi actual`);
  const speed=valueOf('treadmill-speed');if(speed!==null)parts.push(`${speed.toFixed(1)} mph actual average`);
  const incline=valueOf('treadmill-incline');if(incline!==null)parts.push(`${incline.toFixed(1)}% actual average incline`);
  const steps=valueOf('steps');if(steps!==null)parts.push(`${Math.trunc(steps)} actual steps`);
  $('actual-summary').textContent=parts.length?`Treadmill readings entered for this session: ${parts.join(' · ')}. Not saved to your account while saving is paused.`:'Treadmill readings entered here are actual values, not GPS estimates.';
 }else{
  const steps=valueOf('steps');$('actual-summary').textContent=steps===null?'':`${Math.trunc(steps)} user-entered steps. Outdoor distance is a GPS estimate.`;
 }
}
function availableVoices(){return 'speechSynthesis' in window?speechSynthesis.getVoices().filter(v=>v.lang?.toLowerCase().startsWith('en')):[];}
function preferredVoice(){
 const voices=availableVoices();
 const preferred=['samantha','ava','allison','susan','serena','karen','victoria','moira','zoe','female'];
 return voices.find(v=>preferred.some(n=>v.name.toLowerCase().includes(n)))||voices[0]||null;
}
function fallbackSpeech(text){if(!('speechSynthesis' in window))return;try{speechSynthesis.cancel();const utter=new SpeechSynthesisUtterance(text);utter.rate=.88;utter.lang='en-US';const v=preferredVoice();if(v)utter.voice=v;speechSynthesis.speak(utter)}catch(e){}}
function stopNarration(){if(activeCue){activeCue.pause();activeCue=null;}if('speechSynthesis' in window)speechSynthesis.cancel();}
function announce(text,key){
 const current=phaseAt(week,elapsed).current;
 const prompt=mode==='treadmill'&&current?`${text}\nOptional treadmill guidance for ${phaseNames[current].toLowerCase()}: ${recommendation(treadmillLevel,current)}. Adjust to comfort; set the machine yourself.`:text;
 $('message').textContent=prompt;if(!$('voice').checked)return;
 if(activeCue){activeCue.pause();activeCue=null;}
 if('speechSynthesis' in window)speechSynthesis.cancel();
 if(!cueFiles[key]){fallbackSpeech(text);return;}
 const cue=new Audio('/app/walking/audio/'+cueFiles[key]);activeCue=cue;let recovered=false;
 const recover=()=>{if(recovered||activeCue!==cue)return;recovered=true;activeCue=null;fallbackSpeech(text)};
 cue.onerror=recover;cue.play().catch(recover);
}
function choose(n){if(running||saving)return;stopNarration();walkId=crypto.randomUUID();week=n;const count=weekWindowSize();if(n<weekWindowStart||n>=weekWindowStart+count)weekWindowStart=Math.max(0,Math.min(brisk.length-count,n-Math.floor(count/2)));elapsed=0;finished=false;saved=false;events.clear();miles=0;lastPosition=null;manualPhase=null;gpsOptOutForSession=false;clearEnteredMetrics();stopGPS();render();}
function render(){for(const id of ['steps','treadmill-distance','treadmill-speed','treadmill-incline'])$(id).disabled=saving||saved;
 const duration=Math.round(total()/60),current=phaseAt(week,elapsed).current,progressPercent=Math.round(100*elapsed/total());
 const underway=running||(!finished&&elapsed>0);$('workout-center').classList.toggle('is-before',!underway&&!finished);$('workout-center').classList.toggle('is-active',underway);$('workout-center').classList.toggle('is-complete',finished);
 $('journey-week-copy').textContent=`Week ${week+1} of 12 · ${brisk[week]} min brisk walking`;
 $('timer-tag').textContent='Week '+(week+1)+' Walk';$('week-duration').textContent=format(total());$('timer-total').textContent='of '+format(total());
 $('clock').textContent=format(Math.max(0,total()-elapsed));$('setup-duration').textContent=duration+' min';$('setup-phase-summary').textContent=`5 min easy · ${brisk[week]} min brisk · 5 min easy`;$('position').textContent=`5 min easy · ${brisk[week]} min brisk · 5 min easy`;$('brisk-duration').textContent=brisk[week]+' min';
 $('timer-ring').style.setProperty('--timer-progress',progressPercent+'%');$('timer-ring').setAttribute('aria-valuenow',String(progressPercent));
 if(mode==='treadmill'&&current&&manualPhase&&current!==manualPhase){$('manual-speed').value='';$('manual-incline').value='';}if(mode==='treadmill'&&current)manualPhase=current;
 $('phase').textContent=finished?'Completed':!elapsed?'Warm Up':phaseNames[current]||'Completed';
 const status=phaseAt(week,elapsed),activeCurrent=status.current,activeNext=status.next;$('active-phase-name').textContent=finished?'Walk complete':activeCurrent?phaseNames[activeCurrent]:'Warm Up';$('active-next-phase').textContent=activeNext?phaseNames[activeNext]:'Walk complete';$('active-current-recommendation').textContent=activeCurrent?(mode==='treadmill'?recommendation(treadmillLevel,activeCurrent):effort(treadmillLevel,activeCurrent)):'';$('active-current-recommendation').hidden=!activeCurrent;$('active-next-recommendation').textContent=activeNext?(mode==='treadmill'?recommendation(treadmillLevel,activeNext):effort(treadmillLevel,activeNext)):'';$('active-next-recommendation').hidden=!activeNext;
 const locked=running||elapsed>0||finished||saving;$('outdoor-mode').disabled=locked;$('treadmill-mode').disabled=locked;$('mode-lock-note').hidden=!locked;
 $('start').disabled=running||finished||saving;$('start').textContent='Start Walk';$('pause').disabled=!running;$('pause').textContent='Pause Walk';$('resume').hidden=running||!underway;$('resume').disabled=saving;$('start-new').hidden=!finished;$('start-new').disabled=saving;$('reset').disabled=saving;$('save').disabled=!accountWritesEnabled||!finished||saved||saving||!owner;$('save').textContent=saving?'Saving…':saved?'Walk saved':'Save completed walk';$('save').setAttribute('aria-busy',String(saving));
 $('save-help').textContent=!accountWritesEnabled?'Account saving is paused while Supabase validation is pending. Your current entries remain in this browser session.':!owner?'Sign in to save this completed walk. Your entered readings remain on this screen.':saved?'Walk saved.':finished?'Workout finished. Save your steps and distance.':'Complete the walking timer before saving. '+format(total()-elapsed)+' remaining.';
 for(const id of ['steps','treadmill-distance','treadmill-speed','treadmill-incline'])$(id).disabled=saving||saved;
 renderPhases();renderWeekSelector();renderGuidance();renderActuals();
}
function renderPhases(){
 const pieces=[300,brisk[week]*60,300],segments=[...document.querySelectorAll('#phase-track .segment')];let begin=0;
 segments.forEach((segment,index)=>{const end=begin+pieces[index],complete=finished||elapsed>=end,active=!finished&&elapsed>=begin&&elapsed<end;segment.classList.toggle('done',complete);segment.classList.toggle('current',active);segment.style.setProperty('--phase-percent',active?`${Math.max(0,Math.min(100,100*(elapsed-begin)/pieces[index]))}%`:'0%');begin=end;});
}
function renderWeekSelector(){
 const list=$('weeks'),select=$('week-select'),count=weekWindowSize();weekWindowStart=Math.max(0,Math.min(brisk.length-count,weekWindowStart));if(week<weekWindowStart||week>=weekWindowStart+count)weekWindowStart=Math.max(0,Math.min(brisk.length-count,week-Math.floor(count/2)));
 if(!select.options.length)brisk.forEach((mins,index)=>select.add(new Option(`Week ${index+1} · ${mins+10} min`,String(index))));
 select.value=String(week);list.replaceChildren();const end=Math.min(brisk.length,weekWindowStart+count);
 for(let index=weekWindowStart;index<end;index++){
  const card=document.createElement('article');card.className='week';card.setAttribute('aria-current',String(index===week));const button=document.createElement('button');button.type='button';button.disabled=running||saving;button.setAttribute('aria-label',`Choose week ${index+1}, ${brisk[index]+10} minutes`);
  const title=document.createElement('strong');title.textContent='Week '+(index+1);const minutes=document.createElement('small');minutes.textContent=(brisk[index]+10)+' min';button.append(title,minutes);button.onclick=()=>choose(index);card.append(button);list.append(card);
 }
 if(end<brisk.length){const dots=document.createElement('span');dots.className='week-ellipsis';dots.textContent='…';dots.setAttribute('aria-hidden','true');list.append(dots);const card=document.createElement('article');card.className='week';card.setAttribute('aria-current',String(week===brisk.length-1));const jump=document.createElement('button');jump.type='button';jump.className='week-jump';jump.disabled=running||saving;jump.setAttribute('aria-label',`Choose week 12, ${brisk.at(-1)+10} minutes`);const title=document.createElement('strong');title.textContent='Week 12';const minutes=document.createElement('small');minutes.textContent=(brisk.at(-1)+10)+' min';jump.append(title,minutes);jump.onclick=()=>choose(brisk.length-1);card.append(jump);list.append(card);}
 $('week-window-caption').textContent=`Weeks ${weekWindowStart+1}–${end} of 12`;$('week-prev').disabled=weekWindowStart===0||running||saving;$('week-next').disabled=weekWindowStart>=brisk.length-count||running||saving;
}
function milestone(key,text){if(events.has(key))return;events.add(key);announce(text,key)}
function tick(){
 if(!running)return;
 const previous=elapsed;
 elapsed=Math.min(total(),Math.floor((Date.now()-startedAt)/1000));

 if(elapsed>=total()){finish();return;}

 const cues=[
  {time:300,key:'brisk',text:'Warm-up complete. Gradually increase to a brisk pace. You should still be able to talk.'},
  {time:Math.ceil(total()/2),key:'half',text:'You are halfway through your walk. Keep going at a comfortable pace.'},
  {time:total()-300,key:'cool',text:'Five minutes remaining. Slow your pace for your cool-down.'}
 ];

 const due=cues.filter(c=>elapsed>=c.time&&!events.has(c.key));

 if(due.length){
  if(elapsed-previous>15){
   // Safari resumed after a delay: announce only the latest cue.
   due.forEach(c=>events.add(c.key));
   const latest=due[due.length-1];
   announce(latest.text,latest.key);
  }else{
   const next=due[0];
   milestone(next.key,next.text);
  }
 }
 render();
}
function distance(a,b){const rad=Math.PI/180,dlat=(b.latitude-a.latitude)*rad,dlon=(b.longitude-a.longitude)*rad,x=Math.sin(dlat/2)**2+Math.cos(a.latitude*rad)*Math.cos(b.latitude*rad)*Math.sin(dlon/2)**2;return 3958.7613*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}
function startGPS(){if(mode!=='outdoor'||gpsOptOutForSession)return;if(!navigator.geolocation){$('message').textContent='GPS unavailable in this browser. Your walk timer continues without GPS.';return;}if(watch!==null)return;watch=navigator.geolocation.watchPosition(pos=>{if(!running||mode!=='outdoor'||gpsOptOutForSession)return;const p=pos.coords;if(p.accuracy>60)return;const next={latitude:p.latitude,longitude:p.longitude};if(lastPosition){const delta=distance(lastPosition,next);if(delta<.12&&delta>.003)miles+=delta;}lastPosition=next;render()},e=>{ $('message').textContent='GPS not available: '+e.message+' Your walk timer continues.';stopGPS()},{enableHighAccuracy:true,maximumAge:3000,timeout:12000});}
function stopGPS(){if(watch!==null){navigator.geolocation.clearWatch(watch);watch=null;}lastPosition=null}
function stopTimer(){if(timer!==null)clearInterval(timer);timer=null;running=false;gpsRestartOnForeground=false;stopGPS();stopNarration()}
function finish(){elapsed=total();finished=true;stopTimer();milestone('done','Workout complete! Excellent work. You have finished week '+(week+1)+'.');render();}
const startWalk=()=>{if(finished||running)return;running=true;startedAt=Date.now()-elapsed*1000;timer=setInterval(tick,500);if(mode==='outdoor'&&!gpsOptOutForSession)startGPS();if(!events.has('start'))milestone('start','Begin with five minutes of easy walking to warm up.');render()};
$('start').onclick=startWalk;
$('pause').onclick=()=>{tick();stopTimer();$('message').textContent='Workout paused.';render()};
$('resume').onclick=startWalk;
const resetWalk=()=>{if(saving)return;stopTimer();walkId=crypto.randomUUID();elapsed=0;miles=0;finished=false;saved=false;events.clear();manualPhase=null;gpsOptOutForSession=false;$('gps').checked=true;clearEnteredMetrics();render()};
$('reset').onclick=()=>{if(saving)return;if(!confirm('Reset this walk?'))return;resetWalk()};
$('start-new').onclick=resetWalk;
$('gps').checked=true;
$('gps').onchange=()=>{if(mode!=='outdoor'||running||elapsed||finished||saving){render();return;}gpsOptOutForSession=!$('gps').checked;stopGPS()};
$('outdoor-mode').onchange=()=>{if(!$('outdoor-mode').checked)return;if(running||elapsed||finished||saving){render();return;}mode='outdoor';manualPhase=null;stopGPS();miles=0;lastPosition=null;$('gps').checked=!gpsOptOutForSession;clearEnteredMetrics();render()};
$('treadmill-mode').onchange=()=>{if(!$('treadmill-mode').checked)return;if(running||elapsed||finished||saving){render();return;}mode='treadmill';manualPhase=null;treadmillLevel=$('treadmill-level').value;stopGPS();miles=0;lastPosition=null;$('gps').checked=false;clearEnteredMetrics();render()};
$('treadmill-level').onchange=()=>{treadmillLevel=$('treadmill-level').value;renderGuidance();};
$('voice').addEventListener('change',()=>{if(!$('voice').checked)stopNarration();});
$('steps').oninput=render;$('treadmill-distance').oninput=render;$('treadmill-speed').oninput=render;$('treadmill-incline').oninput=render;
$('manual-speed').oninput=render;$('manual-incline').oninput=render;
const saveWalk=createWalkSaveHandler({
 canSave:()=>accountWritesEnabled&&finished&&!saved&&!saving&&!!owner,
 capture:()=>{
  const revision=authRevision,expectedOwner=owner;
  const record=buildWalkSession({
   id:walkId,userId:expectedOwner,weekIndex:week,mode,fitnessLevel:treadmillLevel,durationSeconds:total(),gpsMiles:miles,
   stepsRaw:$('steps').value,treadmillDistanceRaw:$('treadmill-distance').value,
   treadmillSpeedRaw:$('treadmill-speed').value,treadmillInclineRaw:$('treadmill-incline').value
  });
  return {revision,expectedOwner,record};
 },
 save:async context=>{
  const user=await requireMember(db,context.expectedOwner);
  if(context.revision!==authRevision)throw Error('Your account changed. Refresh before saving.');
  const entry={...context.record,user_id:user.id};
  try{await insertOnce(db,'soulwalk','soulwalk_sessions',entry);}catch(error){throw Object.assign(new Error(walkSaveErrorMessage(error)),{cause:error,code:error?.code,status:error?.status});}
 },
 refreshHistory:async context=>context.revision===authRevision?loadHistory():false,
 onState:(next,context)=>{
  if(context&&(context.revision!==authRevision||context.record.id!==walkId))return;
  saving=next.saving;
  if(next.saved!==undefined)saved=next.saved;
  if(next.message!==undefined)$('message').textContent=next.message;
  render();
 }
});
$('save').onclick=()=>saveWalk();
document.querySelector('#week-select').addEventListener('change',e=>choose(Number(e.target.value)));
document.querySelector('#week-prev').onclick=()=>{weekWindowStart=Math.max(0,weekWindowStart-(weekWindowSize()-1));renderWeekSelector()};
document.querySelector('#week-next').onclick=()=>{weekWindowStart=Math.min(brisk.length-weekWindowSize(),weekWindowStart+weekWindowSize()-1);renderWeekSelector()};
window.addEventListener('resize',renderWeekSelector);
document.querySelectorAll('input[name="level-chip"]').forEach(input=>input.addEventListener('change',()=>{if(!input.checked)return;$('treadmill-level').value=input.value;$('treadmill-level').dispatchEvent(new Event('change'));}));
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(running&&mode==='outdoor'&&$('gps').checked){gpsRestartOnForeground=true;stopGPS()}}else if(running){tick();if(gpsRestartOnForeground&&mode==='outdoor'&&$('gps').checked){gpsRestartOnForeground=false;startGPS()}}});
render();

const historyNumber=n=>Number(n).toLocaleString();
async function loadHistory(){
 const revision=++historyRevision,accountRevision=authRevision;const status=$('history-status'),refresh=$('history-refresh'),list=$('history-list');clearHistory();
 refresh.disabled=true;status.textContent='Loading walking history…';$('history-chart-empty').hidden=false;$('history-chart-empty').textContent='Loading recent walk totals…';
 try{
  const member=await requireMember(db,owner);if(accountRevision!==authRevision||revision!==historyRevision)return false;
  const rows=[];let metadataColumns=true;
  // Read all saved walks in bounded pages rather than silently showing incomplete totals.
  for(let start=0;start<20000;start+=500){
   let {data,error}=await bounded(signal=>db.from('soulwalk_sessions')
    .select(metadataColumns?'id,week_number,duration_minutes,distance_miles,steps,created_at,walk_mode,fitness_level,distance_source,steps_source,treadmill_speed_mph,treadmill_incline_percent':'id,week_number,duration_minutes,distance_miles,steps,created_at')
    .eq('user_id',member.id).order('created_at',{ascending:false})
    .range(start,start+499).abortSignal(signal));
   if(error&&metadataColumns&&['42703','PGRST204'].includes(error.code)){
    metadataColumns=false;
    ({data,error}=await bounded(signal=>db.from('soulwalk_sessions').select('id,week_number,duration_minutes,distance_miles,steps,created_at')
     .eq('user_id',member.id).order('created_at',{ascending:false}).range(start,start+499).abortSignal(signal)));
   }
   if(accountRevision!==authRevision||revision!==historyRevision)return false;
   if(error)throw error;
   rows.push(...data);
   if(data.length<500)break;
  }
  const truncated=rows.length===20000;
  const steps=rows.reduce((sum,r)=>sum+(Number(r.steps)||0),0);
  const miles=rows.reduce((sum,r)=>sum+(Number(r.distance_miles)||0),0);
  const weeks=new Set(rows.map(r=>r.week_number)).size;
  $('history-count').textContent=historyNumber(rows.length)+(truncated?'+':'');
  $('history-steps').textContent=historyNumber(steps)+(truncated?'+':'');
  $('history-miles').textContent=miles.toFixed(2)+(truncated?'+':'');
  $('history-weeks').textContent=String(weeks);
  const progress=$('week-progress');
  progress.replaceChildren();
  let qualifiedTotal=0;
  for(let i=0;i<12;i++){
   const required=10+brisk[i];
   const eligible=rows.filter(r=>Number(r.week_number)===i+1&&Number(r.duration_minutes)>=required-0.01);
   const count=eligible.length;
   qualifiedTotal+=Math.min(count,5);
   const card=document.createElement('article');
   card.className='week';
   const heading=document.createElement('strong');
   heading.textContent='W'+(i+1)+' · '+Math.min(count,5)+'/5';
   const bar=document.createElement('progress');
   bar.max=5;bar.value=Math.min(count,5);
   bar.setAttribute('aria-label','Week '+(i+1)+' qualifying walks');
   const note=document.createElement('p');
   note.textContent=count>=5?'Goal reached':count+' / 5';
   card.append(heading,bar,note);
   progress.append(card);
  }
  const completionPercent=Math.round(qualifiedTotal/60*100);
  $('journey-percent').textContent=completionPercent+'%';$('journey-ring').style.setProperty('--journey-progress',completionPercent+'%');$('journey-bar-fill').style.width=completionPercent+'%';
  $('journey-copy').textContent=rows.length?`Week ${Math.max(...rows.map(r=>Number(r.week_number)||0))} of 12 · ${rows.length} recorded walk${rows.length===1?'':'s'}`:'No saved walks yet.';
  $('journey-completed').textContent=`${qualifiedTotal} of 60 full-length walks`;
  renderHistoryChart(rows);
  list.replaceChildren();
  if(!rows.length){status.textContent='No saved walks yet. Complete a walk to start your history.';return true;}
  status.textContent=truncated?'Showing totals for the latest 20,000 walks.':'Your most recent saved walks:';
  for(const r of rows.slice(0,8)){
   const item=document.createElement('article');item.className='history-entry';
   const when=new Date(r.created_at);
   const today=new Date(),sameDay=Number.isFinite(when.getTime())&&when.toDateString()===today.toDateString();
   const day=Number.isFinite(when.getTime())?(sameDay?'Today':when.toLocaleDateString(undefined,{month:'short',day:'numeric'})):'Date unavailable';
   const main=document.createElement('div');main.className='entry-main';const check=document.createElement('span');check.className='entry-check';check.textContent='✓';
   const text=document.createElement('div');const title=document.createElement('strong');title.textContent=`${day} · Week ${r.week_number}`;
   const details=[];if(r.walk_mode)details.push(r.walk_mode==='treadmill'?'Treadmill':'Outdoor');if(r.fitness_level)details.push(r.fitness_level[0].toUpperCase()+r.fitness_level.slice(1));if(r.steps!==null)details.push(historyNumber(r.steps)+' steps'+(r.steps_source?' · '+(r.steps_source==='manual'?'entered':'health data'):''));if(r.distance_miles!==null)details.push(Number(r.distance_miles).toFixed(2)+' mi'+(r.distance_source==='outdoor_gps'?' GPS':r.distance_source==='treadmill_manual'?' actual':''));if(r.treadmill_speed_mph!==null&&r.treadmill_speed_mph!==undefined)details.push(r.treadmill_speed_mph+' mph actual');if(r.treadmill_incline_percent!==null&&r.treadmill_incline_percent!==undefined)details.push(r.treadmill_incline_percent+'% incline actual');const meta=document.createElement('small');meta.textContent=details.join(' · ')||'Completed walk';text.append(title,meta);main.append(check,text);
   const duration=document.createElement('span');duration.className='entry-time';duration.textContent=Number(r.duration_minutes).toFixed(0)+' min';item.append(main,duration);
   list.append(item);
  }
  return true;
 }catch(e){
  if(accountRevision!==authRevision||revision!==historyRevision)return false;status.textContent='Walking history unavailable: '+(e?.message||String(e));return false;
 }finally{if(revision===historyRevision)refresh.disabled=false;}
}
function renderHistoryChart(rows){
 const today=new Date(),days=[];today.setHours(0,0,0,0);
 for(let offset=6;offset>=0;offset--){const date=new Date(today);date.setDate(today.getDate()-offset);const minutes=rows.filter(row=>{const when=new Date(row.created_at);return Number.isFinite(when.getTime())&&when.toDateString()===date.toDateString();}).reduce((sum,row)=>sum+(Number(row.duration_minutes)||0),0);days.push({date,minutes});}
 const chart=$('history-chart'),empty=$('history-chart-empty'),maximum=Math.max(...days.map(day=>day.minutes),0),hasRecent=maximum>0;chart.replaceChildren();chart.hidden=!hasRecent;empty.hidden=hasRecent;empty.textContent='No completed walks in the last 7 days.';
 if(!hasRecent)return;
 for(const day of days){const column=document.createElement('div');column.className='chart-day'+(day.date.toDateString()===today.toDateString()?' today':'');column.title=`${day.date.toLocaleDateString()}: ${day.minutes} actual minutes`;
  const bar=document.createElement('span');bar.className='bar';bar.style.height=day.minutes?`${Math.max(6,Math.round(day.minutes/maximum*55))}px`:'2px';
  const label=document.createElement('small');label.textContent=day.date.toLocaleDateString(undefined,{weekday:'short'});column.append(bar,label);chart.append(column);
 }
}
function clearHistory(){for(const id of ['history-count','history-steps','history-miles','history-weeks'])$(id).textContent='—';$('history-list').replaceChildren();$('week-progress').replaceChildren();$('history-chart').replaceChildren();$('history-chart').hidden=true;$('history-chart-empty').hidden=false;$('history-chart-empty').textContent='Loading recent walk totals…';$('journey-percent').textContent='—';$('journey-ring').style.setProperty('--journey-progress','0%');$('journey-bar-fill').style.width='0%';$('journey-copy').textContent='Loading your member progress…';$('journey-completed').textContent='Loading…';}
function changeMember(user){const next=user?.id||null,reset=accountChangeState(owner,next,week);if(reset){authRevision++;historyRevision++;owner=reset.owner;stopTimer();saving=false;walkId=crypto.randomUUID();week=reset.week;elapsed=reset.elapsed;finished=reset.finished;saved=reset.saved;miles=reset.gpsMiles;events=new Set(reset.events);mode=reset.mode;treadmillLevel=reset.level;manualPhase=null;lastPosition=null;$('outdoor-mode').checked=true;$('treadmill-mode').checked=false;$('treadmill-level').value=reset.level;document.querySelectorAll('input[name="level-chip"]').forEach(input=>input.checked=input.value===reset.level);clearEnteredMetrics();$('gps').checked=false;clearHistory();render();}if(!next)$('history-status').textContent='Sign in to view your walking history.';}
db.auth.onAuthStateChange((_event,session)=>{changeMember(session?.user);setTimeout(()=>loadHistory(),0);});
$('history-refresh').onclick=loadHistory;
requireMember(db).then(user=>{changeMember(user);return loadHistory();}).catch(e=>{if(e.message==='Sign in to Soulanova first.'){window.location.replace('/app/?mode=signin&next=%2Fapp%2Fwalking%2F');return;}$('history-status').textContent='Walking history could not be loaded for your signed-in account: '+e.message;});
