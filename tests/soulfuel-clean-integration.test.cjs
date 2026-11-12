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
    if(file==='app/app.js'){
      const current=fs.readFileSync(path.join(root,file),'utf8');
      const original=git('show',base+':'+file).toString();
      const replaceOnce=(source,from,to)=>{assert.equal(source.split(from).length-1,1,`Expected one source fragment: ${from}`);return source.replace(from,to)};
      let expected=original;
      expected=replaceOnce(expected,"{id:'yoga',category:'Yoga',icon:'✳',title:'Gentle Yoga Reset',minutes:25,steps:['5 min relaxed breathing','10 min comfortable standing and seated poses','5 min gentle mobility','5 min quiet rest']}","{id:'yoga',category:'Yoga',icon:'✳',title:'Chair Yoga with Miriam',minutes:17,steps:['34 mapped movement demonstrations','Choose each movement from the Chair Yoga library','Preview candidates are pending owner review']}");
      expected=replaceOnce(expected,"yoga: {label:'YOGA', cta:'View Session', image:'/app/images/workouts/yoga.jpg'},","yoga: {label:'CHAIR YOGA', cta:'Explore Library', image:'/app/images/chair-yoga/IMG_4285.jpg'},");
      expected=replaceOnce(expected,'  save();\n\n  if(w.id===\'tai\' && window.SoulanovaClasses){',"  save();\n\n  if(w.id==='yoga'){\n    window.location.href='/app/chair-yoga/';\n    return;\n  }\n\n  if(w.id==='tai' && window.SoulanovaClasses){");
      assert.equal(current,expected,'Only the Yoga category is redirected to the Chair Yoga candidate library');
    }else if(file==='tests/soulfuel-clean-integration.test.cjs'){
      // This guard is itself updated to pin the selected Preview baseline.
      continue;
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
