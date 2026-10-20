'use strict';
const workouts=[
{id:'tai',category:'Tai Chi',icon:'☯',title:'Flow & Balance',minutes:30,steps:['5 min gentle warm-up and easy breathing','10 min slow weight shifts and mindful stepping','10 min familiar flowing Tai Chi movements','5 min comfortable cool-down']},
{id:'yoga',category:'Yoga',icon:'✳',title:'Gentle Yoga Reset',minutes:25,steps:['5 min relaxed breathing','10 min comfortable standing and seated poses','5 min gentle mobility','5 min quiet rest']},
{id:'pilates',category:'Pilates',icon:'◌',title:'Core Foundations',minutes:25,steps:['5 min breathing and posture check','10 min controlled core movements','5 min stability practice','5 min stretching']},
{id:'strength',category:'Strength',icon:'↗',title:'Everyday Strength',minutes:30,steps:['5 min warm-up','10 min supported lower-body movements','10 min comfortable upper-body movements','5 min cool-down']},
{id:'mobility',category:'Stretch & Mobility',icon:'〰',title:'Move with Ease',minutes:20,steps:['5 min gentle warm-up','5 min shoulders and upper-back mobility','5 min hip and ankle mobility','5 min easy stretches']},
{id:'cardio',category:'Low-Impact Cardio',icon:'♡',title:'Easy Energy',minutes:25,steps:['5 min easy walk in place','10 min comfortable low-impact steps','5 min light movement','5 min cool-down']},
{id:'meditation',category:'Meditation',icon:'☾',title:'Guided Meditation',minutes:10,steps:['Track 1: seven 10-minute meditations','Track 2: ten 20-minute meditations','Soft voice guidance with quiet pauses']}
];
const days=[
[['Breakfast','Greek yogurt, berries & walnuts'],['Lunch','Chickpea, cucumber & tomato salad'],['Dinner','Baked salmon, roasted vegetables & brown rice']],
[['Breakfast','Oatmeal with apple & almonds'],['Lunch','Lentil soup & whole-grain toast'],['Dinner','Lemon chicken, quinoa & broccoli']],
[['Breakfast','Whole-grain toast, avocado & egg'],['Lunch','White bean & arugula salad'],['Dinner','Vegetable pasta with olive oil & herbs']],
[['Breakfast','Yogurt, pear & pumpkin seeds'],['Lunch','Hummus, vegetables & whole-wheat pita'],['Dinner','Herb-baked cod & farro salad']],
[['Breakfast','Overnight oats with strawberries'],['Lunch','Mediterranean quinoa bowl'],['Dinner','Stuffed peppers with beans & rice']],
[['Breakfast','Spinach & tomato omelet'],['Lunch','Tuna and white bean salad'],['Dinner','Grilled chicken, sweet potato & greens']],
[['Breakfast','Fruit, yogurt & oats'],['Lunch','Tomato, lentil & vegetable stew'],['Dinner','Roasted vegetables & chickpea couscous']]
];
const groceries=['Leafy greens','Tomatoes','Cucumbers','Peppers','Berries','Apples / pears','Chickpeas / beans','Lentils','Oats / quinoa','Brown rice / farro','Extra-virgin olive oil','Walnuts / almonds','Plain yogurt','Fish / seafood','Eggs / poultry','Lemons / herbs'];
const storageKey='soulanova-preview-v1';let state={history:[],selected:'',checked:[]};try{const raw=JSON.parse(localStorage.getItem(storageKey)||'{}');if(typeof raw.selected==='string')state.selected=raw.selected;if(Array.isArray(raw.checked))state.checked=raw.checked.filter(x=>typeof x==='string')}catch(e){};
function save(){try{localStorage.setItem(storageKey,JSON.stringify({selected:state.selected,checked:state.checked}))}catch(e){}};
function tab(name){document.querySelectorAll('.tabs button').forEach(b=>{let active=b.dataset.tab===name;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p.id===name));window.scrollTo({top:0,behavior:'smooth'})}
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>tab(b.dataset.tab)));document.querySelectorAll('[data-goto]').forEach(b=>b.addEventListener('click',()=>tab(b.dataset.goto)));
document.getElementById('today').textContent=new Intl.DateTimeFormat('en-US',{weekday:'long',month:'short',day:'numeric'}).format(new Date());
const category=document.getElementById('category');[...new Set(workouts.map(w=>w.category))].forEach(c=>category.add(new Option(c,c)));category.addEventListener('change',renderWorkouts);
function renderWorkouts(){const box=document.getElementById('workout-list');box.replaceChildren();workouts.filter(w=>category.value==='all'||category.value===w.category).forEach(w=>{let a=document.createElement('article');a.className='workout';a.innerHTML=`<div class="icon" aria-hidden="true">${w.icon}</div><small>${w.category} · ${w.minutes} min</small><h3>${w.title}</h3><p>Suggested movement plan at your own pace. Stop if anything feels uncomfortable.</p>`;let b=document.createElement('button');b.className='action';b.textContent='Choose this session →';b.addEventListener('click',()=>{state.selected=w.id;save();if(w.id==='tai'&&window.SoulanovaClasses){window.SoulanovaClasses.open();return}if(w.id==='meditation'&&window.SoulanovaMeditation){window.SoulanovaMeditation.open();return}renderSelected();document.getElementById('selected-workout').scrollIntoView({behavior:'smooth',block:'start'})});a.append(b);box.append(a)})}
function renderSelected(){let area=document.getElementById('selected-workout');let w=workouts.find(x=>x.id===state.selected);area.replaceChildren();if(!w){area.innerHTML='<h3>Choose a movement session</h3><p>Pick one of the options above to view its suggested outline.</p>';return}let title=document.createElement('h3');title.textContent=`Your plan: ${w.title}`;let info=document.createElement('p');info.textContent=`${w.category} · ${w.minutes} minutes · Self-guided preview (no video yet)`;let ol=document.createElement('ol');w.steps.forEach(step=>{let li=document.createElement('li');li.textContent=step;ol.append(li)});if(w.id==='tai'){let start=document.createElement('button');start.className='action';start.textContent='Open guided 30-minute player →';start.addEventListener('click',()=>window.SoulanovaPlayer.open());area.append(title,info,ol,start);return}let done=document.createElement('button');done.className='action';done.textContent='Mark session complete ✓';done.addEventListener('click',async()=>{done.disabled=true;try{await addWorkout(w);done.textContent='Logged! Mark another completion'}catch(err){alert('Could not save workout: '+err.message)}finally{done.disabled=false}});area.append(title,info,ol,done)}
const mealDay=document.getElementById('meal-day');for(let i=0;i<7;i++)mealDay.add(new Option('Day '+(i+1),String(i)));mealDay.addEventListener('change',renderMeals);
function renderMeals(){let box=document.getElementById('meal-cards');box.replaceChildren();days[Number(mealDay.value)].forEach(([type,name])=>{let a=document.createElement('article');a.className='meal';let t=document.createElement('span');t.textContent=type.toUpperCase();let h=document.createElement('h3');h.textContent=name;let p=document.createElement('p');p.textContent='Flexible inspiration; adjust ingredients and portions to your needs.';a.append(t,h,p);box.append(a)})}
function renderGroceries(){let box=document.getElementById('groceries');box.replaceChildren();groceries.forEach(item=>{let label=document.createElement('label');let cb=document.createElement('input');cb.type='checkbox';cb.checked=state.checked.includes(item);label.classList.toggle('checked',cb.checked);cb.addEventListener('change',()=>{state.checked=cb.checked?[...new Set([...state.checked,item])]:state.checked.filter(x=>x!==item);save();label.classList.toggle('checked',cb.checked)});label.append(cb,document.createTextNode(item));box.append(label)})}
document.getElementById('reset-groceries').addEventListener('click',()=>{state.checked=[];save();renderGroceries()});
function renderStats(){let n=state.history.length;let minutes=state.history.reduce((a,e)=>a+(e.minutes||workouts.find(w=>w.id===e.id)?.minutes||0),0);let categories=new Set(state.history.map(e=>(e.category||workouts.find(w=>w.id===e.id)?.category)).filter(Boolean)).size;document.getElementById('home-count').textContent=n;document.getElementById('home-minutes').textContent=minutes;document.getElementById('home-plan').textContent=workouts.find(w=>w.id===state.selected)?.category||'Not set';document.getElementById('progress-count').textContent=n;document.getElementById('progress-minutes').textContent=minutes;document.getElementById('progress-categories').textContent=categories;let box=document.getElementById('history');box.replaceChildren();if(!n){box.textContent='No sessions logged yet. Choose a movement session to begin.';return}state.history.slice().reverse().forEach((e,reverseIndex)=>{let w=workouts.find(x=>x.id===e.id);let row=document.createElement('div');row.className='entry';let details=document.createElement('div');let label=document.createElement('strong');label.textContent=e.name||w?.title||'Movement session';let date=document.createElement('small');date.textContent=' · '+new Date(e.at).toLocaleString()+' · '+(e.minutes||w?.minutes||0)+' min';details.append(label,date);let b=document.createElement('button');b.textContent='Remove';b.setAttribute('aria-label','Remove '+label.textContent+' entry');b.addEventListener('click',async()=>{if(!e.dbid)return; b.disabled=true;try{await deleteWorkout(e.dbid)}catch(err){alert('Could not remove workout: '+err.message);b.disabled=false}});row.append(details,b);box.append(row)})}
document.getElementById('clear-progress').addEventListener('click',async()=>{if(confirm('Delete all your workout history from your account? This cannot be undone.')){try{await clearWorkouts()}catch(err){alert('Could not clear history: '+err.message)}}});
renderWorkouts();renderSelected();renderMeals();renderGroceries();renderStats();
// Cloud member authentication and per-user workout storage.
const authBox=document.getElementById('auth-box');
const memberApp=document.getElementById('member-app');
const memberLabel=document.getElementById('member-label');
const signOut=document.getElementById('sign-out');
const authMessage=document.getElementById('auth-message');
const authForm=document.getElementById('auth-form');
const authSubmit=document.getElementById('auth-submit');
let client=null,currentUser=null,authMode='signin';
const accountRedirectUrl=new URL('/app/',window.location.origin).href; // Add the preview origin to Supabase Auth URL allowlist when testing.
const recoveryRedirectUrl=new URL('/app/?mode=recover',window.location.origin).href;
const recoveryRequested=new URLSearchParams(window.location.search).get('mode')==='recover';
let recoveryActive=recoveryRequested;

function message(s,error=false){authMessage.textContent=s;authMessage.classList.toggle('error',error)}
function setMode(mode){authMode=mode;document.querySelectorAll('[data-auth-mode]').forEach(b=>b.classList.toggle('active',b.dataset.authMode===mode));document.getElementById('password-field').hidden=mode==='reset';document.getElementById('auth-password').required=mode!=='reset';document.getElementById('confirm-field').hidden=mode!=='signup';document.getElementById('name-field').hidden=mode!=='signup';document.getElementById('marketing-field').hidden=mode!=='signup';document.getElementById('auth-confirm').required=mode==='signup';document.getElementById('auth-password').autocomplete=mode==='signup'?'new-password':'current-password';authSubmit.textContent=mode==='signup'?'Create account':mode==='reset'?'Send reset email':'Sign in';message('');document.getElementById('signin-hint').hidden=mode!=='signup'}
document.querySelectorAll('[data-auth-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.authMode)));
document.getElementById('existing-member-link').addEventListener('click',()=>setMode('signin'));
const requestedMode=new URLSearchParams(window.location.search).get('mode');if(['signin','signup','reset'].includes(requestedMode))setMode(requestedMode);
function setUser(user){currentUser=user;authBox.hidden=recoveryActive?false:!!user;memberApp.hidden=recoveryActive?true:!user;signOut.hidden=!user;memberLabel.textContent=user?.email||'Not signed in';const opt=document.getElementById('account-marketing');if(opt)opt.checked=user?.user_metadata?.marketing_opt_in===true;if(!user){state.history=[];renderStats()}}
async function refreshWorkouts(){if(!currentUser)return;const {data,error}=await client.from('workout_sessions').select('id,workout_name,category,duration_minutes,completed_at').eq('user_id',currentUser.id).order('completed_at',{ascending:true}).limit(1000);if(error)throw error;state.history=(data||[]).map(r=>({id:workouts.find(w=>w.title===r.workout_name&&w.category===r.category)?.id||'',at:r.completed_at,dbid:r.id,minutes:r.duration_minutes,name:r.workout_name,category:r.category}));renderStats()}
async function addWorkout(w){if(!currentUser)throw Error('Please sign in first');const {error}=await client.from('workout_sessions').insert({user_id:currentUser.id,workout_name:w.title,category:w.category,duration_minutes:w.minutes});if(error)throw error;await refreshWorkouts()}
async function deleteWorkout(id){if(!currentUser)return;const {error}=await client.from('workout_sessions').delete().eq('id',id).eq('user_id',currentUser.id);if(error)throw error;await refreshWorkouts()}
async function clearWorkouts(){if(!currentUser)return;const {error}=await client.from('workout_sessions').delete().eq('user_id',currentUser.id);if(error)throw error;await refreshWorkouts()}
// Supabase only needs a public publishable key; never put a secret/service_role key in config.js.
const cfg=window.SOULANOVA_SUPABASE||{};
if(!cfg.url||!cfg.publishableKey||cfg.publishableKey.includes('PASTE_')||!window.supabase){message('Member login is not connected yet. Set the publishable key in app/config.js and refresh.',true);authSubmit.disabled=true}
else{client=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{flowType:'pkce',detectSessionInUrl:true,autoRefreshToken:true,persistSession:true}});
 client.auth.onAuthStateChange((event,session)=>{const user=session?.user||null;if(event==='PASSWORD_RECOVERY')recoveryActive=true;setUser(user);if(recoveryActive){showPasswordUpdate(!!user);return}if(user){setTimeout(()=>refreshWorkouts().catch(e=>message('Unable to load workouts: '+e.message,true)),0)}});
 client.auth.getUser().then(({data,error})=>{if(error&&!error.message?.includes('session'))message(error.message,true);setUser(data?.user||null);if(recoveryActive)showPasswordUpdate(!!data?.user);else if(data?.user)refreshWorkouts().catch(e=>message(e.message,true))}).catch(e=>message(e.message,true));}
authForm.addEventListener('submit',async e=>{e.preventDefault();if(!client)return;const email=document.getElementById('auth-email').value.trim(),password=document.getElementById('auth-password').value;authSubmit.disabled=true;message('Please wait…');try{let result;if(authMode==='signup'){if(password!==document.getElementById('auth-confirm').value)throw Error('Passwords do not match.');result=await client.auth.signUp({email,password,options:{emailRedirectTo:accountRedirectUrl,data:{full_name:document.getElementById('auth-name').value.trim(),marketing_opt_in:document.getElementById('marketing-consent').checked,marketing_consent_at:document.getElementById('marketing-consent').checked?new Date().toISOString():null}}});if(result.error)throw result.error;message('Check your email for a verification link, then return here to sign in.')}else if(authMode==='reset'){result=await client.auth.resetPasswordForEmail(email,{redirectTo:recoveryRedirectUrl});if(result.error)throw result.error;message('If an account exists for this address, a reset email will arrive shortly.')}else{result=await client.auth.signInWithPassword({email,password});if(result.error)throw result.error;message('Signed in successfully.')}}catch(err){message(err.message||'Something went wrong.',true)}finally{authSubmit.disabled=false}});
signOut.addEventListener('click',async()=>{if(!client)return;const {error}=await client.auth.signOut();if(error)message(error.message,true);else{setUser(null);setMode('signin')}});
// Recovery is an explicit route because SIGNED_IN can occur instead of PASSWORD_RECOVERY
// when the same browser already has an authenticated Supabase session.
function showPasswordUpdate(hasSession){
 recoveryActive=true;
 authBox.hidden=false;memberApp.hidden=true;
 document.getElementById('auth-form-area').hidden=true;
 const intro=authBox.querySelector('.auth-intro');
 intro.querySelector('h2').textContent='Choose a new password';
 intro.querySelector('p:last-child').textContent='Create a new password to secure your Soulanova account.';
 let form=document.getElementById('recovery-form');
 if(!form){
  form=document.createElement('form');form.id='recovery-form';
  form.innerHTML='<label>New password<input id="new-password" type="password" minlength="12" autocomplete="new-password" required></label><label>Confirm new password<input id="confirm-new-password" type="password" minlength="12" autocomplete="new-password" required></label><button class="action" id="recovery-submit" type="submit">Save new password</button>';
  authBox.insertBefore(form,authMessage);
  form.addEventListener('submit',async e=>{
   e.preventDefault();
   const password=document.getElementById('new-password').value;
   const confirmPassword=document.getElementById('confirm-new-password').value;
   if(password!==confirmPassword){message('Passwords do not match.',true);return}
   const submit=document.getElementById('recovery-submit');submit.disabled=true;
   message('Updating your password…');
   try{
    const {data:{session},error:sessionError}=await client.auth.getSession();
    if(sessionError||!session)throw Error('This recovery link is invalid or has expired. Request a new reset email.');
    const {error}=await client.auth.updateUser({password});if(error)throw error;
    // End the recovery session; require the user to sign in with their new password.
    const {error:signOutError}=await client.auth.signOut();if(signOutError)throw signOutError;
    recoveryActive=false;
    history.replaceState(null,'',new URL('/app/?mode=signin',window.location.origin).href);
    form.hidden=true;document.getElementById('auth-form-area').hidden=false;
    intro.querySelector('h2').textContent='Welcome to your wellness space';
    intro.querySelector('p:last-child').textContent='Create an account or sign in to save your workouts securely and access them on different devices.';
    setUser(null);setMode('signin');message('Password updated. Please sign in with your new password.');
   }catch(err){message(err.message||'Could not update the password.',true)}
   finally{submit.disabled=false}
  });
 }
 form.hidden=!hasSession;
 if(hasSession)message('Enter and confirm a new password.');
 else message('Checking your password-reset link… If this message remains, request a new reset email.');
}
if(recoveryRequested)showPasswordUpdate(false);

// Member preference is saved in Supabase Auth user metadata, not in a public list.
document.getElementById('save-preferences').addEventListener('click',async()=>{const status=document.getElementById('preferences-message');if(!client||!currentUser){status.textContent='Sign in to update preferences.';return}const opt=document.getElementById('account-marketing').checked;const {data,error}=await client.auth.updateUser({data:{marketing_opt_in:opt,marketing_consent_at:opt?new Date().toISOString():null}});status.textContent=error?'Could not save: '+error.message:'Preference saved.';if(!error)setUser(data.user)});
