'use strict';
// Read-only release preparation. Never deploys, changes credentials or contacts a database.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const gateNames=['currentOriginMemberAcceptance','directRoutesAfterLogout','genuineSessionExpiry','memberSwitchAndReturn','nutritionPrivacyScope','accessModelAcceptance','productionConfigurationAcceptance','monitoringOwnerAndAlertTest','stagedProductionAcceptance','finalProductionAuthorization'];
function assess(evidence={}){
 const gates=gateNames.map(name=>({name,status:evidence[name]?.status==='PASS'&&(name==='finalProductionAuthorization'?evidence[name]?.provenance==='owner-authorization':['real-authenticated','owner-observed','operator-verified','owner-authorization'].includes(evidence[name]?.provenance))&&typeof evidence[name]?.receipt==='string'&&evidence[name].receipt.trim()? 'PASS':'BLOCKED'}));
 return {readyForStaging:gates.filter(g=>!['stagedProductionAcceptance','finalProductionAuthorization'].includes(g.name)).every(g=>g.status==='PASS'),ready:gates.every(g=>g.status==='PASS'),gates};
}
function inspect(){
 const plans=json('app/strength/strengthWorkouts.json'),mappings=json('app/strength/strength-demonstration-mappings.json');
 const programs=json('app/programs/catalogs/programs.json').programs;
 const Core=require(path.join(root,'app/programs/program-core.js'));
 const active=require(path.join(root,'app/strength/strengthRelease.js')).applyDemonstrationMappings(plans.workouts,mappings);
 const assets=json('app/strength/approved-media.json').assets;
 const media=assets.map(a=>({id:a.id,hashMatches:hash(a.file)===a.sha256,sizeMatches:fs.statSync(path.join(root,a.file)).size===a.bytes}));
 const levels=Object.fromEntries(['Beginner','Intermediate','Advanced'].map(l=>[l,active.filter(w=>w.level===l).length]));
 const complete=active.filter(w=>w.exercises.every(e=>Core.media(programs.strength.movements.find(m=>m.id===e.exerciseId)))).length;
 const excluded=Core.media(programs.strength.movements.find(m=>m.id==='STR-053'))===null;
 const stretch=require(path.join(root,'app/stretching/stretchingCatalog.js'));
 const stretchManifest=json('app/stretching/stretchingMediaManifest.json').assets;
 const priorMedia=json('docs/release2/FOUR_PROGRAM_MEDIA_VERIFICATION_2026-11-11.json').hashChecks;
 const stretchMedia=stretch.movements.map(m=>({id:m.id,pinAndPriorReceiptMatch:stretchManifest.some(a=>a.filename===m.file&&a.sha256===m.sha256)&&priorMedia.some(a=>a.id===m.id&&a.sha256===m.sha256&&a.match===true),hosting:'existing content-addressed Supabase public bucket; prior receipt, not a fresh remote hash'}));
 const recipes=json('app/soulfuel/recipe-library/Soulanova_Mediterranean_Recipe_Library/recipes.json');
 const meditation=read('app/meditation.js');
 const sessions=JSON.parse(meditation.match(/const sessions=(\[[^;]+);/)[1]);
 const audio=[...new Set([...meditation.matchAll(/["'](\/app\/[^"']+\.(?:mp3|wav))["']/g)].map(m=>m[1]))];
 const productionDenied=require(path.join(root,'lib/foodscore-preview.js')).enabled({VERCEL:'1',VERCEL_ENV:'production',VERCEL_TARGET_ENV:'production',FOODSCORE_PREVIEW_ENABLED:'true'}, {headers:{host:'soulanova.com'}})===false;
 const nutritionProductionDenied=require(path.join(root,'lib/member-release-scope.js')).nutritionPreview({VERCEL:'1',VERCEL_ENV:'production',VERCEL_TARGET_ENV:'production',VERCEL_PROJECT_ID:'prj_dMMzPIdHf9o5dXuGu8qL3db0fu2I',VERCEL_GIT_COMMIT_REF:'feature/soulfuel-clean-preview-2026-11-09'})===false;
 const soulGolfAbsent=!/soulgolf/i.test(read('app/index.html')+read('app/app.js'));
 const result={levels,workouts:active.length,completeDemonstrationCoverage:complete,STR053Excluded:excluded,STR112Substitutions:mappings.mappings.length,media,stretch:{programs:stretch.routines.length,movements:stretchMedia},meditation:{sessions:sessions.length,packagedAudio:audio.length,allPackaged:audio.every(p=>fs.existsSync(path.join(root,p.slice(1))))},taiChi:{foundationsPackaged:fs.existsSync(path.join(root,'app/videos/Soulanova_Beginner_Tai_Chi_Foundations_10min_v1.mp4'))},recipes:Object.values(recipes.categories).flat().length,foodScoreProductionDenied:productionDenied,nutritionProductionDenied,soulGolfAbsent};
 result.ok=active.length===36&&Object.values(levels).every(n=>n===12)&&complete===36&&excluded&&mappings.mappings.length===10&&media.length===17&&media.every(m=>m.hashMatches&&m.sizeMatches)&&stretch.routines.length===24&&stretchMedia.length===22&&stretchMedia.every(m=>m.pinAndPriorReceiptMatch)&&sessions.length===17&&result.meditation.allPackaged&&result.taiChi.foundationsPackaged&&result.recipes===75&&productionDenied&&nutritionProductionDenied&&soulGolfAbsent;
 return result;
}
if(require.main===module){
 try{const content=inspect(),assessment=assess(json('docs/release2/PRODUCTION_RELEASE_ACCEPTANCE_2026-11-12.json'));
 const commit=cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 console.log(JSON.stringify({commit,content,acceptance:assessment,disposition:content.ok&&assessment.ready?'READY_FOR_EXPLICIT_RELEASE_REVIEW':'BLOCKED_NO_PRODUCTION_ACTION'},null,2));
 process.exitCode=content.ok&&assessment.ready?0:2;
 }catch{console.error('Release preflight failed: required local evidence could not be verified. No deployment performed.');process.exitCode=1;}
}
module.exports={assess,inspect};
