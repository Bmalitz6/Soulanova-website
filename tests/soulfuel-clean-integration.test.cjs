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
      const restored=current.replace('<link rel="stylesheet" href="/app/soulfuel/member-navigation.css">','').replace(/<section id="member-programs"[\s\S]*?<\/section>/,'').replace('<a class="soulfuel-tab" href="/app/soulfuel/">SoulFuel</a>','');
      assert.equal(restored,git('show',base+':'+file).toString(),file+' only authorized link additions');
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
