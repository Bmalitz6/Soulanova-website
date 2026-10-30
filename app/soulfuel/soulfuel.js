import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const $=id=>document.getElementById(id);
const fields=[['calories','Calories','kcal'],['protein','Protein','g'],['carbs','Carbs','g'],['fat','Fat','g'],['total_sugar','Total sugar','g'],['added_sugar','Added sugar','g'],['fiber','Fiber','g'],['sodium','Sodium','mg'],['water','Water','ml']];
const db=createClient(window.SOULANOVA_SUPABASE.url,window.SOULANOVA_SUPABASE.publishableKey);
let user=null,goals=[],entries=[],recentFoods=[];
const message=(s)=>{$('message').textContent=s};
const dayString=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
$('day').value=dayString(new Date());
const el=(tag,txt,cls)=>{let e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;if(cls)e.className=cls;return e};
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
   $('quantity').value=item.quantity;const unitValues=[...$('serving').options].map(o=>o.value);$('serving').value=unitValues.includes(item.serving_description)?item.serving_description:'serving';
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
 for(const g of goals.filter(x=>x.enabled)){const consumed=entries.reduce((n,e)=>n+number(e.nutrients?.[g.nutrient_key]),0),card=el('div',undefined,'summary-card'),line=el('div',undefined,'line'),caption=el('strong',g.display_name);line.append(caption,el('span',consumed.toFixed(1)+' / '+g.target_value+' '+g.unit));const track=el('div',undefined,'track'),fill=el('div',undefined,'fill');fill.style.width=Math.min(100,consumed/Math.max(.001,number(g.target_value))*100)+'%';track.append(fill);card.append(line,track);sum.append(card)}
 if(!goals.length)sum.append(el('p','Set a personal nutrition goal to see your daily progress.','hint'));
 const list=$('entries');list.replaceChildren();
 for(const item of entries){let row=el('div',undefined,'entry'),name=el('div');name.append(el('strong',item.food_name),el('small',item.meal_type+' · '+item.quantity+' '+item.serving_description));const del=el('button','Remove');del.onclick=()=>remove('nutrition_entries',item.id);row.append(name,del);list.append(row)}
 if(!entries.length)list.append(el('p','No foods logged for this day.','hint'));
}
async function refresh(){if(!user)return;message('');const date=$('day').value;const start=new Date(date+'T00:00:00');const end=new Date(start);end.setDate(end.getDate()+1);const results=await Promise.all([db.from('nutrition_goals').select('*').eq('user_id',user.id).order('display_name'),db.from('nutrition_entries').select('*').eq('user_id',user.id).gte('consumed_at',start.toISOString()).lt('consumed_at',end.toISOString()).order('consumed_at',{ascending:false}),db.from('nutrition_entries').select('id,food_name,meal_type,quantity,serving_description,nutrients,barcode,consumed_at').eq('user_id',user.id).order('consumed_at',{ascending:false}).limit(200)]);for(const r of results)if(r.error)throw r.error;[goals,entries,recentFoods]=results.map(x=>x.data||[]);render()}
async function remove(table,id){if(!confirm('Remove this entry?'))return;try{const r=await db.from(table).delete().eq('id',id).eq('user_id',user.id);if(r.error)throw r.error;await refresh()}catch(e){message(e.message)}}
$('goal-form').addEventListener('submit',async e=>{e.preventDefault();const [nutrient_key,display_name,unit]=$('metric').value.split('|');const target_value=Number($('amount').value);if(!Number.isFinite(target_value)||target_value<0)return;try{const r=await db.from('nutrition_goals').upsert({user_id:user.id,nutrient_key,display_name,unit,target_value,goal_type:$('direction').value,enabled:true},{onConflict:'user_id,nutrient_key'});if(r.error)throw r.error;await refresh()}catch(ex){message(ex.message)}});
for(const [key,label,unit] of fields){const wrap=el('label',label+' ('+unit+')'),input=el('input');input.type='number';input.min='0';input.step='any';input.placeholder='optional';input.dataset.nutrient=key;wrap.append(input);$('nutrient-fields').append(wrap)}
$('food-form').addEventListener('submit',async e=>{e.preventDefault();const food_name=$('food-name').value.trim(),quantity=Number($('quantity').value);if(!food_name||!Number.isFinite(quantity)||quantity<=0)return;const nutrients={};for(const field of document.querySelectorAll('[data-nutrient]')){if(field.value.trim()==='')continue;const n=Number(field.value);if(!Number.isFinite(n)||n<0){message('Nutrition amounts must be nonnegative numbers.');return}nutrients[field.dataset.nutrient]=n}
 const selected=$('day').value,now=new Date(),at=new Date(selected+'T12:00:00');if(selected===dayString(now))at.setHours(now.getHours(),now.getMinutes(),0,0);
 try{const r=await db.from('nutrition_entries').insert({user_id:user.id,consumed_at:at.toISOString(),food_name,meal_type:$('meal').value,quantity,serving_description:$('serving').value.trim()||'serving',nutrients,source:'manual'});if(r.error)throw r.error;$('food-form').reset();$('quantity').value='1';$('serving').value='serving';await refresh()}catch(ex){message(ex.message)}});
$('day').addEventListener('change',()=>refresh().catch(e=>message(e.message)));
async function init(){try{const {data,error}=await db.auth.getUser();if(error)throw error;user=data.user;if(!user){$('signin').hidden=false;$('auth-status').textContent='Sign in required';return}$('app').hidden=false;$('auth-status').textContent=user.email;await refresh()}catch(e){message('Unable to load SoulFuel: '+e.message);$('signin').hidden=false}}
init();