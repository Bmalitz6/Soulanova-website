import React,{useState} from 'react';
import {Alert,Linking,Share,StyleSheet,Text,TouchableOpacity,View} from 'react-native';
import * as Location from 'expo-location';

const TEAL='#086B63';
export default function SoulSafe(){
 const [busy,setBusy]=useState(false);
 const [status,setStatus]=useState('Location is shared only when you choose to send it.');
 const shareLocation=async()=>{
  if(busy)return;
  setBusy(true);
  try{
   let permission=await Location.getForegroundPermissionsAsync();
   if(permission.status!=='granted')permission=await Location.requestForegroundPermissionsAsync();
   if(permission.status!=='granted')throw Error('Location permission is needed to share your position.');
   const position=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.High});
   const {latitude,longitude}=position.coords;
   const url='https://maps.apple.com/?ll='+latitude.toFixed(6)+','+longitude.toFixed(6);
   await Share.share({message:'I am out walking or running with Soulanova. Here is my current location (one-time snapshot, not live tracking): '+url,url});
   setStatus('Location sharing sheet opened. Choose your trusted contact to send the pin.');
  }catch(e){setStatus(e instanceof Error?e.message:'Unable to share location.');}
  finally{setBusy(false)}
 };
 const callEmergency=()=>Alert.alert('Emergency SOS','If you need emergency assistance, call your local emergency services. Soulanova does not automatically contact anyone.',[
  {text:'Cancel',style:'cancel'},
  {text:'Call 911 (US)',style:'destructive',onPress:()=>{void Linking.openURL('tel:911').catch(()=>Alert.alert('Could not open dialer','Call your local emergency number directly.'))}}
 ]);
 return <View style={styles.card}>
  <Text style={styles.title}>SoulSafe · Walk & Run Safety</Text>
  <Text style={styles.note}>Optional safety tools for outdoor activity. Nothing is shared automatically.</Text>
  <TouchableOpacity accessibilityRole="button" onPress={()=>{void shareLocation()}} disabled={busy} style={styles.button}>
   <Text style={styles.buttonText}>{busy?'Getting current location…':'Share My Current Location'}</Text>
  </TouchableOpacity>
  <Text style={styles.note}>Sends one map pin using the iPhone or Android share sheet. It does not follow your movement or alert contacts automatically.</Text>
  <TouchableOpacity accessibilityRole="button" onPress={callEmergency} style={[styles.button,styles.sos]}>
   <Text style={styles.buttonText}>Emergency SOS · Call 911</Text>
  </TouchableOpacity>
  <Text style={styles.note}>{status}</Text>
  <Text style={styles.note}>Live location links, trusted-contact alerts, and missed check-ins are planned but not yet enabled. In an emergency, use your phone's emergency features.</Text>
 </View>
}
const styles=StyleSheet.create({card:{backgroundColor:'#FFFFFF',borderRadius:20,borderWidth:1,borderColor:'#DCE8E2',padding:18,marginTop:16},title:{fontSize:21,fontWeight:'800',color:'#173238'},note:{color:'#697F76',fontSize:13,lineHeight:19,marginTop:10},button:{backgroundColor:TEAL,borderRadius:12,padding:15,alignItems:'center',marginTop:14},buttonText:{fontSize:15,fontWeight:'800',color:'#FFFFFF'},sos:{backgroundColor:'#9B3232'}});
