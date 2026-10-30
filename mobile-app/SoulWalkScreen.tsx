import React, { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const brisk = [5,7,9,11,13,15,18,20,23,26,28,30];
const teal='#086B63', dark='#173238';
const clock=(seconds:number)=>String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');

export default function SoulWalkScreen({onBack}:{onBack:()=>void}) {
  const [week,setWeek]=useState(0);
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
  const start=()=>{
    startedAt.current=Date.now()-elapsed*1000;
    setRunning(true);
  };
  const pause=()=>{
    if(startedAt.current!==null)setElapsed(Math.min(duration,Math.floor((Date.now()-startedAt.current)/1000)));
    setRunning(false);
  };
  const reset=()=>{
    setRunning(false);
    startedAt.current=null;
    setElapsed(0);
  };
  const choose=(i:number)=>{if(running)return;reset();setWeek(i)};
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
      <Text style={styles.notice}>Mobile timer preview. Serene coaching, HealthKit, GPS and Supabase saving are not enabled on this screen yet. Keep the app in the foreground during testing.</Text>
    </View>
    <Text style={styles.heading}>Choose your week</Text>
    <View style={styles.weeks}>{brisk.map((n,i)=><TouchableOpacity key={i} onPress={()=>choose(i)} disabled={running} style={[styles.week,i===week&&styles.selected]}><Text style={styles.weekText}>Week {i+1}</Text><Text style={styles.min}>{n+10} min</Text></TouchableOpacity>)}</View>
  </ScrollView>;
}
const styles=StyleSheet.create({
 page:{flex:1,backgroundColor:'#F7F8F5'},container:{padding:22,paddingTop:28,paddingBottom:45},
 back:{color:teal,fontSize:16,fontWeight:'700',marginBottom:22},title:{color:dark,fontSize:34,fontWeight:'800'},subtitle:{color:'#6A8079',fontSize:16,marginTop:5,marginBottom:23},
 card:{backgroundColor:'white',borderRadius:22,padding:20,borderWidth:1,borderColor:'#DCE8E2'},
 eyebrow:{color:teal,fontSize:12,fontWeight:'800',letterSpacing:1.5},phase:{color:dark,textAlign:'center',fontSize:22,fontWeight:'700',marginTop:28},
 clock:{color:teal,fontSize:65,textAlign:'center',fontWeight:'800',fontVariant:['tabular-nums'],marginVertical:14},
 track:{height:12,backgroundColor:'#DCE8E2',borderRadius:8,overflow:'hidden'},fill:{height:'100%',backgroundColor:teal},note:{textAlign:'center',color:'#657F78',marginTop:14},
 actions:{gap:10,marginTop:23},button:{backgroundColor:teal,borderRadius:12,padding:14,alignItems:'center'},disabled:{opacity:.4},buttonText:{color:'white',fontSize:16,fontWeight:'800'},
 notice:{fontSize:12,color:'#71817B',lineHeight:18,marginTop:20},heading:{color:dark,fontSize:23,fontWeight:'800',marginTop:28,marginBottom:12},
 weeks:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between'},week:{width:'31%',padding:12,borderRadius:12,backgroundColor:'white',borderWidth:1,borderColor:'#DEE8E2',marginBottom:10},selected:{borderColor:teal,borderWidth:2},weekText:{fontWeight:'800',color:dark},min:{color:'#708780',marginTop:4}
});
