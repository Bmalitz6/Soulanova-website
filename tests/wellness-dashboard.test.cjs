'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),Core=require('../app/wellness/dashboard-core.js'),Units=require('../app/soulfuel/metrics/units.js'),Health=require('../app/soulfuel/metrics/metrics-core.js');
function storage(){const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),data};}
test('wellness defaults, show/hide/reorder and restore preserve personal references',()=>{
 let p=Core.defaults();assert.deepEqual(p.visible,['steps','heartRate','calories','protein','carbs','exercise']);assert.equal(p.order.length,12);p=Core.visibility(p,'fat',true);assert.ok(p.visible.includes('fat'));p=Core.visibility(p,'heartRate',false);assert.ok(!p.visible.includes('heartRate'));p=Core.move(p,'heartRate',-1);assert.equal(p.order[0],'heartRate');p.goals.steps=8000;const restored=Core.restore(p);assert.deepEqual(restored.visible,Core.DEFAULT);assert.equal(restored.goals.steps,8000);assert.deepEqual(p.visible.includes('fat'),true);
});
test('wellness preferences remain member-local with readback and invalid data protection',()=>{
 const s=storage(),p=Core.visibility(Core.defaults(),'sleep',true);Core.save(s,'unit-member-a',p);assert.ok(Core.read(s,'unit-member-a').visible.includes('sleep'));assert.ok(!Core.read(s,'unit-member-b').visible.includes('sleep'));assert.throws(()=>Core.save(s,null,p));assert.throws(()=>Core.save({getItem:()=>null,setItem(){}},'unit-member-a',p),/persistence/);s.setItem(Core.key('unit-member-a'),'bad');assert.throws(()=>Core.read(s,'unit-member-a'));assert.equal(s.getItem(Core.key('unit-member-a')),'bad');
 for(const bad of [{...p,order:['steps']},{...p,visible:['unknown']},{...p,goals:{heartRate:80}},{...p,goals:{steps:-1}},{...p,goals:{exercise:1441}}])assert.throws(()=>Core.validate(bad));
});
test('wellness nutrition mapping uses only same-day confirmed known diary values',()=>{
 const day='2026-11-10';const diary=[{day,nutritionStatus:'product-data',memberConfirmed:true,calories:80.85,protein:.945,carbs:8.625,fat:4.635},{day,nutritionStatus:'user-supplied',calories:100,protein:null,carbs:0},{day,nutritionStatus:'product-data',memberConfirmed:false,calories:999},{day:'2026-11-09',nutritionStatus:'user-supplied',calories:999}];
 const m=Core.mapData({diary,day});assert.ok(Math.abs(m.calories.value-180.85)<1e-10);assert.equal(m.protein.value,.945);assert.equal(m.protein.partial,true);assert.equal(m.carbs.value,8.625);assert.equal(m.fat.value,4.635);assert.match(m.calories.source,/Manual.*community|community.*Manual/);assert.equal(m.calories.recorded,day);assert.equal(m.distance.value,null);assert.equal(m.sleep.value,null);
 const empty=Core.mapData({day});for(const id of Object.keys(Core.METRICS))assert.equal(empty[id].value,null,id);
 assert.equal(Core.mapData({day,diary:[{day,nutritionStatus:'user-supplied',protein:0}]}).protein.value,0);
});
test('wellness manual readings use actual records and do not sum overlapping workout totals',()=>{
 const day='2026-11-10',health=[{type:'activity',day,source:'manual',values:{steps:2500,minutes:20}},{type:'weight',day,source:'manual',values:{weightKg:72,heightCm:180},calculatedBMI:72/1.8**2},{type:'pulse',day,source:'manual',values:{pulse:62}},{type:'pressure',day,source:'manual',values:{systolic:120,diastolic:80}}],workouts=[{completed_at:'2026-11-10T12:00:00Z',duration_minutes:30}];
 const m=Core.mapData({day,health,workouts});assert.equal(m.steps.value,2500);assert.equal(m.exercise.value,20);assert.equal(m.weight.value,72);assert.equal(m.heartRate.value,62);assert.equal(m.pressure.value,'120 / 80');assert.ok(Math.abs(m.bmi.value-22.222222222)<1e-8);assert.match(m.exercise.source,/Manual/);
 const fallback=Core.mapData({day,workouts});assert.equal(fallback.exercise.value,30);assert.match(fallback.exercise.source,/workout/);assert.equal(fallback.steps.value,null);assert.equal(fallback.calories.value,null);
 assert.equal(Core.mapData({day,health:[{type:'pulse',day,source:'imported',values:{pulse:999}}]}).heartRate.value,null);
});
test('U.S. and Metric canonical conversions use exact constants and derived BMI',()=>{
 const v=Units.toCanonical('weight','us',{weightLb:160,heightFeet:5,heightInches:10});assert.ok(Math.abs(v.weightKg-72.5747792)<1e-10);assert.equal(v.heightCm,177.8);const r=Health.validate({type:'weight',day:'2026-11-10',values:v});assert.ok(Math.abs(r.calculatedBMI-22.9575)<.001);
 const back=Units.toDisplay('weight','us',v);assert.ok(Math.abs(back.weightLb-160)<1e-10);assert.equal(back.heightFeet,5);assert.ok(Math.abs(back.heightInches-10)<1e-10);assert.equal(Units.toCanonical('body','us',{waistIn:32}).waistCm,81.28);
 for(const values of [{weightLb:160,heightFeet:5},{weightLb:160,heightFeet:5,heightInches:12},{weightLb:160,heightFeet:5.5,heightInches:0},{weightLb:NaN},{weightLb:-10}])assert.throws(()=>Health.validate({type:'weight',day:'2026-11-10',values:Units.toCanonical('weight','us',values)}));
 assert.deepEqual(Units.toCanonical('weight','metric',{weightKg:'72',heightCm:'180'}),{weightKg:72,heightCm:180});assert.equal(Units.format('heightCm',182.88,'us'),'6 ft 0 in');assert.match(Units.format('waistCm',81.28,'us'),/32 in/);
});
test('unit preferences are per-member, require readback, and never mutate health rows',()=>{
 const s=storage();Health.save(s,'unit-member-a',{type:'weight',day:'2026-11-10',values:{weightKg:72,heightCm:180}},'w');const prior=s.getItem(Health.memberKey('unit-member-a'));Units.save(s,'unit-member-a','us');assert.equal(Units.read(s,'unit-member-a'),'us');assert.equal(Units.read(s,'unit-member-b'),'metric');assert.equal(s.getItem(Health.memberKey('unit-member-a')),prior);assert.throws(()=>Units.save(s,'unit-member-a','other'));assert.throws(()=>Units.save({setItem(){},getItem:()=>null},'unit-member-a','us'));
});
