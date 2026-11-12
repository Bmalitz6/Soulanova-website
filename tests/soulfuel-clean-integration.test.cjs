'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const base = '1b09f3e897948b16a8a7c4aa4930f9fe8fb8b7ef';
const git = (...args) => execFileSync('git', args, { cwd: root });

test('existing GitHub main files stay unchanged except the authorized SoulFuel dashboard links', () => {
  const entries = git('ls-tree', '-r', base).toString().trim().split('\n');
  assert.ok(entries.length > 0);
  for (const entry of entries) {
    const [metadata, file] = entry.split('\t');
    const [mode, type, hash] = metadata.split(' ');
    assert.equal(type, 'blob');
    if(file==='app/index.html'){
      const current=fs.readFileSync(path.join(root,file),'utf8');
      const original=git('show',base+':'+file).toString();
      const auth=html=>html.slice(html.indexOf('<section id="auth-box"'),html.indexOf('<div id="member-app"'));
      assert.equal(auth(current),auth(original),'Existing account/auth markup unchanged');
      const scripts=['/app/soulfuel/food-diary-core.js','/app/soulfuel/metrics/metrics-core.js','/app/soulfuel/metrics/units.js','/app/soulfuel/tracker-progress.js','/app/wellness/dashboard-core.js','/app/wellness/dashboard.js','/app/member-navigation.js'];
      let tail=current.slice(current.indexOf('<section id="workouts"'));
      for(const src of scripts)tail=tail.replace('<script src="'+src+'"></script>','');tail=tail.replace('\n</body>','</body>');
      assert.equal(tail,original.slice(original.indexOf('<section id="workouts"')),'All existing non-home program panels unchanged');
    }else if(file==='vercel.json'){const current=JSON.parse(fs.readFileSync(path.join(root,file),'utf8')),original=JSON.parse(git('show',base+':'+file));const media=current.headers.filter(h=>h.source==='/app/strength/media/exercises/:hash/:file');assert.equal(media.length,1);assert.deepEqual(media[0].headers,[{key:'Cache-Control',value:'public, max-age=31536000, immutable'}]);current.headers=current.headers.filter(h=>h.source!=='/app/strength/media/exercises/:hash/:file');if(!original.headers)delete current.headers;const assets=require('../app/strength/approved-media.json').assets;for(const asset of assets){const legacy='/app/strength/media/exercises/'+path.basename(asset.file);assert.deepEqual(current.redirects.find(r=>r.source===legacy),{source:legacy,destination:'/'+asset.file,permanent:true});}current.redirects=current.redirects.filter(r=>!r.source.startsWith('/app/strength/media/exercises/'));assert.deepEqual(current,original);
    }else if(file==='app/app.js'){
      const current=fs.readFileSync(path.join(root,file),'utf8');
      const bridge=`\n// Read-only session bridge for the authorized wellness dashboard; no auth changes.\nwindow.SoulanovaMemberAuth=Object.freeze({getClient:()=>client,getWorkoutSnapshot:()=>({memberId:currentUser?.id||null,ready:historyView==='ready',rows:state.history.map(e=>({completed_at:e.at,duration_minutes:e.minutes}))})});\n`;
      assert.equal(current.replace(bridge,''),git('show',base+':'+file).toString(),'Existing workout and authentication code unchanged');
    }else if(file.endsWith('.html')){const current=fs.readFileSync(path.join(root,file),'utf8').replace('<script src="/app/member-navigation.js"></script>\n','');assert.equal(current,git('show',base+':'+file).toString(),file);}else if(file==='app/member-data.mjs'){assert.equal(fs.readFileSync(path.join(root,file),'utf8').replace('if(!user||user.is_anonymous)','if(!user)'),git('show',base+':'+file).toString(),file);}else assert.equal(git('hash-object',file).toString().trim(), hash, file);
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
