'use strict';
((root,f)=>{const api=f(typeof module==='object'&&module.exports?require('../soulfuel/food-diary-core.js'):root.SoulanovaFoodDiary);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.SoulanovaWellness=api;})(typeof globalThis==='undefined'?this:globalThis,Diary=>{
 const METRICS={steps:{label:'Steps',unit:'steps',color:'#11796c',goal:true,health:'activity'},heartRate:{label:'Heart Rate',unit:'bpm',color:'#a43f61',health:'pulse'},calories:{label:'Calories Eaten',unit:'kcal',color:'#11796c',goal:true,nutrition:true},protein:{label:'Protein',unit:'g',color:'#2563b3',goal:true,nutrition:true},carbs:{label:'Carbs',unit:'g',color:'#a45a09',goal:true,nutrition:true},fat:{label:'Fat',unit:'g',color:'#8050a9',goal:true,nutrition:true},exercise:{label:'Exercise Minutes',unit:'min',color:'#8050a9',goal:true,health:'activity'},distance:{label:'Walking / Running Distance',unit:'km',color:'#2563b3'},weight:{label:'Weight',unit:'kg',color:'#11796c',health:'weight'},bmi:{label:'BMI',unit:'kg/m²',color:'#2563b3',health:'weight'},pressure:{label:'Blood Pressure',unit:'mmHg',color:'#a43f61',health:'pressure'},sleep:{label:'Sleep Duration',unit:'h',color:'#8050a9'}};
 const DEFAULT=['steps','heartRate','calories','protein','carbs','exercise'];
 const defaults=()=>({order:[...DEFAULT,...Object.keys(METRICS).filter(k=>!DEFAULT.includes(k))],visible:[...DEFAULT],goals:{}});
 function validate(p){if(!p||!Array.isArray(p.order)||p.order.length!==12||new Set(p.order).size!==12||p.order.some(k=>!Object.hasOwn(METRICS,k))||!Array.isArray(p.visible)||new Set(p.visible).size!==p.visible.length||p.visible.some(k=>!Object.hasOwn(METRICS,k))||!p.goals||typeof p.goals!=='object'||Array.isArray(p.goals))throw Error('Saved dashboard layout is invalid.');for(const[k,v]of Object.entries(p.goals))if(!['steps','exercise'].includes(k)||!Number.isFinite(v)||v<=0||v>(k==='steps'?100000:1440))throw Error('Invalid dashboard goal.');return {order:[...p.order],visible:[...p.visible],goals:{...p.goals}};}
 const key=id=>{if(typeof id!=='string'||!id.trim())throw Error('Verified member required.');return 'soulanova-wellness-layout-v1:'+id;};
 function read(storage,id){const raw=storage.getItem(key(id));return raw===null?defaults():validate(JSON.parse(raw));}
 function save(storage,id,p){const value=JSON.stringify(validate(p)),k=key(id);storage.setItem(k,value);if(storage.getItem(k)!==value)throw Error('Dashboard preference persistence could not be confirmed.');}
 function move(p,id,delta){const next=validate(p),index=next.order.indexOf(id),target=index+delta;if(index<0||![1,-1].includes(delta)||target<0||target>=next.order.length)return next;[next.order[index],next.order[target]]=[next.order[target],next.order[index]];return next;}
 function visibility(p,id,show){const next=validate(p);if(!Object.hasOwn(METRICS,id))throw Error('Unknown metric.');next.visible=show?[...new Set([...next.visible,id])]:next.visible.filter(k=>k!==id);return next;}
 const restore=p=>({...defaults(),goals:{...validate(p).goals}});
 const localDay=value=>{const d=new Date(value);if(!Number.isFinite(d.getTime()))return null;return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
 function mapData({diary=[],health=[],workouts=[],day}){
  const result=Object.fromEntries(Object.entries(METRICS).map(([id,m])=>[id,{value:null,unit:m.unit,source:m.nutrition?'Food diary · no confirmed values yet':m.health?'Manual entry · no record yet':'No connected data source',recorded:null}]));
  const totals=Diary.trackerTotals(diary,day),reviewed=diary.filter(r=>r.day===day&&(['verified','user-supplied'].includes(r.nutritionStatus)||r.nutritionStatus==='product-data'&&r.memberConfirmed===true));
  for(const id of ['calories','protein','carbs','fat'])if(totals.counted[id]){const sources=new Set(reviewed.filter(r=>Number.isFinite(r[id])&&r[id]>=0).map(r=>r.nutritionStatus==='product-data'?'Confirmed community estimate':'Manual food diary'));result[id]={value:totals.totals[id],unit:METRICS[id].unit,source:[...sources].join(' + '),recorded:day,partial:totals.counted[id]<totals.entryCount};}
  const latest=(type,predicate=()=>true)=>health.filter(r=>r.type===type&&r.source==='manual'&&predicate(r)).sort((a,b)=>a.day.localeCompare(b.day)).at(-1);
  const put=(id,row,value)=>{if(row&&value!==null&&value!==undefined)result[id]={value,unit:METRICS[id].unit,source:'Manual measurement · browser-local',recorded:row.day};};
  let row=latest('activity',r=>r.day===day);put('steps',row,row?.values.steps);put('exercise',row,row?.values.minutes);
  row=latest('pulse');put('heartRate',row,row?.values.pulse);row=latest('weight');put('weight',row,row?.values.weightKg);row=latest('weight',r=>Number.isFinite(r.calculatedBMI));put('bmi',row,row?.calculatedBMI);row=latest('pressure');put('pressure',row,row?`${row.values.systolic} / ${row.values.diastolic}`:null);
  // A manually entered daily activity snapshot takes precedence; never add the
  // same period's workout minutes on top of it or infer distance/calories burned.
  const completed=workouts.filter(r=>localDay(r.completed_at)===day&&Number.isFinite(r.duration_minutes)&&r.duration_minutes>=0);
  if(result.exercise.value===null&&completed.length)result.exercise={value:completed.reduce((n,r)=>n+r.duration_minutes,0),unit:'min',source:'Saved workout history · member-filtered',recorded:completed.map(r=>r.completed_at).sort().at(-1)};
  return result;
 }
 return {METRICS,DEFAULT,defaults,validate,key,read,save,move,visibility,restore,mapData,localDay};
});
