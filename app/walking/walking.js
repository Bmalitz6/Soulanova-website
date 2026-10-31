import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const $=id=>document.getElementById(id),brisk=[5,7,9,11,13,15,18,20,23,26,28,30],db=createClient(window.SOULANOVA_SUPABASE.url,window.SOULANOVA_SUPABASE.publishableKey);
let week=0,elapsed=0,startedAt=0,timer=null,running=false,finished=false,watch=null,miles=0,lastPosition=null,events=new Set(),saved=false;
const cueFiles={start:'start.mp3',brisk:'brisk.mp3',half:'halfway.mp3',cool:'cooldown.mp3',done:'finish.mp3'};let activeCue=null;
const total=()=>600+brisk[week]*60;
const format=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
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
function announce(text,key){
 $('message').textContent=text;if(!$('voice').checked)return;
 if(activeCue){activeCue.pause();activeCue=null;}
 if('speechSynthesis' in window)speechSynthesis.cancel();
 if($('voice-choice').value!=='recorded'||!cueFiles[key]){fallbackSpeech(text);return;}
 const cue=new Audio('/app/walking/audio/'+cueFiles[key]);activeCue=cue;let recovered=false;
 const recover=()=>{if(recovered||activeCue!==cue)return;recovered=true;activeCue=null;fallbackSpeech(text)};
 cue.onerror=recover;cue.play().catch(recover);
}
function choose(n){if(running)return;week=n;elapsed=0;finished=false;saved=false;events.clear();miles=0;lastPosition=null;$('gps').checked=false;stopGPS();render();}
function render(){
 $('session-title').textContent='Week '+(week+1)+' · '+Math.round(total()/60)+' minutes';
 $('clock').textContent=format(Math.max(0,total()-elapsed));$('progress').style.width=(100*elapsed/total())+'%';
 const warm=elapsed<300,br=elapsed<300+brisk[week]*60;
 $('phase').textContent=finished?'Completed':!elapsed?'Ready to walk':warm?'Easy warm-up':br?'Brisk walking':'Slow cool-down';
 $('position').textContent='5 min warm-up · '+brisk[week]+' min brisk · 5 min cool-down';
 $('start').disabled=running||finished;$('pause').disabled=!running;$('pause').textContent='Pause';$('save').disabled=!finished||saved;$('save-help').textContent=saved?'Walk saved.':finished?'Workout finished. Save your steps and distance.':'Complete the walking timer before saving. '+format(total()-elapsed)+' remaining.';
 $('miles').textContent=miles>0?miles.toFixed(2):'—';$('steps-display').textContent=$('steps').value||'—';
 document.querySelectorAll('.week').forEach((el,i)=>{el.setAttribute('aria-current',String(i===week));el.querySelector('button').disabled=running;});
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
function startGPS(){if(!navigator.geolocation){$('message').textContent='GPS unavailable in this browser.';return;}if(watch!==null)return;watch=navigator.geolocation.watchPosition(pos=>{if(!running)return;const p=pos.coords;if(p.accuracy>60)return;const next={latitude:p.latitude,longitude:p.longitude};if(lastPosition){const delta=distance(lastPosition,next);if(delta<.12&&delta>.003)miles+=delta;}lastPosition=next;render()},e=>{ $('message').textContent='GPS not available: '+e.message;$('gps').checked=false;stopGPS()},{enableHighAccuracy:true,maximumAge:3000,timeout:12000});}
function stopGPS(){if(watch!==null){navigator.geolocation.clearWatch(watch);watch=null;}lastPosition=null}
function stopTimer(){if(timer!==null)clearInterval(timer);timer=null;running=false;stopGPS();if(activeCue){activeCue.pause();activeCue=null}}
function finish(){elapsed=total();finished=true;stopTimer();milestone('done','Workout complete! Excellent work. You have finished week '+(week+1)+'.');render();}
$('start').onclick=()=>{if(finished)return;running=true;startedAt=Date.now()-elapsed*1000;timer=setInterval(tick,500);if($('gps').checked)startGPS();if(!events.has('start'))milestone('start','Begin with five minutes of easy walking to warm up.');render()};
$('pause').onclick=()=>{tick();stopTimer();$('message').textContent='Workout paused.';render()};
$('reset').onclick=()=>{if(!confirm('Reset this walk?'))return;stopTimer();elapsed=0;miles=0;finished=false;saved=false;events.clear();render()};
$('gps').onchange=()=>{if($('gps').checked&&running)startGPS();else stopGPS()};
$('steps').oninput=render;
$('save').onclick=async()=>{if(!finished||saved)return;const btn=$('save');btn.disabled=true;try{
 const {data,error}=await db.auth.getUser();if(error)throw error;if(!data.user)throw Error('Sign in to Soulanova first.');
 const stepsRaw=$('steps').value.trim();const steps=stepsRaw===''?null:Number(stepsRaw);
 if(steps!==null&&(!Number.isInteger(steps)||steps<0||steps>150000))throw Error('Enter a valid steps count.');
 const entry={user_id:data.user.id,week_number:week+1,duration_minutes:total()/60,distance_miles:miles>0?Number(miles.toFixed(3)):null,steps,source:'web'};
 const {error:detailError}=await db.from('soulwalk_sessions').insert(entry);if(detailError)throw detailError;
 saved=true;render();loadHistory();$('message').textContent='SoulWalk completed! Distance and steps saved to your personal walking history. Workout-summary synchronization is coming next.';
 }catch(e){$('message').textContent='Could not save walk: '+e.message}finally{btn.disabled=saved}}
const box=$('weeks');brisk.forEach((mins,i)=>{const card=document.createElement('article');card.className='week';card.setAttribute('aria-current',String(i===week));const title=document.createElement('strong');title.textContent='Week '+(i+1)+' · '+(mins+10)+' min';const p=document.createElement('p');p.className='muted';p.textContent='5 min easy + '+mins+' min brisk + 5 min easy';const btn=document.createElement('button');btn.textContent='Choose week '+(i+1);btn.onclick=()=>choose(i);card.append(title,p,btn);box.append(card)});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&running)tick()});
render();

const historyNumber=n=>Number(n).toLocaleString();
async function loadHistory(){
 const status=$('history-status'),refresh=$('history-refresh'),list=$('history-list');
 refresh.disabled=true;status.textContent='Loading walking history…';
 try{
  const {data:auth,error:authError}=await db.auth.getUser();
  if(authError||!auth.user)throw Error('Sign in to Soulanova to view your personal walking history.');
  const rows=[];
  // Read all saved walks in bounded pages rather than silently showing incomplete totals.
  for(let start=0;start<20000;start+=500){
   const {data,error}=await db.from('soulwalk_sessions')
    .select('id,week_number,duration_minutes,distance_miles,steps,created_at')
    .eq('user_id',auth.user.id).order('created_at',{ascending:false})
    .range(start,start+499);
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
   const item=document.createElement('p');
   const when=new Date(r.created_at);
   const date=Number.isFinite(when.getTime())?when.toLocaleDateString():'Unknown date';
   const details=[date,'Week '+r.week_number,Number(r.duration_minutes).toFixed(1)+' min'];
   if(r.steps!==null)details.push(historyNumber(r.steps)+' steps');
   if(r.distance_miles!==null)details.push(Number(r.distance_miles).toFixed(2)+' mi');
   item.textContent=details.join(' · ');
   list.append(item);
  }
 }catch(e){
  status.textContent='Walking history unavailable: '+(e?.message||String(e));
 }finally{refresh.disabled=false;}
}
$('history-refresh').onclick=loadHistory;
loadHistory();
