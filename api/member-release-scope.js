'use strict';
// Public UI scope, not member authentication. Production cannot opt into local nutrition tools.
module.exports=function scope(req,res){
 const nutritionPreview=req.method==='GET'&&require('../lib/member-release-scope.js').nutritionPreview(process.env);
 res.statusCode=req.method==='GET'?200:405;
 res.setHeader('Content-Type','application/javascript; charset=utf-8');res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Content-Type-Options','nosniff');
 res.end(`globalThis.SoulanovaMemberReleaseScope=Object.freeze({nutritionPreview:${nutritionPreview}});`);
};
