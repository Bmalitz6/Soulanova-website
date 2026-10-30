import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const GPS_TASK='soulanova-freestyle-gps-v1';
const KEY='soulanova-freestyle-gps-data-v1';
type Point={latitude:number;longitude:number;accuracy:number|null;timestamp:number};
type Track={active:boolean;paused:boolean;points:Point[];meters:number};
const empty=():Track=>({active:false,paused:false,points:[],meters:0});
let pending=Promise.resolve();
const rad=(n:number)=>n*Math.PI/180;
const distance=(a:Point,b:Point)=>{const dlat=rad(b.latitude-a.latitude),dlon=rad(b.longitude-a.longitude);const h=Math.sin(dlat/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(dlon/2)**2;return 12742000*Math.atan2(Math.sqrt(h),Math.sqrt(1-h))};
export async function readGps():Promise<Track>{
 try{const value=await AsyncStorage.getItem(KEY);return value?JSON.parse(value) as Track:empty()}catch{return empty()}
}
export async function beginGps(){await AsyncStorage.setItem(KEY,JSON.stringify({...empty(),active:true}))}
export async function setGpsPaused(paused:boolean){const t=await readGps();t.paused=paused;t.points=[];await AsyncStorage.setItem(KEY,JSON.stringify(t))}
export async function stopGps(){const t=await readGps();t.active=false;t.paused=true;await AsyncStorage.setItem(KEY,JSON.stringify(t))}
export async function clearGps(){await AsyncStorage.removeItem(KEY)}
TaskManager.defineTask(GPS_TASK,({data,error})=>{
 if(error){console.warn('SoulWalk GPS:',error.message);return}
 const locations=(data as {locations?:Location.LocationObject[]}|undefined)?.locations??[];
 pending=pending.then(async()=>{
  const t=await readGps();if(!t.active||t.paused)return;
  for(const loc of locations){
   const c=loc.coords;
   if(!Number.isFinite(c.latitude)||!Number.isFinite(c.longitude)||c.accuracy===null||c.accuracy>65)continue;
   const point:Point={latitude:c.latitude,longitude:c.longitude,accuracy:c.accuracy,timestamp:loc.timestamp};
   const last=t.points[t.points.length-1];
   if(last){
    if(point.timestamp<=last.timestamp)continue;
    const meters=distance(last,point),speed=meters/((point.timestamp-last.timestamp)/1000);
    if(meters>0.8&&speed<=9){t.meters+=meters}
   }
   t.points.push(point);
   if(t.points.length>5000)t.points.shift();
  }
  await AsyncStorage.setItem(KEY,JSON.stringify(t));
 }).catch(e=>console.warn('SoulWalk GPS data error',e));
});
