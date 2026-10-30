import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import * as HealthKit from '@appeeky/expo-healthkit';
import FreeWalkScreen from './FreeWalkScreen';
import SoulSafe from './SoulSafe';
import * as Location from 'expo-location';
import {GPS_TASK,beginGps,setGpsPaused,stopGps,clearGps} from './freestyleGps';
import {endBackgroundShare} from './soulsafeBackground';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Switch } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, StatusBar, Platform, TextInput } from 'react-native';

const brisk = [5,7,9,11,13,15,18,20,23,26,28,30];
const teal='#086B63', dark='#173238';
const clock=(seconds:number)=>String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');

export default function SoulWalkScreen({onBack}:{onBack:()=>void}) {
  const [showFree,setShowFree]=useState(false);
  const [section,setSection]=useState<'home'|'guided'|'history'|'safety'>('home');
  const [week,setWeek]=useState(0);
  const [guidedGps,setGuidedGps]=useState(false);
  const [guidedGpsMessage,setGuidedGpsMessage]=useState('Background GPS is optional. Enable it for locked-phone SoulSafe updates.');
  const gpsBusy=useRef(false);
  const enableGuidedGps=async()=>{
    if(gpsBusy.current||running)return;
    gpsBusy.current=true;
    try{
      let fg=await Location.getForegroundPermissionsAsync();
      if(fg.status!=='granted')fg=await Location.requestForegroundPermissionsAsync();
      if(fg.status!=='granted')throw Error('Location permission not granted.');
      let bg=await Location.getBackgroundPermissionsAsync();
      if(bg.status!=='granted')bg=await Location.requestBackgroundPermissionsAsync();
      if(bg.status!=='granted')throw Error('Allow Always location access in Settings for locked-phone tracking.');
      setGuidedGps(true);setGuidedGpsMessage('Background GPS ready. Start your guided walk to begin.');
    }catch(e){setGuidedGps(false);setGuidedGpsMessage(e instanceof Error?e.message:String(e))}
    finally{gpsBusy.current=false}
  };
  const startGuidedGps=async()=>{
    if(!guidedGps)return;
    try{
      if(await Location.hasStartedLocationUpdatesAsync(GPS_TASK)){
        await setGpsPaused(false);
      }else{
        await beginGps();
        await Location.startLocationUpdatesAsync(GPS_TASK,{accuracy:Location.Accuracy.High,distanceInterval:5,showsBackgroundLocationIndicator:true,pausesUpdatesAutomatically:false,foregroundService:{notificationTitle:'Soulanova Guided SoulWalk',notificationBody:'Recording GPS during your guided walk'}});
      }
      setGuidedGpsMessage('GPS active. SoulSafe shares locations only if you explicitly start live sharing.');
    }catch(e){setGuidedGpsMessage('GPS did not start: '+(e instanceof Error?e.message:String(e)))}
  };
  const pauseGuidedGps=async()=>{if(guidedGps)await setGpsPaused(true)};
  const stopGuidedGps=async()=>{
    if(!guidedGps)return;
    await stopGps();
    if(await Location.hasStartedLocationUpdatesAsync(GPS_TASK))await Location.stopLocationUpdatesAsync(GPS_TASK);
    await clearGps();
  };
  const stopGuidedShare=async()=>{
    try{await endBackgroundShare()}catch(e){Alert.alert('SoulSafe sharing may still be active','Please open SoulSafe and tap Stop Live Sharing. '+(e instanceof Error?e.message:String(e)))}
  };
  const [coaching,setCoaching]=useState(true);
  const player=useAudioPlayer(null);
  const played=useRef(new Set<string>());
  const previousElapsed=useRef(0);
  const coachingRef=useRef(true);
  useEffect(()=>{coachingRef.current=coaching;if(!coaching)player.pause();},[coaching,player]);
  useEffect(()=>{void setAudioModeAsync({playsInSilentMode:true,interruptionMode:'mixWithOthers'});return ()=>player.pause();},[player]);
  const playCue=useCallback((key:'start'|'brisk'|'halfway'|'cooldown'|'finish')=>{
    if(!coachingRef.current||played.current.has(key))return;
    played.current.add(key);
    const files={
      start:require('./assets/audio/start.mp3'),
      brisk:require('./assets/audio/brisk.mp3'),
      halfway:require('./assets/audio/halfway.mp3'),
      cooldown:require('./assets/audio/cooldown.mp3'),
      finish:require('./assets/audio/finish.mp3'),
    };
    player.pause();
    player.replace(files[key]);
    player.play();
  },[player]);
  const clearCues=()=>{played.current.clear();previousElapsed.current=0;player.pause();};
  const [account,setAccount]=useState<Session|null>(null);
  const [walks,setWalks]=useState<Array<{id:string;week_number:number;duration_minutes:number;steps:number|null;distance_miles:number|null;created_at:string}>>([]);
  const [historyMessage,setHistoryMessage]=useState('Loading walking history…');
  const [historyBusy,setHistoryBusy]=useState(false);
  useEffect(()=>{
    if(!supabase){setHistoryMessage('Supabase connection unavailable.');return;}
    supabase.auth.getSession().then(({data})=>setAccount(data.session));
    const {data:listener}=supabase.auth.onAuthStateChange((_event,session)=>setAccount(session));
    return ()=>listener.subscription.unsubscribe();
  },[]);
  const refreshHistory=useCallback(async()=>{
    if(!supabase||!account?.user){setWalks([]);setHistoryMessage('Sign in from Member Account to see your walking history.');return;}
    setHistoryBusy(true);
    try{
      const all:typeof walks=[];
      for(let offset=0;offset<20000;offset+=500){
        const {data,error}=await supabase.from('soulwalk_sessions')
          .select('id,week_number,duration_minutes,steps,distance_miles,created_at')
          .eq('user_id',account.user.id).order('created_at',{ascending:false})
          .range(offset,offset+499);
        if(error)throw error;
        all.push(...(data??[]));
        if((data??[]).length<500)break;
      }
      setWalks(all);
      setHistoryMessage(all.length===20000?'Showing the latest 20,000 walks.':all.length?'Your recent saved walks':'No walks saved yet.');
    }catch(e){setWalks([]);setHistoryMessage('Could not load walking history: '+(e instanceof Error?e.message:String(e)));}
    finally{setHistoryBusy(false);}
  },[account?.user.id]);
  useEffect(()=>{void refreshHistory();},[refreshHistory]);
  const [healthBusy,setHealthBusy]=useState(false);
  const [healthMessage,setHealthMessage]=useState('Loading today’s activity from Apple Health…');
  const [todayHealth,setTodayHealth]=useState<{steps:number|null;miles:number|null}|null>(null);
  const connectHealth=async()=>{
    if(healthBusy)return;
    setHealthBusy(true);
    try{
      if(!HealthKit.isAvailable())throw new Error('Health service unavailable on this device. Use the native development build.');
      await HealthKit.requestAuthorization({toRead:[
        HealthKit.QuantityType.stepCount,
        HealthKit.QuantityType.distanceWalkingRunning
      ],toShare:[]});
      const from=new Date();from.setHours(0,0,0,0);
      const to=new Date();
      const [st,di]=await Promise.all([
        HealthKit.queryStatistics({type:HealthKit.QuantityType.stepCount,unit:HealthKit.Unit.count,from,to,options:HealthKit.StatisticsOption.cumulativeSum}),
        HealthKit.queryStatistics({type:HealthKit.QuantityType.distanceWalkingRunning,unit:HealthKit.Unit.meter,from,to,options:HealthKit.StatisticsOption.cumulativeSum})
      ]);
      const steps=typeof st.sum==='number'&&Number.isFinite(st.sum)?Math.round(st.sum):null;
      const miles=typeof di.sum==='number'&&Number.isFinite(di.sum)?di.sum/1609.344:null;
      setTodayHealth({steps,miles});
      setHealthMessage(steps===null&&miles===null?'No readable data returned. Check health permissions and sync sources.':'Today’s totals only — not an individual SoulWalk workout.');
    }catch(e){setTodayHealth(null);setHealthMessage('Unable to read health data: '+(e instanceof Error?e.message:String(e)));}
    finally{setHealthBusy(false);}
  };
  const [workoutHealth,setWorkoutHealth]=useState<{steps:number|null;miles:number|null}|null>(null);
  const [workoutMessage,setWorkoutMessage]=useState('');
  const [workoutBusy,setWorkoutBusy]=useState(false);
  const workoutStarted=useRef<number|null>(null);
  const workoutEnded=useRef<number|null>(null);
  const readWorkoutHealth=async()=>{
    if(workoutBusy||!complete||!workoutStarted.current||!workoutEnded.current)return;
    setWorkoutBusy(true);setWorkoutMessage('');
    try{
      if(!HealthKit.isAvailable())throw Error('Health tracking is unavailable on this device.');
      await HealthKit.requestAuthorization({toRead:[HealthKit.QuantityType.stepCount,HealthKit.QuantityType.distanceWalkingRunning],toShare:[]});
      const from=new Date(workoutStarted.current),to=new Date(workoutEnded.current);
      const [st,di]=await Promise.all([
        HealthKit.queryStatistics({type:HealthKit.QuantityType.stepCount,unit:HealthKit.Unit.count,from,to,options:HealthKit.StatisticsOption.cumulativeSum}),
        HealthKit.queryStatistics({type:HealthKit.QuantityType.distanceWalkingRunning,unit:HealthKit.Unit.meter,from,to,options:HealthKit.StatisticsOption.cumulativeSum})
      ]);
      const steps=typeof st.sum==='number'&&Number.isFinite(st.sum)?Math.round(st.sum):null;
      const miles=typeof di.sum==='number'&&Number.isFinite(di.sum)?di.sum/1609.344:null;
      if(steps===null&&miles===null){setWorkoutMessage('No workout data available yet. Try Refresh after your watch syncs, or enter steps manually.');return;}
      setWorkoutHealth({steps,miles});
      setWorkoutMessage('Workout interval activity loaded. Review it before saving; activity during pauses may also be included.');
    }catch(e){setWorkoutMessage('Could not read workout activity: '+(e instanceof Error?e.message:String(e)));}
    finally{setWorkoutBusy(false);}
  };
  // Refresh today's totals when SoulWalk opens; the workout metrics remain separate.
  useEffect(()=>{void connectHealth();},[]);
  const [stepsText,setStepsText]=useState('');
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const saveLock=useRef(false);
  const [saveMessage,setSaveMessage]=useState('');
  const [elapsed,setElapsed]=useState(0);
  const [running,setRunning]=useState(false);
  const startedAt=useRef<number|null>(null);
  const duration=(brisk[week]+10)*60;
  const complete=elapsed>=duration;
  useEffect(()=>{
    if(!running)return;
    const interval=setInterval(()=>{
      if(startedAt.current===null)return;
      const value=Math.min(duration,Math.floor((Date.now()-startedAt.current)/1000));
      setElapsed(value);
      if(value>=duration){workoutEnded.current=workoutEnded.current??Date.now();setRunning(false);void stopGuidedGps();void stopGuidedShare();}
    },500);
    return ()=>clearInterval(interval);
  },[running,duration]);
  useEffect(()=>{
    if(elapsed<=previousElapsed.current){previousElapsed.current=elapsed;return;}
    const last=previousElapsed.current;
    previousElapsed.current=elapsed;
    const milestones=[
      {at:300,key:'brisk' as const},
      {at:Math.ceil(duration/2),key:'halfway' as const},
      {at:duration-300,key:'cooldown' as const},
      {at:duration,key:'finish' as const},
    ];
    const crossed=milestones.filter(m=>last<m.at&&elapsed>=m.at);
    if(crossed.length)playCue(crossed[crossed.length-1].key);
  },[elapsed,duration,playCue]);
  const start=()=>{
    if(elapsed===0){workoutStarted.current=Date.now();workoutEnded.current=null;setWorkoutHealth(null);setWorkoutMessage('');}
    startedAt.current=Date.now()-elapsed*1000;
    if(elapsed===0)playCue('start');
    setRunning(true);
    void startGuidedGps();
  };
  const pause=()=>{
    if(startedAt.current!==null){
      const current=Math.min(duration,Math.floor((Date.now()-startedAt.current)/1000));
      setElapsed(current);
      if(current>=duration)workoutEnded.current=workoutEnded.current??Date.now();
    }
    setRunning(false);
    void pauseGuidedGps();
    player.pause();
  };
  const reset=()=>{
    if(saving)return;
    setSaved(false);setStepsText('');setSaveMessage('');
    setWorkoutHealth(null);setWorkoutMessage('');workoutStarted.current=null;workoutEnded.current=null;
    setRunning(false);
    startedAt.current=null;
    setElapsed(0);
    clearCues();
    void stopGuidedGps();
    void stopGuidedShare();
  };
  const choose=(i:number)=>{if(running||saving)return;reset();setWeek(i)};
  const saveWalk=async()=>{
    if(!complete||saved||saveLock.current)return;
    if(!supabase){setSaveMessage('Supabase is not configured.');return;}
    const steps=stepsText.trim()===''?workoutHealth?.steps??null:Number(stepsText.trim());
    if(steps!==null&&(!Number.isInteger(steps)||steps<0||steps>150000)){
      setSaveMessage('Enter a valid step count from 0 to 150,000.');return;
    }
    saveLock.current=true;setSaving(true);setSaveMessage('');
    try{
      const {data,error:authError}=await supabase.auth.getUser();
      if(authError)throw authError;
      if(!data.user)throw Error('Sign in to your Soulanova account first.');
      const {error}=await supabase.from('soulwalk_sessions').insert({
        user_id:data.user.id,week_number:week+1,duration_minutes:duration/60,
        distance_miles:workoutHealth?.miles??null,steps,source:Platform.OS==='android'?'android':'ios'
      });
      if(error)throw error;
      setSaved(true);setSaveMessage('Walk saved successfully.');
      await refreshHistory();
    }catch(e){setSaveMessage('Could not save walk: '+(e instanceof Error?e.message:String(e)));}
    finally{saveLock.current=false;setSaving(false);}
  };
  const phase=complete?'Completed':elapsed<300?'Easy warm-up':elapsed<300+brisk[week]*60?'Brisk walking':'Cool-down';
  const action=(label:string,fn:()=>void,disabled=false)=><TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={fn} style={[styles.button,disabled&&styles.disabled]}><Text style={styles.buttonText}>{label}</Text></TouchableOpacity>;
  if(showFree)return <FreeWalkScreen onBack={()=>setShowFree(false)}/>;
  return <ScrollView style={styles.page} contentContainerStyle={styles.container}>
    <TouchableOpacity accessibilityRole="button" onPress={()=>{pause();onBack()}}><Text style={styles.back}>‹ Back to Soulanova</Text></TouchableOpacity>
    <Text style={styles.title}>SoulWalk</Text>
    <Text style={styles.subtitle}>Choose a guided workout or move at your own pace.</Text>
    {section==='home'&&<>
    <View style={styles.card}>
      <Text style={styles.todayTitle}>Today's Activity</Text>
      <Text style={styles.todaySource}>{Platform.OS==='ios'?'Apple Health':'Health Connect'} · Daily totals</Text>
      <View style={styles.todayRow}>
        <View style={styles.todayMetric}><Text style={styles.todayLabel}>STEPS</Text><Text style={styles.todayNumber}>{todayHealth?.steps==null?'—':todayHealth.steps.toLocaleString()}</Text></View>
        <View style={styles.todayMetric}><Text style={styles.todayLabel}>DISTANCE</Text><Text style={styles.todayNumber}>{todayHealth?.miles==null?'—':todayHealth.miles.toFixed(2)+' mi'}</Text></View>
      </View>
      <Text style={styles.notice}>{healthMessage}</Text>
      {action(healthBusy?'Refreshing…':'Refresh Today’s Activity',()=>{void connectHealth();},healthBusy)}
      <Text style={styles.notice}>Daily totals are separate from your guided and Freestyle workouts.</Text>
    </View>
      <TouchableOpacity accessibilityRole="button" onPress={()=>setShowFree(true)} disabled={running} style={styles.navTile}><Text style={styles.navTitle}>🚶 Walk / Run Freestyle  →</Text><Text style={styles.navSubtitle}>GPS, music and your own pace</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={()=>setSection('guided')} style={styles.navTile}><Text style={styles.navTitle}>🎧 Guided SoulWalk  →</Text><Text style={styles.navSubtitle}>12-week coached program · Week {week+1}</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={()=>setSection('safety')} style={styles.navTile}><Text style={styles.navTitle}>🛡️ SoulSafe  →</Text><Text style={styles.navSubtitle}>Location sharing and emergency shortcut</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={()=>setSection('history')} style={styles.navTile}><Text style={styles.navTitle}>📊 Walking History  →</Text><Text style={styles.navSubtitle}>Your saved activities and progress</Text></TouchableOpacity>
      {running&&<Text style={styles.notice}>Guided walk in progress. Open Guided SoulWalk to pause or finish.</Text>}
    </>}
    {section!=='home'&&<TouchableOpacity accessibilityRole="button" onPress={()=>setSection('home')} style={styles.sectionBack}><Text style={styles.back}>‹ SoulWalk Home</Text></TouchableOpacity>}
    {section==='safety'&&<SoulSafe />}
    {section==='guided'&&<>
    <View style={styles.card}>
      <Text style={styles.eyebrow}>WEEK {week+1} · {Math.round(duration/60)} MINUTES</Text>
      <Text style={styles.phase}>{phase}</Text>
      <Text style={styles.clock}>{clock(Math.max(0,duration-elapsed))}</Text>
      <View style={styles.track}><View style={[styles.fill,{width:(elapsed/duration*100)+'%'}]}/></View>
      <Text style={styles.note}>5 min warm-up · {brisk[week]} min brisk · 5 min cool-down</Text>
      <Text style={styles.notice}>{guidedGpsMessage}</Text>
      {!guidedGps&&action('Enable Background GPS for SoulSafe',()=>{void enableGuidedGps()},running)}

      <View style={styles.actions}>{action(complete?'Finished':running?'Walking':'Start / Resume',start,running||complete)}{action('Pause',pause,!running)}{action('Reset',()=>Alert.alert('Reset walk?','This discards the current unsaved timer.',[{text:'Cancel',style:'cancel'},{text:'Reset',style:'destructive',onPress:reset}]))}</View>
      <View style={styles.statRow}><Text style={styles.stat}>Serene coaching voice</Text><Switch value={coaching} onValueChange={setCoaching} trackColor={{true:teal}} accessibilityLabel="Serene coaching voice"/></View>
      {complete&&<View style={styles.saveSection}>
        <Text style={styles.stat}>Workout Health Data</Text>
        <Text style={styles.notice}>Read steps and distance recorded between this walk's start and finish. Pauses may be included. Results depend on your watch syncing.</Text>
        {action(workoutBusy?'Reading Activity…':workoutHealth?'Refresh Workout Activity':'Read Workout Activity',()=>{void readWorkoutHealth();},workoutBusy||saving||saved)}
        {workoutHealth&&<Text style={styles.stat}>Workout: {workoutHealth.steps===null?'—':workoutHealth.steps.toLocaleString()} steps · {workoutHealth.miles===null?'—':workoutHealth.miles.toFixed(2)} miles</Text>}
        {!!workoutMessage&&<Text style={styles.notice}>{workoutMessage}</Text>}
        <Text style={styles.stat}>Steps from your watch or phone (optional)</Text>
        <TextInput accessibilityLabel="Steps during this walk" keyboardType="number-pad"
          placeholder={workoutHealth?.steps===null||!workoutHealth?'Enter steps':`Health: ${workoutHealth.steps} steps (or override)`} value={stepsText} onChangeText={setStepsText}
          editable={!saved&&!saving} style={styles.stepInput}/>
        {action(saved?'Walk Saved':saving?'Saving…':'Save Completed Walk',
          ()=>{void saveWalk();},saved||saving)}
        {!!saveMessage&&<Text accessibilityRole="alert" style={styles.notice}>{saveMessage}</Text>}
      </View>}
      <Text style={styles.notice}>Apple Health workout reading is available when a walk finishes. GPS and background workout tracking are not enabled. Keep the app in the foreground during testing.</Text>
    </View>
    <Text style={styles.heading}>Choose your week</Text>
    <View style={styles.weeks}>{brisk.map((n,i)=><TouchableOpacity key={i} onPress={()=>choose(i)} disabled={running} style={[styles.week,i===week&&styles.selected]}><Text style={styles.weekText}>Week {i+1}</Text><Text style={styles.min}>{n+10} min</Text></TouchableOpacity>)}</View>
    </>}
    {section==='history'&&<>
    <View style={styles.card}>
      <Text style={styles.heading}>Your Walking History</Text>
      <View style={styles.statRow}>
       <Text style={styles.stat}>Walks: {walks.length.toLocaleString()}</Text>
       <Text style={styles.stat}>Steps: {walks.reduce((sum,w)=>sum+(w.steps??0),0).toLocaleString()}</Text>
      </View>
      <View style={styles.statRow}>
       <Text style={styles.stat}>Miles: {walks.reduce((sum,w)=>sum+(w.distance_miles??0),0).toFixed(2)}</Text>
       <Text style={styles.stat}>Weeks: {new Set(walks.map(w=>w.week_number)).size}/12</Text>
      </View>
      <Text style={styles.notice}>{historyMessage}</Text>
      {walks.slice(0,10).map(w=><Text key={w.id} style={styles.historyItem}>{new Date(w.created_at).toLocaleDateString()} · Week {w.week_number} · {Number(w.duration_minutes).toFixed(1)} min · {w.steps??'—'} steps</Text>)}
      {action(historyBusy?'Refreshing…':'Refresh History',()=>{void refreshHistory();},historyBusy)}
    </View>
    </>}
  </ScrollView>;
}
const styles=StyleSheet.create({navTile:{backgroundColor:'#FFFFFF',borderRadius:18,borderWidth:1,borderColor:'#DCE8E2',padding:20,marginTop:13},navTitle:{fontSize:19,fontWeight:'800',color:'#173238'},navSubtitle:{fontSize:13,color:'#6A8079',marginTop:8},sectionBack:{marginTop:12,marginBottom:4},todayTitle:{fontSize:22,fontWeight:'800',color:'#173238'},todaySource:{fontSize:12,color:'#6A8079',marginTop:4},todayRow:{flexDirection:'row',gap:10,marginTop:15},todayMetric:{flex:1,backgroundColor:'#EAF4F0',borderRadius:12,padding:14},todayLabel:{fontSize:11,fontWeight:'800',color:'#617C72'},todayNumber:{fontSize:24,fontWeight:'800',color:'#086B63',marginTop:4},
 page:{flex:1,backgroundColor:'#F7F8F5'},container:{padding:22,paddingTop:Platform.OS==='android' ? (StatusBar.currentHeight ?? 24)+20 : 76,paddingBottom:45},
 back:{color:teal,fontSize:16,fontWeight:'700',marginBottom:16},title:{color:dark,fontSize:32,fontWeight:'800'},subtitle:{color:'#6A8079',fontSize:16,marginTop:5,marginBottom:16},
 card:{backgroundColor:'white',borderRadius:22,padding:17,borderWidth:1,borderColor:'#DCE8E2'},
 eyebrow:{color:teal,fontSize:12,fontWeight:'800',letterSpacing:1.5},phase:{color:dark,textAlign:'center',fontSize:22,fontWeight:'700',marginTop:15},
 clock:{color:teal,fontSize:56,textAlign:'center',fontWeight:'800',fontVariant:['tabular-nums'],marginVertical:7},
 track:{height:12,backgroundColor:'#DCE8E2',borderRadius:8,overflow:'hidden'},fill:{height:'100%',backgroundColor:teal},note:{textAlign:'center',color:'#657F78',marginTop:14},
 actions:{gap:10,marginTop:14},button:{backgroundColor:teal,borderRadius:12,padding:14,alignItems:'center'},disabled:{opacity:.4},buttonText:{color:'white',fontSize:16,fontWeight:'800'},
 notice:{fontSize:12,color:'#71817B',lineHeight:18,marginTop:15},heading:{color:dark,fontSize:23,fontWeight:'800',marginTop:28,marginBottom:12},
 saveSection:{marginTop:20},stepInput:{backgroundColor:'#F8FAF8',padding:14,borderRadius:12,borderWidth:1,borderColor:'#D9E7E1',marginTop:10,marginBottom:12,fontSize:17},
 statRow:{flexDirection:'row',justifyContent:'space-between',marginTop:12,gap:10},stat:{color:dark,fontSize:16,fontWeight:'700'},historyItem:{color:'#536E67',paddingVertical:8,borderBottomWidth:1,borderBottomColor:'#E4EDE8'},
 weeks:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between'},week:{width:'31%',padding:12,borderRadius:12,backgroundColor:'white',borderWidth:1,borderColor:'#DEE8E2',marginBottom:10},selected:{borderColor:teal,borderWidth:2},weekText:{fontWeight:'800',color:dark},min:{color:'#708780',marginTop:4}
});
