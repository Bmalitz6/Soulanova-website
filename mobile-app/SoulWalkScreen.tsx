import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Switch } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, StatusBar, Platform, TextInput } from 'react-native';

const brisk = [5,7,9,11,13,15,18,20,23,26,28,30];
const teal='#086B63', dark='#173238';
const clock=(seconds:number)=>String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');

export default function SoulWalkScreen({onBack}:{onBack:()=>void}) {
  const [week,setWeek]=useState(0);
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
      if(value>=duration)setRunning(false);
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
    startedAt.current=Date.now()-elapsed*1000;
    if(elapsed===0)playCue('start');
    setRunning(true);
  };
  const pause=()=>{
    if(startedAt.current!==null)setElapsed(Math.min(duration,Math.floor((Date.now()-startedAt.current)/1000)));
    setRunning(false);
    player.pause();
  };
  const reset=()=>{
    if(saving)return;
    setSaved(false);setStepsText('');setSaveMessage('');
    setRunning(false);
    startedAt.current=null;
    setElapsed(0);
    clearCues();
  };
  const choose=(i:number)=>{if(running||saving)return;reset();setWeek(i)};
  const saveWalk=async()=>{
    if(!complete||saved||saveLock.current)return;
    if(!supabase){setSaveMessage('Supabase is not configured.');return;}
    const steps=stepsText.trim()===''?null:Number(stepsText.trim());
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
        distance_miles:null,steps,source:Platform.OS==='android'?'android':'ios'
      });
      if(error)throw error;
      setSaved(true);setSaveMessage('Walk saved successfully.');
      await refreshHistory();
    }catch(e){setSaveMessage('Could not save walk: '+(e instanceof Error?e.message:String(e)));}
    finally{saveLock.current=false;setSaving(false);}
  };
  const phase=complete?'Completed':elapsed<300?'Easy warm-up':elapsed<300+brisk[week]*60?'Brisk walking':'Cool-down';
  const action=(label:string,fn:()=>void,disabled=false)=><TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={fn} style={[styles.button,disabled&&styles.disabled]}><Text style={styles.buttonText}>{label}</Text></TouchableOpacity>;
  return <ScrollView style={styles.page} contentContainerStyle={styles.container}>
    <TouchableOpacity accessibilityRole="button" onPress={()=>{pause();onBack()}}><Text style={styles.back}>‹ Back to Soulanova</Text></TouchableOpacity>
    <Text style={styles.title}>SoulWalk</Text>
    <Text style={styles.subtitle}>Your 12-Week Walking Journey</Text>
    <View style={styles.card}>
      <Text style={styles.eyebrow}>WEEK {week+1} · {Math.round(duration/60)} MINUTES</Text>
      <Text style={styles.phase}>{phase}</Text>
      <Text style={styles.clock}>{clock(Math.max(0,duration-elapsed))}</Text>
      <View style={styles.track}><View style={[styles.fill,{width:(elapsed/duration*100)+'%'}]}/></View>
      <Text style={styles.note}>5 min warm-up · {brisk[week]} min brisk · 5 min cool-down</Text>
      <View style={styles.actions}>{action(complete?'Finished':running?'Walking':'Start / Resume',start,running||complete)}{action('Pause',pause,!running)}{action('Reset',()=>Alert.alert('Reset walk?','This discards the current unsaved timer.',[{text:'Cancel',style:'cancel'},{text:'Reset',style:'destructive',onPress:reset}]))}</View>
      <View style={styles.statRow}><Text style={styles.stat}>Serene coaching voice</Text><Switch value={coaching} onValueChange={setCoaching} trackColor={{true:teal}} accessibilityLabel="Serene coaching voice"/></View>
      {complete&&<View style={styles.saveSection}>
        <Text style={styles.stat}>Steps from your watch or phone (optional)</Text>
        <TextInput accessibilityLabel="Steps during this walk" keyboardType="number-pad"
          placeholder="Enter steps" value={stepsText} onChangeText={setStepsText}
          editable={!saved&&!saving} style={styles.stepInput}/>
        {action(saved?'Walk Saved':saving?'Saving…':'Save Completed Walk',
          ()=>{void saveWalk();},saved||saving)}
        {!!saveMessage&&<Text accessibilityRole="alert" style={styles.notice}>{saveMessage}</Text>}
      </View>}
      <Text style={styles.notice}>HealthKit and GPS are not yet connected. Steps are entered manually; distance is not recorded. Keep the app in the foreground during testing.</Text>
    </View>
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
    <Text style={styles.heading}>Choose your week</Text>
    <View style={styles.weeks}>{brisk.map((n,i)=><TouchableOpacity key={i} onPress={()=>choose(i)} disabled={running} style={[styles.week,i===week&&styles.selected]}><Text style={styles.weekText}>Week {i+1}</Text><Text style={styles.min}>{n+10} min</Text></TouchableOpacity>)}</View>
  </ScrollView>;
}
const styles=StyleSheet.create({
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
