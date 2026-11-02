import {bounded,requireMember,insertOnce} from '/app/member-data.mjs';
import {briskMinutes as brisk,treadmillLevels,phaseAt,accountChangeState} from '/app/walking/training.mjs';
import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const $=id=>document.getElementById(id),db=createClient(window.SOULANOVA_SUPABASE.url,window.SOULANOVA_SUPABASE.publishableKey,{auth:{flowType:'pkce',detectSessionInUrl:true,autoRefreshToken:true,persistSession:true}});
let saving=false,walkId=crypto.randomUUID(),owner=null,authRevision=0,historyRevision=0;
let week=0,elapsed=0,startedAt=0,timer=null,running=false,finished=false,watch=null,miles=0,lastPosition=null,events=new Set(),saved=false,mode='outdoor',treadmillLevel='beginner',manualPhase=null;
const accountWritesEnabled=false;
const cueFiles={start:'start.mp3',brisk:'brisk.mp3',half:'halfway.mp3',cool:'cooldown.mp3',done:'finish.mp3'};let activeCue=null;
const total=()=>600+brisk[week]*60;
const format=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
const phaseNames={warmup:'Warm-up',steady:'Steady walk',brisk:'Brisk walk',cooldown:'Cool-down'};
const valueOf=id=>$(id).value.trim()===''?null:Number($(id).value);
function formatRange(range){return range[0]===range[1]?String(range[0]):`${range[0]}–${range[1]}`;}
function recommendation(level,phase){const item=treadmillLevels[level]?.phases[phase];return item?`${formatRange(item.speed)} mph · ${formatRange(item.incline)}% incline`:'—';}
function clearEnteredMetrics(){for(const id of ['steps','treadmill-distance','treadmill-speed','treadmill-incline','manual-speed','manual-incline'])$(id).value='';}
function renderGuidance(){
 $('treadmill-options').hidden=mode!=='treadmill';$('gps-control').hidden=mode!=='outdoor';
 $('gps').disabled=mode!=='outdoor'||saving;if(mode!=='outdoor')$('gps').checked=false;
 const status=phaseAt(week,elapsed),current=status.current,next=status.next;
 if(current){$('current-phase-name').textContent=phaseNames[current];$('current-recommendation').textContent=recommendation(treadmillLevel,current);}
 else{$('current-phase-name').textContent='Completed';$('current-recommendation').textContent='—';}
 $('next-phase-name').textContent=next?phaseNames[next]:'No next phase';$('next-recommendation').textContent=next?recommendation(treadmillLevel,next):'—';
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
function refreshVoices(){
 const select=$('voice-choice'),prior=select.value,voices=availableVoices();
 select.replaceChildren(new Option('Serene · Recorded female coach','recorded'),new Option('Device voice (fallback)','auto'));
 if(!prior)select.value='recorded';
 voices.forEach(v=>select.add(new Option(v.name+' · '+v.lang,v.voiceURI)));
 if([...select.options].some(o=>o.value===prior))select.value=prior;
}
if('speechSynthesis' in window){refreshVoices();speechSynthesis.addEventListener?.('voiceschanged',refreshVoices);}
function preferredVoice(){
 const voices=availableVoices(),selected=$('voice-choice').value;
 if(selected!=='auto')return voices.find(v=>v.voiceURI===selected)||null;
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
 if($('voice-choice').value!=='recorded'||!cueFiles[key]){fallbackSpeech(text);return;}
 const cue=new Audio('/app/walking/audio/'+cueFiles[key]);activeCue=cue;let recovered=false;
 const recover=()=>{if(recovered||activeCue!==cue)return;recovered=true;activeCue=null;fallbackSpeech(text)};
 cue.onerror=recover;cue.play().catch(recover);
}
function choose(n){if(running||saving)return;stopNarration();walkId=crypto.randomUUID();week=n;elapsed=0;finished=false;saved=false;events.clear();miles=0;lastPosition=null;manualPhase=null;$('gps').checked=false;clearEnteredMetrics();stopGPS();render();}
function render(){
 const duration=Math.round(total()/60);
 $('session-title').textContent='Week '+(week+1)+' · '+duration+' minutes';
 $('timer-week-title').textContent='Week '+(week+1)+' walk';$('week-duration').textContent=duration+' MINUTES';
 $('clock').textContent=format(Math.max(0,total()-elapsed));$('progress').style.width=(100*elapsed/total())+'%';
 $('progress').parentElement.setAttribute('aria-valuenow',String(Math.round(100*elapsed/total())));
 const current=phaseAt(week,elapsed).current;
 if(mode==='treadmill'&&current&&manualPhase&&current!==manualPhase){$('manual-speed').value='';$('manual-incline').value='';}
 if(mode==='treadmill'&&current)manualPhase=current;
 $('phase').textContent=finished?'Completed':!elapsed?'Ready to walk':phaseNames[current]||'Completed';
 $('position').textContent='5 min warm-up · '+brisk[week]+' min brisk · 5 min cool-down';
 const locked=running||elapsed>0||finished||saving;
 $('outdoor-mode').disabled=locked;$('treadmill-mode').disabled=locked;$('mode-lock-note').hidden=!locked;
 $('start').disabled=running||finished||saving;$('start').textContent=running?'Walking…':finished?'Walk complete':elapsed?'Resume walk':'Start walk';$('pause').disabled=!running;$('pause').textContent='Pause';$('reset').disabled=saving;$('save').disabled=!accountWritesEnabled||!finished||saved||saving||!owner;$('save').textContent=saving?'Saving…':'Save completed walk';$('save').setAttribute('aria-busy',String(saving));$('save-help').textContent=accountWritesEnabled?(saved?'Walk saved.':finished?'Workout finished. Save your steps and distance.':'Complete the walking timer before saving. '+format(total()-elapsed)+' remaining.'):'Account saving is paused while Supabase validation is pending. Your current entries remain in this browser session.';
 renderMilestones();
 renderGuidance();renderActuals();
 document.querySelectorAll('#weeks .week').forEach((el,i)=>{el.setAttribute('aria-current',String(i===week));el.querySelector('button').disabled=running||saving;});
}
function renderMilestones(){
 const marks={start:elapsed>0||finished,brisk:elapsed>=300,half:elapsed>=Math.ceil(total()/2),cool:elapsed>=total()-300,done:finished};
 document.querySelectorAll('#milestone-track [data-milestone]').forEach(el=>el.classList.toggle('done',Boolean(marks[el.dataset.milestone])));
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
function startGPS(){if(mode!=='outdoor')return;if(!navigator.geolocation){$('message').textContent='GPS unavailable in this browser.';return;}if(watch!==null)return;watch=navigator.geolocation.watchPosition(pos=>{if(!running||mode!=='outdoor')return;const p=pos.coords;if(p.accuracy>60)return;const next={latitude:p.latitude,longitude:p.longitude};if(lastPosition){const delta=distance(lastPosition,next);if(delta<.12&&delta>.003)miles+=delta;}lastPosition=next;render()},e=>{ $('message').textContent='GPS not available: '+e.message;$('gps').checked=false;stopGPS()},{enableHighAccuracy:true,maximumAge:3000,timeout:12000});}
function stopGPS(){if(watch!==null){navigator.geolocation.clearWatch(watch);watch=null;}lastPosition=null}
function stopTimer(){if(timer!==null)clearInterval(timer);timer=null;running=false;stopGPS();stopNarration()}
function finish(){elapsed=total();finished=true;stopTimer();milestone('done','Workout complete! Excellent work. You have finished week '+(week+1)+'.');render();}
$('start').onclick=()=>{if(finished)return;running=true;startedAt=Date.now()-elapsed*1000;timer=setInterval(tick,500);if(mode==='outdoor'&&$('gps').checked)startGPS();if(!events.has('start'))milestone('start','Begin with five minutes of easy walking to warm up.');render()};
$('pause').onclick=()=>{tick();stopTimer();$('message').textContent='Workout paused.';render()};
$('reset').onclick=()=>{if(saving)return;if(!confirm('Reset this walk?'))return;stopTimer();walkId=crypto.randomUUID();elapsed=0;miles=0;finished=false;saved=false;events.clear();manualPhase=null;clearEnteredMetrics();render()};
$('gps').onchange=()=>{if($('gps').checked&&running)startGPS();else stopGPS()};
$('outdoor-mode').onchange=()=>{if(!$('outdoor-mode').checked)return;if(running||elapsed||finished||saving){render();return;}mode='outdoor';manualPhase=null;stopGPS();miles=0;lastPosition=null;$('gps').checked=false;clearEnteredMetrics();render()};
$('treadmill-mode').onchange=()=>{if(!$('treadmill-mode').checked)return;if(running||elapsed||finished||saving){render();return;}mode='treadmill';manualPhase=null;treadmillLevel=$('treadmill-level').value;stopGPS();miles=0;lastPosition=null;$('gps').checked=false;clearEnteredMetrics();render()};
$('treadmill-level').onchange=()=>{treadmillLevel=$('treadmill-level').value;renderGuidance();};
$('voice').addEventListener('change',()=>{if(!$('voice').checked)stopNarration();});
$('steps').oninput=render;$('treadmill-distance').oninput=render;$('treadmill-speed').oninput=render;$('treadmill-incline').oninput=render;
$('manual-speed').oninput=render;$('manual-incline').oninput=render;
$('save').onclick=async()=>{if(!accountWritesEnabled){$('message').textContent='Saving is disabled while account validation is pending. Your readings remain on this screen.';return;}if(!finished||saved||saving)return;const revision=authRevision;const expected=owner;saving=true;render();
 try{const user=await requireMember(db,expected);if(revision!==authRevision)throw Error('Your account changed. Refresh before saving.');
 const stepsRaw=$('steps').value.trim(),steps=stepsRaw===''?null:Number(stepsRaw);
 if(steps!==null&&(!Number.isInteger(steps)||steps<0||steps>150000))throw Error('Enter a valid steps count.');
 const actualDistance=mode==='treadmill'?valueOf('treadmill-distance'):null;
 if(mode==='treadmill'&&actualDistance!==null&&(!Number.isFinite(actualDistance)||actualDistance<0||actualDistance>100))throw Error('Enter a valid treadmill distance.');
 const entry={id:walkId,user_id:user.id,week_number:week+1,duration_minutes:total()/60,distance_miles:mode==='treadmill'?(actualDistance===null?null:Number(actualDistance.toFixed(3))):(miles>0?Number(miles.toFixed(3)):null),steps,source:'web'};
 await insertOnce(db,'soulwalk','soulwalk_sessions',entry);if(revision!==authRevision)return;
 saved=true;$('message').textContent='Walk saved to your account. Refreshing history…';await loadHistory();if(revision===authRevision)$('message').textContent='Walk saved. See your personal walking history below.';
 }catch(e){if(revision===authRevision)$('message').textContent='Could not save walk: '+e.message;}finally{saving=false;render();}};
const box=$('weeks');brisk.forEach((mins,i)=>{const card=document.createElement('article');card.className='week';card.setAttribute('aria-current',String(i===week));const btn=document.createElement('button');btn.type='button';btn.textContent=String(i+1);btn.setAttribute('aria-label','Choose week '+(i+1)+', '+(mins+10)+' minutes');btn.title='Week '+(i+1)+' · '+(mins+10)+' minutes';btn.onclick=()=>choose(i);card.append(btn);box.append(card)});
document.querySelectorAll('input[name="level-chip"]').forEach(input=>input.addEventListener('change',()=>{if(!input.checked)return;$('treadmill-level').value=input.value;$('treadmill-level').dispatchEvent(new Event('change'));}));
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&running)tick()});
render();

const historyNumber=n=>Number(n).toLocaleString();
async function loadHistory(){
 const revision=++historyRevision,accountRevision=authRevision;const status=$('history-status'),refresh=$('history-refresh'),list=$('history-list');clearHistory();
 refresh.disabled=true;status.textContent='Loading walking history…';
 try{
  const member=await requireMember(db,owner);if(accountRevision!==authRevision||revision!==historyRevision)return;
  const rows=[];
  // Read all saved walks in bounded pages rather than silently showing incomplete totals.
  for(let start=0;start<20000;start+=500){
   const {data,error}=await bounded(signal=>db.from('soulwalk_sessions')
    .select('id,week_number,duration_minutes,distance_miles,steps,created_at')
    .eq('user_id',member.id).order('created_at',{ascending:false})
    .range(start,start+499).abortSignal(signal));
   if(accountRevision!==authRevision||revision!==historyRevision)return;
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
  for(let i=0;i<12;i++){
   const required=10+brisk[i];
   const eligible=rows.filter(r=>Number(r.week_number)===i+1&&Number(r.duration_minutes)>=required-0.01);
   const count=eligible.length;
   const card=document.createElement('article');
   card.className='week';
   const heading=document.createElement('strong');
   heading.textContent='Week '+(i+1)+' · '+Math.min(count,5)+'/5 walks';
   const bar=document.createElement('progress');
   bar.max=5;bar.value=Math.min(count,5);
   bar.style.width='100%';
   bar.setAttribute('aria-label','Week '+(i+1)+' qualifying walks');
   const note=document.createElement('p');
   note.className='muted';
   note.textContent=count>=5?'Goal reached':count+' full-length '+required+'-minute '+(count===1?'walk':'walks')+' saved';
   card.append(heading,bar,note);
   progress.append(card);
  }
  list.replaceChildren();
  if(!rows.length){status.textContent='No saved walks yet. Complete a walk to start your history.';return;}
  status.textContent=truncated?'Showing totals for the latest 20,000 walks.':'Your most recent saved walks:';
  for(const r of rows.slice(0,10)){
   const item=document.createElement('article');item.className='history-entry';
   const when=new Date(r.created_at);
   const date=Number.isFinite(when.getTime())?when.toLocaleDateString():'Unknown date';
   const details=[date,'Week '+r.week_number,Number(r.duration_minutes).toFixed(1)+' min'];
   if(r.steps!==null)details.push(historyNumber(r.steps)+' steps');
   if(r.distance_miles!==null)details.push(Number(r.distance_miles).toFixed(2)+' mi');
   const title=document.createElement('strong');title.textContent='Week '+r.week_number+' walk';const meta=document.createElement('span');meta.textContent=details.join(' · ');item.append(title,meta);
   list.append(item);
  }
 }catch(e){
  if(accountRevision!==authRevision||revision!==historyRevision)return;status.textContent='Walking history unavailable: '+(e?.message||String(e));
 }finally{if(revision===historyRevision)refresh.disabled=false;}
}
function clearHistory(){for(const id of ['history-count','history-steps','history-miles','history-weeks'])$(id).textContent='—';$('history-list').replaceChildren();$('week-progress').replaceChildren();}
function changeMember(user){const next=user?.id||null,reset=accountChangeState(owner,next,week);if(reset){authRevision++;historyRevision++;owner=reset.owner;stopTimer();walkId=crypto.randomUUID();week=reset.week;elapsed=reset.elapsed;finished=reset.finished;saved=reset.saved;miles=reset.gpsMiles;events=new Set(reset.events);mode=reset.mode;treadmillLevel=reset.level;manualPhase=null;lastPosition=null;$('outdoor-mode').checked=true;$('treadmill-mode').checked=false;$('treadmill-level').value=reset.level;document.querySelectorAll('input[name="level-chip"]').forEach(input=>input.checked=input.value===reset.level);clearEnteredMetrics();$('gps').checked=false;clearHistory();render();}if(!next)$('history-status').textContent='Sign in to view your walking history.';}
db.auth.onAuthStateChange((_event,session)=>{changeMember(session?.user);setTimeout(()=>loadHistory(),0);});
$('history-refresh').onclick=loadHistory;
requireMember(db).then(user=>{changeMember(user);return loadHistory();}).catch(e=>{$('history-status').textContent=e.message;});
