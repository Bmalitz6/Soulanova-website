'use strict';
((root,f)=>{const api=f();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.SoulanovaPrograms=api;})(globalThis,()=>{
 function media(m){if(!m||!/^[a-f0-9]{64}$/.test(m.sha256||''))return null;if(!m.video)return null;let url;try{url=new URL(m.video);}catch{return null;}if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)return null;
  if(m.approval==='APPROVED MASTER — pinned SHA-256 verified'&&url.origin==='https://www.soulanova.com'&&/^\/app\/strength\/media\/exercises\/Soulanova_Strength_IMG_\d{4}_[A-Za-z_]+_APPROVED\.mp4$/.test(url.pathname))return url.href;
  if(m.approval==='Owner-approved for Production — exact reviewed SHA-256'&&url.origin==='https://dscbavbnlubfmfhudqwy.supabase.co'&&url.pathname.startsWith('/storage/v1/object/public/soulanova-soulstretch-public/soulstretch/'+m.sha256+'/')&&/^IMG_\d{4}\.(mov|mp4)$/.test(url.pathname.split('/').at(-1)))return url.href;
  return null;
 }
 function validate(c){if(c?.schema!==1)throw Error('Unsupported catalog.');for(const p of Object.values(c.programs)){const ids=new Set(p.movements.map(m=>m.id));if(ids.size!==p.movements.length)throw Error('Duplicate movement.');for(const w of p.workouts)if(!w.steps.length||w.steps.some(s=>!ids.has(s.id)))throw Error('Broken program mapping.');}return c;}
 return {media,validate};
});
