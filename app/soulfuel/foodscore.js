'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const form = $('lookup-form'), input = $('barcode'), button = $('lookup-button');
  const status = $('status'), result = $('result'), authState = $('auth-state'), diaryList = $('diary-list');
  const lookupEnabled = window.SoulanovaFoodScoreAvailability?.enabled === true;
  $('foodscore-lookup').hidden = !lookupEnabled;
  $('foodscore-coming-soon').hidden = lookupEnabled;
  let memberId = null, currentProduct = null, scanId = '', client = null, lookupPending = false;
  let storageReadFailed = false;
  const sourceBase = 'https://world.openfoodfacts.org';
  const dayKey = () => { const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'); };
  const keyFor = (id) => `soulanova-foodscore-diary-v1:${id}`;
  const { normalizeOpenFoodFactsProduct: normalize } = window.SoulanovaFoodScore;
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const showStatus = (message, ok = false) => { status.textContent = message; status.classList.toggle('good', ok); };
  const fmt = (value, unit) => value === null ? 'Unavailable' : `${Number(value.toFixed(1)).toLocaleString()} ${unit}`;

  async function lookup(barcode) {
    const code=String(barcode).replace(/\s/g,'');
    if(!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(code)){showStatus('Enter a valid 8, 12, 13, or 14 digit barcode.');return}
    lookupPending=true;button.disabled=true;result.hidden=true;showStatus('Looking up product…');
    const endpoint='/api/foodfacts';
    try{
      const response=await fetch(`${endpoint}?barcode=${encodeURIComponent(code)}`,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(15000)});
      if(response.status===429){const seconds=Math.max(1,Number(response.headers?.get('Retry-After'))||60);throw Error(`Food lookup limit reached. Try again in about ${seconds} seconds.`)}
      if(response.status===503)throw Error('FoodScore is temporarily unavailable. Please try again later.');
      if(!response.ok)throw Error('Open Food Facts is temporarily unavailable. Please try again.');
      const payload=await response.json();
      if(!(payload.status===1||payload.status==='success')||!payload.product){currentProduct=null;showStatus('No product was found for this barcode. Check the number or try another product.');return}
      currentProduct=normalize(payload.product,code);scanId=`${Date.now()}-${Math.random().toString(36).slice(2)}`;renderProduct();showStatus('Product information loaded from Open Food Facts.',true);
    }catch(error){showStatus(error instanceof Error&&/Food lookup limit|FoodScore is temporarily|Open Food Facts is temporarily|No product was found/.test(error.message)?error.message:'FoodScore lookup is temporarily unavailable. Please try again later.')}
    finally{lookupPending=false;button.disabled=false}
  }

  function renderProduct(){
    if(!currentProduct)return;const p=currentProduct,s=p.score;
    const image=p.image?`<img class="product-image" src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name||'Product')} package" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'placeholder',textContent:'◌'}))">`:'<div class="placeholder" aria-label="Product image unavailable">◌</div>';
    const score=s.status==='scored'?`<div class="score ${escapeHtml(s.band.toLowerCase())}"><div class="score-gauge" role="img" aria-label="FoodScore ${s.score} out of 100, ${escapeHtml(s.band)}"><svg viewBox="0 0 112 112" aria-hidden="true"><circle class="gauge-track" cx="56" cy="56" r="45"></circle><circle class="gauge-value" cx="56" cy="56" r="45" style="stroke-dashoffset:${(1-s.score/100)*282.74}"></circle></svg><div class="gauge-number"><strong>${s.score}</strong><span>of 100</span></div></div><div><b>${escapeHtml(s.band)}</b><div class="muted">Provisional Soulanova FoodScore · not medical advice</div><div class="muted">Separate from official Nutri-Score</div></div></div>`:`<div class="insufficient"><strong>Insufficient data</strong><p class="muted">No score is shown. Missing verified information: ${s.missing.map(escapeHtml).join(', ')}.</p></div>`;
    const n=p.per100g,serv=p.perServing;
    const factors=s.status==='scored'?`<h3>Why this score</h3><p class="muted">Nutrition ${s.components.nutritionalBalance}/60 · Ingredients &amp; processing ${s.components.ingredientsProcessing}/25 · Whole-food &amp; fiber ${s.components.wholeFoodFiber}/15</p><ul class="factors">${s.positive.map(x=>`<li class="positive">+ ${escapeHtml(x)}</li>`).join('')}${s.neutral.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}${s.negative.map(x=>`<li class="negative">− ${escapeHtml(x)}</li>`).join('')}</ul>`:'';
    result.innerHTML=`<article class="product"><div class="product-top">${image}<div><h2>${escapeHtml(p.name||'Product name unavailable')}</h2><p class="brandline">${escapeHtml(p.brand||'Brand unavailable')} · Barcode ${escapeHtml(p.barcode)}<br>Serving: ${escapeHtml(p.servingSize||'Unavailable')}</p></div></div>${score}<h3>Nutrition per 100 g</h3><p class="muted scale-note">Nutrient bars show capped amounts, not daily targets.</p><div class="nutrients">${nutrient('Calories',n.calories,'kcal')}${nutrient('Protein',n.protein,'g','♧',25)}${nutrient('Carbohydrates',n.carbs,'g')}${nutrient('Sugar',n.sugar,'g','◌',25)}${nutrient('Fiber',n.fiber,'g','✳',10)}${nutrient('Saturated fat',n.satfat,'g','◍',10)}${nutrient('Sodium',n.sodium,'mg','⌁',1500)}</div><h3>Per serving (when reported)</h3><div class="nutrients">${nutrient('Calories',serv.calories,'kcal')}${nutrient('Protein',serv.protein,'g')}${nutrient('Carbohydrates',serv.carbs,'g')}${nutrient('Sugar',serv.sugar,'g')}${nutrient('Fiber',serv.fiber,'g')}${nutrient('Saturated fat',serv.satfat,'g')}${nutrient('Sodium',serv.sodium,'mg')}</div><h3>Ingredients</h3><p class="muted">${escapeHtml(p.ingredients||'Unavailable')}</p><p class="muted">Open Food Facts NOVA: ${p.nova??'Unavailable'} · Official Nutri-Score: ${escapeHtml(p.nutriScore||'Unavailable')} (separate from FoodScore).</p>${factors}<p class="attrib">Product data and image: <a href="${sourceBase}/product/${encodeURIComponent(p.barcode)}" target="_blank" rel="noopener noreferrer">Open Food Facts</a> · <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener noreferrer">ODbL database</a> / <a href="https://opendatacommons.org/licenses/dbcl/1-0/" target="_blank" rel="noopener noreferrer">DbCL contents</a> / <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener noreferrer">CC BY-SA images</a>. Verify packaging; community data may be incomplete or incorrect.</p><button id="save-food" class="primary save" type="button" ${memberId&&!storageReadFailed?'':'disabled'}>${memberId?'Save to Food Diary':'Sign in to save to your member diary'}</button></article>`;
    result.hidden=false;$('save-food').addEventListener('click',saveCurrentFood);
  }
  function nutrient(name,value,unit,icon='',scale=0){const ratio=value===null||!scale?0:Math.max(0,Math.min(1,value/scale));return `<div class="nutrient" aria-label="${escapeHtml(name)}: ${escapeHtml(fmt(value,unit))}"><span class="nutrient-name"><span class="nutrient-icon" aria-hidden="true">${icon}</span>${escapeHtml(name)}</span><strong>${escapeHtml(fmt(value,unit))}</strong>${scale?`<span class="nutrient-meter" aria-hidden="true"><span style="width:${Math.round(ratio*100)}%"></span></span>`:''}</div>`}

  function readDiary(){if(!memberId)return[];const raw=localStorage.getItem(keyFor(memberId));if(!raw)return[];const value=JSON.parse(raw);if(!Array.isArray(value))throw Error('Saved diary format is invalid.');return value;}
  function renderDiary(){diaryList.replaceChildren();if(!memberId){authState.innerHTML='Sign in through the <a href="/app/?mode=signin">Soulanova member page</a> to save foods to a private diary.';return}authState.textContent='Food entries are stored in this browser under your signed-in member ID.';let rows;try{rows=readDiary()}catch{storageReadFailed=true;authState.textContent='Your saved diary could not be read. Existing entries were left unchanged; saving is paused.';return}const todays=rows.filter(x=>x.day===dayKey()&&x.meal===$('meal').value);if(!todays.length){diaryList.innerHTML='<p class="subtle">No foods in this meal today.</p>';return}for(const item of todays){const row=document.createElement('div');row.className='entryrow';const title=document.createElement('div'),meta=document.createElement('small'),score=document.createElement('strong');title.textContent=item.name||`Food ${item.barcode}`;meta.textContent=`${item.portion||'Serving unavailable'} · ${item.calories===null?'Calories unavailable':`${item.calories} kcal`} · ${item.source}`;score.textContent=item.score===null?'Insufficient data':`${item.score} · ${item.scoreBand}`;const left=document.createElement('div');left.append(title,meta);row.append(left,score);diaryList.append(row)}}

  async function saveCurrentFood(){
    if(!memberId||!currentProduct||lookupPending||storageReadFailed)return;
    const saveButton=$('save-food');if(!saveButton||saveButton.disabled)return;saveButton.disabled=true;
    try{const rows=readDiary(),id=`foodscore:${currentProduct.barcode}:${scanId}`;if(rows.some(x=>x.id===id)){saveButton.textContent='Already in Food Diary';return}
      const p=currentProduct,s=p.score;const entry={id,barcode:p.barcode,name:p.name||`Food ${p.barcode}`,brand:p.brand,portion:p.servingSize||'Serving size unavailable',calories:p.perServing.calories,protein:p.perServing.protein,carbs:p.perServing.carbs,sugar:p.perServing.sugar,fiber:p.perServing.fiber,saturatedFat:p.perServing.satfat,sodiumMg:p.perServing.sodium,score:s.status==='scored'?s.score:null,scoreBand:s.status==='scored'?s.band:null,source:'Open Food Facts',sourceUrl:`${sourceBase}/product/${p.barcode}`,day:dayKey(),meal:$('meal').value};
      localStorage.setItem(keyFor(memberId),JSON.stringify([...rows,entry]));saveButton.textContent='Added to Food Diary';renderDiary();
    }catch{storageReadFailed=true;saveButton.textContent='Could not save';authState.textContent='The food diary could not be saved. Existing entries were left unchanged.'}
  }

  if(lookupEnabled)form.addEventListener('submit',(event)=>{event.preventDefault();void lookup(input.value.trim())});$('meal').addEventListener('change',renderDiary);
  async function restoreSession(){
    const cfg=window.SOULANOVA_SUPABASE||{};
    if(!cfg.url||!cfg.publishableKey||!window.supabase){authState.textContent='Member sign-in is unavailable in this local preview; scanning still works.';return}
    client=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{flowType:'pkce',detectSessionInUrl:true,autoRefreshToken:true,persistSession:true}});
    client.auth.onAuthStateChange((_event,session)=>{memberId=session?.user?.id||null;storageReadFailed=false;renderDiary();if(currentProduct)renderProduct()});
    const {data,error}=await client.auth.getSession();if(error){authState.textContent='Could not restore your member session. Sign in again from the member page.';return}memberId=data.session?.user?.id||null;renderDiary();
  }
  restoreSession().catch(()=>{authState.textContent='Could not restore your member session.'});
})();
