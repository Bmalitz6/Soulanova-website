import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const $=id=>document.getElementById(id),db=createClient(window.SOULANOVA_SUPABASE.url,window.SOULANOVA_SUPABASE.publishableKey);
let user=null,barcode='',per100={},lastAmount=100,amountUnit='g',baseAmount=100,scanner=null,scanning=false;
function labeledPortion(label){const match=String(label||'').match(/(\d+(?:[.,]\d+)?)\s*(mL|ml|g|fl\.?\s*oz|oz)\b/i);if(!match)return null;const value=Number(match[1].replace(',','.'));if(!Number.isFinite(value)||value<=0)return null;const unit=match[2].toLowerCase().replace(/\s|\./g,'');if(unit==='ml')return {amount:value,unit:'mL'};if(unit==='g')return {amount:value,unit:'g'};if(unit==='floz')return {amount:value*29.5735295625,unit:'mL'};if(unit==='oz')return {amount:value*28.349523125,unit:'g'};return null;}
const nutrients=[['calories','Calories','kcal','energy-kcal_100g',1],['protein','Protein','g','proteins_100g',1],['carbs','Carbs','g','carbohydrates_100g',1],['fat','Fat','g','fat_100g',1],['total_sugar','Total sugar','g','sugars_100g',1],['fiber','Fiber','g','fiber_100g',1],['sodium','Sodium','mg','sodium_100g',1000],['added_sugar','Added sugar','g',null,1]];
const setStatus=s=>{$('status').textContent=s},valid=n=>Number.isFinite(n)&&n>=0;
const safeNumber=v=>v===null||v===undefined||v===''?null:Number(v);
async function lookup(e){e?.preventDefault();barcode=$('barcode').value.trim();if(!/^\d{8,14}$/.test(barcode)){setStatus('Enter a valid UPC or EAN barcode.');return}
 $('result').hidden=true;setStatus('Looking up product…');
 try{const res=await fetch('https://world.openfoodfacts.org/api/v2/product/'+encodeURIComponent(barcode)+'.json?fields=code,product_name,brands,serving_size,nutriments',{headers:{Accept:'application/json'}});if(!res.ok)throw Error('Food lookup service returned '+res.status);const data=await res.json();if(data.status!==1||!data.product){setStatus('Product not found. Use manual food entry in SoulFuel.');return}
 const p=data.product;per100={};for(const [key,, ,field,factor] of nutrients){if(!field)continue;const n=safeNumber(p.nutriments?.[field]);if(n!==null&&valid(n))per100[key]=n*factor}
 $('product').textContent=[p.product_name||'Unnamed product',p.brands].filter(Boolean).join(' · ');$('food-name').value=p.product_name||'Food '+barcode;
 $('attribution').textContent='Lookup: Open Food Facts · Serving label: '+(p.serving_size||'not specified')+'. Nutrients are based on reported values per 100g/100mL.';
 const portion=labeledPortion(p.serving_size);lastAmount=portion?.amount||100;baseAmount=lastAmount;amountUnit=portion?.unit||'g';$('amount-unit').value=amountUnit;
 $('amount').value=String(Number(lastAmount.toFixed(2)));
 $('amount-label').textContent=portion?'Suggested package serving: '+p.serving_size:'Serving size unavailable; check the label.';
 for(const [key] of nutrients){const el=$('macro-'+key);el.value=per100[key]===undefined?'':String(Number((per100[key]*lastAmount/100).toFixed(2)));}
 $('result').hidden=false;setStatus('Product found. Review and adjust the values before saving.');$('result').scrollIntoView({behavior:'smooth',block:'start'});
 }catch(err){setStatus('Lookup failed: '+err.message+'. You can still log this food manually.')}
}
for(const [key,label,unit] of nutrients){const l=document.createElement('label'),i=document.createElement('input');l.textContent=label+' ('+unit+')';i.type='number';i.min='0';i.step='any';i.placeholder='Unknown';i.id='macro-'+key;l.append(i);$('macros').append(l)}
const unitFactors={mL:1,'fl oz':29.5735295625,g:1,oz:28.349523125};
$('amount-unit').addEventListener('change',()=>{
 const next=$('amount-unit').value,old=amountUnit;
 const compatible=(old==='mL'||old==='fl oz')&&(next==='mL'||next==='fl oz')||(old==='g'||old==='oz')&&(next==='g'||next==='oz');
 if(compatible){const n=Number($('amount').value);if(Number.isFinite(n)&&n>0){const converted=n*unitFactors[old]/unitFactors[next];$('amount').value=String(Number(converted.toFixed(3)));lastAmount=converted;}}
 else if(old!==next){setStatus('Please confirm amount and macros: this unit cannot be automatically converted from '+old+'.');}
 amountUnit=next;
});
$('lookup').addEventListener('submit',lookup);
$('amount').addEventListener('change',()=>{const next=Number($('amount').value);if(!Number.isFinite(next)||next<=0||next>10000)return;const ratio=next/lastAmount;for(const [key] of nutrients){const el=$('macro-'+key);if(el.value.trim()!==''){const n=Number(el.value);if(valid(n))el.value=String(Number((n*ratio).toFixed(2)))}}lastAmount=next});
$('save').addEventListener('submit',async e=>{e.preventDefault();const btn=e.submitter;try{
 const session=await db.auth.getUser();if(session.error)throw session.error;user=session.data.user;if(!user)throw Error('Please sign in to your Soulanova account first.');
 const amount=Number($('amount').value),name=$('food-name').value.trim();if(!Number.isFinite(amount)||amount<=0||amount>10000||!name)throw Error('Check the food name and amount.');
 const values={};for(const [key] of nutrients){const raw=$('macro-'+key).value.trim();if(raw==='')continue;const n=Number(raw);if(!valid(n))throw Error('Correct the value for '+key);values[key]=n}
 btn.disabled=true;const {error}=await db.from('nutrition_entries').insert({user_id:user.id,consumed_at:new Date().toISOString(),meal_type:$('meal').value,food_name:name,quantity:amount,serving_description:$('amount-unit').value,nutrients:values,source:'barcode',barcode});if(error)throw error;
 setStatus('Saved to your SoulFuel food journal.');$('result').hidden=true;
 }catch(err){setStatus(err.message)}finally{btn.disabled=false}});
async function stop(){if(scanner&&scanning){try{await scanner.stop()}catch(e){}scanning=false}if(scanner){try{scanner.clear()}catch(e){}scanner=null}$('camera').hidden=true;$('stop-camera').hidden=true}
$('start-camera').addEventListener('click',async()=>{try{if(!window.Html5Qrcode)throw Error('Camera library unavailable. Use manual barcode entry.');await stop();$('camera').hidden=false;$('stop-camera').hidden=false;scanner=new window.Html5Qrcode('camera');scanning=true;await scanner.start({facingMode:'environment'},{fps:10,qrbox:{width:260,height:140}},async code=>{await stop();$('barcode').value=code;await lookup()},()=>{});setStatus('Point the camera at the product barcode.')}catch(err){await stop();setStatus('Camera unavailable: '+err.message+'. Enter the barcode manually.') }});
$('stop-camera').addEventListener('click',()=>stop().then(()=>setStatus('Camera stopped.')));
db.auth.getUser().then(({data,error})=>{if(error)setStatus('Sign-in check failed: '+error.message);else if(!data.user)setStatus('Sign in through Soulanova before saving foods.');else setStatus('Ready to scan or enter a barcode.')});
