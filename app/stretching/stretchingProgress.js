'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.SoulStretchProgress=api;})(typeof globalThis==='undefined'?this:globalThis,()=>{
 const key=memberId=>'soulanova-stretch-history-v1:'+(memberId||'guest');
 function read(storage,memberId){const raw=storage.getItem(key(memberId));if(raw===null)return [];const entries=JSON.parse(raw);if(!Array.isArray(entries)||entries.some(e=>!e||typeof e!=='object'||typeof e.title!=='string'||typeof e.routineId!=='string'||!Number.isFinite(Date.parse(e.completedAt))))throw Error('Existing stretching history could not be read.');return entries;}
 // Caller serializes read/append/write across tabs with a Web Lock. Never truncate legacy records.
 function append(storage,memberId,item){const entries=read(storage,memberId);if(!item.completionId)throw Error('Completion identity is required.');if(entries.some(e=>e.completionId===item.completionId))return {entries,saved:false};const next=[item,...entries];storage.setItem(key(memberId),JSON.stringify(next));return {entries:next,saved:true};}
 function workoutSession(memberId,item){if(!memberId)throw Error('Sign in before syncing history.');if(!item.completionId||!Number.isInteger(item.minutes)||item.minutes<1||item.minutes>300)throw Error('Invalid completion.');return {id:item.completionId,user_id:memberId,workout_name:item.title,category:'Stretching',duration_minutes:item.minutes,completed_at:item.completedAt};}
 return {key,read,append,workoutSession};
});
