'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
// The current website feature branch is the source of this isolated Preview.
const base = '37754c995a1852f0d26b935f0649fe244df2c780';
const git = (...args) => execFileSync('git', args, { cwd: root });

test('selected website preview source stays unchanged except the scoped Chair Yoga entry', () => {
  const entries = git('ls-tree', '-r', base).toString().trim().split('\n');
  assert.ok(entries.length > 0);
  for (const entry of entries) {
    const [metadata, file] = entry.split('\t');
    const [mode, type, hash] = metadata.split(' ');
    assert.equal(type, 'blob');
    if(file==='app/index.html'){
      const current=fs.readFileSync(path.join(root,file),'utf8');
      const original=git('show',base+':'+file).toString();
      const from='<a class="member-path wellness-program-card" href="/app/#workouts" data-wellness-category="Yoga"><img src="/app/images/workouts/yoga.jpg" width="600" height="338" alt="" loading="lazy"><div><h3>Yoga</h3><p>Explore your existing program</p><strong>Open program →</strong></div></a>';
      const to='<a class="member-path wellness-program-card" id="chair-yoga-dashboard-entry" href="/app/chair-yoga/" aria-label="Open Chair Yoga with Miriam: 36 proposed complete workouts"><img src="/app/images/chair-yoga/IMG_4285.jpg" width="600" height="338" alt="Miriam seated in the Soulanova Chair Yoga studio" loading="lazy"><div><h3>Chair Yoga</h3><p>36 proposed complete workouts · 12 per level</p><strong>Choose a Chair Yoga workout →</strong></div></a>';
      assert.equal(original.split(from).length-1,1,'Expected one generic Yoga card in the verified baseline');
      assert.equal(current,original.replace(from,to),'Only the dashboard Yoga card changes to direct Chair Yoga navigation');
    }else if(file==='app/app.js'){
      const current=fs.readFileSync(path.join(root,file),'utf8');
      const original=git('show',base+':'+file).toString();
      const replaceOnce=(source,from,to)=>{assert.equal(source.split(from).length-1,1,`Expected one source fragment: ${from}`);return source.replace(from,to)};
      let expected=original;
      expected=replaceOnce(expected,"{id:'yoga',category:'Yoga',icon:'✳',title:'Gentle Yoga Reset',minutes:25,steps:['5 min relaxed breathing','10 min comfortable standing and seated poses','5 min gentle mobility','5 min quiet rest']}","{id:'yoga',category:'Yoga',icon:'✳',title:'Chair Yoga with Miriam',minutes:13,steps:['36 movement workouts · 12 per proposed level','Each movement demonstration plays twice','Level assignments and narration await owner review']}");
      expected=replaceOnce(expected,"{id:'pilates',category:'Pilates',icon:'◌',title:'Core Foundations',minutes:25,steps:['5 min breathing and posture check','10 min controlled core movements','5 min stability practice','5 min stretching']},\n",'');
      expected=replaceOnce(expected,"yoga: {label:'YOGA', cta:'View Session', image:'/app/images/workouts/yoga.jpg'},","yoga: {label:'CHAIR YOGA', cta:'Explore Library', image:'/app/images/chair-yoga/IMG_4285.jpg'},");
      expected=replaceOnce(expected,"  pilates: {label:'PILATES', cta:'View Session', image:'/app/images/workouts/pilates.jpg'},\n",'');
      expected=replaceOnce(expected,'  save();\n\n  if(w.id===\'tai\' && window.SoulanovaClasses){',"  save();\n\n  if(w.id==='yoga'){\n    window.location.href='/app/chair-yoga/';\n    return;\n  }\n\n  if(w.id==='tai' && window.SoulanovaClasses){");
      expected=replaceOnce(expected," client.auth.onAuthStateChange((event,session)=>{const user=session?.user||null;"," const requestedNext=new URLSearchParams(window.location.search).get('next');\n const safeChairYogaReturn=requestedNext&&requestedNext.startsWith('/app/chair-yoga')&&!requestedNext.startsWith('//')?requestedNext:null;\n if(safeChairYogaReturn)client.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_IN'&&session?.user)window.location.assign(safeChairYogaReturn)});\n client.auth.onAuthStateChange((event,session)=>{const user=session?.user||null;");
      assert.equal(current,expected,'Only the Yoga category changes and Pilates is removed from active workout listings');
    }else if(file==='tests/soulfuel-clean-integration.test.cjs'){
      // This guard is itself updated to pin the selected Preview baseline.
      continue;
    }else if(file==='tests/soulfuel-navigation-browser.test.cjs'){
      const current=fs.readFileSync(path.join(root,file),'utf8');
      const original=git('show',base+':'+file).toString();
      const from="  for(const [name,category,title]of [['Yoga','Yoga','Gentle Yoga Reset']]){\n   await card(name).click();assert.equal(await page.locator('#category').inputValue(),category);assert.equal(await page.locator('#workouts .sectionhead h2').textContent(),'Your Workout Library');assert.equal(await page.locator('#workout-list h3').textContent(),title);assert.equal(await page.locator('#workout-list').isVisible(),true);await page.locator('#workout-list button').click();assert.equal(await page.locator('#selected-workout h3').textContent(),'Your plan: '+title);await page.locator('[data-tab=home]').click();assert.equal(await page.locator('#home').isVisible(),true);\n  }";
      const to="  const chairYoga=card('Chair Yoga');await chairYoga.click();await page.waitForURL('**/app/chair-yoga/');assert.equal(await page.locator('#auth-title').count(),1);assert.equal(await page.locator('#member-library').isVisible(),false);await page.locator('.topbar a[href=\"/app/\"]').click();await page.waitForURL('**/app/');await page.waitForSelector('#soulfuel-dashboard-entry');";
      assert.equal(original.split(from).length-1,1,'Expected the previous Yoga browser flow once');
      const expected=original.replace("['SoulWalk','Strength','Yoga','Tai Chi','Meditation','Stretching','SoulFuel']","['SoulWalk','Strength','Chair Yoga','Tai Chi','Meditation','Stretching','SoulFuel']").replace(from,to);
      assert.equal(current,expected,'Browser acceptance now checks direct Chair Yoga navigation and absence of Pilates');
    }else if(file==='tests/pilates-removal.test.cjs'){
      const current=fs.readFileSync(path.join(root,file),'utf8');
      const original=git('show',base+':'+file).toString();
      const from="['SoulWalk', 'Strength', 'Yoga', 'Tai Chi', 'Meditation', 'Stretching', 'SoulFuel']";
      const to="['SoulWalk', 'Strength', 'Chair Yoga', 'Tai Chi', 'Meditation', 'Stretching', 'SoulFuel']";
      assert.equal(original.split(from).length-1,1);
      assert.equal(current,original.replace(from,to),'Pilates regression confirms the renamed dashboard Chair Yoga entry');
    }else assert.equal(git('hash-object',file).toString().trim(), hash, file);
  }
});

test('SoulFuel page and recipe HTML links, assets and fragments resolve in the actual main checkout', () => {
  const library = path.join(root,'app/soulfuel/recipe-library/Soulanova_Mediterranean_Recipe_Library');
  const pages = ['app/soulfuel/index.html', ...fs.readdirSync(library).filter(p=>p.endsWith('.html')).map(p=>path.relative(root,path.join(library,p)))];
  for(const file of pages) {
    const html=fs.readFileSync(path.join(root,file),'utf8');
    for(const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)) {
      const target=match[1];
      if (/^(?:https?:|mailto:|data:|javascript:|\/\/)/i.test(target)) continue;
      const url=new URL(target,`https://preview.invalid/${file}`);
      const pathname=decodeURIComponent(url.pathname);
      let resolved=path.join(root,pathname);
      if(pathname.startsWith('/api/')) {
        assert.ok(fs.existsSync(resolved+'.js'),`${file} -> ${target}`); continue;
      }
      if(fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) resolved=path.join(resolved,'index.html');
      assert.ok(fs.existsSync(resolved),`${file} -> ${target}`);
      if(url.hash && resolved.endsWith('.html')) {
        const fragment=decodeURIComponent(url.hash.slice(1));
        const destination=fs.readFileSync(resolved,'utf8');
        assert.ok([...destination.matchAll(/\b(?:id|name)=["']([^"']+)["']/g)].some(m=>m[1]===fragment),`${file} -> ${target} missing fragment`);
      }
    }
  }
});

test('isolated SoulFuel uses existing public member config and accurate optional-goals entry', () => {
  const html=fs.readFileSync(path.join(root,'app/soulfuel/index.html'),'utf8');
  assert.match(html, /src="\/app\/config\.js"/);
  assert.doesNotMatch(html,/config\.development\.local\.js/);
  assert.doesNotMatch(html,/Personal nutrition goals are not available yet/);
  assert.match(html,/id="nutrition-goals-form"/);
  const navigation=fs.readFileSync(path.join(root,'app/navigation.js'),'utf8');
  for(const destination of ['meals','free-library']) assert.ok(navigation.includes(destination),destination);
});
