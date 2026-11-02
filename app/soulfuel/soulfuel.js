import {bounded,requireMember,insertOnce,assertWriteReady} from '/app/member-data.mjs';
import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const $=id=>document.getElementById(id);
const fields=[['calories','Calories','kcal'],['protein','Protein','g'],['carbs','Carbs','g'],['fat','Fat','g'],['total_sugar','Total sugar','g'],['added_sugar','Added sugar','g'],['fiber','Fiber','g'],['sodium','Sodium','mg'],['water','Water','ml']];
const db=createClient(window.SOULANOVA_SUPABASE.url,window.SOULANOVA_SUPABASE.publishableKey,{auth:{flowType:'pkce',detectSessionInUrl:true,autoRefreshToken:true,persistSession:true}});
let user=null,goals=[],entries=[],recentFoods=[],savingFood=false,savingGoal=false,pendingFood=null,authRevision=0,refreshRevision=0,journalStatus='idle';
const message=(s)=>{$('message').textContent=s};
const dayString=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
$('day').value=dayString(new Date());
const el=(tag,txt,cls)=>{let e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;if(cls)e.className=cls;return e};
// Units are stored exactly as entered. Changing compatible units converts the quantity,
// not the food's nutrients; those describe the same consumed portion.
const conversion={mL:{'fl oz':1/29.5735295625},'fl oz':{mL:29.5735295625},g:{oz:1/28.349523125},oz:{g:28.349523125}};
let selectedUnit=$('serving').value;
$('serving').addEventListener('change',()=>{
 const next=$('serving').value,old=selectedUnit;
 const factor=conversion[old]?.[next];
 if(factor){const val=Number($('quantity').value);
  if(Number.isFinite(val)&&val>0)$('quantity').value=String(Number((val*factor).toFixed(3)));
 }else if(old!==next){message('Unit changed. Serving size is not convertible to weight or volume without product information. Check the quantity before saving.');}
 selectedUnit=next;
});
const number=v=>Number.isFinite(Number(v))?Number(v):0;
function renderFrequentFoods(){
 const box=$('frequent-foods');box.replaceChildren();
 const grouped=new Map();
 // Use the member's own recent entries; keep the latest full nutrient values.
 for(const item of recentFoods){
  const key='name:'+item.food_name.trim().toLowerCase().replace(/\s+/g,' ');
  if(!grouped.has(key))grouped.set(key,{count:0,latest:item});
  grouped.get(key).count++;
 }
 const frequent=[...grouped.values()].sort((a,b)=>b.count-a.count).slice(0,6);
 if(!frequent.length){box.append(el('p','As you log meals, your frequently used foods will appear here.','hint'));return;}
 for(const group of frequent){
  const item=group.latest,row=el('div',undefined,'metric'),info=el('div');
  const legacyUnit=['g or mL (as labeled)'].includes(item.serving_description);const displayUnit=legacyUnit?'unit needs confirmation':item.serving_description;info.append(el('strong',item.food_name),el('small',group.count+' logged · '+item.quantity+' '+displayUnit));
  const btn=el('button','Use again');btn.type='button';btn.className='frequent-use';
  btn.onclick=()=>{
   $('food-name').value=item.food_name;$('meal').value=item.meal_type;
   $('quantity').value=item.quantity;const unitValues=[...$('serving').options].map(o=>o.value);$('serving').value=unitValues.includes(item.serving_description)?item.serving_description:'serving';selectedUnit=$('serving').value;
   for(const field of document.querySelectorAll('[data-nutrient]')){
    const value=item.nutrients?.[field.dataset.nutrient];
    field.value=value===undefined||value===null?'':String(value);
   }
   message('Food filled in. Check the unit, serving quantity and nutrition values before saving.'+(legacyUnit?' This older entry did not specify g versus mL.':''));
   $('food-form').scrollIntoView({behavior:'smooth',block:'center'});
  };
  row.append(info,btn);box.append(row);
 }
}
function render(){
 renderFrequentFoods();
 const goalBox=$('goals');goalBox.replaceChildren();
 for(const g of goals){const row=el('div',undefined,'metric'),info=el('div');info.append(el('strong',g.display_name),el('small',g.goal_type+' '+g.target_value+' '+g.unit));const del=el('button','Remove');del.onclick=()=>remove('nutrition_goals',g.id);row.append(info,del);goalBox.append(row)}
 if(!goals.length)goalBox.append(el('p','No goals yet. Add only the metrics you want to track.','hint'));
 const sum=$('summary');sum.replaceChildren();
 for(const g of goals.filter(x=>x.enabled)){const known=entries.filter(e=>e.nutrients?.[g.nutrient_key]!==undefined&&e.nutrients?.[g.nutrient_key]!==null&&Number.isFinite(Number(e.nutrients[g.nutrient_key]))),unknown=entries.length-known.length,consumed=known.reduce((n,e)=>n+number(e.nutrients[g.nutrient_key]),0),card=el('div',undefined,'summary-card'),line=el('div',undefined,'line'),caption=el('strong',g.display_name);line.append(caption,el('span',(journalStatus==='loading'?'Loading…':journalStatus==='error'?'—':known.length||!entries.length?consumed.toFixed(1):'—')+' / '+g.target_value+' '+g.unit));const track=el('div',undefined,'track'),fill=el('div',undefined,'fill');fill.style.width=Math.min(100,consumed/Math.max(.001,number(g.target_value))*100)+'%';track.append(fill);card.append(line,track);if(unknown)card.append(el('small',unknown+' '+(unknown===1?'food has':'foods have')+' no '+g.display_name.toLowerCase()+' value. Only known values are totaled.','hint'));sum.append(card)}
 if(!goals.length)sum.append(el('p','Set a personal nutrition goal to see your daily progress.','hint'));
 const list=$('entries');list.replaceChildren();
 for(const item of entries){let row=el('div',undefined,'entry'),name=el('div');name.append(el('strong',item.food_name),el('small',item.meal_type+' · '+item.quantity+' '+item.serving_description));const del=el('button','Remove');del.onclick=()=>remove('nutrition_entries',item.id);row.append(name,del);list.append(row)}
 if(!entries.length)list.append(el('p',journalStatus==='loading'?'Loading your food journal…':journalStatus==='error'?'Your food journal is unavailable. Choose a date to try again.':'No foods logged for this day.','hint'));
}
async function refresh(){if(!user)return;const account=user.id,revision=++refreshRevision;message('');const date=$('day').value,start=new Date(date+'T00:00:00'),end=new Date(start);if(!Number.isFinite(start.getTime())){entries=[];journalStatus='error';render();throw Error('Choose a valid history date.');}end.setDate(end.getDate()+1);entries=[];journalStatus='loading';render();
 try{const results=await Promise.all([
 bounded(signal=>db.from('nutrition_goals').select('*').eq('user_id',account).order('display_name').abortSignal(signal)),
 bounded(signal=>db.from('nutrition_entries').select('*').eq('user_id',account).gte('consumed_at',start.toISOString()).lt('consumed_at',end.toISOString()).order('consumed_at',{ascending:false}).abortSignal(signal)),
 bounded(signal=>db.from('nutrition_entries').select('id,food_name,meal_type,quantity,serving_description,nutrients,barcode,consumed_at').eq('user_id',account).order('consumed_at',{ascending:false}).limit(200).abortSignal(signal))]);
 if(user?.id!==account||revision!==refreshRevision)return;for(const r of results)if(r.error)throw r.error;[goals,entries,recentFoods]=results.map(x=>x.data||[]);journalStatus='ready';render();}catch(error){if(user?.id!==account||revision!==refreshRevision)return;entries=[];journalStatus='error';render();throw error;}}
async function remove(table,id){if(!user||!confirm('Remove this entry?'))return;try{assertWriteReady('soulfuel');const account=user.id;await requireMember(db,account);const r=await bounded(signal=>db.from(table).delete().eq('id',id).eq('user_id',account).abortSignal(signal));if(r.error)throw r.error;await refresh();}catch(e){message(e.message);}}
$('goal-form').addEventListener('submit',async e=>{e.preventDefault();if(savingGoal)return;savingGoal=true;const btn=$('goal-form').querySelector('button[type="submit"]');btn.disabled=true;
 try{assertWriteReady('soulfuel');const account=user?.id;if(!account)throw Error('Please sign in first.');await requireMember(db,account);const [nutrient_key,display_name,unit]=$('metric').value.split('|'),target_value=Number($('amount').value);if(!Number.isFinite(target_value)||target_value<0)throw Error('Enter a nonnegative goal.');
 const r=await bounded(signal=>db.from('nutrition_goals').upsert({user_id:account,nutrient_key,display_name,unit,target_value,goal_type:$('direction').value,enabled:true},{onConflict:'user_id,nutrient_key'}).abortSignal(signal));if(r.error)throw r.error;await refresh();}catch(ex){message(ex.message);}finally{savingGoal=false;btn.disabled=false;}});
for(const [key,label,unit] of fields){const wrap=el('label',label+' ('+unit+')'),input=el('input');input.type='number';input.min='0';input.step='any';input.placeholder='optional';input.dataset.nutrient=key;wrap.append(input);$('nutrient-fields').append(wrap)}
$('food-form').addEventListener('submit',async e=>{e.preventDefault();if(savingFood)return;savingFood=true;const btn=$('food-form').querySelector('button[type="submit"]'),revision=authRevision;btn.disabled=true;btn.setAttribute('aria-busy','true');
 try{assertWriteReady('soulfuel');if(!user)throw Error('Please sign in first.');
 if(!pendingFood){const food_name=$('food-name').value.trim(),quantity=Number($('quantity').value);if(!food_name||!Number.isFinite(quantity)||quantity<=0)throw Error('Check food name and quantity.');if($('serving').value==='serving'&&quantity>20)throw Error('Please confirm the serving unit before saving.');const nutrients={};for(const field of document.querySelectorAll('[data-nutrient]')){if(field.value.trim()==='')continue;const n=Number(field.value);if(!Number.isFinite(n)||n<0)throw Error('Nutrition amounts must be nonnegative numbers.');nutrients[field.dataset.nutrient]=n;}
 const selected=$('day').value,now=new Date(),at=new Date(selected+'T12:00:00');if(selected===dayString(now))at.setHours(now.getHours(),now.getMinutes(),0,0);
 pendingFood={id:crypto.randomUUID(),user_id:user.id,consumed_at:at.toISOString(),food_name,meal_type:$('meal').value,quantity,serving_description:$('serving').value||'serving',nutrients,source:'manual'};}
 await insertOnce(db,'soulfuel','nutrition_entries',pendingFood);if(revision!==authRevision)return;pendingFood=null;$('food-form').reset();$('quantity').value='1';$('serving').value='serving';selectedUnit='serving';
 try{await refresh();message('Food saved.');}catch(ex){message('Food saved; journal refresh failed: '+ex.message);}
 }catch(ex){if(revision===authRevision)message(ex.message+(pendingFood?' Retry this save to confirm the same entry; it will not create another record.':''));}finally{savingFood=false;btn.disabled=false;btn.setAttribute('aria-busy','false');for(const control of $('food-form').querySelectorAll('input,select'))control.disabled=!!pendingFood;}});
$('day').addEventListener('change',()=>refresh().catch(e=>message(e.message)));
function changeMember(next){if((next?.id||null)!==(user?.id||null)){authRevision++;refreshRevision++;user=next||null;journalStatus='idle';goals=[];entries=[];recentFoods=[];pendingFood=null;$('food-form').reset();for(const c of $('food-form').querySelectorAll('input,select'))c.disabled=false;render();}$('app').hidden=!user;$('signin').hidden=!!user;$('auth-status').textContent=user?.email||'Sign in required';}
async function init(){const revision=authRevision;try{const member=await requireMember(db);if(revision!==authRevision)return;changeMember(member);await refresh();}catch(e){message('Unable to load SoulFuel: '+e.message);if(!user)$('signin').hidden=false;}}
db.auth.onAuthStateChange((_event,session)=>{changeMember(session?.user);if(user)setTimeout(()=>refresh().catch(e=>message(e.message)),0);});init();
