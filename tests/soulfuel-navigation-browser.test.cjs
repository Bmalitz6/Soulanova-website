'use strict';
// Actual dashboard/login/navigation scripts with a disposable, mocked auth provider.
// No account, workout write, Redis, OFF or external network is used.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),enabled=Boolean(process.env.SOULFUEL_PLAYWRIGHT_PATH);
let server,browser,origin;
const authStub=`(()=>{const user=()=>localStorage.getItem('navigation-test-session')?{id:'navigation-disposable-a',email:'navigation@example.invalid',user_metadata:{}}:null;window.supabase={createClient:()=>{let listener;const query={select(){return this},eq(){return this},order(){return this},limit(){return this},abortSignal(){return this},then(resolve,reject){return Promise.resolve({data:[],error:null}).then(resolve,reject)}};return {from:()=>query,auth:{onAuthStateChange:fn=>{listener=fn;return {data:{subscription:{unsubscribe(){}}}}},getUser:async()=>({data:{user:user()},error:null}),getSession:async()=>({data:{session:user()?{user:user()}:null},error:null}),signInWithPassword:async()=>{localStorage.setItem('navigation-test-session','signed-in');localStorage.setItem('navigation-test-signins',String(Number(localStorage.getItem('navigation-test-signins')||0)+1));listener?.('SIGNED_IN',{user:user()});return {data:{user:user()},error:null}},signOut:async()=>{localStorage.removeItem('navigation-test-session');listener?.('SIGNED_OUT',null);return {error:null}}}}}}})();`;
before(async()=>{
 if(!enabled)return;
 server=http.createServer((req,res)=>{let file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep))return res.writeHead(404).end();if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');if(!fs.existsSync(file))return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.mjs':'application/javascript','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;
 browser=await require(process.env.SOULFUEL_PLAYWRIGHT_PATH).chromium.launch({headless:true});
});
after(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r));});
for(const width of [1280,390,320])test(`navigation ${width}px: login → dashboard → SoulFuel → dashboard without another sign-in`,{skip:!enabled},async()=>{
 const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[];let barcodeRequests=0;
 page.on('pageerror',e=>errors.push(e.message));
 try{
 await context.route('**/*',async route=>{const url=route.request().url();if(url.includes('cdn.jsdelivr.net/npm/@supabase/'))return route.fulfill({contentType:'application/javascript',body:authStub});if(url===origin+'/api/foodscore-availability')return route.fulfill({contentType:'application/javascript',body:'globalThis.SoulanovaFoodScoreAvailability={enabled:false};'});if(url===origin+'/api/foodfacts'){barcodeRequests++;return route.abort();}if(!url.startsWith(origin+'/'))return route.abort();if(route.request().resourceType()==='media')return route.fulfill({status:204,body:''});await route.continue();});
 await page.goto(origin+'/app/?mode=signin');assert.equal(await page.locator('#soulfuel-dashboard-entry').isVisible(),false);
 await page.locator('#auth-email').fill('navigation@example.invalid');await page.locator('#auth-password').fill('Disposable-test-password');await page.locator('#auth-submit').click();await page.waitForSelector('#soulfuel-dashboard-entry');
 assert.equal(await page.locator('#auth-box').isVisible(),false);const shortcut=await page.locator('#soulfuel-dashboard-entry').boundingBox();assert.ok(shortcut.y>=0&&shortcut.y+shortcut.height<=900,'SoulFuel shortcut immediately visible after login');
 const nav=page.locator('.tabs .soulfuel-tab'),navbox=await nav.boundingBox(),container=await page.locator('.tabs').boundingBox();assert.ok(navbox.x>=container.x&&navbox.x+navbox.width<=container.x+container.width,'SoulFuel tab needs no horizontal menu search');assert.ok(navbox.height>=44);
 if(process.env.SOULFUEL_AXE_PATH){const AxeBuilder=require(process.env.SOULFUEL_AXE_PATH).default;const a=await new AxeBuilder({page}).include('#soulfuel-dashboard-entry').include('.tabs .soulfuel-tab').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(a.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);}
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:`/private/tmp/soulfuel-dashboard-navigation-${width}.png`,fullPage:false});
 await Promise.all([page.waitForURL('**/app/soulfuel/'),page.locator('#soulfuel-dashboard-entry').click()]);await page.waitForFunction(()=>document.querySelector('#entry-name')?.disabled===false);
 assert.equal(await page.locator('.member-navigation [aria-current=page]').textContent(),'SoulFuel');assert.equal(await page.locator('#diary-totals .tracker-dial').count(),4);assert.equal(await page.locator('.member-navigation a').first().textContent(),'← Dashboard');
 for(const a of await page.locator('.member-navigation a').all()){const box=await a.boundingBox();assert.ok(box.height>=44);}
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 if(width===390&&process.env.SOULFUEL_AXE_PATH){const AxeBuilder=require(process.env.SOULFUEL_AXE_PATH).default;const a=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(a.violations.map(v=>v.id),[]);}
 await page.screenshot({path:`/private/tmp/soulfuel-header-navigation-${width}.png`,fullPage:false});
 await Promise.all([page.waitForURL('**/app/#home'),page.locator('.member-navigation a').first().click()]);await page.waitForSelector('#soulfuel-dashboard-entry');assert.equal(await page.locator('#auth-box').isVisible(),false);assert.equal(await page.locator('#home').isVisible(),true);
 await page.locator('[data-tab=workouts]').click();assert.equal(await page.locator('#workouts').isVisible(),true);await Promise.all([page.waitForURL('**/app/soulfuel/'),page.locator('.tabs .soulfuel-tab').click()]);await page.waitForFunction(()=>document.querySelector('#entry-name')?.disabled===false);
 assert.equal(await page.evaluate(()=>localStorage.getItem('navigation-test-signins')),'1');assert.equal(barcodeRequests,0);assert.deepEqual(errors,[]);
 }finally{await context.close();}
});
