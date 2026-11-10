'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {progress}=require('../app/soulfuel/tracker-progress.js');
for(const percent of [0,100,101,125,200,375])test(`tracker dial preserves ${percent}% and correct goal state`,()=>{
 const p=progress(percent*2,200);
 assert.equal(p.percent,percent);assert.equal(p.label,String(percent));
 assert.equal(p.state,percent>100?'over':percent===100?'reached':'under');
 assert.equal(p.ring,Math.min(100,percent));
});
test('tracker dial does not invent progress for absent, zero, negative or invalid goals/data',()=>{
 for(const goal of [null,undefined,0,-10,NaN,Infinity]){const p=progress(40,goal);assert.equal(p.state,'unset');assert.equal(p.percent,null);assert.equal(p.label,null);}
 for(const value of [null,undefined,-1,NaN,Infinity]){const p=progress(value,100);assert.equal(p.state,'unknown');assert.equal(p.percent,null);}
});
test('tracker dial does not round a small overflow down to a goal-reached percentage',()=>{
 const p=progress(100.00000000001,100);assert.equal(p.state,'over');assert.ok(Number(p.label)>100);
 assert.equal(progress(99.999,100).state,'under');assert.ok(Number(progress(99.9999999999999,100).label)<100);
});
test('tracker dial extreme arithmetic never renders Infinity or negative progress',()=>{
 const p=progress(Number.MAX_VALUE,Number.MIN_VALUE);assert.equal(p.state,'unknown');assert.equal(p.percent,null);assert.equal(p.ring,0);
});
