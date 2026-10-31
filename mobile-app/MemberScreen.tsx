import React, {useState} from 'react';
import {ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity} from 'react-native';
import {supabase} from './supabase';

export default function MemberScreen({onBack, emailSignedIn}:{onBack:()=>void;emailSignedIn:string|null}) {
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 async function signIn(){
  if(!supabase){setMessage('Supabase connection not configured.');return;}
  if(!email.trim()||!password){setMessage('Enter email and password.');return;}
  setBusy(true);setMessage('');
  try{
   const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
   if(error)throw error;
   setPassword('');setMessage('Signed in successfully.');
  }catch(e){setMessage(e instanceof Error?e.message:'Sign in failed.');}
  finally{setBusy(false);}
 }
 function signOut(){
  Alert.alert('Sign out?','Sign out of your Soulanova account on this phone?',[
   {text:'Cancel',style:'cancel'},
   {text:'Sign Out',style:'destructive',onPress:async()=>{
    if(!supabase)return;
    setBusy(true);
    const {error}=await supabase.auth.signOut();
    setBusy(false);
    setMessage(error?error.message:'Signed out.');
   }}
  ]);
 }
 return <KeyboardAvoidingView style={styles.root} behavior={Platform.OS==='ios'?'padding':undefined}>
  <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
   <TouchableOpacity onPress={onBack}><Text style={styles.back}>‹ Back to Soulanova</Text></TouchableOpacity>
   <Text style={styles.heading}>Member Account</Text>
   {emailSignedIn?<>
    <Text style={styles.info}>Signed in as</Text><Text style={styles.email}>{emailSignedIn}</Text>
    <TouchableOpacity style={styles.button} onPress={signOut} disabled={busy}><Text style={styles.buttonText}>Sign Out</Text></TouchableOpacity>
   </>:<>
    <Text style={styles.info}>Sign in with your existing Soulanova account.</Text>
    <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email address" autoCapitalize="none" keyboardType="email-address" autoComplete="email" accessibilityLabel="Email address"/>
    <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry autoComplete="password" accessibilityLabel="Password"/>
    <TouchableOpacity style={styles.button} onPress={signIn} disabled={busy}><Text style={styles.buttonText}>Sign In</Text></TouchableOpacity>
   </>}
   {busy&&<ActivityIndicator color="#086B63"/>}
   {!!message&&<Text accessibilityRole="alert" style={styles.info}>{message}</Text>}
  </ScrollView>
 </KeyboardAvoidingView>;
}
const styles=StyleSheet.create({
 root:{flex:1,backgroundColor:'#F7F8F5'},
 content:{paddingHorizontal:24,paddingTop:Platform.OS==='ios'?78:55,paddingBottom:40},
 back:{fontSize:16,color:'#086B63',fontWeight:'700',marginBottom:26},
 heading:{fontSize:32,fontWeight:'800',color:'#173238',marginBottom:16},
 info:{color:'#607B74',fontSize:15,marginBottom:18},
 email:{fontSize:18,fontWeight:'700',color:'#173238',marginBottom:22},
 input:{backgroundColor:'white',padding:16,borderRadius:12,borderWidth:1,borderColor:'#D9E7E1',fontSize:16,marginBottom:13},
 button:{backgroundColor:'#086B63',padding:17,borderRadius:12,alignItems:'center',marginBottom:18},
 buttonText:{color:'white',fontWeight:'800',fontSize:16}
});
