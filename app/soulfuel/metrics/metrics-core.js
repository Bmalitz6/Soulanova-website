'use strict';
((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.SoulanovaMetrics=api;})(typeof globalThis==='undefined'?this:globalThis,()=>{
 const TYPES={weight:{label:'Weight & calculated BMI',fields:{weightKg:['Weight','kg',1,500,true],heightCm:['Height for BMI (optional)','cm',50,250,false]}},pressure:{label:'Blood pressure',fields:{systolic:['Systolic','mmHg',40,300,true],diastolic:['Diastolic','mmHg',20,200,true]}},body:{label:'Body measurements',fields:{waistCm:['Waist','cm',1,300,false],hipCm:['Hip','cm',1,300,false],chestCm:['Chest','cm',1,300,false]}},pulse:{label:'Resting pulse',fields:{pulse:['Resting pulse','bpm',20,250,true]}},activity:{label:'Daily activity (manual snapshot)',fields:{steps:['Steps','steps',0,100000,false],minutes:['Activity minutes','min',0,1440,false]}},wellness:{label:'Energy check-in',fields:{energy:['Energy (1 low to 5 high)','of 5',1,5,true]}}};
 const memberKey=id=>{if(typeof id!=='string'||!id.trim())throw Error('A verified member is required.');return 'soulanova-health-metrics-v1:'+id;};
 function dateValid(day){return typeof day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(day)&&Number.isFinite(new Date(day+'T12:00:00Z').getTime())&&new Date(day+'T12:00:00Z').toISOString().slice(0,10)===day;}
 function validate(input){
  if(!input||!Object.hasOwn(TYPES,input.type)||!dateValid(input.day))throw Error('Choose a supported metric and valid date.');
  if(input.bmi!==undefined||input.values?.bmi!==undefined)throw Error('BMI must be calculated from height and weight.');
  const fields=TYPES[input.type].fields,values={};
  for(const key of Object.keys(input.values||{}))if(!Object.hasOwn(fields,key))throw Error('Unsupported measurement field.');
  for(const [key,[label,,min,max,required]]of Object.entries(fields)){
   const raw=input.values?.[key];if(raw===''||raw===undefined||raw===null||typeof raw==='string'&&!raw.trim()){if(required)throw Error(label+' is required.');continue;}
   if(typeof raw!=='string'&&typeof raw!=='number')throw Error('Enter a number for '+label+'.');
   const number=Number(raw);if(!Number.isFinite(number)||number<min||number>max)throw Error(`${label} must be between ${min} and ${max}. These are input limits, not health targets.`);
   if(['steps','energy'].includes(key)&&!Number.isInteger(number))throw Error(label+' must be a whole number.');values[key]=number;
  }
  if(!Object.keys(values).length)throw Error('Enter at least one measurement.');
  if(input.type==='pressure'&&values.systolic<=values.diastolic)throw Error('Systolic must be higher than diastolic. Check the reading.');
  const calculatedBMI=input.type==='weight'&&values.heightCm?values.weightKg/((values.heightCm/100)**2):null;
  return {type:input.type,day:input.day,values,calculatedBMI};
 }
 function read(storage,member){const raw=storage.getItem(memberKey(member));if(raw===null)return [];let rows;try{rows=JSON.parse(raw);}catch{throw Error('Existing metrics could not be read. No data was changed.');}
  if(!Array.isArray(rows)||rows.some(r=>!r||r.ownerId!==member||r.source!=='manual'||typeof r.id!=='string'||!r.id))throw Error('Saved metrics are invalid or belong to another member.');
  if(new Set(rows.map(r=>r.id)).size!==rows.length)throw Error('Duplicate stored metric IDs.');
  for(const row of rows){const checked=validate(row);if(checked.calculatedBMI!==row.calculatedBMI)throw Error('Saved calculated BMI is inconsistent.');}
  return rows;
 }
 function write(storage,member,rows){const key=memberKey(member),serialized=JSON.stringify(rows);storage.setItem(key,serialized);if(storage.getItem(key)!==serialized)throw Error('Persistence could not be confirmed. Reload before retrying.');}
 function save(storage,member,input,id){if(typeof id!=='string'||!id)throw Error('A record ID is required.');const checked=validate(input);let rows=read(storage,member);const record={...checked,id:checked.type==='activity'?'activity:'+checked.day:id,ownerId:member,source:'manual'};if(checked.type==='activity'&&id.startsWith('activity:')&&id!==record.id)rows=rows.filter(r=>r.id!==id);const index=rows.findIndex(r=>r.id===record.id);if(index<0)rows.push(record);else rows[index]=record;write(storage,member,rows);return record;}
 function remove(storage,member,id){const rows=read(storage,member),next=rows.filter(r=>r.id!==id);if(next.length!==rows.length)write(storage,member,next);}
 function trend(rows,type,key){const list=rows.filter(r=>r.type===type&&Number.isFinite(r.values[key])).sort((a,b)=>a.day.localeCompare(b.day));if(!list.length)return null;const first=list[0],last=list[list.length-1];return {count:list.length,latest:last.values[key],change:list.length>1?last.values[key]-first.values[key]:null};}
 return {TYPES,memberKey,validate,read,save,remove,trend};
});
