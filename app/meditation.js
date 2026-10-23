'use strict';
(()=>{
const sessions=[{"id":"short1","track":1,"title":"Calm Breathing","subtitle":"Follow the Breath","minutes":10,"cues":["Let each breath arrive naturally","Notice the gentle rise and fall of your breathing","If the mind wanders, quietly return to the next breath","Relax your jaw and let the shoulders soften","There is nothing you need to solve right now","Notice the space between one breath and the next","Let yourself rest in this moment","Take one gentle breath and bring awareness back to the room"]},{"id":"short2","track":1,"title":"Morning Grounding","subtitle":"Start with Stillness","minutes":10,"cues":["Feel the support beneath your feet or seat","Allow the day to begin without rushing","Notice the sounds around you, near and far","Let your body settle into a comfortable position","Choose one simple intention for the day","Imagine moving through your morning with steadiness","Release the need to plan every detail","Bring your attention gently back to the room"]},{"id":"short3","track":1,"title":"Stress Release","subtitle":"Unclench and Unwind","minutes":10,"cues":["Notice where your body is holding tension","Soften your forehead and loosen your jaw","Let your shoulders drop a little","Uncurl your fingers and relax your hands","Allow the breath to be easy and unforced","You do not have to change every thought","Feel the weight of your body being supported","Return slowly with a little more space"]},{"id":"short4","track":1,"title":"Gratitude Pause","subtitle":"Notice What Is Good","minutes":10,"cues":["Bring to mind one small thing you appreciate","Notice how it feels to remember it","There is no need for a perfect day","Think of a person who has offered kindness","Allow a quiet sense of thanks to grow","Offer that kindness toward yourself as well","Rest with this appreciation for a few breaths","Open your attention to the present"]},{"id":"short5","track":1,"title":"Body Scan","subtitle":"Relax from Head to Toe","minutes":10,"cues":["Bring your attention to your forehead","Soften around the eyes and mouth","Notice the neck and shoulders","Feel your arms resting comfortably","Let your attention move through chest and belly","Notice your hips, legs and feet","Allow the whole body to rest without effort","Wiggle your fingers and return gently"]},{"id":"short6","track":1,"title":"Mindful Focus","subtitle":"One Thing at a Time","minutes":10,"cues":["Notice the next breath, just as it is","Choose a simple point of focus","When thoughts pull you away, notice without judgment","Return to that one point of attention","There is no need to force concentration","Each return is an opportunity to begin again","Let your awareness grow calm and steady","Bring this gentleness to your next task"]},{"id":"short7","track":1,"title":"Evening Unwind","subtitle":"Let the Day Settle","minutes":10,"cues":["Feel the bed or chair supporting you","Allow the events of the day to move into the background","Soften your hands and relax your shoulders","Let your breathing settle into its own rhythm","You can set aside unfinished tasks for now","Notice how your body feels at rest","Allow quiet moments without needing to fill them","Return slowly, or stay resting if you're ready"]},{"id":"long1","track":2,"title":"Deep Relaxation","subtitle":"Spacious Body Scan","minutes":20,"cues":["Feel the weight of your body where it rests","Notice the forehead and soften the muscles around your eyes","Let the jaw unclench and the tongue relax","Allow the neck and shoulders to settle","Move your awareness down through each arm and hand","Feel the breath moving gently in your chest","Notice your belly without trying to change it","Release tension around the hips","Let both legs grow heavy and supported","Notice your feet and toes","Sense the whole body resting together","Remain here for a while without effort","Bring awareness back slowly and kindly"]},{"id":"long2","track":2,"title":"Restful Sleep","subtitle":"A Gentle Path to Rest","minutes":20,"cues":["Choose a restful position and let your eyes close if comfortable","Feel the support beneath you","Let the day fade into the background","Observe a quiet breath without changing it","Relax the muscles around your face","Allow your shoulders and hands to become still","Imagine setting the day's tasks on a shelf","Notice thoughts passing without following them","Rest your awareness on the soft rhythm of breathing","Allow long spaces of quiet","If wakefulness remains, that is all right","Let each exhale be an invitation to soften","Stay resting as long as you wish"]},{"id":"long3","track":2,"title":"Inner Confidence","subtitle":"Steady and Capable","minutes":20,"cues":["Find a comfortable upright position","Feel both feet or your seat securely supported","Recall one moment when you handled something difficult","Notice the strength it took to be present","Allow the shoulders to soften while your spine stays easy","Confidence does not require certainty","Imagine taking one small step with steadiness","Notice the breath supporting this calm attention","Let unhelpful comparisons pass by","Return to the feeling of being grounded","You can begin again whenever you need to","Rest with a sense of quiet capability","Carry one small intention into your day"]},{"id":"long4","track":2,"title":"Mindful Nature","subtitle":"A Peaceful Walk","minutes":20,"cues":["Picture a path through a peaceful natural setting","Notice the imagined ground beneath your feet","Hear the soft sounds of air moving among leaves","Imagine sunlight gently warming the path","Observe the colors around you","Let your steps become slow and unhurried","Pause beside a tree and notice its steadiness","Feel a light breeze against your skin","Imagine a quiet stream flowing nearby","Allow your thoughts to move like water","Rest in the calm of this landscape","Begin to notice your actual surroundings again","Carry a little of this spaciousness with you"]},{"id":"long5","track":2,"title":"Letting Go","subtitle":"Release What You Can","minutes":20,"cues":["Take a moment to feel supported","Notice a thought you have been carrying","You do not need to push it away","Allow it to be present without holding it tightly","With each breath, make a little more room","Soften the muscles in your hands","Imagine setting down a heavy bag","You may return to important things later","Notice the quiet beneath your thoughts","Let unnecessary effort ease","Rest in the space you have created","Offer yourself patience","Come back gently to the present"]},{"id":"long6","track":2,"title":"Emotional Balance","subtitle":"Room for Every Feeling","minutes":20,"cues":["Notice how you're feeling right now","There is no correct emotion to have","Name the feeling quietly, if a name comes","Notice where you sense it in your body","Allow your breathing to stay natural","Make room for the feeling without needing to fix it","Feel the support of your seat or floor","Observe that sensations can shift over time","Return to a gentle point of attention","Treat yourself with the kindness you would offer a friend","Let each new breath be a fresh moment","Stay with a sense of steadiness","Return to the room at your own pace"]},{"id":"long7","track":2,"title":"Compassion Practice","subtitle":"Kindness Toward Yourself","minutes":20,"cues":["Begin with a comfortable breath","Think of someone you care about","Silently wish them ease and well-being","Notice what kindness feels like in your body","Now turn the same warmth toward yourself","You also deserve patience and care","Allow imperfections to be part of being human","Bring to mind someone who could use encouragement","Offer a simple wish of peace","Rest without forcing any feeling","Let kindness extend into your ordinary day","Feel your body sitting or lying here","Return with gentleness"]},{"id":"long8","track":2,"title":"Resilience","subtitle":"Returning to Center","minutes":20,"cues":["Feel the ground supporting you","Recall that difficult moments come and go","Notice the breath, quietly arriving","Allow your body to soften without collapsing","Think of one resource that helps you feel steady","Imagine yourself returning to that support","There is strength in moving one step at a time","Let the body settle into the present","You don't need to solve the future right now","Give yourself permission to pause","Notice that you can begin again","Rest in this small moment of steadiness","Return gently and carry it forward"]},{"id":"long9","track":2,"title":"Breath and Awareness","subtitle":"The Quiet Observer","minutes":20,"cues":["Sit or rest in a comfortable position","Notice the simple fact of breathing","Allow sensations to come and go","Observe sounds without labeling them good or bad","When thinking appears, notice that too","You can watch thoughts without following each one","Let the attention rest lightly","Notice contact with the ground or chair","Awareness does not need to be forced","Allow a longer space of quiet","Return to one easy breath","Feel the whole body in the room","Open your eyes when ready"]},{"id":"long10","track":2,"title":"Gratitude and Reflection","subtitle":"Closing with Appreciation","minutes":20,"cues":["Recall a quiet moment from your day","Notice one thing that offered comfort","Bring to mind a person or place you appreciate","Allow any warm feeling to be subtle or strong","You do not need to feel grateful for everything","Notice one challenge you moved through","Offer yourself appreciation for trying","Rest with a memory that makes you smile","Imagine carrying gratitude into tomorrow","Return to the feeling of your breath","Allow a long moment of quiet","Give thanks in your own way","Come back gently to the present"]}];
const root=document.getElementById('meditation-library');if(!root)return;
const choose=document.getElementById('meditation-session-list'),heading=document.getElementById('meditation-now-title'),info=document.getElementById('meditation-cue'),timer=document.getElementById('meditation-clock'),status=document.getElementById('meditation-status'),progress=document.getElementById('meditation-progress'),controls=document.getElementById('meditation-controls');
const startButton=document.getElementById('meditation-play'),stopButton=document.getElementById('meditation-stop'),voiceButton=document.getElementById('meditation-voice'),backButton=document.getElementById('meditation-back');
let selected=null,elapsed=0,playing=false,voiceOn=true,lastTick=0,interval=null,lastCue=-1,finished=false;

const recordedTracks = {
  short1: '/app/meditation-audio/production/Soulanova_Calm_Breathing_Voice.mp3',
  short2: '/app/meditation-audio/production/Soulanova_Morning_Grounding_Voice.mp3',
  short3: '/app/meditation-audio/production/Soulanova_Stress_Release_Voice.mp3',
  short4: '/app/meditation-audio/production/Soulanova_Gratitude_Pause_Voice.mp3',
  short5: '/app/meditation-audio/production/Soulanova_Body_Scan_Voice.mp3',
  short6: '/app/meditation-audio/production/Soulanova_Mindful_Focus_Voice.mp3',
  short7: '/app/meditation-audio/production/Soulanova_Evening_Unwind_Voice.mp3',
  long8: '/app/meditation-audio/production/Soulanova_Resilience_Voice.mp3',
  long1: '/app/meditation-audio/production/Soulanova_Deep_Relaxation_Voice.mp3',
  long2: '/app/meditation-audio/production/Soulanova_Restful_Sleep_Voice.mp3',
  long3: '/app/meditation-audio/production/Soulanova_Inner_Confidence_Voice.mp3',
  long4: '/app/meditation-audio/production/Soulanova_Mindful_Nature_Voice.mp3',
  long5: '/app/meditation-audio/production/Soulanova_Letting_Go_Voice.mp3',
  long6: '/app/meditation-audio/production/Soulanova_Emotional_Balance_Voice.mp3',
  long7: '/app/meditation-audio/production/Soulanova_Compassion_Practice_Voice.mp3',
  long9: '/app/meditation-audio/production/Soulanova_Breath_and_Awareness_Voice.mp3',
  long10: '/app/meditation-audio/production/Soulanova_Gratitude_and_Reflection_Voice.mp3',
};
const recordedAudio = new Audio();
const recordedOcean = new Audio();

recordedOcean.preload = 'metadata';

const recordedOceanTracks = {
  short1: '/app/meditation-audio/production/Soulanova_Ocean_10min.mp3',
  short2: '/app/meditation-audio/production/Soulanova_Ocean_10min.mp3',
  short3: '/app/meditation-audio/production/Soulanova_Ocean_10min.mp3',
  short4: '/app/meditation-audio/production/Soulanova_Ocean_10min.mp3',
  short5: '/app/meditation-audio/production/Soulanova_Ocean_10min.mp3',
  short6: '/app/meditation-audio/production/Soulanova_Mindful_Focus_Ocean.mp3',
  short7: '/app/meditation-audio/production/Soulanova_Ocean_10min.mp3',
  long8: '/app/meditation-audio/production/Soulanova_Ocean_20min.mp3',
  long1: '/app/meditation-audio/production/Soulanova_Ocean_20min.mp3',
  long2: '/app/meditation-audio/production/Soulanova_Ocean_20min.mp3',
  long3: '/app/meditation-audio/production/Soulanova_Ocean_20min.mp3',
  long4: '/app/meditation-audio/production/Soulanova_Ocean_20min.mp3',
  long5: '/app/meditation-audio/production/Soulanova_Ocean_20min.mp3',
  long6: '/app/meditation-audio/production/Soulanova_Ocean_20min.mp3',
  long7: '/app/meditation-audio/production/Soulanova_Ocean_20min.mp3',
  long9: '/app/meditation-audio/production/Soulanova_Ocean_20min.mp3',
  long10: '/app/meditation-audio/production/Soulanova_Ocean_20min.mp3',
};

let voiceVolume = 85;
const voiceVolumeInput = document.getElementById('meditation-voice-volume');
const voiceVolumeLabel = document.getElementById('meditation-voice-volume-label');

voiceVolumeInput.addEventListener('input', () => {
  voiceVolume = Number(voiceVolumeInput.value);
  voiceVolumeLabel.textContent = voiceVolume + '%';
  setRecordedLevels();
});

function setRecordedLevels() {
  recordedAudio.volume = voiceOn ? voiceVolume / 100 : 0;
  recordedOcean.volume = wavesOn ? musicVolume / 100 : 0;
}

recordedAudio.preload = 'metadata';
const isRecorded = () => !!(selected && recordedTracks[selected.id]);

let musicOn=false,musicVolume=65,audioContext=null,master=null,oscillators=[],modulators=[];
const musicButton=document.getElementById('meditation-music'),volumeInput=document.getElementById('meditation-volume'),volumeLabel=document.getElementById('meditation-volume-label');

const waveButton=document.getElementById('meditation-waves');
let wavesOn=true,waveSource=null,waveGain=null,waveFilter=null,waveTimer=null;
function waveLevel(){return wavesOn&&playing ? .55*musicVolume/100 : 0}
function setWaveLevel(){if(waveGain&&audioContext)waveGain.gain.setTargetAtTime(waveLevel(),audioContext.currentTime,.8)}
function stopWaves(){if(waveTimer){clearInterval(waveTimer);waveTimer=null}if(waveGain&&audioContext)waveGain.gain.setTargetAtTime(0,audioContext.currentTime,.8);if(waveSource){const old=waveSource;waveSource=null;setTimeout(()=>{try{old.stop();old.disconnect()}catch(e){}},1800)}}
function startWaves(){if(!wavesOn||!selected)return;
const C=window.AudioContext||window.webkitAudioContext;if(!C){waveButton.textContent='Ocean unavailable on this device';waveButton.disabled=true;return}
try{
if(!audioContext){audioContext=new C();master=audioContext.createGain();master.gain.value=0;master.connect(audioContext.destination)}
audioContext.resume();if(waveSource){setWaveLevel();return}
const buffer=audioContext.createBuffer(1,audioContext.sampleRate*9,audioContext.sampleRate);
const data=buffer.getChannelData(0);let filtered=0;
for(let i=0;i<data.length;i++){filtered=filtered*.88+(Math.random()*2-1)*.12;data[i]=filtered}
const src=audioContext.createBufferSource();src.buffer=buffer;src.loop=true;
const low=audioContext.createBiquadFilter();low.type='lowpass';low.frequency.value=680;
const gain=audioContext.createGain();gain.gain.value=0;
src.connect(low);low.connect(gain);gain.connect(audioContext.destination);
src.start();waveSource=src;waveFilter=low;waveGain=gain;
const beginning=audioContext.currentTime;
function animateWaves(){
if(!waveGain||!audioContext)return;
const t=audioContext.currentTime-beginning;
const swell=.35+.65*(.5+.5*Math.sin(t*Math.PI/4.6-Math.PI/2));
const target=waveLevel()*swell;
waveGain.gain.setTargetAtTime(target,audioContext.currentTime,.6);
waveFilter.frequency.setTargetAtTime(450+420*swell,audioContext.currentTime,.8)
}
animateWaves();waveTimer=setInterval(animateWaves,300);
}catch(e){wavesOn=false;waveButton.textContent='Ocean waves unavailable';waveButton.disabled=true}
}

function closeMusic(){if(master&&audioContext){master.gain.setTargetAtTime(0,audioContext.currentTime,.35)}if(oscillators.length){const old=oscillators;oscillators=[];setTimeout(()=>{old.forEach(o=>{try{o.stop();o.disconnect()}catch(e){}})},1800)}modulators.forEach(o=>{try{o.stop();o.disconnect()}catch(e){}});modulators=[]}
function musicTarget(){return musicOn&&playing?(.12*musicVolume/100):0}
function setMusicLevel(duck=false){if(master&&audioContext)master.gain.setTargetAtTime(musicTarget()*(duck?.32:1),audioContext.currentTime,.55)}
function startMusic(){if(!musicOn||!selected)return;const C=window.AudioContext||window.webkitAudioContext;if(!C)return;try{if(!audioContext){audioContext=new C();master=audioContext.createGain();master.gain.value=0;master.connect(audioContext.destination)}audioContext.resume();if(oscillators.length){setMusicLevel();return}const notes=[[174.61,261.63,349.23],[164.81,246.94,329.63],[146.83,220,293.66],[196,293.66,392],[130.81,196,261.63],[155.56,233.08,311.13],[174.61,233.08,349.23],[146.83,220,349.23],[130.81,196,329.63],[164.81,246.94,369.99],[146.83,220,293.66],[196,261.63,392],[174.61,261.63,392],[155.56,233.08,349.23],[130.81,196,293.66],[164.81,261.63,329.63],[146.83,233.08,349.23]][sessions.indexOf(selected)]||[174.61,261.63,349.23];notes.forEach((frequency,i)=>{const oscillator=audioContext.createOscillator();oscillator.type='sine';oscillator.frequency.value=frequency;const layer=audioContext.createGain();layer.gain.value=[.28,.18,.10][i];oscillator.connect(layer);layer.connect(master);oscillator.start();oscillators.push(oscillator);const lfo=audioContext.createOscillator(),depth=audioContext.createGain();lfo.frequency.value=.025+i*.008;depth.gain.value=.045; lfo.connect(depth);depth.connect(layer.gain);lfo.start();modulators.push(lfo)});setMusicLevel()}catch(e){musicButton.textContent='Music unavailable on this device';musicOn=false}}

function fmt(n){return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')}
function speak(text){if(!voiceOn||!('speechSynthesis' in window))return;window.speechSynthesis.cancel();const msg=new SpeechSynthesisUtterance(text);msg.rate=.78;msg.pitch=.92;msg.volume=.43;const voices=window.speechSynthesis.getVoices();const voice=voices.find(v=>v.lang.startsWith('en')&&/samantha|serena|ava|daniel|allison|natural|premium/i.test(v.name))||voices.find(v=>v.lang.startsWith('en'));if(voice)msg.voice=voice;msg.onstart=()=>setMusicLevel(true);msg.onend=()=>setMusicLevel(false);msg.onerror=()=>setMusicLevel(false);window.speechSynthesis.speak(msg)}
function cueIndex(){return Math.min(selected.cues.length*3-1,Math.floor(elapsed/(selected.minutes*60/(selected.cues.length*3))))}
function passage(i){const base=selected.cues[Math.floor(i/3)];const phase=i%3;const openers=[
'Begin by noticing that you have arrived in this moment. There is nowhere else you need to be. ',
'Continue slowly, without trying to achieve anything. Give yourself permission to be exactly where you are. ',
'Take some time to notice what is here. You can listen to these words, or simply let them pass softly in the background. '];
const endings=[
'Stay with this for a few comfortable breaths. You do not need to change the pace of your breathing. Let the next quiet moment be enough.',
'If your attention drifts, that is natural. Gently return to this simple experience whenever you notice. There is no test and nothing to get right.',
'Allow a little space around the thought. Notice the support beneath your body. Rest here as you are, with kindness and patience.'];
return openers[phase]+base+'. '+endings[phase]}
function currentText(){return passage(cueIndex())}
function update(){if(!selected)return;const total=selected.minutes*60;heading.textContent=selected.title;timer.textContent=fmt(Math.max(0,total-Math.floor(elapsed)));progress.style.width=(100*Math.min(1,elapsed/total))+'%';const i=cueIndex();
info.textContent=isRecorded()
  ? 'Professionally guided meditation with gentle ocean waves.'
  : currentText();
startButton.textContent=finished?'Completed':playing?'Pause':'Start / Resume';startButton.disabled=finished;status.textContent=finished?'Session complete':playing?'Playing · relaxed spaces of quiet are intentional':'Paused / Ready'}
function pause(){if(isRecorded()){
  recordedAudio.pause();
  recordedOcean.pause();
}
playing=false;setMusicLevel();setWaveLevel();if(interval)clearInterval(interval);interval=null;if('speechSynthesis' in window)window.speechSynthesis.cancel();update()}
function complete(){if(finished)return;pause();finished=true;update();if(typeof addWorkout==='function'){addWorkout({title:'Meditation: '+selected.title,category:'Meditation',minutes:selected.minutes}).then(()=>{status.textContent='Session completed and saved to My progress'}).catch(()=>{status.textContent='Session complete; progress could not be saved'})}}
function step(){if(!playing||isRecorded())return;const now=performance.now();elapsed+=(now-lastTick)/1000;lastTick=now;if(elapsed>=selected.minutes*60){elapsed=selected.minutes*60;complete();return}const i=cueIndex();if(i!==lastCue){lastCue=i;speak(passage(i))}update()}
function show(s){
pause();closeMusic();stopWaves();
recordedAudio.pause();
recordedAudio.removeAttribute('src');
recordedAudio.load();
selected=s;
if(isRecorded()){
  recordedAudio.src=recordedTracks[s.id];
  recordedAudio.load();
  recordedOcean.src=recordedOceanTracks[s.id];
  recordedOcean.load();
  recordedOcean.pause();
  recordedOcean.currentTime=0;
  setRecordedLevels();
}
wavesOn=true;waveButton.textContent=wavesOn?'Ocean waves: On':'Ocean waves: Off';waveButton.setAttribute('aria-pressed',String(wavesOn));elapsed=0;lastCue=-1;finished=false;controls.hidden=false;choose.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===s.id)));update();voiceButton.disabled=false;
waveButton.disabled=false;
volumeInput.disabled=false;
voiceButton.title=isRecorded()?'Narration is included in the recording':'';
waveButton.title=isRecorded()?'Ocean waves are included in the recording':'';
controls.scrollIntoView({behavior:'smooth',block:'nearest'})}
function makeCards(){for(const track of [1,2]){const section=document.createElement('section');const h=document.createElement('h3');h.textContent=track===1?'Track 1 · Seven 10-minute meditations':'Track 2 · Ten 20-minute meditations';section.append(h);const grid=document.createElement('div');grid.className='meditation-grid';for(const s of sessions.filter(x=>x.track===track)){const card=document.createElement('article');card.className='meditation-card';const title=document.createElement('h4');title.textContent=s.title;const desc=document.createElement('p');desc.textContent=s.subtitle;const btn=document.createElement('button');btn.type='button';btn.className='quiet';btn.dataset.id=s.id;btn.textContent='Open '+s.minutes+'-minute session';btn.addEventListener('click',()=>show(s));card.append(title,desc,btn);grid.append(card)}section.append(grid);choose.append(section)}}
startButton.addEventListener('click',()=>{if(!selected||finished)return;if(playing){pause();return}if(isRecorded()){
  recordedAudio.currentTime=elapsed;
  recordedOcean.currentTime=elapsed;
  setRecordedLevels();

  recordedAudio.play().then(()=>{
    recordedOcean.play().catch(()=>{});

    playing=true;
    update();
  }).catch(()=>{
    playing=false;
    status.textContent='Audio could not play. Please try again.';
    update();
    status.textContent='Audio could not play. Please try again.';
  });
  return;
}
playing=true;startMusic();startWaves();lastTick=performance.now();const i=cueIndex();lastCue=i;speak(passage(i));interval=setInterval(step,250);update()});stopButton.addEventListener('click',()=>{pause();if(isRecorded()){
  recordedAudio.currentTime=0;
  recordedOcean.currentTime=0;
}
elapsed=0;lastCue=-1;finished=false;update()});waveButton.addEventListener('click',()=>{wavesOn=!wavesOn;waveButton.textContent=wavesOn?'Ocean waves: On':'Ocean waves: Off';waveButton.setAttribute('aria-pressed',String(wavesOn));if(isRecorded()){
  setRecordedLevels();
}else if(wavesOn&&playing){
  startWaves();
}else{
  setWaveLevel();
}});musicButton.disabled=true;musicButton.hidden=true;musicButton.title='Synthetic background music removed; ocean ambience is the default';volumeInput.addEventListener('input',()=>{musicVolume=Number(volumeInput.value);volumeLabel.textContent=musicVolume+'%';setMusicLevel();setWaveLevel();if(isRecorded())setRecordedLevels()});voiceButton.addEventListener('click',()=>{voiceOn=!voiceOn;if(!voiceOn&&'speechSynthesis' in window)window.speechSynthesis.cancel();voiceButton.textContent=voiceOn?'Voice: On':'Voice: Off';voiceButton.setAttribute('aria-pressed',String(voiceOn));if(isRecorded())setRecordedLevels()});backButton.addEventListener('click',()=>{pause();root.hidden=true;document.getElementById('workout-list').hidden=false;document.getElementById('selected-workout').hidden=false;document.querySelector('#workouts .sectionhead').hidden=false});
recordedAudio.addEventListener('timeupdate',()=>{
  if(!isRecorded()||finished)return;
  elapsed=Math.min(selected.minutes*60,recordedAudio.currentTime);

  if(playing && !recordedOcean.paused &&
     Math.abs(recordedOcean.currentTime-recordedAudio.currentTime)>0.35){
    recordedOcean.currentTime=recordedAudio.currentTime;
  }
  update();
});

recordedAudio.addEventListener('ended',()=>{
  if(isRecorded()&&!finished){
    elapsed=selected.minutes*60;
    complete();
  }
});

recordedAudio.addEventListener('error',()=>{
  if(isRecorded()){
    playing=false;
    update();
    status.textContent='Unable to load the recorded meditation.';
  }
});

document.addEventListener('visibilitychange',()=>{
  if(document.hidden&&playing)pause();
});
window.SoulanovaMeditation={open(){if(window.SoulanovaClasses)try{window.SoulanovaClasses.close()}catch(e){};document.querySelector('#workouts .sectionhead').hidden=true;document.getElementById('workout-list').hidden=true;document.getElementById('selected-workout').hidden=true;root.hidden=false;root.scrollIntoView({behavior:'smooth',block:'start'})}};
if(!('speechSynthesis' in window)){voiceOn=false;voiceButton.textContent='Voice unavailable on this device';voiceButton.disabled=true}makeCards();
})();