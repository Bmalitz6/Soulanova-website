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
  if(url.includes('cdn.jsdelivr.net')){await route.fulfill({contentType:'application/javascript',body:`window.supabase={createClient:()=>({auth:{onAuthStateChange:fn=>{window.__switchMember=id=>fn('SIGNED_IN',{user:{id}})},getSession:async()=>({data:{session:{user:{id:'test-member-a'}}},error:null})}})};`});return}
  if(url===origin+'/api/foodscore-availability'){await route.fulfill({contentType:'application/javascript',body:`globalThis.SoulanovaFoodScoreAvailability={enabled:${active}};`});return}
  if(!url.startsWith(origin+'/')){await route.abort();throw Error('External network blocked in test')}
  await route.continue();
 });
 await page.goto(origin+'/app/soulfuel/');await page.waitForFunction(()=>document.querySelector('#entry-name')?.disabled===false);return {page,context,errors};
}
async function expand(page,id){const panel=page.locator('#'+id);if(await panel.count() && !await panel.evaluate(e=>e.open))await panel.locator('summary').first().click();}
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
 await page.locator('#barcode').fill('0123456789012');await page.locator('#lookup-button').click();await page.waitForSelector('#save-food');
 assert.match(await page.locator('.score-gauge').getAttribute('aria-label'),/90 out of 100/);
 assert.match(await page.locator('#result').textContent(),/staging · Test data only/);
 assert.equal(await page.locator('#result .attrib a').first().getAttribute('href'),'https://world.openfoodfacts.net/product/0123456789012');
 assert.match(await page.locator('#camera-status').textContent(),/manually/);
 await page.locator('#product-grams').fill('75');assert.match(await page.locator('#portion-preview').textContent(),/112.5 kcal/);
 await page.locator('#save-food').click();assert.match(await page.locator('#product-save-status').textContent(),/Confirm the product/);
 await page.locator('#product-confirm').check();await page.locator('#save-food').click();assert.match(await page.locator('#product-save-status').textContent(),/Saved and read back/);
 assert.match(await page.locator('.total-calories').textContent(),/112.5/);assert.equal(await page.locator('.total-calories progress').getAttribute('max'),'2000');
 const entries=await page.evaluate(()=>JSON.parse(localStorage.getItem('soulanova-foodscore-diary-v1:test-member-a')));assert.equal(entries.length,1);assert.equal(entries[0].memberConfirmed,true);assert.equal(entries[0].protein,6);assert.equal(entries[0].sourceUrl,'https://world.openfoodfacts.net/product/0123456789012');assert.equal(entries[0].source,'Open Food Facts staging (test data)');
 assert.equal(await page.locator('#save-food').isDisabled(),true);assert.equal(requests.length,1);assert.deepEqual(requests[0],{method:'POST',url:'/api/foodfacts',body:{barcode:'0123456789012'}});
 await page.screenshot({path:'/private/tmp/soulfuel-upgrade-mocked-score.png',fullPage:true});
 await page.reload();await page.waitForFunction(()=>document.querySelector('#entry-name').disabled===false);assert.match(await page.locator('.total-calories').textContent(),/112.5/);assert.deepEqual(errors,[]);await context.close();
});
test('browser: account switch isolates diary/goals and delayed lookup result cannot enter another account',opts,async()=>{
 const {page,context}=await open();await expand(page,'manual-entry-panel');await page.locator('#entry-name').fill('Member A oats');await page.locator('#entry-calories').fill('100');await page.locator('#save-entry').click();
 await expand(page,'goal-editor');await page.locator('#goal-calories').fill('2000');await page.locator('#nutrition-goals-form button[type="submit"]').click();
 let finish;const delayed=new Promise(resolve=>finish=resolve);await page.route('**/api/foodfacts',async route=>{await delayed;await route.fulfill({contentType:'application/json',body:JSON.stringify({status:1,product:fixture})})});
 await page.locator('#barcode').fill('0123456789012');await page.locator('#lookup-button').click();
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
 assert.deepEqual(await page.locator('main > section[id]').evaluateAll(els=>els.map(e=>e.id)),['diary','foodscore','recipe-library','nutrition-goals']);
 assert.equal(await page.locator('.hero-actions a').count(),2);assert.equal(await page.locator('.fuel-grid').count(),0);
 assert.equal(await page.locator('#diary-totals > .total-item').count(),4);assert.equal(await page.locator('#secondary-totals > .total-item').count(),2);
 assert.equal(await page.locator('#secondary-totals').isVisible(),false);await page.locator('.secondary-metrics > summary').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#secondary-totals').isVisible(),true);
 assert.equal(await page.locator('#entry-name').isVisible(),false);await page.locator('#manual-entry-panel > summary').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#entry-name').isVisible(),true);
 assert.equal(await page.locator('#entry-fiber').isVisible(),false);await page.locator('#manual-entry-form .secondary-fields > summary').click();assert.equal(await page.locator('#entry-fiber').isVisible(),true);
 assert.equal(await page.locator('#goal-calories').isVisible(),false);await expand(page,'goal-editor');assert.equal(await page.locator('#goal-calories').isVisible(),true);assert.equal(await page.locator('#goal-water').isVisible(),false);
 for(const selector of ['.hero-actions a','.section-nav a','.diary-date-nav button','#manual-entry-panel > summary','#goal-editor > summary'])for(const element of await page.locator(selector).all()){const box=await element.boundingBox();assert.ok(box.height>=44,selector+' touch target');}
 await context.close();
});
test('browser: collapsed manual editor still supports edit/delete and keeps source details accessible',opts,async()=>{
 const {page,context}=await open({active:false});await expand(page,'manual-entry-panel');await page.locator('#entry-name').fill('Mediterranean lunch');await page.locator('#entry-calories').fill('400');await page.locator('#entry-protein').fill('15');await page.locator('#save-entry').click();
 assert.match(await page.locator('.total-calories').textContent(),/400/);await page.locator('#manual-entry-panel > summary').click();
 await page.locator('#diary-list button').getByText('Edit',{exact:true}).click();assert.equal(await page.locator('#entry-name').isVisible(),true);await page.locator('#entry-calories').fill('450');await page.locator('#save-entry').click();assert.match(await page.locator('.total-calories').textContent(),/450/);
 assert.equal(await page.locator('.entry-nutrition-details').count(),1);await page.locator('.entry-nutrition-details > summary').click();assert.match(await page.locator('.entry-nutrition-details').textContent(),/Manual entry/);
 await page.locator('#diary-list button').getByText('Delete',{exact:true}).click();assert.equal(await page.locator('.entryrow').count(),0);assert.equal(await page.locator('.total-calories strong').getAttribute('aria-label'),'Calories: Not provided');await context.close();
});
