// Supabase Edge Function: SoulSafe recipient viewer.
// Deploy with: supabase functions deploy soulsafe-view --no-verify-jwt
// The bearer token is a high-entropy UUID generated in Postgres.
const headers={'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; img-src https: data:; base-uri 'none'; frame-ancestors 'none'"};
Deno.serve(async(req)=>{
 const url=new URL(req.url);
 const token=url.searchParams.get('token')??'';
 if(!/^[a-f0-9-]{36}$/i.test(token))return new Response('Invalid SoulSafe link',{status:400});
 const base=Deno.env.get('SUPABASE_URL')??'';
 const anon=Deno.env.get('SUPABASE_ANON_KEY')??'';
 if(!base||!anon)return new Response('Viewer not configured',{status:503});
 const load=async()=>{
  const response=await fetch(base+'/rest/v1/rpc/soulsafe_view',{method:'POST',headers:{apikey:anon,Authorization:'Bearer '+anon,'Content-Type':'application/json'},body:JSON.stringify({token})});
  if(!response.ok)throw new Error('Location unavailable');
  const rows=await response.json();
  return Array.isArray(rows)?rows[0]:null;
 };
 if(url.searchParams.get('data')==='1'){
  try{return Response.json((await load())??{is_active:false},{headers:{'Cache-Control':'no-store','Access-Control-Allow-Origin':'none'}})}
  catch{return Response.json({is_active:false,error:'Unable to refresh'},{status:503,headers:{'Cache-Control':'no-store'}})}
 }
 const doc=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SoulSafe Live Location</title><meta property="og:title" content="SoulSafe Live Location"><meta property="og:description" content="Private, time-limited Soulanova location sharing. Open this link to view the latest position."><meta property="og:type" content="website"><meta name="description" content="Private live location shared via SoulSafe."><meta name="referrer" content="no-referrer"><style>body{font-family:-apple-system,system-ui,sans-serif;background:#f2f7f5;color:#173238;max-width:600px;margin:38px auto;padding:20px}article{background:white;border-radius:18px;padding:22px;box-shadow:0 2px 14px #0001}h1{color:#086b63}a{color:#086b63;font-weight:bold}p{line-height:1.6}.status{font-weight:bold}small{color:#677c75}</style></head><body><article><h1>🛡️ SoulSafe</h1><p>Private live location, shared with your permission by a Soulanova member.</p><div id="status" class="status">Loading location…</div><p id="location"></p><p id="map"></p><small>Refreshes approximately every 15 seconds while this page is open. This is not an emergency response service. If the location is stale, contact the person directly. Do not forward this private link.</small></article><script>const token=${JSON.stringify(token)};async function refresh(){try{const u=new URL(location.href);u.searchParams.set('data','1');const response=await fetch(u,{cache:'no-store'});if(!response.ok)throw Error('Network error');const s=await response.json();const status=document.getElementById('status'),loc=document.getElementById('location'),map=document.getElementById('map');map.replaceChildren();if(!s.is_active){status.textContent='Sharing has ended or the link has expired.';loc.textContent='';return}if(s.latitude==null||s.longitude==null){status.textContent='Sharing is active; waiting for first GPS update.';loc.textContent='';return}const last=s.updated_at?new Date(s.updated_at):null;const age=last?Math.max(0,Math.round((Date.now()-last.getTime())/1000)):null;status.textContent=age!=null&&age>90?'Location may be out of date':'Sharing is active';loc.textContent='Last GPS update: '+(last?last.toLocaleTimeString():'unknown')+(age!=null?' ('+age+' seconds ago)':'')+(s.accuracy_m!=null?' · accuracy approx. '+Math.round(s.accuracy_m)+' meters':'');const a=document.createElement('a');a.textContent='View latest position in Maps';a.target='_blank';a.rel='noopener noreferrer';a.href='https://maps.apple.com/?ll='+encodeURIComponent(s.latitude+','+s.longitude);map.append(a)}catch{document.getElementById('status').textContent='Cannot refresh location; check connection.'}}refresh();setInterval(refresh,15000)</script></body></html>`;
 return new Response(doc,{headers});
});
