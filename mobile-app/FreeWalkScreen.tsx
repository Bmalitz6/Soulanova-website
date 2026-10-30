import React,{useEffect,useRef,useState} from 'react';
import {Alert,Linking,Platform,ScrollView,StyleSheet,Text,TouchableOpacity,View} from 'react-native';
import * as Health from '@appeeky/expo-healthkit';
const teal='#086B63';
export default function FreeWalkScreen({onBack}:{onBack:()=>void}){
 const [kind,setKind]=useState<'Walk'|'Run'>('Walk'),[running,setRunning]=useState(false),[done,setDone]=useState(false),[seconds,setSeconds]=useState(0),[busy,setBusy]=useState(false);
 const [results,setResults]=useState<{steps:number|null;miles:number|null}|null>(null),[message,setMessage]=useState('No set duration. Play music in your favorite app while you move.');
 const active=useRef<number|null>(null),segments=useRef<{start:number;end:number}[]>([]);
 const elapsed=()=>Math.round((segments.current.reduce((a,s)=>a+s.end-s.start,0)+(active.current?Date.now()-active.current:0))/1000);
 useEffect(()=>{if(!running)return;const id=setInterval(()=>setSeconds(elapsed()),1000);return()=>clearInterval(id)},[running]);
 const start=()=>{active.current=Date.now();setRunning(true)};
 const pause=()=>{if(active.current){segments.current.push({start:active.current,end:Date.now()});active.current=null;}setSeconds(elapsed());setRunning(false)};
 const finish=()=>{pause();setDone(true);setMessage('Finished. Read activity to get the available steps and distance for this session.')};
 const reset=()=>{active.current=null;segments.current=[];setRunning(false);setDone(false);setSeconds(0);setResults(null);setMessage('Ready for another activity.')};
 const read=async()=>{
  setBusy(true);
  try{
   if(!Health.isAvailable())throw Error('Health data is not available on this device.');
   await Health.requestAuthorization({toRead:[Health.QuantityType.stepCount,Health.QuantityType.distanceWalkingRunning],toShare:[]});
   const spans=[...segments.current];if(active.current)spans.push({start:active.current,end:Date.now()});
   let steps=0,miles=0,hasSteps=false,hasMiles=false;
   for(const span of spans){
    const from=new Date(span.start),to=new Date(span.end);
    const [a,b]=await Promise.all([
     Health.queryStatistics({type:Health.QuantityType.stepCount,unit:Health.Unit.count,from,to,options:Health.StatisticsOption.cumulativeSum}),
     Health.queryStatistics({type:Health.QuantityType.distanceWalkingRunning,unit:Health.Unit.meter,from,to,options:Health.StatisticsOption.cumulativeSum})
    ]);
    if(typeof a.sum==='number'){steps+=a.sum;hasSteps=true}
    if(typeof b.sum==='number'){miles+=b.sum/1609.344;hasMiles=true}
   }
   setResults({steps:hasSteps?Math.round(steps):null,miles:hasMiles?miles:null});
   setMessage('Activity may appear after your watch syncs. Tap Read Activity again to refresh.');
  }catch(e){setMessage('Cannot read health activity: '+(e instanceof Error?e.message:String(e)))}
  finally{setBusy(false)}
 };
 const openMusic=async(service:'Apple Music'|'Spotify')=>{
   const url=service==='Apple Music'?'https://music.apple.com/':'https://open.spotify.com/';
   try{await Linking.openURL(url)}
   catch{Alert.alert('Unable to open '+service,'Open your music app directly, then return to Soulanova.')}
 };
 const btn=(label:string,press:()=>void,disabled=false)=><TouchableOpacity disabled={disabled} onPress={press} style={[styles.button,disabled&&{opacity:.35}]}><Text style={styles.buttonText}>{label}</Text></TouchableOpacity>;
 return <ScrollView style={styles.page} contentContainerStyle={styles.content}>
  <TouchableOpacity onPress={()=>{if(running){Alert.alert('Pause first','Pause or finish before leaving.');return;}onBack()}}><Text style={styles.back}>‹ Back to SoulWalk</Text></TouchableOpacity>
  <Text style={styles.title}>Walk / Run</Text><Text style={styles.sub}>Your pace. Your music. No time limit.</Text>
  <View style={styles.card}><View style={styles.row}>{(['Walk','Run'] as const).map(k=><TouchableOpacity key={k} onPress={()=>setKind(k)} disabled={running||segments.current.length>0||done} style={[styles.choice,kind===k&&{borderColor:teal,borderWidth:2}]}><Text style={styles.value}>{k}</Text></TouchableOpacity>)}</View>
   <Text style={styles.label}>Choose your music</Text>
   <View style={styles.row}>
     <TouchableOpacity accessibilityRole="button" onPress={()=>{void openMusic('Apple Music')}} style={styles.musicButton}><Text style={styles.musicText}>♫ Apple Music</Text></TouchableOpacity>
     <TouchableOpacity accessibilityRole="button" onPress={()=>{void openMusic('Spotify')}} style={styles.musicButton}><Text style={styles.musicText}>◉ Spotify</Text></TouchableOpacity>
   </View>
   <Text style={styles.note}>Open a playlist, press Play, then return here to start or resume tracking. Other music apps work too.</Text>
   <Text style={styles.label}>{kind} {done?'completed':running?'in progress':'ready'}</Text>
   <Text style={styles.clock}>{Math.floor(seconds/3600).toString().padStart(2,'0')}:{Math.floor(seconds%3600/60).toString().padStart(2,'0')}:{(seconds%60).toString().padStart(2,'0')}</Text>
   {btn(running?'Tracking…':seconds?'Resume':'Start Tracking',start,running||done)}
   {btn('Pause',pause,!running)}
   {btn('Finish',finish,done||(!running&&seconds===0))}
   {btn('Reset',()=>Alert.alert('Discard activity?','This clears the activity.',[{text:'Cancel'},{text:'Discard',style:'destructive',onPress:reset}]),running||(!seconds&&!done))}
   {seconds>0&&btn(busy?'Reading…':'Read Activity',()=>{void read()},busy)}
   {results&&<Text style={styles.value}>{results.steps??'—'} steps • {results.miles?.toFixed(2)??'—'} miles</Text>}
   <Text style={styles.note}>{message}</Text>
   <Text style={styles.note}>Music: open Spotify, Apple Music, or another player yourself. Soulanova provides no coaching in this mode. This first test reads health measurements during active tracking intervals. GPS, reliable background tracking, and saving free activities are not yet enabled; keep the app open during testing.</Text>
  </View>
 </ScrollView>;
}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:'#F7F8F5'},content:{padding:22,paddingTop:76,paddingBottom:48},back:{fontSize:16,color:teal,fontWeight:'700',marginBottom:22},title:{fontSize:35,fontWeight:'800',color:'#173238'},sub:{color:'#6C827A',fontSize:16,marginTop:8,marginBottom:18},card:{backgroundColor:'white',padding:20,borderRadius:20,borderWidth:1,borderColor:'#DBE9E2'},row:{flexDirection:'row',gap:12},musicButton:{flex:1,alignItems:'center',justifyContent:'center',paddingVertical:15,borderRadius:12,backgroundColor:'#E5F1EC'},musicText:{color:teal,fontWeight:'800',fontSize:15},choice:{flex:1,padding:15,borderRadius:14,borderColor:'#DCE8E2',borderWidth:1,alignItems:'center'},label:{marginTop:26,textAlign:'center',fontSize:19,color:'#173238',fontWeight:'700'},clock:{textAlign:'center',fontSize:46,fontWeight:'800',color:teal,marginVertical:20},value:{fontSize:19,fontWeight:'700',color:'#173238',textAlign:'center',marginTop:8},button:{backgroundColor:teal,borderRadius:12,padding:16,alignItems:'center',marginBottom:10},buttonText:{color:'white',fontWeight:'800',fontSize:17},note:{fontSize:14,lineHeight:21,color:'#72847C',marginTop:14}});
