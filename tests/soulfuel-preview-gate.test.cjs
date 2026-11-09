'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const policy = require('../lib/foodscore-preview.js');
const api = require('../api/foodfacts.js');
const availability = require('../api/foodscore-availability.js');
const host = 'soulfuel-approved.vercel.app';
const approved = {
  VERCEL: '1', VERCEL_ENV: 'preview', VERCEL_TARGET_ENV: 'preview',
  VERCEL_PROJECT_ID: 'prj_dMMzPIdHf9o5dXuGu8qL3db0fu2I',
  VERCEL_GIT_COMMIT_REF: 'feature/soulfuel-preview', VERCEL_GIT_COMMIT_SHA: 'a'.repeat(40),
  FOODSCORE_PREVIEW_APPROVED_BRANCH: 'feature/soulfuel-preview', FOODSCORE_PREVIEW_APPROVED_COMMIT: 'a'.repeat(40),
  VERCEL_URL: host, FOODSCORE_PREVIEW_ENABLED: 'true', FOODSCORE_PREVIEW_APPROVED: 'true', FOODSCORE_PREVIEW_PROTECTION_CONFIRMED: 'true',
};
const request = { method: 'GET', headers: { host, origin: `https://${host}` } };
function response() { return { headers: {}, setHeader(k,v) { this.headers[k]=v; }, end(body) { this.body=body; } }; }
function environment(t, overrides = {}) {
  const keys = {...approved,...overrides}, before = Object.fromEntries(Object.keys(keys).map(k=>[k,process.env[k]]));
  Object.assign(process.env, keys);
  t.after(()=>{ for (const key of Object.keys(keys)) { if(before[key]===undefined) delete process.env[key]; else process.env[key]=before[key]; } });
}
test('exact server-approved project, branch and full commit authorize Preview', () => {
  assert.equal(policy.enabled(approved, request), true);
  assert.equal(policy.enabled(approved, {headers:{host}}), true);
});
test('every missing deployment identity, approval or switch fails closed', () => {
  for (const key of Object.keys(approved)) {
    const env = {...approved}; delete env[key];
    assert.equal(policy.enabled(env, request), false, key);
    assert.equal(policy.enabled({...approved,[key]:''},request),false, key+' empty');
  }
  assert.equal(policy.enabled({}, request),false);
  for(const req of [undefined,{}, {headers:{}}]) assert.equal(policy.enabled(approved,req),false);
});
test('Production and conflicting or unknown platform environments always deny', () => {
  for(const VERCEL_ENV of ['production','development','Preview',''])
    assert.equal(policy.enabled({...approved,VERCEL_ENV},request),false);
  for(const VERCEL_TARGET_ENV of ['production','development','staging',''])
    assert.equal(policy.enabled({...approved,VERCEL_TARGET_ENV},request),false);
  assert.equal(policy.enabled({...approved,VERCEL:'0'},request),false);
});
test('new generated host authorizes only the same approved branch and commit', () => {
  const nextHost='soulfuel-new-deployment.vercel.app';
  const env={...approved,VERCEL_URL:nextHost};
  assert.equal(policy.enabled(env,{headers:{host:nextHost,origin:`https://${nextHost}`}}),true);
  assert.equal(policy.enabled(env,request),false,'old host cannot access new deployment');
  assert.equal(policy.enabled({...env,VERCEL_GIT_COMMIT_SHA:'b'.repeat(40)},{headers:{host:nextHost}}),false);
  assert.equal(policy.enabled({...env,VERCEL_GIT_COMMIT_REF:'main'},{headers:{host:nextHost}}),false);
});
test('wrong project, branch, SHA and malformed approval cannot authorize', () => {
  for(const env of [
    {...approved,VERCEL_PROJECT_ID:'prj_other'},
    {...approved,VERCEL_GIT_COMMIT_REF:'other'},
    {...approved,VERCEL_GIT_COMMIT_SHA:'b'.repeat(40)},
    {...approved,FOODSCORE_PREVIEW_APPROVED_BRANCH:' feature/soulfuel-preview'},
    ...['aaaaaaa','A'.repeat(40),'g'.repeat(40),'a'.repeat(39),'a'.repeat(41)].map(commit=>({...approved,FOODSCORE_PREVIEW_APPROVED_COMMIT:commit,VERCEL_GIT_COMMIT_SHA:commit})),
  ]) assert.equal(policy.enabled(env,request),false);
});
test('Host and Origin are restrictive checks; aliases and malformed platform hosts deny', () => {
  for(const headers of [
    {host:'soulanova.com'}, {host:host+':443'}, {host:'alias.vercel.app'},
    {host,origin:'https://attacker.invalid'}, {host,origin:'null'}, {host,origin:''},
    {host,origin:`http://${host}`}, {host,origin:[`https://${host}`]}, {host:[host]},
  ]) assert.equal(policy.enabled(approved,{headers}),false);
  for(const VERCEL_URL of ['https://'+host,host+'/','evil.vercel.app.attacker.invalid','x.y.vercel.app','-x.vercel.app'])
    assert.equal(policy.enabled({...approved,VERCEL_URL},{headers:{host:VERCEL_URL}}),false);
});
test('spoofed headers, query parameters and body cannot supply server approval', () => {
  const spoof={headers:{host,origin:`https://${host}`,'x-forwarded-host':host,'x-vercel-env':'preview',...approved},
    query:{...approved}, body:{...approved},url:'/api/foodfacts?FOODSCORE_PREVIEW_ENABLED=true'};
  assert.equal(policy.enabled({},spoof),false);
  assert.equal(policy.enabled({...approved,VERCEL_ENV:'production'},spoof),false);
  assert.equal(policy.enabled({...approved,VERCEL_GIT_COMMIT_SHA:'b'.repeat(40)},spoof),false);
  assert.equal(policy.enabled(approved,{headers:{host:'attacker.invalid','x-forwarded-host':host}}),false);
  assert.equal(policy.enabled(approved,{headers:{host,origin:`https://${host}`,'x-forwarded-host':'attacker.invalid'}}),true,'forwarded header ignored');
  assert.equal(policy.enabled({...approved,FOODSCORE_PREVIEW_HOST:host,FOODSCORE_PREVIEW_APPROVED_COMMIT:''},request),false,'legacy hostname flag grants nothing');
});
test('denied API and browser availability never access Redis or OFF', async t => {
  environment(t);
  const before=global.fetch; let calls=0;
  global.fetch=async()=>{calls++;throw Error('must not fetch')}; t.after(()=>{global.fetch=before});
  for(const overrides of [{VERCEL_ENV:'production'},{VERCEL_TARGET_ENV:'production'},{VERCEL_GIT_COMMIT_SHA:'b'.repeat(40)},{FOODSCORE_PREVIEW_ENABLED:'false'},{FOODSCORE_PREVIEW_APPROVED:'false'},{VERCEL_PROJECT_ID:'prj_other'}]) {
    Object.assign(process.env,approved,overrides);
    const res=response(); await api({...request,method:'POST',body:{barcode:'0123456789012'}},res);
    assert.equal(res.statusCode,503);assert.equal(res.headers['Cache-Control'],'no-store');
    const js=response(); availability(request,js); assert.match(js.body,/enabled:false/);assert.equal(js.headers['Cache-Control'],'private, no-store');
  }
  Object.assign(process.env,approved);
  for(const headers of [{host:'attacker.invalid','x-forwarded-host':host},{host,origin:'https://attacker.invalid','x-vercel-env':'preview'}]) {
    const spoof={...request,method:'POST',headers,query:{...approved},body:{barcode:'0123456789012',...approved}};
    const res=response(); await api(spoof,res);assert.equal(res.statusCode,503);
    const js=response();availability({...spoof,method:'GET'},js);assert.match(js.body,/enabled:false/);
  }
  assert.equal(calls,0);
});
test('availability exposes only a boolean and rejects unsupported methods', t => {
  environment(t);
  const res=response(); availability(request,res); assert.match(res.body,/enabled:true/);assert.equal(res.statusCode,200);assert.doesNotMatch(res.body,/TOKEN|APPROVED|vercel|aaaaaa/);
  const denied=response();availability({...request,method:'POST'},denied);assert.equal(denied.statusCode,405);assert.match(denied.body,/enabled:false/);
});
