'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('member dashboard cards are one keyboard-accessible click target with no nested actions',()=>{
 const html=read('app/index.html'),cards=[...html.matchAll(/<a class="member-path"[\s\S]*?<\/a>/g)].map(x=>x[0]);
 assert.equal(cards.length,6);
 for(const card of cards){const inner=card.replace(/^<a\b[^>]*>|<\/a>$/g,'');assert.doesNotMatch(inner,/<(?:a|button|input|select)\b/i);assert.match(card,/<img\b/);}
 const css=read('app/member-preview.css');assert.match(css,/\.member-path:focus-visible/);assert.match(css,/\.member-path:hover/);assert.match(css,/\.member-path\{cursor:pointer\}/);
 assert.match(html,/All Workouts directory/);assert.match(html,/data-tab="workouts"/);
 for(const href of ['/app/strength/','/app/stretching/','/app/walking/','/app/soulfuel/','/app/classes/beginner-tai-chi-foundations/','/app/?mode=signin#meditation'])assert.ok(html.includes(`href="${href}"`),href);
});

test('SoulStretch exposes 24 ordered programs, level/body-area browsing, and all approved movements',()=>{
 const catalog=require('../app/stretching/stretchingCatalog.js'),player=read('app/stretching/stretching.js'),page=read('app/stretching/index.html');
 assert.equal(catalog.movements.length,22);assert.equal(catalog.routines.length,24);
 for(const level of ['Beginner','Intermediate','Advanced'])assert.equal(catalog.routines.filter(r=>r.collection==='level'&&r.level===level).length,6);assert.equal(catalog.routines.filter(r=>r.collection==='body-area').length,6);
 assert.deepEqual(Array.from(new Set(catalog.routines.flatMap(r=>r.ids))).sort(),catalog.movements.map(m=>m.id).sort());
 assert.match(page,/22 owner-approved exercise demonstrations/);assert.match(page,/id="level-tabs"/);assert.match(page,/Stretch by Body Area/);assert.match(page,/id="body-area-tabs"/);assert.match(page,/id="narration-enabled"/);assert.match(page,/id="narration-volume"/);
 assert.match(player,/function routineCard\(item\)\{[\s\S]*?document\.createElement\('button'\)/);assert.match(player,/card\.append\(image,copy\)/);assert.match(player,/aria-pressed/);const css=read('app/stretching/stretching.css');assert.match(css,/\.routine:hover/);assert.match(css,/\.routine:focus-visible/);assert.match(css,/\.routines,\.movement-list\{grid-template-columns:minmax\(0,1fr\)\}/);assert.match(player,/video\.addEventListener\('ended',\(\)=>playback\.videoEnded\(\)\)/);assert.match(player,/video\.addEventListener\('seeking'/);assert.match(player,/audio\.currentTime=Math\.min\(video\.currentTime,audio\.duration\)/);assert.match(player,/playback\.tick/);assert.match(page,/stretchingPlayback\.js/);
 const guidance=require('../app/stretching/stretchingGuidance.js');for(const movement of catalog.movements){const cue=guidance[movement.id];assert.ok(cue);for(const field of ['start','form','breathing','core','transition'])assert.ok(cue[field]);assert.equal(cue.audioStatus,'owner-approved');assert.match(cue.audioUrl,/^\/app\/stretching\/narration\/miriam\/.+\.mp3$/);assert.match(cue.audioSha256,/^[a-f0-9]{64}$/);assert.match(movement.thumbnail,/^\/app\/stretching\/thumbnails\/.+\.jpg$/);}assert.match(player,/cue\.audioStatus==='owner-approved'/);assert.match(player,/Approved Miriam narration follows this movement/);
});

test('SoulFuel remains one-click accessible with recipe, planning, diary paths and FoodScore OFF',()=>{
 const dashboard=read('app/index.html'),page=read('app/soulfuel/index.html'),code=read('app/soulfuel/foodscore.js'),availability=read('app/soulfuel/foodscore-availability.js');
 assert.match(dashboard,/href="\/app\/soulfuel\/"/);assert.match(page,/href="\/app\/#free-library">Mediterranean recipes/);assert.match(page,/href="\/app\/#meals">Meal planning/);assert.match(page,/href="#diary">Food diary/);
 assert.match(availability,/enabled: false/);assert.match(code,/lookupEnabled\s*=\s*window\.SoulanovaFoodScoreAvailability\?\.enabled\s*===\s*true/);assert.match(code,/localStorage\.setItem\(keyFor\(memberId\)/);
});

test('Guided and Freestyle SoulWalk retain account context without enabling cloud writes',()=>{
 const guided=read('app/walking/index.html'),guidedJs=read('app/walking/walking.js'),freestyle=read('app/walking/freestyle/index.html'),freestyleJs=read('app/walking/freestyle/freestyle.js'),memberData=read('app/member-data.mjs');
 assert.match(guided,/Guided · 12-Week Journey/);assert.match(guided,/href="\/app\/walking\/freestyle\/"/);assert.match(freestyle,/Freestyle · Walk at your own pace/);
 assert.match(guidedJs,/const accountWritesEnabled=false/);assert.match(memberData,/soulwalk:false/);assert.match(freestyleJs,/await requireMember\(db\)/);
 assert.doesNotMatch(freestyleJs,/\.from\(|\.insert\(|localStorage|sessionStorage/);assert.match(freestyle,/does not save or synchronize Freestyle sessions/);
 assert.match(guidedJs,/next=%2Fapp%2Fwalking%2F/);assert.match(read('app/app.js'),/window\.location\.replace\(destination\)/);
});
