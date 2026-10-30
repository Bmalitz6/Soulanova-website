import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const $=id=>document.getElementById(id),brisk=[5,7,9,11,13,15,18,20,23,26,28,30],db=createClient(window.SOULANOVA_SUPABASE.url,window.SOULANOVA_SUPABASE.publishableKey);
let week=0,elapsed=0,startedAt=0,timer=null,running=false,finished=false,watch=null,miles=0,lastPosition=null,events=new Set(),saved=false;
const total=()=>600+brisk[week]*60;
const format=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
function announce(text){$('message').textContent=text;if($('voice').checked&&'speechSynthesis' in window){try{speechSynthesis.cancel();const utter=new SpeechSynthesisUtterance(text);utter.rate=.88;utter.lang='en-US';speechSynthesis.speak(utter)}catch(e){}}}
function choose(n){if(running)return;week=n;elapsed=0;finished=false;saved=false;events.clear();miles=0;lastPosition=null;$('gps').checked=false;stopGPS();render();}
function render(){
 $('session-title').textContent='Week '+(week+1)+' · '+Math.round(total()/60)+' minutes';
 $('clock').textContent=format(Math.max(0,total()-elapsed));$('progress').style.width=(100*elapsed/total())+'%';
 const warm=elapsed<300,br=elapsed<300+brisk[week]*60;
 $('phase').textContent=finished?'Completed':!elapsed?'Ready to walk':warm?'Easy warm-up':br?'Brisk walking':'Slow cool-down';
 $('position').textContent='5 min warm-up · '+brisk[week]+' min brisk · 5 min cool-down';
 $('start').disabled=running||finished;$('pause').disabled=!running;$('pause').textContent='Pause';$('save').disabled=!finished||saved;
 $('miles').textContent=miles>0?miles.toFixed(2):'—';$('steps-display').textContent=$('steps').value||'—';
 document.querySelectorAll('.week').forEach((el,i)=>{el.setAttribute('aria-current',String(i===week));el.querySelector('button').disabled=running;});
}
function milestone(key,text){if(events.has(key))return;events.add(key);announce(text)}
function tick(){if(!running)return;elapsed=Math.min(total(),Math.floor((Date.now()-startedAt)/1000));
 if(elapsed>=Math.ceil(total()/2))milestone('half','You are halfway through your walk. Keep going at a comfortable pace.');
 if(elapsed>=300)milestone('brisk','Warm-up complete. Gradually increase to a brisk pace. You should still be able to talk.');
 if(elapsed>=total()-300)milestone('cool','Five minutes remaining. Slow your pace for your cool-down.');
 if(elapsed===total()){finish();return}render();}
function distance(a,b){const rad=Math.PI/180,dlat=(b.latitude-a.latitude)*rad,dlon=(b.longitude-a.longitude)*rad,x=Math.sin(dlat/2)**2+Math.cos(a.latitude*rad)*Math.cos(b.latitude*rad)*Math.sin(dlon/2)**2;return 3958.7613*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}
function startGPS(){if(!navigator.geolocation){$('message').textContent='GPS unavailable in this browser.';return;}if(watch!==null)return;watch=navigator.geolocation.watchPosition(pos=>{if(!running)return;const p=pos.coords;if(p.accuracy>60)return;const next={latitude:p.latitude,longitude:p.longitude};if(lastPosition){const delta=distance(lastPosition,next);if(delta<.12&&delta>.003)miles+=delta;}lastPosition=next;render()},e=>{ $('message').textContent='GPS not available: '+e.message;$('gps').checked=false;stopGPS()},{enableHighAccuracy:true,maximumAge:3000,timeout:12000});}
function stopGPS(){if(watch!==null){navigator.geolocation.clearWatch(watch);watch=null;}lastPosition=null}
function stopTimer(){if(timer!==null)clearInterval(timer);timer=null;running=false;stopGPS();}
function finish(){elapsed=total();finished=true;stopTimer();milestone('done','Workout complete! Excellent work. You have finished week '+(week+1)+'.');render();}
$('start').onclick=()=>{if(finished)return;running=true;startedAt=Date.now()-elapsed*1000;timer=setInterval(tick,500);if($('gps').checked)startGPS();if(!events.has('start'))milestone('start','Begin with five minutes of easy walking to warm up.');render()};
$('pause').onclick=()=>{tick();stopTimer();milestone('paused','Workout paused.');render()};
$('reset').onclick=()=>{if(!confirm('Reset this walk?'))return;stopTimer();elapsed=0;miles=0;finished=false;saved=false;events.clear();render()};
$('gps').onchange=()=>{if($('gps').checked&&running)startGPS();else stopGPS()};
$('steps').oninput=render;
$('save').onclick=async()=>{if(!finished||saved)return;try{const {data,error}=await db.auth.getUser();if(error)throw error;if(!data.user)throw Error('Sign in to Soulanova first.');const {error:writeError}=await db.from('workout_sessions').insert({user_id:data.user.id,workout_name:'SoulWalk — Week '+(week+1),category:'Low-Impact Cardio',duration_minutes:total()/60});if(writeError)throw writeError;saved=true;render();$('message').textContent='Walk saved to your Soulanova workout history. Mileage and steps are displayed locally in this preview; they are not yet stored in workout history.';}catch(e){$('message').textContent='Could not save walk: '+e.message}};
const box=$('weeks');brisk.forEach((mins,i)=>{const card=document.createElement('article');card.className='week';card.setAttribute('aria-current',String(i===week));const title=document.createElement('strong');title.textContent='Week '+(i+1)+' · '+(mins+10)+' min';const p=document.createElement('p');p.className='muted';p.textContent='5 min easy + '+mins+' min brisk + 5 min easy';const btn=document.createElement('button');btn.textContent='Choose week '+(i+1);btn.onclick=()=>choose(i);card.append(title,p,btn);box.append(card)});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&running)tick()});
render();
