import React,{useEffect,useRef,useState} from 'react';
import {Alert,Linking,Share,StyleSheet,Text,TouchableOpacity,View,AppState} from 'react-native';
import * as Location from 'expo-location';
import {supabase} from './supabase';
import {setBackgroundShare} from './soulsafeBackground';

const TEAL='#086B63';
type LiveSession={id:string;share_token:string;expires_at:string};
const messageOf=(e:unknown)=>e&&typeof e==='object'&&'message'in e?String((e as {message:unknown}).message):String(e);
export default function SoulSafe(){
 const [busy,setBusy]=useState(false);
 const [status,setStatus]=useState('Location is shared only when you choose to send it.');
 const [live,setLive]=useState<LiveSession|null>(null);
 const session=useRef<LiveSession|null>(null);
 const updating=useRef(false);
 useEffect(()=>{let mounted=true;
  const restore=async()=>{if(!supabase)return;
   const {data:{user}}=await supabase.auth.getUser();if(!user||!mounted)return;
   const {data,error}=await supabase.from('soulsafe_sessions').select('id,share_token,expires_at').eq('owner_id',user.id).is('ended_at',null).gt('expires_at',new Date().toISOString()).order('created_at',{ascending:false}).limit(1).maybeSingle();
   if(!error&&data&&mounted){session.current=data as LiveSession;setLive(data as LiveSession);void setBackgroundShare(data as LiveSession);setStatus('An existing live sharing session is active. Use Stop Live Sharing to end it.')}
  };void restore();return()=>{mounted=false}
 },[]);

 const updateLocation=async()=>{
  const current=session.current;
  if(!current||!supabase||updating.current||AppState.currentState!=='active')return;
  if(Date.now()>=new Date(current.expires_at).getTime()){setStatus('Live sharing expired.');await setBackgroundShare(null);session.current=null;setLive(null);return}
  updating.current=true;
  try{
   const p=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced});
   if(session.current?.id!==current.id)return;
   const {error}=await supabase.from('soulsafe_sessions').update({latitude:p.coords.latitude,longitude:p.coords.longitude,accuracy_m:p.coords.accuracy??null,updated_at:new Date().toISOString()}).eq('id',current.id);
   if(error)throw error;
   setStatus('Live location updated at '+new Date().toLocaleTimeString()+'. Keep SoulWalk active for updates outside Freestyle workouts.');
  }catch(e){setStatus('Live sharing update failed: '+messageOf(e))}
  finally{updating.current=false}
 };
 useEffect(()=>{if(!live)return;void updateLocation();const interval=setInterval(()=>{void updateLocation()},15000);return()=>clearInterval(interval)},[live?.id]);
 const shareLocation=async()=>{
  if(busy)return;setBusy(true);
  try{
   let permission=await Location.getForegroundPermissionsAsync();
   if(permission.status!=='granted')permission=await Location.requestForegroundPermissionsAsync();
   if(permission.status!=='granted')throw Error('Location permission is needed to share your position.');
   const position=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.High});
   const {latitude,longitude}=position.coords;
   const url='https://maps.apple.com/?ll='+latitude.toFixed(6)+','+longitude.toFixed(6);
   await Share.share({message:'I am out walking or running with Soulanova. Here is my current location (one-time snapshot, not live tracking): '+url});
   setStatus('Choose your trusted contact to send the location pin.');
  }catch(e){setStatus(messageOf(e))}
  finally{setBusy(false)}
 };
 const startLive=async()=>{
  if(busy||live)return;
  if(!supabase){setStatus('Sign in to your Soulanova account to share live location.');return}
  setBusy(true);
  try{
   const {data:{user},error:authError}=await supabase.auth.getUser();
   if(authError)throw authError;
   if(!user)throw Error('Sign in to your Soulanova account first.');
   let permission=await Location.getForegroundPermissionsAsync();
   if(permission.status!=='granted')permission=await Location.requestForegroundPermissionsAsync();
   if(permission.status!=='granted')throw Error('Location access is needed for live sharing.');
   const {data,error}=await supabase.from('soulsafe_sessions').insert({owner_id:user.id}).select('id,share_token,expires_at').single();
   if(error)throw error;
   const started=data as LiveSession;session.current=started;await setBackgroundShare(started);setLive(started);
   setStatus('Live sharing active for up to two hours. Send your private link to a trusted person. Background updates are supported during an active Freestyle workout when GPS permission is enabled.');
   const url='https://soulanova.com/soulsafe/#token='+encodeURIComponent(started.share_token);
   await Share.share({message:'I chose to share my SoulSafe location with you for up to two hours. This private link can reveal my current location; please do not forward it. '+url});
  }catch(e){setStatus('Could not start live sharing: '+messageOf(e))}
  finally{setBusy(false)}
 };
 const resendLiveLink=async()=>{
  const current=session.current;if(!current)return;
  const url='https://soulanova.com/soulsafe/#token='+encodeURIComponent(current.share_token);
  try{await Share.share({message:'My private SoulSafe live location link (do not forward): '+url})}catch(e){setStatus(messageOf(e))}
 };
 const stopLive=async()=>{
  const current=session.current;
  if(!current||!supabase)return;
  setBusy(true);
  try{
   const {error}=await supabase.from('soulsafe_sessions').update({ended_at:new Date().toISOString()}).eq('id',current.id);
   if(error)throw error;
   await setBackgroundShare(null);session.current=null;setLive(null);setStatus('Live location sharing stopped. The private link no longer shows your location.');
  }catch(e){setStatus('Could not stop sharing. Check your connection and retry: '+messageOf(e))}
  finally{setBusy(false)}
 };
 const callEmergency=()=>Alert.alert('Emergency SOS','If you need emergency assistance, call your local emergency services. Soulanova does not automatically contact anyone.',[
  {text:'Cancel',style:'cancel'},
  {text:'Call 911 (US)',style:'destructive',onPress:()=>{void Linking.openURL('tel:911').catch(()=>Alert.alert('Could not open dialer','Call your local emergency number directly.'))}}
 ]);
 return <View style={styles.card}>
  <Text style={styles.title}>SoulSafe · Walk & Run Safety</Text>
  <Text style={styles.note}>Optional safety tools. Live location sharing is OFF until you explicitly start it.</Text>
  <TouchableOpacity accessibilityRole="button" onPress={()=>{void shareLocation()}} disabled={busy} style={styles.button}>
   <Text style={styles.buttonText}>{busy?'Working…':'Share My Current Location'}</Text>
  </TouchableOpacity>
  <Text style={styles.note}>One-time map pin. Does not follow your movement.</Text>
  {!live?<TouchableOpacity accessibilityRole="button" onPress={()=>{void startLive()}} disabled={busy} style={styles.button}><Text style={styles.buttonText}>Start Live Sharing (2 hours max)</Text></TouchableOpacity>:
   <TouchableOpacity accessibilityRole="button" onPress={()=>{void stopLive()}} disabled={busy} style={[styles.button,styles.sos]}><Text style={styles.buttonText}>Stop Live Sharing</Text></TouchableOpacity>}
  {live&&<TouchableOpacity accessibilityRole="button" onPress={()=>{void resendLiveLink()}} style={styles.button}><Text style={styles.buttonText}>Share Live Link Again</Text></TouchableOpacity>}
  {live&&<Text style={styles.note}>Sharing until {new Date(live.expires_at).toLocaleTimeString()} at the latest. During Freestyle workouts, location can continue updating with your phone locked. A link holder can view your current position until you stop or it expires.</Text>}
  <TouchableOpacity accessibilityRole="button" onPress={callEmergency} style={[styles.button,styles.sos]}><Text style={styles.buttonText}>Emergency SOS · Call 911</Text></TouchableOpacity>
  <Text style={styles.note}>{status}</Text>
  <Text style={styles.note}>Background sharing uses Freestyle GPS while the workout is active and not paused. Guided walks and sharing outside active Freestyle workouts currently require the screen to be open. It does NOT automatically notify contacts or detect falls. Location accuracy, internet service and battery affect updates. Do not rely on it for emergency rescue.</Text>
 </View>
}
const styles=StyleSheet.create({card:{backgroundColor:'#FFFFFF',borderRadius:20,borderWidth:1,borderColor:'#DCE8E2',padding:18,marginTop:16},title:{fontSize:21,fontWeight:'800',color:'#173238'},note:{color:'#697F76',fontSize:13,lineHeight:19,marginTop:10},button:{backgroundColor:TEAL,borderRadius:12,padding:15,alignItems:'center',marginTop:14},buttonText:{fontSize:15,fontWeight:'800',color:'#FFFFFF'},sos:{backgroundColor:'#9B3232'}});
