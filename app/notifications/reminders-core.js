'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.SoulanovaReminders=api;})(typeof globalThis==='undefined'?this:globalThis,()=>{
  const categories=[['strength','SoulStrength','18:00'],['walking','SoulWalk','09:00'],['meditation','Meditation','20:00'],['stretching','SoulStretch','17:00'],['food','SoulFuel meal','12:30']];
  const defaults=()=>({enabled:false,system:false,items:categories.map(([id,label,time])=>({id,label,time,enabled:false}))});
  function normalize(value){const result=defaults();if(!value||typeof value!=='object')return result;result.enabled=value.enabled===true;result.system=value.system===true;for(const item of result.items){const saved=value.items?.find?.(v=>v?.id===item.id);if(saved){if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(saved.time))throw Error('A reminder time is invalid.');item.time=saved.time;item.enabled=saved.enabled===true;}}return result;}
  const prefsKey=id=>'soulanova-browser-reminders-v1:'+id;
  const ledgerKey=id=>'soulanova-browser-reminders-sent-v1:'+id;
  function readPrefs(storage,id){if(!id)return defaults();const raw=storage.getItem(prefsKey(id));return raw===null?defaults():normalize(JSON.parse(raw));}
  function savePrefs(storage,id,value){if(!id)throw Error('Sign in before saving reminders.');const prefs=normalize(value);storage.setItem(prefsKey(id),JSON.stringify(prefs));return prefs;}
  function localDay(now){return [now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');}
  function claimDue(storage,id,prefs,now){
    if(!id||!prefs.enabled)return [];
    const raw=storage.getItem(ledgerKey(id));const ledger=raw===null?{}:JSON.parse(raw);
    if(!ledger||typeof ledger!=='object'||Array.isArray(ledger)||Object.values(ledger).some(v=>v!==true))throw Error('Reminder history is unreadable. Existing data was preserved.');
    const day=localDay(now),time=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
    const due=prefs.items.filter(i=>i.enabled&&i.time===time&&!ledger[day+':'+i.id]);
    if(!due.length)return [];
    // The caller holds a cross-tab Web Lock. Claim before showing, for at-most-once delivery.
    for(const item of due)ledger[day+':'+item.id]=true;
    const cutoff=new Date(now);cutoff.setDate(cutoff.getDate()-14);const first=localDay(cutoff);
    for(const key of Object.keys(ledger))if(key.slice(0,10)<first)delete ledger[key];
    storage.setItem(ledgerKey(id),JSON.stringify(ledger));return due;
  }
  return {categories,defaults,normalize,prefsKey,ledgerKey,readPrefs,savePrefs,claimDue,localDay};
});
