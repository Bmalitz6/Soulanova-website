'use strict';
// Actual dashboard/login/navigation scripts with a disposable, mocked auth provider.
// No account, workout write, Redis, OFF or external network is used.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),enabled=Boolean(process.env.SOULFUEL_PLAYWRIGHT_PATH);
let server,browser,origin;
const authStub=`(()=>{const user=()=>localStorage.getItem('navigation-test-session')?{id:localStorage.getItem('navigation-test-member')||'navigation-disposable-a',is_anonymous:localStorage.getItem('navigation-test-anonymous')==='true',email:'navigation@example.invalid',user_metadata:{}}:null;window.supabase={createClient:()=>{let listener;const query={select(){return this},eq(){return this},order(){return this},limit(){return this},abortSignal(){return this},then(resolve,reject){return Promise.resolve({data:[],error:null}).then(resolve,reject)}};return {from:()=>query,auth:{onAuthStateChange:fn=>{listener=fn;window.__navigationSwitch=id=>{if(id){localStorage.setItem('navigation-test-session','signed-in');localStorage.setItem('navigation-test-member',id);}else localStorage.removeItem('navigation-test-session');listener(id?'SIGNED_IN':'SIGNED_OUT',id?{user:user()}:null);};return {data:{subscription:{unsubscribe(){}}}}},getUser:async()=>{if(window.__healthAuthGate)await window.__healthAuthGate;return localStorage.getItem('navigation-test-auth-error')?{data:{user:null},error:{message:'Verification unavailable'}}:{data:{user:user()},error:null};},getSession:async()=>({data:{session:user()?{user:user()}:null},error:null}),signInWithPassword:async()=>{localStorage.setItem('navigation-test-session','signed-in');localStorage.setItem('navigation-test-signins',String(Number(localStorage.getItem('navigation-test-signins')||0)+1));listener?.('SIGNED_IN',{user:user()});return {data:{user:user()},error:null}},signOut:async()=>{localStorage.removeItem('navigation-test-session');listener?.('SIGNED_OUT',null);return {error:null}}}}}}})();`;
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

async function metricPage({width=390,signedIn=true,anonymous=false,authError=false}={}){
 const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await context.addInitScript(({signedIn,anonymous,authError})=>{if(!sessionStorage.getItem('health-test-initialized')){sessionStorage.setItem('health-test-initialized','true');if(signedIn)localStorage.setItem('navigation-test-session','signed-in');if(anonymous)localStorage.setItem('navigation-test-anonymous','true');if(authError)localStorage.setItem('navigation-test-auth-error','true');}},{signedIn,anonymous,authError});
 await context.route('**/*',async route=>{const url=route.request().url();if(url.includes('cdn.jsdelivr.net/npm/@supabase/'))return route.fulfill({contentType:'application/javascript',body:authStub});if(!url.startsWith(origin+'/'))return route.abort();await route.continue();});
 await page.goto(origin+'/app/soulfuel/metrics/');return {page,context,errors};
}
for(const width of [1280,390,320])test(`health ${width}px: manual consent, calculated BMI, local persistence, member isolation and accessible layout`,{skip:!enabled},async()=>{
 const {page,context,errors}=await metricPage({width});try{
 await page.waitForFunction(()=>document.querySelector('#health-auth').textContent.includes('Member verified'));
 assert.equal(await page.locator('input[name=bmi],#metric-bmi').count(),0);await page.locator('#metric-weightKg').fill('72');await page.locator('#metric-heightCm').fill('180');assert.match(await page.locator('#bmi-preview').textContent(),/22.22/);
 await page.locator('#metric-save').click();assert.equal(await page.locator('.metric-record').count(),0);await page.locator('#metric-consent').check();await page.locator('#metric-save').click();await page.waitForSelector('.metric-record');assert.match(await page.locator('#metric-message').textContent(),/saved and read back/);assert.match(await page.locator('.metric-record').textContent(),/Manual entry/);assert.match(await page.locator('.metric-record').textContent(),/22.22/);
 const key='soulanova-health-metrics-v1:navigation-disposable-a';assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).length,key),1);
 await page.reload();await page.waitForFunction(()=>document.querySelector('#health-auth').textContent.includes('Member verified'));assert.equal(await page.locator('.metric-record').count(),1);
 await page.locator('.metric-record button').getByText('Edit',{exact:true}).click();await page.locator('#metric-weightKg').fill('73');await page.locator('#metric-consent').check();await page.locator('#metric-save').click();await page.waitForFunction(()=>document.querySelector('.metric-record').textContent.includes('73 kg'));assert.equal(await page.locator('.metric-record').count(),1);
 await page.evaluate(()=>window.__navigationSwitch('health-isolation-member-b'));await page.waitForFunction(()=>document.querySelector('#health-auth').textContent.includes('Member verified'));assert.equal(await page.locator('.metric-record').count(),0);assert.equal(await page.locator('#metric-weightKg').inputValue(),'');
 await page.evaluate(()=>window.__navigationSwitch('navigation-disposable-a'));await page.waitForSelector('.metric-record');assert.match(await page.locator('.metric-record').textContent(),/73 kg/);
 await page.locator('#metric-type').selectOption('pressure');await page.locator('#metric-systolic').fill('120');await page.locator('#metric-diastolic').fill('80');await page.locator('#metric-consent').check();await page.locator('#metric-save').click();await page.waitForFunction(()=>document.querySelectorAll('.metric-record').length===2);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 if(process.env.SOULFUEL_AXE_PATH){const AxeBuilder=require(process.env.SOULFUEL_AXE_PATH).default;const a=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(a.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);}
 await page.screenshot({path:`/private/tmp/soulfuel-my-health-${width}.png`,fullPage:true});
 await page.locator('.metric-record button').getByText('Delete',{exact:true}).first().click();await page.waitForFunction(()=>document.querySelectorAll('.metric-record').length===1);
 await page.evaluate(()=>window.__navigationSwitch(null));await page.waitForFunction(()=>document.querySelector('#metric-save').disabled);assert.equal(await page.locator('.metric-record').count(),0);assert.deepEqual(errors,[]);
 }finally{await context.close();}
});
test('health anonymous and signed-out sessions cannot read member records or save', {skip:!enabled},async()=>{
 for(const options of [{signedIn:false},{signedIn:true,anonymous:true}]){const {page,context}=await metricPage(options);try{await page.waitForTimeout(100);assert.equal(await page.locator('#metric-save').isDisabled(),true);await page.evaluate(()=>{document.querySelector('#metric-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});assert.equal(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('soulanova-health-metrics')).length),0);}finally{await context.close();}}
});

test('health rejects an unverified session even when a local sign-in marker exists', {skip:!enabled},async()=>{
 const {page,context}=await metricPage({authError:true});try{await page.waitForTimeout(100);assert.equal(await page.locator('#metric-save').isDisabled(),true);assert.equal(await page.locator('.metric-record').count(),0);assert.doesNotMatch(await page.locator('#health-auth').textContent(),/Member verified/);}finally{await context.close();}
});
test('health silent storage failure never claims persistence or adds visible records', {skip:!enabled},async()=>{
 const {page,context}=await metricPage();try{await page.waitForFunction(()=>document.querySelector('#health-auth').textContent.includes('Member verified'));await page.locator('#metric-weightKg').fill('72');await page.locator('#metric-consent').check();await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.startsWith('soulanova-health-metrics'))return;return original.call(this,k,v);};});await page.locator('#metric-save').click();await page.waitForFunction(()=>document.querySelector('#metric-message').textContent.includes('No success'));assert.equal(await page.locator('.metric-record').count(),0);assert.equal(await page.locator('#metric-save').isDisabled(),true);}finally{await context.close();}
});
test('health account switch during verification invalidates an outstanding save', {skip:!enabled},async()=>{
 const {page,context}=await metricPage();try{await page.waitForFunction(()=>document.querySelector('#health-auth').textContent.includes('Member verified'));await page.locator('#metric-weightKg').fill('72');await page.locator('#metric-consent').check();await page.evaluate(()=>{window.__healthAuthGate=new Promise(resolve=>window.__healthRelease=resolve);});await page.locator('#metric-save').click();await page.evaluate(()=>{window.__navigationSwitch('health-race-member-b');window.__healthRelease();window.__healthAuthGate=null;});await page.waitForFunction(()=>document.querySelector('#health-auth').textContent.includes('Member verified'));assert.equal(await page.locator('.metric-record').count(),0);assert.equal(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('soulanova-health-metrics')).length),0);assert.doesNotMatch(await page.locator('#metric-message').textContent(),/saved and read back/);}finally{await context.close();}
});

test('program cards and mobile My Health shortcut lead to the three SoulFuel areas', {skip:!enabled},async()=>{
 const {page,context}=await metricPage({width:390});try{
 await page.goto(origin+'/app/#home');await page.waitForSelector('#soulfuel-dashboard-entry');assert.equal(await page.locator('#soulfuel-dashboard-entry').evaluate(e=>e.classList.contains('member-path')),true);assert.equal(await page.locator('#soulfuel-dashboard-entry img').count(),1);
 await Promise.all([page.waitForURL('**/metrics/#add-metric'),page.locator('.health-dashboard-shortcut').click()]);await page.waitForFunction(()=>document.querySelector('#health-auth').textContent.includes('Member verified'));assert.equal(await page.locator('#metric-type').isVisible(),true);
 await Promise.all([page.waitForURL('**/app/soulfuel/'),page.locator('.member-navigation a').getByText('SoulFuel program',{exact:true}).click()]);assert.deepEqual(await page.locator('.program-choices h3').allTextContents(),['Metrics Tracker','FoodScore & Food Diary','Recipes']);assert.equal(await page.locator('.program-choices a').count(),3);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.equal(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('soulanova-health-metrics')).length),0);
 }finally{await context.close();}
});
