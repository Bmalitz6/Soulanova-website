'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const core=require('../app/notifications/reminders-core.js');
function store(){const rows=new Map();return {getItem:key=>rows.get(key)??null,setItem:(key,value)=>rows.set(key,value)};}
const at=(day=8,hour=12,minute=30)=>new Date(2026,10,day,hour,minute);
const enabled=()=>{const p=core.defaults();p.enabled=true;p.items.find(i=>i.id==='food').enabled=true;return p;};
test('all opt-ins are off by default, including system delivery',()=>{const p=core.defaults();assert.equal(p.enabled,false);assert.equal(p.system,false);assert.ok(p.items.every(i=>!i.enabled));});
test('preferences and delivery claims are private to each local member',()=>{const s=store();core.savePrefs(s,'a',enabled());assert.equal(core.readPrefs(s,'b').enabled,false);assert.equal(core.claimDue(s,'a',enabled(),at()).length,1);assert.equal(core.claimDue(s,'b',enabled(),at()).length,1);});
test('duplicate ticks, tabs, reloads and changed schedule cannot repeat a program the same day',()=>{const s=store(),p=enabled();assert.equal(core.claimDue(s,'a',p,at()).length,1);assert.deepEqual(core.claimDue(s,'a',p,at()),[]);p.items.find(i=>i.id==='food').time='12:31';assert.deepEqual(core.claimDue(s,'a',p,at(8,12,31)),[]);});
test('delivery resumes on the next local calendar day',()=>{const s=store();core.claimDue(s,'a',enabled(),at());assert.equal(core.claimDue(s,'a',enabled(),at(9)).length,1);});
test('signed-out and disabled schedules do not claim or deliver',()=>{const s=store();assert.deepEqual(core.claimDue(s,null,enabled(),at()),[]);assert.deepEqual(core.claimDue(s,'a',core.defaults(),at()),[]);});
test('missed reminders are skipped rather than replayed in a burst',()=>{assert.deepEqual(core.claimDue(store(),'a',enabled(),at(8,12,31)),[]);});
test('malformed ledger is preserved and fails closed',()=>{const s=store();s.setItem(core.ledgerKey('a'),'corrupt');assert.throws(()=>core.claimDue(s,'a',enabled(),at()));assert.equal(s.getItem(core.ledgerKey('a')),'corrupt');});
test('quota failure prevents a delivery claim',()=>{const s=store();s.setItem=()=>{throw Error('quota')};assert.throws(()=>core.claimDue(s,'a',enabled(),at()),/quota/);});
test('invalid preference times cannot be saved',()=>{const p=enabled();p.items[0].time='25:99';assert.throws(()=>core.savePrefs(store(),'a',p),/invalid/);});
test('same-day daylight clock repeat still has one delivery',()=>{const s=store(),p=enabled();p.items.find(i=>i.id==='food').time='01:30';assert.equal(core.claimDue(s,'a',p,at(8,1,30)).length,1);assert.equal(core.claimDue(s,'a',p,at(8,1,30)).length,0);});
