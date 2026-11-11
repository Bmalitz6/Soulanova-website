'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),baseline='36cbbf10a799876e87046f0fa7bb3e58314a6951';
test('premium redesign preserves exact formula, scanner, diary storage and both server gates',()=>{
 for(const file of ['api/foodscore-availability.js','lib/foodscore-preview.js','app/soulfuel/foodscore-core.js','app/soulfuel/food-diary-core.js','app/soulfuel/foodscore-availability.js','app/soulfuel/foodscore-scanner.js']){
  assert.deepEqual(fs.readFileSync(path.join(root,file)),execFileSync('git',['show',baseline+':'+file],{cwd:root}),file);
 }
 const recipeFiles=execFileSync('git',['ls-tree','-r','--name-only',baseline,'app/soulfuel/recipe-library/'],{cwd:root,encoding:'utf8'}).trim().split('\n');assert.equal(recipeFiles.length,8);
 for(const file of recipeFiles){const current=fs.readFileSync(path.join(root,file),'utf8').replace('<script src="/app/member-navigation.js"></script>\n','');assert.equal(current,execFileSync('git',['show',baseline+':'+file],{cwd:root,encoding:'utf8'}),file);}
});
test('every collection photograph has exact provenance, license and checked file hash',()=>{
 const credits=JSON.parse(fs.readFileSync(path.join(root,'app/soulfuel/media/PHOTO_CREDITS.json'),'utf8'));assert.equal(credits.length,5);
 const html=fs.readFileSync(path.join(root,'app/soulfuel/index.html'),'utf8');
 for(const photo of credits){const bytes=fs.readFileSync(path.join(root,photo.file));assert.equal(bytes.subarray(0,2).toString('hex'),'ffd8');assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),photo.sha256);assert.equal(photo.license_url,'https://www.pexels.com/license/');assert.match(photo.source_page,/^https:\/\/www\.pexels\.com\/photo\//);assert.ok(photo.photographer);assert.ok(html.includes('/'+photo.file));assert.ok(html.includes(photo.source_page));}
 assert.doesNotMatch(html,/src="https:\/\/(?:images\.pexels|images\.unsplash)/);assert.ok(credits.reduce((sum,p)=>sum+p.bytes,0)<1000000);
});
