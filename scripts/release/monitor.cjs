'use strict';
// Operator-run, no external monitoring subscription; no credentials or member payloads.
async function probe(origin,request=fetch){
 const base=new URL(origin);if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash||base.pathname!=='/'||!(/^(?:www\.)?soulanova\.com$/.test(base.hostname)||/^soulanova-website-[a-z0-9]+-soulanova\.vercel\.app$/.test(base.hostname)))throw Error('Expected exact Soulanova deployment origin.');
 const response=await request(new URL('/api/release-health',base),{redirect:'manual',signal:AbortSignal.timeout(15000)});
 if(response.status!==200)return {ok:false,status:response.status,code:[302,307,401,403].includes(response.status)?'PROTECTED_REQUIRES_OPERATOR_AUTH':'HEALTH_HTTP_ERROR'};
 const data=await response.json();return {ok:data.status==='ok'&&['production','preview'].includes(data.environment)&&/^[a-f0-9]{40}$/.test(data.commit||'')&&data.foodscoreLookups==='disabled'&&(data.environment!=='production'||data.nutritionTools==='unavailable'),status:200,environment:data.environment,commit:/^[a-f0-9]{40}$/.test(data.commit||'')?data.commit:null,code:data.status==='ok'?'HEALTH_RESPONSE':'HEALTH_INVALID'};
}
if(require.main===module)probe(process.argv[2]).then(result=>{console.log(JSON.stringify(result));process.exitCode=result.ok?0:2}).catch(()=>{console.error('Release monitor failed; no member data or credentials logged.');process.exitCode=1});
module.exports={probe};
