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
  res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
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
const opts={skip:!enabled};
test('browser: default-off makes no lookup; desktop/iPhone layouts have no horizontal overflow',opts,async()=>{
 requests.length=0;
 for(const [width,height] of [[1280,900],[390,844],[320,740]]){
  const {page,context,errors}=await open({active:false,width,height});assert.equal(await page.locator('#foodscore-lookup').isVisible(),false);
  await page.locator('a[href="#foodscore"]').first().click();assert.equal(requests.length,0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`overflow ${width}`);
  assert.equal(await page.locator('.recipe-category-card').count(),4);assert.deepEqual(errors,[]);
  if(width===1280||width===390)await page.screenshot({path:`/private/tmp/soulfuel-upgrade-${width}.png`,fullPage:true});
  await context.close();
 }
});
test('browser: manual barcode → mock product → reviewed portion → readback-confirmed tracker and no duplicate',opts,async()=>{
 requests.length=0;const {page,context,errors}=await open();
 await page.locator('#goal-calories').fill('2000');await page.locator('#goal-protein').fill('80');await page.locator('#nutrition-goals-form button[type="submit"]').click();
 await page.locator('#barcode').fill('0123456789012');await page.locator('#lookup-button').click();await page.waitForSelector('#save-food');
 assert.match(await page.locator('.score-gauge').getAttribute('aria-label'),/90 out of 100/);
 assert.match(await page.locator('#camera-status').textContent(),/manually/);
 await page.locator('#product-grams').fill('75');assert.match(await page.locator('#portion-preview').textContent(),/112.5 kcal/);
 await page.locator('#save-food').click();assert.match(await page.locator('#product-save-status').textContent(),/Confirm the product/);
 await page.locator('#product-confirm').check();await page.locator('#save-food').click();assert.match(await page.locator('#product-save-status').textContent(),/Saved and read back/);
 assert.match(await page.locator('.total-calories').textContent(),/112.5/);assert.equal(await page.locator('.total-calories progress').getAttribute('max'),'2000');
 const entries=await page.evaluate(()=>JSON.parse(localStorage.getItem('soulanova-foodscore-diary-v1:test-member-a')));assert.equal(entries.length,1);assert.equal(entries[0].memberConfirmed,true);assert.equal(entries[0].protein,6);
 assert.equal(await page.locator('#save-food').isDisabled(),true);assert.equal(requests.length,1);assert.deepEqual(requests[0],{method:'POST',url:'/api/foodfacts',body:{barcode:'0123456789012'}});
 await page.screenshot({path:'/private/tmp/soulfuel-upgrade-mocked-score.png',fullPage:true});
 await page.reload();await page.waitForFunction(()=>document.querySelector('#entry-name').disabled===false);assert.match(await page.locator('.total-calories').textContent(),/112.5/);assert.deepEqual(errors,[]);await context.close();
});
test('browser: account switch isolates diary/goals and delayed lookup result cannot enter another account',opts,async()=>{
 const {page,context}=await open();await page.locator('#entry-name').fill('Member A oats');await page.locator('#entry-calories').fill('100');await page.locator('#save-entry').click();
 await page.locator('#goal-calories').fill('2000');await page.locator('#nutrition-goals-form button[type="submit"]').click();
 let finish;const delayed=new Promise(resolve=>finish=resolve);await page.route('**/api/foodfacts',async route=>{await delayed;await route.fulfill({contentType:'application/json',body:JSON.stringify({status:1,product:fixture})})});
 await page.locator('#barcode').fill('0123456789012');await page.locator('#lookup-button').click();
 await page.evaluate(()=>window.__switchMember('test-member-b'));finish();await page.waitForTimeout(100);
 assert.equal(await page.locator('#result').isVisible(),false);assert.equal(await page.locator('#goal-calories').inputValue(),'');assert.doesNotMatch(await page.locator('#diary-list').textContent(),/Member A oats/);
 await page.evaluate(()=>window.__switchMember('test-member-a'));assert.match(await page.locator('#diary-list').textContent(),/Member A oats/);assert.equal(await page.locator('#goal-calories').inputValue(),'2000');await context.close();
});
test('browser: failed local writes do not announce success or reset the manual entry',opts,async()=>{
 const {page,context}=await open();await page.evaluate(()=>{Storage.prototype.setItem=function(){throw Error('quota')};});
 await page.locator('#entry-name').fill('Keep this entry');await page.locator('#entry-calories').fill('50');await page.locator('#save-entry').click();
 assert.match(await page.locator('#auth-state').textContent(),/persistence could not be confirmed/);assert.equal(await page.locator('#entry-name').inputValue(),'Keep this entry');assert.doesNotMatch(await page.locator('#diary-message').textContent(),/Entry saved/);await context.close();
});
test('browser: default and mock-product states meet automated WCAG A/AA checks', {skip:!enabled||!process.env.SOULFUEL_AXE_PATH}, async()=>{
 const {page,context}=await open({active:false,width:390,height:844});
 const AxeBuilder=require(process.env.SOULFUEL_AXE_PATH).default;
 let results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(results.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);
 await context.close();const second=await open();await second.page.locator('#barcode').fill('0123456789012');await second.page.locator('#lookup-button').click();await second.page.waitForSelector('#save-food');
 results=await new AxeBuilder({page:second.page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(results.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);await second.context.close();
});
