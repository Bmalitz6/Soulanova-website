'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const Diary=require('../app/soulfuel/food-diary-core.js');
function storage(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)}}
const entry={id:'lookup-1',day:'2026-11-09',meal:'Lunch',calories:200,protein:8,carbs:null,nutritionStatus:'product-data',memberConfirmed:true};
test('tracker includes explicitly confirmed community estimates while curated totals stay separate',()=>{
 const entries=[entry,{...entry,id:'old',memberConfirmed:undefined,calories:900},{...entry,id:'manual',nutritionStatus:'user-supplied',calories:50}];
 const t=Diary.trackerTotals(entries,entry.day);assert.equal(t.totals.calories,250);assert.equal(t.counted.carbs,0);assert.equal(t.communityEntries,1);assert.equal(t.entryCount,2);assert.equal(Diary.dailyTotals(entries,entry.day).totals.calories,50);
});
test('persistence requires exact readback; silent writes and quota errors never report success',()=>{
 const s=storage();s.setItem=()=>{};assert.throws(()=>Diary.saveEntry(s,'a',entry),/persistence/);assert.throws(()=>Diary.writeGoals(s,'a',{calories:2000}),/persistence/);
 s.setItem=()=>{throw Error('quota')};assert.throws(()=>Diary.saveEntry(s,'a',entry),/quota/);
});
test('member-scoped confirmed records persist exactly once after repeated save',()=>{
 const s=storage();Diary.saveEntry(s,'a',entry);Diary.saveEntry(s,'a',entry);assert.equal(Diary.readDiary(s,'a').length,1);assert.deepEqual(Diary.readDiary(s,'b'),[]);assert.equal(Diary.trackerTotals(Diary.readDiary(s,'a'),entry.day).totals.calories,200);assert.equal(Diary.trackerTotals(Diary.readDiary(s,'a'),'2026-11-10').entryCount,0);Diary.deleteEntry(s,'a',entry.id);assert.deepEqual(Diary.readDiary(s,'a'),[]);
});
test('malformed stored record arrays are rejected without overwriting them',()=>{
 const s=storage();s.setItem(Diary.diaryKey('a'),'[null]');assert.throws(()=>Diary.saveEntry(s,'a',entry),/invalid format/);assert.equal(s.getItem(Diary.diaryKey('a')),'[null]');
});
