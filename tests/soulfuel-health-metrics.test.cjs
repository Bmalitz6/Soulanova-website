'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),Core=require('../app/soulfuel/metrics/metrics-core.js');
function storage(){const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),data};}
const weight={type:'weight',day:'2026-11-10',values:{weightKg:72,heightCm:180}};
test('health BMI is derived from validated metric height and weight; no arbitrary BMI input',()=>{
 assert.ok(Math.abs(Core.validate(weight).calculatedBMI-22.2222222222)<1e-9);
 assert.equal(Core.validate({...weight,values:{weightKg:72}}).calculatedBMI,null);
 for(const values of [{weightKg:0,heightCm:180},{weightKg:72,heightCm:0},{weightKg:Infinity,heightCm:180},{weightKg:72,heightCm:NaN},{weightKg:72,bmi:22},{weightKg:'',heightCm:180}])assert.throws(()=>Core.validate({...weight,values}));
 assert.throws(()=>Core.validate({...weight,bmi:22}));
});
test('health blood pressure, body, activity and energy inputs validate without inventing values',()=>{
 assert.deepEqual(Core.validate({type:'pressure',day:weight.day,values:{systolic:'120',diastolic:'80'}}).values,{systolic:120,diastolic:80});
 for(const values of [{systolic:80,diastolic:120},{systolic:120},{systolic:301,diastolic:80}])assert.throws(()=>Core.validate({type:'pressure',day:weight.day,values}));
 assert.throws(()=>Core.validate({type:'body',day:weight.day,values:{}}));assert.deepEqual(Core.validate({type:'body',day:weight.day,values:{waistCm:80}}).values,{waistCm:80});
 assert.throws(()=>Core.validate({type:'activity',day:weight.day,values:{steps:'   '}}));assert.throws(()=>Core.validate({type:'activity',day:weight.day,values:{steps:-1}}));assert.throws(()=>Core.validate({type:'activity',day:weight.day,values:{steps:1.5}}));assert.throws(()=>Core.validate({type:'activity',day:weight.day,values:{minutes:1441}}));assert.equal(Core.validate({type:'activity',day:weight.day,values:{steps:0}}).values.steps,0);
 assert.throws(()=>Core.validate({type:'wellness',day:weight.day,values:{energy:6}}));assert.throws(()=>Core.validate({...weight,day:'2026-02-30'}));assert.throws(()=>Core.validate({...weight,type:'__proto__'}));
});
test('health records use member namespace and manual source; no anonymous or foreign record access',()=>{
 const s=storage();assert.throws(()=>Core.save(s,null,weight,'one'));Core.save(s,'unit-member-a',weight,'one');assert.equal(Core.read(s,'unit-member-b').length,0);assert.equal(Core.read(s,'unit-member-a')[0].source,'manual');
 const foreign=s.getItem(Core.memberKey('unit-member-a'));s.setItem(Core.memberKey('unit-member-b'),foreign);assert.throws(()=>Core.read(s,'unit-member-b'),/another member/);
});
test('health saves require readback, update once, preserve unrelated records and delete per member',()=>{
 const s=storage();Core.save(s,'unit-member-a',weight,'one');Core.save(s,'unit-member-a',{...weight,values:{weightKg:73,heightCm:180}},'one');assert.equal(Core.read(s,'unit-member-a').length,1);assert.equal(Core.read(s,'unit-member-a')[0].values.weightKg,73);
 Core.save(s,'unit-member-b',weight,'other');Core.remove(s,'unit-member-a','one');assert.equal(Core.read(s,'unit-member-a').length,0);assert.equal(Core.read(s,'unit-member-b').length,1);
 assert.throws(()=>Core.save({getItem:()=>null,setItem(){}},'unit-member-a',weight,'one'),/Persistence/);
 const corrupt=storage();corrupt.setItem(Core.memberKey('unit-member-a'),'bad json');assert.throws(()=>Core.save(corrupt,'unit-member-a',weight,'one'));assert.equal(corrupt.getItem(Core.memberKey('unit-member-a')),'bad json');
});
test('manual daily activity snapshot replaces same date, and trends never combine unrelated fields',()=>{
 const s=storage();Core.save(s,'unit-member-a',{type:'activity',day:weight.day,values:{steps:100}},'one');Core.save(s,'unit-member-a',{type:'activity',day:weight.day,values:{steps:200,minutes:10}},'two');assert.equal(Core.read(s,'unit-member-a').length,1);assert.equal(Core.read(s,'unit-member-a')[0].values.steps,200);
 Core.save(s,'unit-member-a',{...weight,day:'2026-11-09'},'w1');Core.save(s,'unit-member-a',{...weight,values:{weightKg:73}},'w2');assert.deepEqual(Core.trend(Core.read(s,'unit-member-a'),'weight','weightKg'),{count:2,latest:73,change:1});
});
