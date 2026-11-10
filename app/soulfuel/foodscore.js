'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const form = $('lookup-form'), input = $('barcode'), button = $('lookup-button');
  const status = $('status'), result = $('result'), authState = $('auth-state'), diaryList = $('diary-list');
  const cameraButton = $('scan-camera'), stopCameraButton = $('stop-camera'), cameraStatus = $('camera-status'), cameraPreview = $('camera-preview'), cameraVideo = $('camera-video');
  const Scanner = window.SoulanovaFoodScoreScanner;
  const lookupEnabled = window.SoulanovaFoodScoreAvailability?.enabled === true;
  $('foodscore-lookup').hidden = !lookupEnabled;
  $('foodscore-coming-soon').hidden = lookupEnabled;
  if($('scanner-paused-preview'))$('scanner-paused-preview').hidden=lookupEnabled;
  if($('lookup-availability'))$('lookup-availability').textContent=lookupEnabled?'Barcode lookup ready':'Preview · lookup paused';
  let memberId = null, currentProduct = null, scanId = '', client = null, lookupPending = false, authRevision = 0;
  let storageReadFailed = false, lookupRevision = 0;
  const sourceBase = 'https://world.openfoodfacts.net';
  const dayKey = () => { const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'); };
  const Diary = window.SoulanovaFoodDiary;
  const dateInput = $('diary-date'), manualForm = $('manual-entry-form'), goalsForm = $('nutrition-goals-form');
  const selectedDay = () => dateInput.value || dayKey();
  const { normalizeOpenFoodFactsProduct: normalize } = window.SoulanovaFoodScore;
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const showStatus = (message, ok = false) => { status.textContent = message; status.classList.toggle('good', ok); };
  const fmt = (value, unit) => value === null ? 'Unavailable' : `${Number(value.toFixed(1)).toLocaleString()} ${unit}`;
  let cameraSession = null, cameraAttempt = 0;
  function selectFoodTab(name,focus=false){
    if(name!=='scan')stopCamera();
    for(const tabName of ['scan','manual']){
      const tab=$(tabName+'-tab'),active=tabName===name;
      tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;
      $(tabName+'-panel').hidden=!active;
      if(active&&focus)tab.focus();
    }
  }
  for(const name of ['scan','manual']){
    $(name+'-tab').addEventListener('click',()=>selectFoodTab(name));
    $(name+'-tab').addEventListener('keydown',event=>{
      if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
        event.preventDefault();selectFoodTab(event.key==='Home'?'scan':event.key==='End'?'manual':name==='scan'?'manual':'scan',true);
      }
    });
  }


  function stopCamera(){cameraAttempt++;cameraSession?.stop();cameraSession=null;cameraPreview.hidden=true;stopCameraButton.hidden=true;cameraButton.disabled=!Scanner?.capability(window)}

  async function lookup(barcode) {
    if(!lookupEnabled)return;
    const requestRevision=++lookupRevision, memberRevision=authRevision;
    const code=String(barcode).replace(/\s/g,'');
    if(!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(code)){showStatus('Enter a valid 8, 12, 13, or 14 digit barcode.');return}
    stopCamera();
    lookupPending=true;button.disabled=true;$('scan-panel').setAttribute('aria-busy','true');result.hidden=true;showStatus('Looking up product…');
    const endpoint='/api/foodfacts';
    try{
      const response=await fetch(endpoint,{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({barcode:code}),signal:AbortSignal.timeout(15000)});
      if(response.status===429){const seconds=Math.max(1,Number(response.headers?.get('Retry-After'))||60);throw Error(`Food lookup limit reached. Try again in about ${seconds} seconds.`)}
      if(response.status===503)throw Error('FoodScore is temporarily unavailable. Please try again later.');
      if(!response.ok)throw Error('Open Food Facts is temporarily unavailable. Please try again.');
      const payload=await response.json();
      if(requestRevision!==lookupRevision||memberRevision!==authRevision)return;
      if(!(payload.status===1||payload.status==='success')||!payload.product){currentProduct=null;showStatus('No product was found for this barcode. Check the number or try another product.');return}
      currentProduct=normalize(payload.product,code);scanId=`${Date.now()}-${Math.random().toString(36).slice(2)}`;renderProduct();showStatus('Open Food Facts staging test data loaded. Not for nutrition decisions.',true);
    }catch(error){if(requestRevision!==lookupRevision||memberRevision!==authRevision)return;showStatus(error instanceof Error&&/Food lookup limit|FoodScore is temporarily|Open Food Facts is temporarily|No product was found/.test(error.message)?error.message:'FoodScore lookup is temporarily unavailable. Please try again later.')}
    finally{if(requestRevision===lookupRevision){lookupPending=false;button.disabled=false;$('scan-panel').setAttribute('aria-busy','false')}}
  }

  function renderProduct(){
    if(!currentProduct)return;
    const p=currentProduct,s=p.score,n=p.per100g,serv=p.perServing;
    const image='<div class="placeholder" aria-label="Product image not loaded">◌</div>';
    const score=s.status==='scored'?`<div class="score ${escapeHtml(s.band.toLowerCase().replace(/ /g,'-'))}"><div class="score-gauge" role="img" aria-label="Provisional FoodScore ${s.score} out of 100, ${escapeHtml(s.band)}"><svg viewBox="0 0 112 112" aria-hidden="true"><circle class="gauge-track" cx="56" cy="56" r="45"></circle><circle class="gauge-value" cx="56" cy="56" r="45" style="stroke-dashoffset:${(1-s.score/100)*282.74}"></circle></svg><div class="gauge-number"><strong>${s.score}</strong><span>of 100</span></div></div><div><span class="eyebrow">PROVISIONAL SOULANOVA FOODSCORE</span><h3>${escapeHtml(s.band)}</h3><p class="muted">Provisional · ${s.coverage}/100 weighted points assessed.<br>Source data is unverified.</p></div></div>`:`<div class="insufficient"><strong>Insufficient data</strong><p class="muted">No score is shown. Missing or unsupported: ${s.missing.map(escapeHtml).join(', ')}.</p></div>`;
    const factors=`<details class="score-explainer"><summary>How this provisional score is calculated</summary><p>Nutrition 60 · Ingredient quality 25 · Processing context 15. Version ${escapeHtml(s.version)}. Separate from official Nutri-Score and NOVA.</p>${s.status==='scored'?`<p>Assessed points: ${Number(s.earned.toFixed(1))}/${s.coverage}; normalized to ${s.score}/100.</p><p>Missing: ${escapeHtml(s.missing.join('; ')||'No scoring inputs missing; source accuracy is unverified.')}</p><ul class="factors">${s.factors.map(f=>`<li>${escapeHtml(f.label)}: ${Number(f.value.toFixed(2))} → ${Number(f.points.toFixed(1))}/${f.max} points</li>`).join('')}</ul>`:''}<ul>${(s.notes||[]).map(note=>`<li>${escapeHtml(note)}</li>`).join('')}</ul><a href="#score-method">Read the formula and its limits</a></details>`;
    const meal=escapeHtml($('entry-meal').value||'Breakfast');
    result.innerHTML=`<article class="product"><p class="status">Open Food Facts staging · Test data only. Records may differ from the live database; do not rely on these estimates for nutrition decisions.</p><div class="product-top">${image}<div><h2>${escapeHtml(p.name||'Product name unavailable')}</h2><p class="brandline">${escapeHtml(p.brand||'Brand unavailable')} · Barcode ${escapeHtml(p.barcode)}<br>Serving: ${escapeHtml(p.servingSize||'Unavailable')}</p></div></div>${score}<details class="nutrition-details"><summary>Nutrition &amp; ingredients</summary><h3>Nutrition per ${p.baseUnit==='ml'?'100 ml':p.baseUnit==='g'?'100 g':'100 g/ml (basis unavailable)'}</h3><p class="muted scale-note">Reported product identity and nutrition are not independently verified. Check the package. Values come from this Open Food Facts staging test record. Missing fields are unavailable; values are community-contributed and not independently verified. Energy is converted to kcal when only kJ is supplied; sodium may be converted from reported salt.</p><div class="nutrients">${nutrient('Calories',n.calories,'kcal')}${nutrient('Protein',n.protein,'g','♧',25)}${nutrient('Carbohydrates',n.carbs,'g')}${nutrient('Total fat',n.fat,'g')}${nutrient('Sugar',n.sugar,'g','◌',25)}${nutrient('Fiber',n.fiber,'g','✳',10)}${nutrient('Saturated fat',n.satfat,'g','◍',10)}${nutrient('Sodium',n.sodium,'mg','⌁',1500)}</div><h3>Per serving (when reported)</h3><div class="nutrients">${nutrient('Calories',serv.calories,'kcal')}${nutrient('Protein',serv.protein,'g')}${nutrient('Carbohydrates',serv.carbs,'g')}${nutrient('Total fat',serv.fat,'g')}${nutrient('Sugar',serv.sugar,'g')}${nutrient('Fiber',serv.fiber,'g')}${nutrient('Saturated fat',serv.satfat,'g')}${nutrient('Sodium',serv.sodium,'mg')}</div><h3>Ingredients</h3><p class="muted">${escapeHtml(p.ingredients||'Unavailable')}</p><p class="muted">Open Food Facts NOVA: ${p.nova??'Unavailable'} · Official Nutri-Score: ${escapeHtml(p.nutriScore||'Unavailable')} (separate from FoodScore).</p></details>${factors}<fieldset class="product-save"><legend>Add to Daily Tracker</legend><p class="muted">Review the portion and meal, then choose Add. Per-serving data is multiplied by servings. If no per-serving nutrients are reported, enter a measured portion matching the displayed basis. Grams and milliliters are never interchanged. Missing nutrients remain unavailable.</p><div class="product-save-controls"><label for="product-servings">Servings<input id="product-servings" type="number" min="0.1" step="0.1" value="1" inputmode="decimal"></label><label for="product-grams">Measured portion in ${p.baseUnit||'g/ml — basis unknown'} (optional)<input id="product-grams" type="number" min="0.1" step="any" placeholder="Use reported per-100 ${p.baseUnit||'unit'} values" ${p.baseUnit?'':'disabled'} inputmode="decimal"></label><label for="product-meal">Meal<select id="product-meal"><option ${meal==='Breakfast'?'selected':''}>Breakfast</option><option ${meal==='Lunch'?'selected':''}>Lunch</option><option ${meal==='Dinner'?'selected':''}>Dinner</option><option ${meal==='Snack'?'selected':''}>Snack</option></select></label></div><div id="portion-preview" class="portion-preview" aria-live="polite"></div><label class="confirm-portion"><input id="product-confirm" type="checkbox"> I checked the product and portion against the package and want to add this community-reported nutrition.</label><p id="product-save-status" class="status" role="status" aria-live="polite">Product nutrition is community-contributed; check the package before relying on it.</p><button id="save-food" class="primary save" type="button" ${memberId&&!storageReadFailed?'':'disabled'}>${memberId?'Confirm & add to Daily Tracker':'Sign in to save to your member diary'}</button></fieldset><p class="attrib">Product information: <a href="${sourceBase}/product/${encodeURIComponent(p.barcode)}" target="_blank" rel="noopener noreferrer">Open Food Facts staging (test data)</a> · database: <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener noreferrer">ODbL</a> · contents: <a href="https://opendatacommons.org/licenses/dbcl/1-0/" target="_blank" rel="noopener noreferrer">DbCL</a>. Product images are not loaded; image reuse needs separate rights review.</p></article>`;
    result.hidden=false;$('save-food').addEventListener('click',saveCurrentFood);for(const id of ['product-servings','product-grams'])$(id).addEventListener('input',renderPortion);renderPortion();
  }
  function nutrient(name,value,unit){return `<div class="nutrient" aria-label="${escapeHtml(name)}: ${escapeHtml(fmt(value,unit))}"><span class="nutrient-name">${escapeHtml(name)}</span><strong>${escapeHtml(fmt(value,unit))}</strong></div>`}


  function renderPortion(){try{const p=currentProduct,portion=window.SoulanovaFoodScore.scaleProductNutrition(p,$('product-servings').value,$('product-grams').value);$('portion-preview').textContent=`Selected: ${portion.basis} · ${Object.entries(portion.values).map(([k,v])=>`${k}: ${v===null?'Unavailable':Number(v.toFixed(1))+(k==='calories'?' kcal':k==='sodium'?' mg':' g')}`).join(' · ')}`}catch(error){$('portion-preview').textContent=error.message}}
  function setFormsEnabled(enabled){for(const formElement of [manualForm,goalsForm])for(const control of Array.from(formElement?.elements||[]))control.disabled=!enabled;const foodButton=$('save-food');if(foodButton)foodButton.disabled=!enabled}
  function renderTotals(rows){
    const {totals,counted,communityEntries,entryCount}=Diary.trackerTotals(rows,selectedDay());let goals={};
    if(memberId){try{goals=Diary.readGoals(localStorage,memberId)}catch{}}
    const names={calories:['Calories','kcal'],protein:['Protein','g'],carbs:['Carbohydrates','g'],fat:['Fat','g'],fiber:['Fiber','g'],water:['Water','ml']};
    const target=$('diary-totals'),secondary=$('secondary-totals');target.replaceChildren();secondary?.replaceChildren();
    for(const key of Diary.NUTRIENTS){
      const cell=document.createElement('div');cell.className=`total-item total-${key}`;
      const amount=counted[key]?totals[key]:entryCount===0?0:null;
      const goal=goals[key], unit=names[key][1];
      if(!['fiber','water'].includes(key)){
        const p=window.SoulanovaTrackerProgress.progress(amount,goal);
        const amountText=p.amount===null?'Unavailable':p.amount.toLocaleString(undefined,{maximumFractionDigits:10});
        const goalText=p.target===null?'Not Set':`${p.target.toLocaleString()} ${unit}`;
        const stateText=p.state==='over'?'Over Goal':p.state==='reached'?'Goal Reached ✓':p.state==='unset'?'Set Goal':p.state==='unknown'?'No reported data':'Of your goal';
        const percentText=p.label===null?'—':`${p.label}%`;
        cell.classList.add('tracker-dial',`dial-${p.state}`);
        cell.innerHTML=`<span class="dial-title">${names[key][0]}</span><div class="dial-graphic" role="img" aria-label="${names[key][0]}: ${amountText} ${unit}; goal ${goalText}; ${p.label===null?'percentage unavailable':percentText}; ${stateText}"><svg viewBox="0 0 160 160" aria-hidden="true"><circle class="dial-track" cx="80" cy="80" r="63"></circle><circle class="dial-fill" cx="80" cy="80" r="63" style="stroke-dashoffset:${(1-p.ring/100)*395.84}"></circle>${p.state==='over'?'<circle class="dial-overflow" cx="80" cy="80" r="75"></circle>':''}</svg><div class="dial-center"><strong aria-label="${names[key][0]}: ${amount===null?'Not provided':amountText+' '+unit}">${amountText}</strong><span>${unit} consumed</span><b class="dial-percent">${percentText}</b></div></div><small class="dial-goal">Goal: ${goalText}</small>${p.state==='unset'?'<a class="dial-state" href="#nutrition-goals">Set Goal</a>':`<span class="dial-state">${stateText}</span>`}`;
      }else{
        const label=document.createElement('span'),value=document.createElement('strong');label.textContent=names[key][0];value.textContent=amount===null?'Unavailable':`${Number(amount.toFixed(1)).toLocaleString()} ${unit}`;cell.append(label,value);
        if(Number.isFinite(goal)&&goal>0){const hint=document.createElement('small'),bar=document.createElement('progress');bar.max=goal;if(amount!==null)bar.value=Math.min(amount,goal);bar.setAttribute('aria-label',`${names[key][0]} goal: ${goal} ${unit}`);hint.textContent=`Goal: ${goal} ${unit}${amount===null?' · No reported data':''}`;cell.append(bar,hint);}
      }
      (secondary&&['fiber','water'].includes(key)?secondary:target).append(cell);
    }
    const note=$('tracker-summary');if(note)note.textContent=`${entryCount} confirmed entries · ${communityEntries} with community-reported nutrition. Totals reflect available values only; unknown nutrients are not zero. Personal goals are references, not dietary recommendations.`;
  }
  $('diary-totals').addEventListener('click',event=>{const link=event.target.closest('a.dial-state');if(link){$('goal-editor').open=true;const cell=link.closest('.tracker-dial');const key=Diary.NUTRIENTS.find(n=>cell.classList.contains('total-'+n));if(key)$('goal-'+key).focus();}});
  function renderDiary(){diaryList.replaceChildren();if(!memberId){authState.innerHTML='Sign in through the <a href="/app/?mode=signin">Soulanova member page</a> to save foods to a private diary.';setFormsEnabled(false);renderTotals([]);$('selected-day-label').textContent=selectedDay();return}authState.textContent='Saved in this browser for your account.';setFormsEnabled(!storageReadFailed);let rows;try{rows=Diary.readDiary(localStorage,memberId)}catch{storageReadFailed=true;setFormsEnabled(false);authState.textContent='Your saved diary could not be read. Existing entries were left unchanged; saving is paused.';renderTotals([]);return}const day=selectedDay();$('selected-day-label').textContent=new Date(`${day}T12:00:00`).toLocaleDateString(undefined,{weekday:'long',year:'numeric',month:'long',day:'numeric'});const todays=rows.filter(x=>x.day===day);renderTotals(rows);if(!todays.length){diaryList.innerHTML='<p class="subtle">No entries for this day yet.</p>';return}const units={calories:'kcal',protein:'g',carbs:'g',fat:'g',sugar:'g',fiber:'g',water:'ml',saturatedFat:'g',sodiumMg:'mg'};for(const item of todays){const row=document.createElement('article');row.className='entryrow';const left=document.createElement('div'),title=document.createElement('strong'),meta=document.createElement('small'),actions=document.createElement('div');left.className='entry-copy';title.textContent=item.name||`Food ${item.barcode||''}`;const nutrition=Object.entries(units).filter(([key])=>['calories','protein','carbs','fat'].includes(key)).filter(([key])=>typeof item[key]==='number').map(([key,unit])=>`${key}: ${item[key]} ${unit}`).join(' · ');const scoreLabel=Number.isFinite(item.score)?`Provisional FoodScore ${item.score}; separate from official Nutri-Score`:null;meta.textContent=[item.meal,item.portion||'Serving not entered',nutrition||'Nutrition not provided',scoreLabel,item.type==='manual'?'Values entered by you; not independently verified':`${item.source||'Saved food'} · community estimate included only after your confirmation`].filter(Boolean).join(' · ');left.append(title,meta);const extra=document.createElement('details'),extraTitle=document.createElement('summary'),extraText=document.createElement('p');extra.className='entry-nutrition-details';extraTitle.textContent='More nutrition & source';extraText.textContent=[...Object.entries(units).filter(([key])=>!['calories','protein','carbs','fat'].includes(key)&&typeof item[key]==='number').map(([key,unit])=>`${key}: ${item[key]} ${unit}`),item.source||'Manual entry',scoreLabel].filter(Boolean).join(' · ');extra.append(extraTitle,extraText);left.append(extra);actions.className='entry-actions';if(item.type==='manual'){const edit=document.createElement('button');edit.type='button';edit.className='secondary';edit.textContent='Edit';edit.addEventListener('click',()=>editEntry(item));actions.append(edit)}const remove=document.createElement('button');remove.type='button';remove.className='secondary';remove.textContent='Delete';remove.addEventListener('click',()=>removeEntry(item.id));actions.append(remove);row.append(left,actions);diaryList.append(row)}}

  function writeEntry(entry){if(!memberId||storageReadFailed)return;try{Diary.saveEntry(localStorage,memberId,entry);$('diary-message').textContent='Entry saved and read back on this device.';renderDiary();return true}catch{storageReadFailed=true;authState.textContent='Diary persistence could not be confirmed. Reload to check your entries before retrying; saving is paused.';setFormsEnabled(false);return false}}
  function resetEntryForm(){manualForm.reset();$('entry-id').value='';$('entry-meal').value='Breakfast';$('diary-date').value=selectedDay();$('manual-form-title').textContent='Add food or drink';$('save-entry').textContent='Add to Daily Tracker';$('cancel-edit').hidden=true}
  function editEntry(item){selectFoodTab('manual');$('entry-id').value=item.id;$('entry-name').value=item.name||'';$('entry-portion').value=item.portion||'';$('entry-meal').value=Diary.MEALS.includes(item.meal)?item.meal:'Breakfast';$('diary-date').value=item.day||selectedDay();for(const nutrient of Diary.NUTRIENTS)$(`entry-${nutrient}`).value=typeof item[nutrient]==='number'?item[nutrient]:'';$('manual-form-title').textContent='Edit food or drink';$('save-entry').textContent='Save changes';$('cancel-edit').hidden=false;$('entry-name').focus()}
  function removeEntry(id){if(!memberId||storageReadFailed)return;try{Diary.deleteEntry(localStorage,memberId,id);$('diary-message').textContent='Entry deleted from this device.';renderDiary()}catch{storageReadFailed=true;authState.textContent='The entry could not be deleted safely. Existing diary data was left unchanged.';setFormsEnabled(false)}}
  function renderGoals(){if(!memberId){for(const n of Diary.NUTRIENTS)$(`goal-${n}`).value='';$('goals-message').textContent='Sign in to save goals privately in this browser.';return}try{const goals=Diary.readGoals(localStorage,memberId);for(const nutrient of Diary.NUTRIENTS)$(`goal-${nutrient}`).value=goals[nutrient]??'';$('goals-message').textContent='Goals are optional and saved only on this device.'}catch{$('goals-message').textContent='Saved goals could not be read. Existing data was left unchanged.';goalsForm.querySelector('button[type="submit"]').disabled=true}}

  async function saveCurrentFood(){
    if(!memberId||!currentProduct||lookupPending||storageReadFailed)return;
    const saveButton=$('save-food');if(!saveButton||saveButton.disabled)return;saveButton.disabled=true;
    try{if(!$('product-confirm').checked)throw Error('Confirm the product and portion before adding it.');const rows=Diary.readDiary(localStorage,memberId),id=`foodscore:${currentProduct.barcode}:${scanId}`;if(rows.some(x=>x.id===id)){$('product-save-status').textContent='This lookup is already in your diary.';saveButton.disabled=true;return}
      const p=currentProduct,s=p.score,portion=window.SoulanovaFoodScore.scaleProductNutrition(p,$('product-servings').value,$('product-grams').value);const entry={id,type:'product',barcode:p.barcode,name:p.name||`Food ${p.barcode}`,brand:p.brand,portion:`${portion.basis}${portion.basis.includes('serving')&&p.servingSize?` of ${p.servingSize}`:' portion'}`,calories:portion.values.calories,protein:portion.values.protein,carbs:portion.values.carbs,fat:portion.values.fat,sugar:portion.values.sugar,fiber:portion.values.fiber,saturatedFat:portion.values.satfat,sodiumMg:portion.values.sodium,score:s.status==='scored'?s.score:null,scoreBand:s.status==='scored'?s.band:null,source:'Open Food Facts staging (test data)',sourceUrl:`${sourceBase}/product/${encodeURIComponent(p.barcode)}`,nutritionStatus:'product-data',memberConfirmed:true,scoreVersion:s.version,day:selectedDay(),meal:$('product-meal').value};
      if(!Object.values(portion.values).some(v=>v!==null))throw Error('No nutrition is reported for this portion. Enter a measured portion or use manual entry.');
      Diary.saveEntry(localStorage,memberId,entry);$('product-save-status').textContent='Saved and read back on this device. Your Daily Tracker now includes this confirmed community-reported estimate.';renderDiary();saveButton.disabled=true;
    }catch(error){$('product-save-status').textContent=error.message||'Could not save this product. Existing diary entries were left unchanged.';saveButton.disabled=false}
  }

  if(lookupEnabled)form.addEventListener('submit',(event)=>{event.preventDefault();void lookup(input.value.trim())});
  dateInput.value=dayKey();
  setFormsEnabled(false);
  dateInput.addEventListener('change',renderDiary);
  $('previous-day').addEventListener('click',()=>moveDate(-1));$('next-day').addEventListener('click',()=>moveDate(1));$('today-day').addEventListener('click',()=>{dateInput.value=dayKey();renderDiary()});
  function moveDate(days){const d=new Date(`${selectedDay()}T12:00:00`);d.setDate(d.getDate()+days);dateInput.value=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');renderDiary()}
  manualForm.addEventListener('submit',event=>{event.preventDefault();if(!memberId||storageReadFailed)return;const id=$('entry-id').value||`manual:${Date.now()}-${Math.random().toString(36).slice(2)}`;try{const entry=Diary.makeManualEntry({id,name:$('entry-name').value,portion:$('entry-portion').value,meal:$('entry-meal').value,day:selectedDay(),...Object.fromEntries(Diary.NUTRIENTS.map(n=>[n,$(`entry-${n}`).value]))},id);if(writeEntry(entry))resetEntryForm()}catch(error){$('diary-message').textContent=error.message||'Check the entry and try again.'}});
  $('cancel-edit').addEventListener('click',resetEntryForm);
  goalsForm.addEventListener('submit',event=>{event.preventDefault();if(!memberId||storageReadFailed)return;try{const goals=Diary.writeGoals(localStorage,memberId,Object.fromEntries(Diary.NUTRIENTS.map(n=>[n,$(`goal-${n}`).value])));for(const nutrient of Diary.NUTRIENTS)$(`goal-${nutrient}`).value=goals[nutrient]??'';$('goals-message').textContent='Your goals are saved on this device.';renderDiary()}catch{$('goals-message').textContent='Goal persistence could not be confirmed. Reload to check before retrying.'}});
  $('clear-goals').addEventListener('click',()=>{if(!memberId||storageReadFailed)return;try{localStorage.removeItem(Diary.goalsKey(memberId));renderGoals();renderDiary();$('goals-message').textContent='Your goals were cleared from this device.'}catch{$('goals-message').textContent='Could not clear goals.'}});
  if(!Scanner?.capability(window)){cameraButton.disabled=true;cameraStatus.textContent='Camera scanning is not supported in this browser. Enter the barcode manually.'}
  cameraButton.addEventListener('click',async()=>{if(!lookupEnabled)return;const attempt=++cameraAttempt;cameraButton.disabled=true;stopCameraButton.hidden=false;cameraPreview.hidden=false;cameraStatus.textContent='Requesting camera access…';try{const session=await Scanner.start({browser:window,video:cameraVideo,onStatus:message=>{cameraStatus.textContent=message},onBarcode:value=>{input.value=value;stopCamera();void lookup(value)}});if(attempt!==cameraAttempt){session.stop();return}cameraSession=session}catch(error){if(attempt===cameraAttempt){cameraPreview.hidden=true;stopCameraButton.hidden=true;cameraButton.disabled=false;cameraStatus.textContent=error.message||'Camera unavailable. Enter the barcode manually.'}}});
  stopCameraButton.addEventListener('click',()=>{stopCamera();cameraStatus.textContent='Camera stopped. Enter the barcode manually or scan again.'});
  document.addEventListener?.('visibilitychange',()=>{if(document.hidden&&cameraSession){stopCamera();cameraStatus.textContent='Camera stopped while this page was hidden.'}});
  async function restoreSession(){
    const cfg=window.SOULANOVA_SUPABASE||{};
    if(!cfg.url||!cfg.publishableKey||!window.supabase){authState.textContent='Member sign-in is unavailable. Your existing data is unchanged.';return}
    client=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{flowType:'pkce',detectSessionInUrl:true,autoRefreshToken:true,persistSession:true}});
    client.auth.onAuthStateChange((_event,session)=>{authRevision++;const nextMemberId=session?.user?.id||null;if(nextMemberId!==memberId){lookupRevision++;lookupPending=false;button.disabled=false;$('scan-panel').setAttribute('aria-busy','false');stopCamera();resetEntryForm();dateInput.value=dayKey();currentProduct=null;result.hidden=true}memberId=nextMemberId;storageReadFailed=false;renderDiary();renderGoals();if(currentProduct)renderProduct()});
    const revision=authRevision;const {data,error}=await client.auth.getSession();if(error){authState.textContent='Could not restore your member session. Sign in again from the member page.';return}if(revision===authRevision){memberId=data.session?.user?.id||null;renderDiary();renderGoals()}
  }
  restoreSession().catch(()=>{authState.textContent='Could not restore your member session.'});
})();
