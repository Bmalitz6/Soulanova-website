'use strict';
// No database calls, member fields, credentials, billing or mutable state.
module.exports=function health(req,res){
 res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='GET'){res.statusCode=405;res.end(JSON.stringify({status:'method-not-allowed'}));return;}
 const env=process.env;res.statusCode=200;
 res.end(JSON.stringify({status:'ok',environment:['production','preview','development'].includes(env.VERCEL_ENV)?env.VERCEL_ENV:'unknown',commit:/^[a-f0-9]{40}$/.test(env.VERCEL_GIT_COMMIT_SHA||'')?env.VERCEL_GIT_COMMIT_SHA:null,nutritionTools:require('../lib/member-release-scope.js').nutritionPreview(env)?'preview-only':'unavailable',foodscoreLookups:require('../lib/foodscore-preview.js').enabled(env,req)?'enabled':'disabled'}));
};
