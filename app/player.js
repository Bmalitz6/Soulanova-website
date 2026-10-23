'use strict';
// Soulanova guided Tai Chi: 15 movements x (30s instruction + 90s practice).
(()=>{
const moves=[
['Marching Step','Stand tall, shift your weight gently and coordinate your arms with each step.'],
['Opening Form','Stand comfortably, soften your knees and let your shoulders relax. Breathe slowly as you raise and lower your arms.'],
['Commencing Breath','Inhale as your arms float upward; exhale as they descend. Keep the movement smooth and easy.'],
['Parting the Wild Horse’s Mane','Shift your weight, step gently and open one arm forward while the other settles near your hip. Alternate sides.'],
['White Crane Spreads Wings','Shift into a comfortable stance. Lift one hand above shoulder height and lower the other, then settle.'],
['Brush Knee and Push','Step softly, brush one hand past the knee and extend the other forward without locking your elbow.'],
['Play the Lute','Shift your weight back and bring your hands into a relaxed, rounded position in front of your body.'],
['Repulse Monkey','Step backward carefully while one hand pushes gently forward and the other draws back.'],
['Grasp the Sparrow’s Tail','Practice a slow sequence of ward-off, roll-back, press and push with relaxed shoulders.'],
['Single Whip','Open your stance, turn gently and extend one arm while the other hand stays soft.'],
['Cloud Hands','Shift from side to side while your hands circle smoothly across the body at different heights.'],
['High Pat on Horse','Transfer your weight slowly and extend one palm forward with control.'],
['Golden Rooster Stands on One Leg','Lift one knee only as high as comfortable. Use a chair or wall for balance if needed.'],
['Heel Kick','Raise your knee and extend the heel gently. Keep the kick low or simply practice the weight shift.'],
['Closing Form','Return to a comfortable stance, lower your arms slowly, and finish with a respectful closing bow.']
];
const el = id => document.getElementById(id);
// No third-party exercise footage is used. Unreleased movements display the Coming Soon placeholder.
const videoSources={
  'Marching Step': '/app/videos/Soulanova_TaiChi_001_Marching_Step.mp4'
};
const video=el('player-video'), videoPlaceholder=el('player-video-placeholder');
const benjamin=new Audio('/app/tai-chi-audio/Marching_Step_Benjamin.mp3');
const piano=new Audio('/app/tai-chi-audio/Soulanova_Soft_Piano.mp3');
benjamin.preload='auto';
piano.preload='auto';
piano.loop=true;
benjamin.volume=.85;
piano.volume=.25;
let pianoEnabled=true;

function playAudio(){
  if(pianoEnabled)piano.play().catch(()=>{});
  if(moves[Math.min(14,Math.floor(elapsed/120))][0]==='Marching Step'){
    benjamin.play().catch(()=>{});
  }
}
function pauseAudio(){
  benjamin.pause();
  piano.pause();
}
function syncNarration(){
  const index=Math.min(14,Math.floor(elapsed/120));
  const isMarching=moves[index][0]==='Marching Step';
  if(!isMarching){
    benjamin.pause();
    benjamin.currentTime=0;
    return;
  }
  const position=elapsed%120;
  if(Math.abs(benjamin.currentTime-position)>.75)
    benjamin.currentTime=position;
  if(running&&benjamin.paused)benjamin.play().catch(()=>{});
}

let shownMove='';
function syncVideo(name){if(shownMove===name)return;shownMove=name;video.pause();const src=videoSources[name];if(src){video.src=src;video.hidden=false;videoPlaceholder.hidden=true;video.load();video.currentTime=0;if(running)video.play().catch(()=>{});}else{video.removeAttribute('src');video.load();video.hidden=true;videoPlaceholder.hidden=false;}}
const total=1800,block=120,teach=30;
let elapsed=0,activeSeconds=0,running=false,finished=false,last=0,timer=null,saving=false;
const fmt=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
function draw(){const index=Math.min(14,Math.floor(elapsed/block)),inside=elapsed-index*block,practice=inside>=teach;el('player-move').textContent=moves[index][0];syncVideo(moves[index][0]);el('player-cue').textContent=moves[index][1];el('player-phase').textContent=finished?'Session complete':practice?'Practice · move mindfully':'Instruction · prepare';el('player-clock').textContent=fmt(finished?0:(practice?block-inside:teach-inside));el('player-position').textContent=`Movement ${index+1} of 15 · ${fmt(elapsed)} / 30:00`;el('player-fill').style.width=`${elapsed/total*100}%`;el('player-progress').setAttribute('aria-valuenow',String(elapsed));el('player-toggle').textContent=finished?'Session finished':running?'Pause':'Start / Resume';el('player-toggle').disabled=finished;el('player-next').disabled=finished;el('player-prev').disabled=finished;}
function stop(){video.pause();pauseAudio();running=false;if(timer){clearInterval(timer);timer=null}draw()}
async function finish(){stop();finished=true;draw();if(saving)return;saving=true;if(activeSeconds<total){el('player-status').textContent='You reached the end of the sequence. Complete 30 minutes of active practice to save a full session.';return}el('player-status').textContent='30 minutes completed. Saving to your account…';try{await addWorkout(workouts.find(w=>w.id==='tai'));el('player-status').textContent='Workout complete! Your 30-minute Tai Chi session is saved to your account.'}catch(err){el('player-status').textContent='Workout finished, but saving failed: '+err.message+'. Please try again.';const retry=document.createElement('button');retry.className='quiet';retry.textContent='Retry saving';retry.addEventListener('click',()=>{retry.remove();saving=false;finish()});el('player-status').after(retry)}}
function tick(){if(!running)return;const now=performance.now(),delta=Math.max(0,now-last);last=now;const whole=Math.floor(delta/1000);elapsed=Math.min(total,elapsed+whole);activeSeconds+=whole; // retain sub-second remainder
last-=delta%1000;if(elapsed>=total){finish();return}syncNarration();draw()}
function start(){if(finished)return;running=true;syncNarration();video.play().catch(()=>{});playAudio();last=performance.now();timer=setInterval(tick,200);draw()}
function seek(direction){if(finished)return;stop();const current=Math.floor(elapsed/block);elapsed=Math.min(total-1,Math.max(0,(current+direction)*block));el('player-status').textContent='Paused. Navigation does not count skipped time as a completed workout.';syncNarration();draw()}
el('tai-ben-volume').addEventListener('input',e=>{
  benjamin.volume=Number(e.target.value)/100;
  el('tai-ben-label').textContent=e.target.value+'%';
});
el('tai-piano-volume').addEventListener('input',e=>{
  piano.volume=Number(e.target.value)/100;
  el('tai-piano-label').textContent=e.target.value+'%';
});
el('tai-piano-toggle').addEventListener('click',()=>{
  pianoEnabled=!pianoEnabled;
  el('tai-piano-toggle').textContent=pianoEnabled?'Piano: On':'Piano: Off';
  el('tai-piano-toggle').setAttribute('aria-pressed',String(pianoEnabled));
  if(!pianoEnabled)piano.pause();
  else if(running)piano.play().catch(()=>{});
});
el('player-toggle').addEventListener('click',()=>running?stop():start());el('player-prev').addEventListener('click',()=>seek(-1));el('player-next').addEventListener('click',()=>seek(1));el('player-close').addEventListener('click',()=>{stop();el('tai-player').hidden=true;if(window.SoulanovaClasses)window.SoulanovaClasses.open()});el('player-restart').addEventListener('click',()=>{if(running)stop();if(elapsed>0&&!confirm('Restart your Tai Chi session from the beginning?'))return;elapsed=0;activeSeconds=0;finished=false;saving=false;el('player-status').textContent='Complete the full 30-minute timer to save your workout.';draw()});
window.SoulanovaPlayer={open(){el('tai-player').hidden=false;draw();el('tai-player').scrollIntoView({behavior:'smooth',block:'start'})}};
const library=el('tai-library'), detail=el('class-detail'), workoutsPanel=el('workouts'), player=el('tai-player');
const list=el('class-movements');moves.forEach((move,i)=>{const li=document.createElement('li');li.textContent=`${i+1}. ${move[0]}`;list.append(li)});
function showLibrary(preview=false){stop();player.hidden=true;library.hidden=false;detail.hidden=!preview;document.querySelector('.sectionhead').hidden=true;el('workout-list').hidden=true;el('selected-workout').hidden=true;library.scrollIntoView({block:'start'});}
function leaveLibrary(){stop();player.hidden=true;library.hidden=true;detail.hidden=true;document.querySelector('.sectionhead').hidden=false;el('workout-list').hidden=false;el('selected-workout').hidden=false;workoutsPanel.scrollIntoView({block:'start'});}
function launch(){library.hidden=true;detail.hidden=true;window.SoulanovaPlayer.open()}
el('marching-step-open').addEventListener('click',()=>{leaveLibrary();const tab=document.querySelector('[data-tab="free-library"]');if(tab)tab.click();document.querySelector('.free-video')?.scrollIntoView({behavior:'smooth',block:'center'});});
el('library-back').addEventListener('click',leaveLibrary);el('detail-back').addEventListener('click',()=>showLibrary(false));el('class-preview').addEventListener('click',()=>showLibrary(true));el('class-start').addEventListener('click',launch);el('detail-start').addEventListener('click',launch);
window.SoulanovaClasses={open:()=>showLibrary(false),close:leaveLibrary};

// Pause when tab/app is backgrounded so inactive time is not logged.
document.addEventListener('visibilitychange',()=>{if(document.hidden&&running){stop();el('player-status').textContent='Paused while the app was in the background. Tap Resume when ready.'}});
draw();
})();
