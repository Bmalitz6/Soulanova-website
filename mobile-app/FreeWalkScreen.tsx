import React,{useEffect,useRef,useState} from 'react';
import {Alert,Linking,Platform,ScrollView,StyleSheet,Text,TextInput,TouchableOpacity,View} from 'react-native';
import * as Health from '@appeeky/expo-healthkit';
import {Pedometer} from 'expo-sensors';
import {supabase} from './supabase';
import * as Location from 'expo-location';
import {GPS_TASK,beginGps,readGps,setGpsPaused,stopGps,clearGps} from './freestyleGps';
const teal='#086B63';
export default function FreeWalkScreen({onBack}:{onBack:()=>void}){
 const [kind,setKind]=useState<'Walk'|'Run'>('Walk'),[running,setRunning]=useState(false),[done,setDone]=useState(false),[seconds,setSeconds]=useState(0),[busy,setBusy]=useState(false);
 const healthReadLock=useRef(false);
 const [phoneSteps,setPhoneSteps]=useState<number|null>(null);
 const [pedometerStatus,setPedometerStatus]=useState('Phone step counting will start with your walk.');
 const phoneReadLock=useRef(false);
 const refreshPhoneSteps=async()=>{
  if(Platform.OS!=='ios'||phoneReadLock.current)return;
  if(!active.current&&!segments.current.length)return;
  phoneReadLock.current=true;
  try{
   const intervals=[...segments.current];if(active.current)intervals.push({start:active.current,end:Date.now()});
   let total=0;
   for(const span of intervals){
    if(span.end<=span.start)continue;
    const data=await Pedometer.getStepCountAsync(new Date(span.start),new Date(span.end));
    total+=data.steps;
   }
   setPhoneSteps(Math.round(total));
   setPedometerStatus('Steps from this iPhone’s motion sensor; your watch may report a different number.');
  }catch(e){setPedometerStatus('Phone step count not available: '+(e instanceof Error?e.message:String(e)))}
  finally{phoneReadLock.current=false}
 };
 useEffect(()=>{
  if(!running&&!done)return;
  void refreshPhoneSteps();
  if(!running)return;
  const timer=setInterval(()=>{void refreshPhoneSteps()},6000);
  return()=>clearInterval(timer);
 },[running,done]);
 const [manualSteps,setManualSteps]=useState('');
 const [results,setResults]=useState<{steps:number|null;miles:number|null}|null>(null),[message,setMessage]=useState('No set duration. Play music in your favorite app while you move.');
 const active=useRef<number|null>(null),segments=useRef<{start:number;end:number}[]>([]);
 const [saving,setSaving]=useState(false),[saved,setSaved]=useState(false),[saveMessage,setSaveMessage]=useState('');
 const savingLock=useRef(false);
 const [recent,setRecent]=useState<Array<{id:string;activity_type:string;duration_seconds:number;steps:number|null;distance_miles:number|null;created_at:string}>>([]);
 const [refreshBusy,setRefreshBusy]=useState(false);
 const loadRecent=async()=>{
  if(!supabase)return;
  setRefreshBusy(true);
  try{
   const {data:{user}}=await supabase.auth.getUser();if(!user){setRecent([]);return}
   const {data,error}=await supabase.from('freestyle_sessions').select('id,activity_type,duration_seconds,steps,distance_miles,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(5);
   if(error)throw error;
   setRecent(data??[]);
  }catch(e){setSaveMessage('History unavailable: '+(e instanceof Error?e.message:String(e)))}
  finally{setRefreshBusy(false)}
 };
 useEffect(()=>{void loadRecent()},[]);
 const saveFreestyle=async()=>{
  if(!done||saved||savingLock.current)return;
  if(!supabase){setSaveMessage('Account connection unavailable.');return;}
  savingLock.current=true;setSaving(true);setSaveMessage('');
  try{
   const {data:{user},error:authError}=await supabase.auth.getUser();
   if(authError)throw authError;
   if(!user)throw Error('Sign in to Member Account to save your workout.');
   const gpsAvailable=gpsEnabled&&gpsMiles>0;
   const healthAvailable=results?.miles!==null&&results?.miles!==undefined;
   const miles=gpsAvailable?gpsMiles:healthAvailable?results!.miles:null;
   const steps=manualSteps.trim()?Number(manualSteps.trim()):phoneSteps??results?.steps??null;
   if(steps!==null&&(!Number.isInteger(steps)||steps<0||steps>150000))throw Error('Enter a valid step count.');
   const {error}=await supabase.from('freestyle_sessions').insert({
    user_id:user.id,activity_type:kind.toLowerCase(),duration_seconds:seconds,
    steps,distance_miles:miles,
    distance_source:gpsAvailable?'gps':healthAvailable?'health':'none'
   });
   if(error)throw error;
   setSaved(true);setSaveMessage('Activity saved to your Soulanova account.');
   await loadRecent();
  }catch(e){setSaveMessage('Could not save activity: '+(e instanceof Error?e.message:String(e)))}
  finally{setSaving(false);savingLock.current=false}
 };
 const [gpsEnabled,setGpsEnabled]=useState(false),[gpsMiles,setGpsMiles]=useState(0),[gpsMessage,setGpsMessage]=useState('GPS optional. Enable before starting.'),[gpsBusy,setGpsBusy]=useState(false);
 useEffect(()=>{if(!gpsEnabled)return;const id=setInterval(()=>{void readGps().then(t=>setGpsMiles(t.meters/1609.344))},2500);return()=>clearInterval(id)},[gpsEnabled]);
 const enableGps=async():Promise<boolean>=>{
  setGpsBusy(true);
  try{
   let fg=await Location.getForegroundPermissionsAsync();
   if(fg.status!=='granted')fg=await Location.requestForegroundPermissionsAsync();
   if(fg.status!=='granted')throw Error('Location permission denied. Enable location in Settings to record GPS distance.');
   let bg=await Location.getBackgroundPermissionsAsync();
   if(bg.status!=='granted')bg=await Location.requestBackgroundPermissionsAsync();
   if(bg.status!=='granted')throw Error('Background location permission denied. The timer still works without GPS; enable Always location access in Settings to record routes.');
   if(!await Location.isBackgroundLocationAvailableAsync())throw Error('Background GPS unavailable; install the latest development build.');
   setGpsEnabled(true);setGpsMessage('GPS tracking enabled automatically.');
   return true;
  }catch(e){setGpsEnabled(false);setGpsMessage(e instanceof Error?e.message:String(e));return false}
  finally{setGpsBusy(false)}
 };
 const elapsed=()=>Math.round((segments.current.reduce((a,s)=>a+s.end-s.start,0)+(active.current?Date.now()-active.current:0))/1000);
 useEffect(()=>{if(!running)return;const id=setInterval(()=>setSeconds(elapsed()),1000);return()=>clearInterval(id)},[running]);
 const start=()=>{active.current=Date.now();setRunning(true)};
 const pause=()=>{if(active.current){segments.current.push({start:active.current,end:Date.now()});active.current=null;}setSeconds(elapsed());setRunning(false)};
 const finish=()=>{pause();setDone(true);setMessage('Finished. Read activity to get the available steps and distance for this session.')};
 const reset=()=>{setPhoneSteps(null);setPedometerStatus('Phone step counting will start with your walk.');setManualSteps('');setSaved(false);setSaveMessage('');active.current=null;segments.current=[];setRunning(false);setDone(false);setSeconds(0);setResults(null);setMessage('Ready for another activity.')};
 const gpsStart=async()=>{
  if(gpsBusy)return;
  if(Platform.OS==='ios'){
   try{if(await Pedometer.isAvailableAsync()){const p=await Pedometer.requestPermissionsAsync();if(!p.granted)setPedometerStatus('Motion access not granted; GPS and timer still work.')}else setPedometerStatus('Phone step sensor unavailable.')}catch(e){setPedometerStatus('Phone step sensor unavailable.')}}
  const permissionReady=gpsEnabled||await enableGps();
  if(permissionReady){
   try{
    if(!segments.current.length&&!active.current){
     await beginGps();
     await Location.startLocationUpdatesAsync(GPS_TASK,{accuracy:Location.Accuracy.High,distanceInterval:5,showsBackgroundLocationIndicator:true,pausesUpdatesAutomatically:false,foregroundService:{notificationTitle:'Soulanova Walk / Run',notificationBody:'Recording your activity'}});
    }else await setGpsPaused(false);
   }catch(e){setGpsMessage('GPS could not start: '+(e instanceof Error?e.message:String(e)));}
  }
  // Manual timing remains available when location access is denied or unavailable.
  start();
 };
 const gpsPause=async()=>{pause();if(gpsEnabled)await setGpsPaused(true)};
 const gpsFinish=async()=>{pause();void refreshPhoneSteps();if(gpsEnabled){await stopGps();if(await Location.hasStartedLocationUpdatesAsync(GPS_TASK))await Location.stopLocationUpdatesAsync(GPS_TASK);setGpsMiles((await readGps()).meters/1609.344)}setDone(true);setMessage('Activity finished. Read Health data after your watch syncs.')};
 const gpsReset=async()=>{if(await Location.hasStartedLocationUpdatesAsync(GPS_TASK))await Location.stopLocationUpdatesAsync(GPS_TASK);await clearGps();setGpsMiles(0);reset()};
 const read=async()=>{
  if(healthReadLock.current||saved)return;
  healthReadLock.current=true;
  setBusy(true);
  try{
   if(!Health.isAvailable())throw Error('Health data is not available on this device.');
   await Health.requestAuthorization({toRead:[Health.QuantityType.stepCount,Health.QuantityType.distanceWalkingRunning],toShare:[]});
   const spans=[...segments.current];if(active.current)spans.push({start:active.current,end:Date.now()});
   let steps=0,miles=0,hasSteps=false,hasMiles=false;
   for(const span of spans){
    const from=new Date(span.start),to=new Date(span.end);
    if(to<=from)continue;
    try{
     const st=await Health.queryStatistics({type:Health.QuantityType.stepCount,unit:Health.Unit.count,from,to,options:Health.StatisticsOption.cumulativeSum});
     if(typeof st.sum==='number'&&Number.isFinite(st.sum)){steps+=st.sum;hasSteps=true}
    }catch{/* No steps were reported for this interval. */}
    try{
     const di=await Health.queryStatistics({type:Health.QuantityType.distanceWalkingRunning,unit:Health.Unit.meter,from,to,options:Health.StatisticsOption.cumulativeSum});
     if(typeof di.sum==='number'&&Number.isFinite(di.sum)){miles+=di.sum/1609.344;hasMiles=true}
    }catch{/* Distance can be unavailable independently of steps. */}
   }
   setResults({steps:hasSteps?Math.round(steps):null,miles:hasMiles?miles:null});
   setMessage(!hasSteps&&!hasMiles?'No activity samples have synced for this period yet. Try Read Activity again after your watch syncs, or enter steps manually.':!hasSteps?'Distance loaded, but step samples are not available yet. Refresh after watch sync or enter steps manually.':'Health data loaded. Review before saving.');
  }catch(e){setMessage('Cannot read health activity: '+(e instanceof Error?e.message:String(e)))}
  finally{healthReadLock.current=false;setBusy(false)}
 };
 // Foreground refresh only: HealthKit may not have samples until watch sync.
 useEffect(()=>{
  if(done){void read();return;}
  if(!running)return;
  const id=setInterval(()=>{void read()},30000);
  return()=>clearInterval(id);
 },[running,done]);
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
   <Text style={styles.label}>GPS distance: {gpsMiles.toFixed(2)} mi</Text>
   <Text style={styles.note}>GPS starts automatically with your activity when location access is allowed.</Text>
   <Text style={styles.note}>{gpsMessage}</Text>
   <Text style={styles.label}>{kind} {done?'completed':running?'in progress':'ready'}</Text>
   <Text style={styles.clock}>{Math.floor(seconds/3600).toString().padStart(2,'0')}:{Math.floor(seconds%3600/60).toString().padStart(2,'0')}:{(seconds%60).toString().padStart(2,'0')}</Text>
   <View style={styles.metrics}>
    <View style={styles.metric}><Text style={styles.metricLabel}>GPS Miles</Text><Text style={styles.metricValue}>{gpsMiles.toFixed(2)}</Text></View>
    <View style={styles.metric}><Text style={styles.metricLabel}>Steps</Text><Text style={styles.metricValue}>{phoneSteps??results?.steps??'—'}</Text></View>
    <View style={styles.metric}><Text style={styles.metricLabel}>Avg pace</Text><Text style={styles.metricValue}>{gpsMiles>=0.1&&seconds>=120?((seconds/60)/gpsMiles).toFixed(1):'—'}</Text><Text style={styles.metricLabel}>{gpsMiles>=0.1&&seconds>=120?'min/mi':'Calculating…'}</Text></View>
   </View>
   {btn(running?'Tracking…':seconds?'Resume':'Start Tracking',()=>{void gpsStart()},running||done||gpsBusy)}
   {btn('Pause',()=>{void gpsPause()},!running)}
   {btn('Finish',()=>{void gpsFinish()},done||(!running&&seconds===0))}
   {btn('Reset',()=>Alert.alert('Discard activity?','This clears the activity.',[{text:'Cancel'},{text:'Discard',style:'destructive',onPress:()=>{void gpsReset()}}]),running||(!seconds&&!done))}
   {seconds>0&&btn(busy?'Reading…':'Read Activity',()=>{void read()},busy)}
   <Text style={styles.note}>{pedometerStatus}</Text>
   {results&&<Text style={styles.value}>Apple Health: {results.steps??'—'} steps • {results.miles?.toFixed(2)??'—'} mi</Text>}
   {done&&<View style={styles.summaryCard}>
     <Text style={styles.summaryHeading}>{kind} Complete</Text>
     <Text style={styles.summaryNote}>Review your workout before saving to Soulanova.</Text>
     <View style={styles.summaryGrid}>
       <View style={styles.summaryTile}><Text style={styles.summaryKey}>TIME</Text><Text style={styles.summaryNumber}>{Math.floor(seconds/60)}m {seconds%60}s</Text></View>
       <View style={styles.summaryTile}><Text style={styles.summaryKey}>DISTANCE</Text><Text style={styles.summaryNumber}>{gpsMiles>0?gpsMiles.toFixed(2)+' mi':results?.miles!=null?results.miles.toFixed(2)+' mi':'—'}</Text></View>
       <View style={styles.summaryTile}><Text style={styles.summaryKey}>STEPS</Text><Text style={styles.summaryNumber}>{manualSteps.trim()||(phoneSteps??results?.steps??'—')}</Text></View>
       <View style={styles.summaryTile}><Text style={styles.summaryKey}>AVG PACE</Text><Text style={styles.summaryNumber}>{gpsMiles>=0.1&&seconds>=120?((seconds/60)/gpsMiles).toFixed(1)+' min/mi':'—'}</Text></View>
     </View>
     <Text style={styles.note}>Steps from iPhone motion or Apple Health when available. GPS distance may differ from Apple Health.</Text>
     <TextInput accessibilityLabel="Optional manual steps" keyboardType="number-pad" placeholder="Correct steps (optional)" value={manualSteps} onChangeText={setManualSteps} editable={!saving&&!saved} style={styles.stepsInput}/>
     {btn(saved?'Activity Saved':saving?'Saving…':'Save Activity',()=>{void saveFreestyle()},saved||saving)}
     {!!saveMessage&&<Text style={styles.note}>{saveMessage}</Text>}
   </View>}
   <Text style={styles.label}>Your Recent Freestyle Activities</Text>
   {recent.map(x=><Text key={x.id} style={styles.note}>{new Date(x.created_at).toLocaleDateString()} · {x.activity_type} · {Math.round(x.duration_seconds/60)} min · {x.distance_miles??'—'} mi</Text>)}
   {btn(refreshBusy?'Refreshing…':'Refresh Activities',()=>{void loadRecent()},refreshBusy)}
   <Text style={styles.note}>{message}</Text>
   <Text style={styles.note}>Phone sensor steps update while the app is open and can catch up when reopened on iPhone. They do not include watch-only steps.</Text>
   <Text style={styles.note}>Steps refresh about every 30 seconds while this screen is active and once when you finish. Apple Health can report them later after a watch sync; use Read Activity to refresh manually.</Text>
   <Text style={styles.note}>Music: open Spotify, Apple Music, or another player yourself. Soulanova provides no coaching in this mode. This first test reads health measurements during active tracking intervals. Background GPS is experimental and requires a new native build; force-closing the app can interrupt tracking. Saving free activities requires the member account and freestyle_sessions database table.</Text>
  </View>
 </ScrollView>;
}
const styles=StyleSheet.create({summaryCard:{marginTop:22,backgroundColor:'#F1F7F4',borderRadius:18,padding:16},summaryHeading:{fontSize:24,fontWeight:'800',color:'#173238',textAlign:'center'},summaryNote:{color:'#637E73',textAlign:'center',marginTop:5,marginBottom:12},summaryGrid:{flexDirection:'row',flexWrap:'wrap',gap:9},summaryTile:{width:'48%',backgroundColor:'white',padding:13,borderRadius:12},summaryKey:{fontSize:11,fontWeight:'800',color:'#6D817A'},summaryNumber:{color:'#086B63',fontSize:19,fontWeight:'800',marginTop:5},stepsInput:{backgroundColor:'#F7FAF8',borderColor:'#DCE8E2',borderWidth:1,borderRadius:12,padding:14,fontSize:16,marginVertical:12},metrics:{flexDirection:'row',gap:7,marginBottom:16},metric:{flex:1,backgroundColor:'#EAF4F0',borderRadius:12,padding:9,alignItems:'center'},metricLabel:{fontSize:11,color:'#6D817A',fontWeight:'700'},metricValue:{color:teal,fontSize:22,fontWeight:'800'},page:{flex:1,backgroundColor:'#F7F8F5'},content:{padding:22,paddingTop:76,paddingBottom:48},back:{fontSize:16,color:teal,fontWeight:'700',marginBottom:22},title:{fontSize:35,fontWeight:'800',color:'#173238'},sub:{color:'#6C827A',fontSize:16,marginTop:8,marginBottom:18},card:{backgroundColor:'white',padding:20,borderRadius:20,borderWidth:1,borderColor:'#DBE9E2'},row:{flexDirection:'row',gap:12},musicButton:{flex:1,alignItems:'center',justifyContent:'center',paddingVertical:15,borderRadius:12,backgroundColor:'#E5F1EC'},musicText:{color:teal,fontWeight:'800',fontSize:15},choice:{flex:1,padding:15,borderRadius:14,borderColor:'#DCE8E2',borderWidth:1,alignItems:'center'},label:{marginTop:26,textAlign:'center',fontSize:19,color:'#173238',fontWeight:'700'},clock:{textAlign:'center',fontSize:46,fontWeight:'800',color:teal,marginVertical:20},value:{fontSize:19,fontWeight:'700',color:'#173238',textAlign:'center',marginTop:8},button:{backgroundColor:teal,borderRadius:12,padding:16,alignItems:'center',marginBottom:10},buttonText:{color:'white',fontWeight:'800',fontSize:17},note:{fontSize:14,lineHeight:21,color:'#72847C',marginTop:14}});
