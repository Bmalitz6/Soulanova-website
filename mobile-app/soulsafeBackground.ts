import AsyncStorage from '@react-native-async-storage/async-storage';
import {supabase} from './supabase';

const KEY='soulsafe-background-session-v1';
type ActiveShare={id:string;expires_at:string};
export async function setBackgroundShare(s:ActiveShare|null){if(s)await AsyncStorage.setItem(KEY,JSON.stringify(s));else await AsyncStorage.removeItem(KEY)}
export async function backgroundSharePoint(latitude:number,longitude:number,accuracy:number|null,timestamp:number){
 if(!supabase)return;
 const raw=await AsyncStorage.getItem(KEY);if(!raw)return;
 let share:ActiveShare;
 try{share=JSON.parse(raw) as ActiveShare}catch{await setBackgroundShare(null);return}
 if(!share?.id||!share.expires_at||Date.now()>=Date.parse(share.expires_at)){await setBackgroundShare(null);return}
 // The database enforces owner-only updates, terminal revocation and expiration.
 const {error}=await supabase.from('soulsafe_sessions').update({latitude,longitude,accuracy_m:accuracy,updated_at:new Date(timestamp).toISOString()}).eq('id',share.id).is('ended_at',null).gt('expires_at',new Date().toISOString());
 if(error)console.warn('SoulSafe background update failed:',error.message);
}
export async function endBackgroundShare(){
 if(!supabase)throw Error('Account connection unavailable');
 const raw=await AsyncStorage.getItem(KEY);if(!raw)return;
 const session=JSON.parse(raw) as ActiveShare;
 const {error}=await supabase.from('soulsafe_sessions').update({ended_at:new Date().toISOString()}).eq('id',session.id).is('ended_at',null);
 if(error)throw error;
 await setBackgroundShare(null);
}
