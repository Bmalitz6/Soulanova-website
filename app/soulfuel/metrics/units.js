'use strict';
((root,f)=>{const api=f();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.SoulanovaHealthUnits=api;})(typeof globalThis==='undefined'?this:globalThis,()=>{
 const LB_KG=.45359237,IN_CM=2.54;
 const blank=v=>v===null||v===undefined||typeof v==='string'&&!v.trim();
 const num=v=>{if(blank(v))return null;if(!['number','string'].includes(typeof v)||!Number.isFinite(Number(v)))throw Error('Enter a finite measurement.');return Number(v);};
 const prefKey=id=>{if(typeof id!=='string'||!id.trim())throw Error('A verified member is required.');return 'soulanova-health-units-v1:'+id;};
 function read(storage,id){const raw=storage.getItem(prefKey(id));if(raw===null)return 'metric';if(!['metric','us'].includes(raw))throw Error('Saved unit preference is invalid.');return raw;}
 function save(storage,id,unit){if(!['metric','us'].includes(unit))throw Error('Choose U.S. or Metric units.');const key=prefKey(id);storage.setItem(key,unit);if(storage.getItem(key)!==unit)throw Error('Unit preference persistence could not be confirmed.');}
 function toCanonical(type,unit,values){const numeric=Object.fromEntries(Object.entries(values).filter(([,v])=>!blank(v)).map(([k,v])=>[k,num(v)]));if(unit==='metric')return numeric;if(unit!=='us')throw Error('Unknown units.');const out={...numeric};
  if(type==='weight'){
   const lbs=num(values.weightLb),feet=num(values.heightFeet),inches=num(values.heightInches);delete out.weightLb;delete out.heightFeet;delete out.heightInches;
   if(lbs!==null)out.weightKg=lbs*LB_KG;
   if(feet!==null||inches!==null){if(feet===null||inches===null||!Number.isInteger(feet)||feet<0||feet>8||inches<0||inches>=12)throw Error('Enter feet and inches (use 0 inches when needed); inches must be below 12.');out.heightCm=(feet*12+inches)*IN_CM;}
  }
  if(type==='body')for(const name of ['waist','hip','chest']){const value=num(values[name+'In']);delete out[name+'In'];if(value!==null)out[name+'Cm']=value*IN_CM;}
  return out;
 }
 function toDisplay(type,unit,values){if(unit==='metric')return {...values};if(unit!=='us')throw Error('Unknown units.');const out={...values};
  if(type==='weight'){delete out.weightKg;delete out.heightCm;if(values.weightKg!==undefined)out.weightLb=values.weightKg/LB_KG;if(values.heightCm!==undefined){const total=values.heightCm/IN_CM;let feet=Math.floor(total/12),inches=total-feet*12;if(Math.abs(inches-12)<1e-9){feet++;inches=0;}out.heightFeet=feet;out.heightInches=inches;}}
  if(type==='body')for(const name of ['waist','hip','chest']){delete out[name+'Cm'];if(values[name+'Cm']!==undefined)out[name+'In']=values[name+'Cm']/IN_CM;}
  return out;
 }
 function fields(type,unit,types){if(unit!=='us'||!['weight','body'].includes(type))return types[type].fields;
  if(type==='weight')return {weightLb:['Weight','lb',1/LB_KG,500/LB_KG,true],heightFeet:['Height for BMI (optional)','ft',0,8,false],heightInches:['Remaining height (enter 0 when exact feet)','in',0,12,false]};
  return Object.fromEntries(['waist','hip','chest'].map(n=>[n+'In',[n[0].toUpperCase()+n.slice(1),'in',1/IN_CM,300/IN_CM,false]]));
 }
 function format(key,value,unit){const n=v=>Number(v.toFixed(2)).toLocaleString();if(unit==='us'&&key==='weightKg')return n(value/LB_KG)+' lb';if(unit==='us'&&key==='heightCm'){const total=value/IN_CM;let feet=Math.floor(total/12),inches=Math.round((total-feet*12)*100)/100;if(inches===12){feet++;inches=0;}return feet+' ft '+n(inches)+' in';}if(unit==='us'&&['waistCm','hipCm','chestCm'].includes(key))return n(value/IN_CM)+' in';return n(value)+' '+(key==='weightKg'?'kg':['heightCm','waistCm','hipCm','chestCm'].includes(key)?'cm':'');}
 return {LB_KG,IN_CM,prefKey,read,save,toCanonical,toDisplay,fields,format};
});
