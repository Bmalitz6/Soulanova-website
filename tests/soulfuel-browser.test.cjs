'use strict';
// Run with SOULFUEL_PLAYWRIGHT_PATH pointing to an externally installed Playwright.
// All API/auth traffic is mocked; this harness cannot contact Redis or OFF.
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const fixture=require('./fixtures/soulfuel-product.json');
const enabled=Boolean(process.env.SOULFUEL_PLAYWRIGHT_PATH);
let server,browser,origin;const requests=[];
before(async()=>{
 if(!enabled)return;
 server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/foodscore-availability'){res.setHeader('Content-Type','application/javascript');res.end('globalThis.SoulanovaFoodScoreAvailability={enabled:false};');return}
  if(url.pathname==='/api/foodfacts'){let body='';req.on('data',d=>body+=d);req.on('end',()=>{requests.push({method:req.method,url:req.url,body:JSON.parse(body)});res.setHeader('Content-Type','application/json');res.end(JSON.stringify({status:1,product:fixture}))});return}
  let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(root+path.sep)){res.writeHead(404).end();return}
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  if(!fs.existsSync(file)){res.writeHead(404).end();return}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.jpg':'image/jpeg','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin=`http://127.0.0.1:${server.address().port}`;
 browser=await require(process.env.SOULFUEL_PLAYWRIGHT_PATH).chromium.launch({headless:true});
});
after(async()=>{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));});
async function open({active=true,width=1280,height=900}={}){
 const context=await browser.newContext({viewport:{width,height}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await context.route('**/*',async route=>{
  const url=route.request().url();
  if(url.includes('cdn.jsdelivr.net')){await route.fulfill({contentType:'application/javascript',body:`let member='test-member-a';window.supabase={createClient:()=>({auth:{onAuthStateChange:fn=>{window.__refreshMember=()=>fn('TOKEN_REFRESHED',{user:{id:member}});window.__switchMember=id=>{member=id;fn(id?'SIGNED_IN':'SIGNED_OUT',id?{user:{id}}:null)}},getUser:async()=>{if(window.__refreshOnSave){window.__refreshOnSave=false;window.__refreshMember();}if(window.__saveAuthGate)await window.__saveAuthGate;return {data:{user:member?{id:member,is_anonymous:window.__anonymous===true}:null},error:window.__authFailed?{message:'Unavailable'}:null}},getSession:async()=>({data:{session:member?{user:{id:member}}:null},error:null})}})};`});return}
  if(url===origin+'/api/foodscore-availability'){await route.fulfill({contentType:'application/javascript',body:`globalThis.SoulanovaFoodScoreAvailability={enabled:${active}};`});return}
  if(!url.startsWith(origin+'/')){await route.abort();throw Error('External network blocked in test')}
  await route.continue();
 });
 await page.goto(origin+'/app/soulfuel/');await page.waitForFunction(()=>document.querySelector('#entry-name')?.disabled===false);return {page,context,errors};
}
async function expand(page,id){if(id==='manual-entry-panel'){await page.locator('#manual-tab').click();return}const panel=page.locator('#'+id);if(await panel.count() && !await panel.evaluate(e=>e.open))await panel.locator('summary').first().click();}
const opts={skip:!enabled};
test('browser: default-off makes no lookup; desktop/iPhone layouts have no horizontal overflow',opts,async()=>{
 requests.length=0;
 for(const [width,height] of [[1280,900],[390,844],[320,740]]){
  const {page,context,errors}=await open({active:false,width,height});assert.equal(await page.locator('#foodscore-lookup').isVisible(),false);
  await page.locator('a[href="#foodscore"]').first().click();assert.equal(requests.length,0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`overflow ${width}`);
  assert.equal(await page.locator('.recipe-category-card').count(),4);assert.deepEqual(errors,[]);
  await page.evaluate(async()=>{await Promise.all([...document.images].map(img=>{img.loading='eager';return img.decode().catch(()=>{});}));});
  await page.screenshot({path:`/private/tmp/soulfuel-upgrade-${width}.png`,fullPage:true});
  await context.close();
 }
});
test('browser: manual barcode → mock product → reviewed portion → readback-confirmed tracker and no duplicate',opts,async()=>{
 requests.length=0;const {page,context,errors}=await open();
 await expand(page,'goal-editor');await page.locator('#goal-calories').fill('2000');await page.locator('#goal-protein').fill('80');await page.locator('#nutrition-goals-form button[type="submit"]').click();
 await page.locator('#scan-tab').click();await page.locator('#barcode').fill('0123456789012');await page.locator('#lookup-button').click();await page.waitForSelector('#save-food');
 assert.match(await page.locator('.score-gauge').getAttribute('aria-label'),/90 out of 100/);
 assert.match(await page.locator('#result').textContent(),/staging · Test data only/);
 assert.equal(await page.locator('#result .attrib a').first().getAttribute('href'),'https://world.openfoodfacts.net/product/0123456789012');
 assert.match(await page.locator('#camera-status').textContent(),/manually/);
 await page.locator('#product-grams').fill('75');assert.match(await page.locator('#portion-preview').textContent(),/112.5 kcal/);
 await page.locator('#save-food').click();assert.match(await page.locator('#product-save-status').textContent(),/Confirm the product/);
 await page.locator('#product-confirm').check();await page.locator('#save-food').click();assert.match(await page.locator('#product-save-status').textContent(),/Saved and read back/);
 assert.match(await page.locator('.total-calories').textContent(),/112.5/);assert.match(await page.locator('.total-calories .dial-goal').textContent(),/2,000 kcal/);assert.equal(await page.locator('.total-calories .dial-percent').textContent(),'5.625%');
 const entries=await page.evaluate(()=>JSON.parse(localStorage.getItem('soulanova-foodscore-diary-v1:test-member-a')));assert.equal(entries.length,1);assert.equal(entries[0].memberConfirmed,true);assert.equal(entries[0].protein,6);assert.equal(entries[0].sourceUrl,'https://world.openfoodfacts.net/product/0123456789012');assert.equal(entries[0].source,'Open Food Facts staging (test data)');
 assert.equal(await page.locator('#save-food').isDisabled(),true);assert.equal(requests.length,1);assert.deepEqual(requests[0],{method:'POST',url:'/api/foodfacts',body:{barcode:'0123456789012'}});
 await page.screenshot({path:'/private/tmp/soulfuel-upgrade-mocked-score.png',fullPage:true});
 await page.reload();await page.waitForFunction(()=>document.querySelector('#entry-name').disabled===false);assert.match(await page.locator('.total-calories').textContent(),/112.5/);assert.deepEqual(errors,[]);await context.close();
});
test('browser: account switch isolates diary/goals and delayed lookup result cannot enter another account',opts,async()=>{
 const {page,context}=await open();await expand(page,'manual-entry-panel');await page.locator('#entry-name').fill('Member A oats');await page.locator('#entry-calories').fill('100');await page.locator('#save-entry').click();
 await expand(page,'goal-editor');await page.locator('#goal-calories').fill('2000');await page.locator('#nutrition-goals-form button[type="submit"]').click();
 let finish;const delayed=new Promise(resolve=>finish=resolve);await page.route('**/api/foodfacts',async route=>{await delayed;await route.fulfill({contentType:'application/json',body:JSON.stringify({status:1,product:fixture})})});
 await page.locator('#scan-tab').click();await page.locator('#barcode').fill('0123456789012');await page.locator('#lookup-button').click();
 await page.evaluate(()=>window.__switchMember('test-member-b'));finish();await page.waitForTimeout(100);
 assert.equal(await page.locator('#result').isVisible(),false);assert.equal(await page.locator('#goal-calories').inputValue(),'');assert.doesNotMatch(await page.locator('#diary-list').textContent(),/Member A oats/);
 await page.evaluate(()=>window.__switchMember('test-member-a'));assert.match(await page.locator('#diary-list').textContent(),/Member A oats/);assert.equal(await page.locator('#goal-calories').inputValue(),'2000');await context.close();
});
test('browser: failed local writes do not announce success or reset the manual entry',opts,async()=>{
 const {page,context}=await open();await page.evaluate(()=>{Storage.prototype.setItem=function(){throw Error('quota')};});
 await expand(page,'manual-entry-panel');await page.locator('#entry-name').fill('Keep this entry');await page.locator('#entry-calories').fill('50');await page.locator('#save-entry').click();
 assert.match(await page.locator('#auth-state').textContent(),/persistence could not be confirmed/);assert.equal(await page.locator('#entry-name').inputValue(),'Keep this entry');assert.doesNotMatch(await page.locator('#diary-message').textContent(),/Entry saved/);await context.close();
});
test('browser: default and mock-product states meet automated WCAG A/AA checks', {skip:!enabled||!process.env.SOULFUEL_AXE_PATH}, async()=>{
 const {page,context}=await open({active:false,width:390,height:844});
 const AxeBuilder=require(process.env.SOULFUEL_AXE_PATH).default;
 let results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(results.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);
 await context.close();const second=await open();await second.page.locator('#barcode').fill('0123456789012');await second.page.locator('#lookup-button').click();await second.page.waitForSelector('#save-food');
 results=await new AxeBuilder({page:second.page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(results.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);await second.context.close();
});
test('browser: premium hierarchy keeps four primary metrics and reveals secondary controls by keyboard',opts,async()=>{
 const {page,context}=await open({active:false,width:390,height:844});
 assert.deepEqual(await page.locator('main > section[id]').evaluateAll(els=>els.map(e=>e.id)),['program-overview','diary','foodscore','recipe-library','nutrition-goals']);
 assert.equal(await page.locator('.hero-actions a').count(),2);assert.equal(await page.locator('.fuel-grid').count(),0);
 assert.equal(await page.locator('#diary-totals > .total-item').count(),4);assert.equal(await page.locator('#secondary-totals > .total-item').count(),2);
 assert.equal(await page.locator('#secondary-totals').isVisible(),false);await page.locator('.secondary-metrics > summary').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#secondary-totals').isVisible(),true);
 assert.equal(await page.locator('#entry-name').isVisible(),false);await page.locator('#scan-tab').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#entry-name').isVisible(),true);
 assert.equal(await page.locator('#entry-fiber').isVisible(),false);await page.locator('#manual-entry-form .secondary-fields > summary').click();assert.equal(await page.locator('#entry-fiber').isVisible(),true);
 assert.equal(await page.locator('#goal-calories').isVisible(),false);await expand(page,'goal-editor');assert.equal(await page.locator('#goal-calories').isVisible(),true);assert.equal(await page.locator('#goal-water').isVisible(),false);
 for(const selector of ['.hero-actions a','.section-nav a','.diary-date-nav button','.food-tabs button','#goal-editor > summary'])for(const element of await page.locator(selector).all()){const box=await element.boundingBox();assert.ok(box.height>=44,selector+' touch target');}
 await context.close();
});
test('browser: collapsed manual editor still supports edit/delete and keeps source details accessible',opts,async()=>{
 const {page,context}=await open({active:false});await expand(page,'manual-entry-panel');await page.locator('#entry-name').fill('Mediterranean lunch');await page.locator('#entry-calories').fill('400');await page.locator('#entry-protein').fill('15');await page.locator('#save-entry').click();
 assert.match(await page.locator('.total-calories').textContent(),/400/);await page.locator('#scan-tab').click();
 await page.locator('#diary-list button').getByText('Edit',{exact:true}).click();assert.equal(await page.locator('#entry-name').isVisible(),true);await page.locator('#entry-calories').fill('450');await page.locator('#save-entry').click();assert.match(await page.locator('.total-calories').textContent(),/450/);
 assert.equal(await page.locator('.entry-nutrition-details').count(),1);await page.locator('.entry-nutrition-details > summary').click();assert.match(await page.locator('.entry-nutrition-details').textContent(),/Manual entry/);
 await page.locator('#diary-list button').getByText('Delete',{exact:true}).click();assert.equal(await page.locator('.entryrow').count(),0);assert.equal(await page.locator('.total-calories strong').getAttribute('aria-label'),'Calories: 0 kcal');await context.close();
});

test('browser: tracker goal states, overflow, edit/delete, missing data and live goal changes',opts,async()=>{
 const {page,context}=await open({active:false});
 await page.locator('#diary-date').fill('2026-11-09');
 const seed=async(value,goal=100)=>{
  await page.evaluate(({value,goal})=>{
   localStorage.setItem('soulanova-food-diary-goals-v1:test-member-a',JSON.stringify({calories:goal,protein:goal,carbs:goal,fat:goal}));
   localStorage.setItem('soulanova-foodscore-diary-v1:test-member-a',JSON.stringify([{id:'dial-fixture',type:'manual',nutritionStatus:'user-supplied',name:'Dial test meal',day:'2026-11-09',meal:'Lunch',calories:value,protein:value,carbs:value,fat:value}]));
  },{value,goal});
  await page.locator('#diary-date').dispatchEvent('change');
 };
 for(const value of [0,100,101,125,200,375]){
  await seed(value);
  for(const nutrient of ['calories','protein','carbs','fat']){
   const dial=page.locator('.total-'+nutrient);
   assert.equal(await dial.locator('.dial-percent').textContent(),value+'%');
   assert.match(await dial.locator('.dial-graphic').getAttribute('aria-label'),new RegExp(value+'%'));
   assert.equal(await dial.locator('.dial-overflow').count(),value>100?1:0);
   assert.equal(await dial.locator('.dial-state').textContent(),value>100?'Over Goal':value===100?'Goal Reached ✓':'Of your goal');
  }
 }
 await seed(125);await page.locator('#diary-list button').getByText('Edit',{exact:true}).click();
 assert.equal(await page.locator('#manual-tab').getAttribute('aria-selected'),'true');
 await page.locator('#entry-calories').fill('101');await page.locator('#save-entry').click();assert.equal(await page.locator('.total-calories .dial-percent').textContent(),'101%');assert.equal(await page.locator('.entryrow').count(),1);
 await expand(page,'goal-editor');await page.locator('#goal-calories').fill('202');await page.locator('#nutrition-goals-form button[type=submit]').click();assert.equal(await page.locator('.total-calories .dial-percent').textContent(),'50%');
 await page.locator('#diary-list button').getByText('Delete',{exact:true}).click();assert.equal(await page.locator('.total-calories .dial-percent').textContent(),'0%');
 await page.locator('#clear-goals').click();assert.equal(await page.locator('.total-calories .dial-percent').textContent(),'—');assert.match(await page.locator('.total-calories').textContent(),/Not Set.*Set Goal/);
 await page.locator('.total-calories .dial-state').click();assert.equal(await page.locator('#goal-calories').isVisible(),true);
 await seed(null);assert.equal(await page.locator('.total-calories .dial-percent').textContent(),'—');assert.match(await page.locator('.total-calories .dial-graphic').getAttribute('aria-label'),/Unavailable/);
 await context.close();
});

test('browser: colorful tracker and tabbed scanner fit desktop and narrow iPhone layouts',opts,async()=>{
 for(const width of [1280,390,320]){
  const {page,context}=await open({active:false,width,height:900});
  await page.evaluate(async()=>{await Promise.all([...document.images].map(img=>{img.loading='eager';return img.decode().catch(()=>{});}));});
  await page.evaluate(()=>{
   localStorage.setItem('soulanova-food-diary-goals-v1:test-member-a',JSON.stringify({calories:2000,protein:100,carbs:200,fat:60}));
   localStorage.setItem('soulanova-foodscore-diary-v1:test-member-a',JSON.stringify([{id:'visual-fixture',type:'manual',nutritionStatus:'user-supplied',name:'Visual test meal',day:document.querySelector('#diary-date').value,meal:'Lunch',calories:1500,protein:100,carbs:150,fat:30}]));
  });await page.locator('#diary-date').dispatchEvent('change');
  const boxes=await page.locator('#diary-totals .tracker-dial').evaluateAll(els=>els.map(e=>({x:e.offsetLeft,y:e.offsetTop})));
  assert.equal(new Set(boxes.map(b=>b.y)).size,width===1280?1:2);
  assert.equal(new Set(boxes.map(b=>b.x)).size,width===1280?4:2);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await page.locator('#paused-barcode').isDisabled(),true);assert.equal(await page.locator('#scanner-paused-preview button').first().isDisabled(),true);
  await page.screenshot({path:`/private/tmp/soulfuel-dials-${width}.png`,fullPage:true});
  await page.evaluate(()=>{const key='soulanova-foodscore-diary-v1:test-member-a',rows=JSON.parse(localStorage.getItem(key));rows[0].carbs=250;rows[0].fat=120;localStorage.setItem(key,JSON.stringify(rows));});await page.locator('#diary-date').dispatchEvent('change');
  await page.screenshot({path:`/private/tmp/soulfuel-dials-overflow-${width}.png`,fullPage:true});
  await page.locator('#manual-tab').click();assert.equal(await page.locator('#scan-panel').isVisible(),false);assert.equal(await page.locator('#entry-name').isVisible(),true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  if(width===390)await page.screenshot({path:'/private/tmp/soulfuel-dials-manual-390.png',fullPage:true});
  await page.locator('#manual-tab').focus();await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('#scan-tab').getAttribute('aria-selected'),'true');
  await context.close();
 }
});

test('browser: overflow dials and manual tab pass automated WCAG A/AA', {skip:!enabled||!process.env.SOULFUEL_AXE_PATH},async()=>{
 const {page,context}=await open({active:false,width:320,height:900});
 await page.evaluate(()=>{
  localStorage.setItem('soulanova-food-diary-goals-v1:test-member-a',JSON.stringify({calories:100,protein:100,carbs:100,fat:100}));
  localStorage.setItem('soulanova-foodscore-diary-v1:test-member-a',JSON.stringify([{id:'a11y',type:'manual',nutritionStatus:'user-supplied',name:'Accessibility fixture',day:document.querySelector('#diary-date').value,meal:'Lunch',calories:101,protein:100,carbs:125,fat:200}]));
 });await page.locator('#diary-date').dispatchEvent('change');
 const AxeBuilder=require(process.env.SOULFUEL_AXE_PATH).default;
 for(const tab of ['scan','manual']){await page.locator('#'+tab+'-tab').click();const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);}
 await context.close();
});

test('browser: scanner exposes loading, safe error and retry review before confirmed save',opts,async()=>{
 const {page,context}=await open();let finish;
 const delayed=new Promise(resolve=>finish=resolve);
 await page.route('**/api/foodfacts',async route=>{await delayed;await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Unavailable'})});});
 await page.locator('#barcode').fill('0123456789012');await page.locator('#lookup-button').click();
 assert.equal(await page.locator('#scan-panel').getAttribute('aria-busy'),'true');assert.equal(await page.locator('#lookup-button').isDisabled(),true);assert.match(await page.locator('#status').textContent(),/Looking up/);
 finish();await page.waitForFunction(()=>document.querySelector('#scan-panel').getAttribute('aria-busy')==='false');assert.match(await page.locator('#status').textContent(),/temporarily unavailable/);assert.equal(await page.locator('#result').isVisible(),false);
 await page.unroute('**/api/foodfacts');await page.locator('#lookup-button').click();await page.waitForSelector('#save-food');assert.equal(await page.locator('.entryrow').count(),0);assert.match(await page.locator('#product-save-status').textContent(),/check the package/);assert.equal(await page.locator('#product-confirm').isChecked(),false);
 await context.close();
});

test('browser: real captured Nutella without serving values requires measured grams before saving',opts,async()=>{
 const {page,context}=await open();try{
 await page.route('**/api/foodfacts',route=>route.fulfill({contentType:'application/json',body:JSON.stringify(require('./fixtures/off-staging-v3.4-nutella.json'))}));
 await page.locator('#barcode').fill('3017620422003');await page.locator('#lookup-button').click();await page.waitForSelector('#save-food');assert.match(await page.locator('.score-gauge').getAttribute('aria-label'),/23 out of 100/);assert.equal(await page.locator('#product-servings').isDisabled(),true);assert.match(await page.locator('#portion-preview').textContent(),/No serving nutrition is reported/);assert.equal(await page.locator('#save-food').isDisabled(),true);
 await page.locator('#product-grams').fill('15');assert.equal(await page.locator('#save-food').isDisabled(),false);await page.locator('#product-confirm').check();await page.locator('#save-food').click();assert.match(await page.locator('#product-save-status').textContent(),/Saved and read back/);const rows=await page.evaluate(()=>JSON.parse(localStorage.getItem('soulanova-foodscore-diary-v1:test-member-a')));assert.equal(rows.length,1);assert.equal(rows[0].portion,'15 g portion');assert.ok(Math.abs(rows[0].calories-80.85)<1e-9);assert.equal(rows[0].memberConfirmed,true);
 }finally{await context.close();}
});

test('browser: local diary mutations reject anonymous or failed member verification without writing',{skip:!enabled},async()=>{
 for(const flag of ['__anonymous','__authFailed']){const {page,context}=await open({active:false});try{await expand(page,'manual-entry-panel');await page.locator('#entry-name').fill('Do not save');await page.locator('#entry-calories').fill('100');await page.evaluate(flag=>window[flag]=true,flag);await page.locator('#save-entry').click();await page.waitForFunction(()=>document.querySelector('#auth-state').textContent.includes('Member verification failed'));assert.equal(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('soulanova-foodscore-diary-v1:')).length),0);assert.equal(await page.locator('#save-entry').isDisabled(),true);assert.doesNotMatch(await page.locator('#diary-message').textContent(),/Entry saved/);}finally{await context.close();}}
});
test('browser: account switch during diary-save verification never writes to either member',{skip:!enabled},async()=>{const {page,context}=await open({active:false});try{await expand(page,'manual-entry-panel');await page.locator('#entry-name').fill('Pending A food');await page.locator('#entry-calories').fill('100');await page.evaluate(()=>{window.__saveAuthGate=new Promise(resolve=>window.__releaseSaveAuth=resolve);});await page.locator('#save-entry').click();await page.evaluate(()=>window.__switchMember('test-member-b'));await page.evaluate(()=>window.__releaseSaveAuth());await page.waitForFunction(()=>document.querySelector('#entry-name').disabled===false);assert.equal(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('soulanova-foodscore-diary-v1:')).length),0);assert.equal(await page.locator('#entry-name').inputValue(),'');assert.doesNotMatch(await page.locator('#diary-message').textContent(),/Entry saved/);}finally{await context.close();}});

test('browser: timed-out diary verification fails closed and a late reply cannot write',{skip:!enabled},async()=>{const {page,context}=await open({active:false});try{await expand(page,'manual-entry-panel');await page.locator('#entry-name').fill('Keep this unsaved');await page.locator('#entry-calories').fill('100');await page.clock.install();await page.evaluate(()=>{window.__saveAuthGate=new Promise(resolve=>window.__releaseSaveAuth=resolve);});await page.locator('#save-entry').click();await page.clock.runFor(12001);await page.waitForFunction(()=>document.querySelector('#auth-state').textContent.includes('Member verification failed'));await page.evaluate(()=>window.__releaseSaveAuth());assert.equal(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('soulanova-foodscore-diary-v1:')).length),0);assert.equal(await page.locator('#entry-name').inputValue(),'Keep this unsaved');assert.equal(await page.locator('#save-entry').isDisabled(),true);}finally{await context.close();}});

test('browser: same-account token refresh during verified diary save preserves the save exactly once',{skip:!enabled},async()=>{const {page,context}=await open({active:false});try{await expand(page,'manual-entry-panel');await page.locator('#entry-name').fill('Refresh-safe food');await page.locator('#entry-calories').fill('100');await page.evaluate(()=>window.__refreshOnSave=true);await page.locator('#save-entry').click();await page.waitForFunction(()=>document.querySelector('#diary-message').textContent.includes('Entry saved'));const rows=await page.evaluate(()=>JSON.parse(localStorage.getItem('soulanova-foodscore-diary-v1:test-member-a')));assert.equal(rows.length,1);assert.equal(rows[0].name,'Refresh-safe food');assert.equal(await page.locator('#entry-name').inputValue(),'');}finally{await context.close();}});
