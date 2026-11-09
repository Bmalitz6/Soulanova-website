'use strict';
(()=>{
  const $=id=>document.getElementById(id),core=window.SoulanovaReminders;
  let member=null,authRevision=0,permissionPending=false;const shown=new Set();
  const status=message=>{$('status').textContent=message;};
  const supported=()=>window.isSecureContext&&'Notification' in window;
  function draw(){
    $('preferences').hidden=!member;
    $('identity').textContent=member?'Preferences are private to this signed-in member on this browser.':'Sign in through Member space to configure reminders.';
    if(!member)return;
    try{const prefs=core.readPrefs(localStorage,member);$('enabled').checked=prefs.enabled;
      $('reminder-options').replaceChildren();for(const item of prefs.items){const row=document.createElement('div');row.className='reminder-row';const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.id='reminder-'+item.id;check.checked=item.enabled;label.append(check,' '+item.label);const time=document.createElement('input');time.type='time';time.id='time-'+item.id;time.value=item.time;time.required=true;time.setAttribute('aria-label',item.label+' daily reminder time');row.append(label,time);$('reminder-options').append(row);}
      $('system-status').textContent=supported()?`System permission: ${Notification.permission}. System reminders: ${prefs.system?'on':'off'}.`:'System notifications are unavailable here. You can use in-page reminders.';
      $('allow-system').disabled=!supported()||permissionPending||Notification.permission==='denied';
      if(!navigator.locks)status('Scheduled in-page reminders are unavailable in this browser because safe cross-tab duplicate prevention is unavailable. Preferences can still be saved.');
    }catch{status('Saved preferences could not be read. Existing browser data was preserved; reminder delivery is paused.');$('preferences').hidden=true;}
  }
  function applyMember(user){const next=user?.id||null;authRevision++;if(member!==next){for(const notification of shown)notification.close();shown.clear();$('reminder-banner').hidden=true;$('reminder-message').replaceChildren();status('');}member=next;draw();}
  $('preferences').addEventListener('submit',async event=>{event.preventDefault();const expected=member;if(!expected)return;try{const prefs=core.readPrefs(localStorage,expected);prefs.enabled=$('enabled').checked;for(const item of prefs.items){item.enabled=$('reminder-'+item.id).checked;item.time=$('time-'+item.id).value;}
    if(navigator.locks)await navigator.locks.request('soulanova-reminders:'+expected,()=>{if(member===expected)core.savePrefs(localStorage,expected,prefs);});else core.savePrefs(localStorage,expected,prefs);
    if(member!==expected)return;draw();status(!prefs.enabled?'Reminders are off.':!navigator.locks?'Preferences saved, but this browser cannot safely schedule reminders across tabs. Delivery remains paused.':'Preferences saved. Keep this page visible for reminders.');
  }catch{status('Could not save preferences. Existing data was preserved.');}});
  $('allow-system').addEventListener('click',async()=>{
    if(!member||!supported()||permissionPending)return;const expected=member,revision=authRevision;permissionPending=true;$('allow-system').disabled=true;
    try{const result=await Notification.requestPermission();if(member!==expected||authRevision!==revision)return;
      const update=()=>{if(member!==expected||authRevision!==revision)return;const prefs=core.readPrefs(localStorage,expected);prefs.system=result==='granted';core.savePrefs(localStorage,expected,prefs);};
      if(navigator.locks)await navigator.locks.request('soulanova-reminders:'+expected,update);else update();
      if(member===expected){draw();status(result==='granted'?(!navigator.locks?'System permission granted, but scheduled reminders are unavailable in this browser.':'System permission granted. Save and enable your chosen reminders.'):'Permission was not granted. In-page reminders remain available.');}
    }catch{status('System notifications are unavailable. In-page reminders remain available.');}finally{permissionPending=false;draw();}
  });
  $('disable-system').addEventListener('click',async()=>{const expected=member;if(!expected)return;try{const update=()=>{if(member!==expected)return;const prefs=core.readPrefs(localStorage,expected);prefs.system=false;core.savePrefs(localStorage,expected,prefs);};if(navigator.locks)await navigator.locks.request('soulanova-reminders:'+expected,update);else update();draw();status('System notifications are off. Browser permission can be revoked in your browser settings.');}catch{status('Could not update preferences.');}});
  $('dismiss').addEventListener('click',()=>{$('reminder-banner').hidden=true;$('reminder-message').replaceChildren();});
  async function tick(){
    const expected=member,revision=authRevision;if(!expected||document.hidden||!navigator.locks)return;
    try{await navigator.locks.request('soulanova-reminders:'+expected,()=>{
      if(member!==expected||authRevision!==revision||document.hidden)return;
      const prefs=core.readPrefs(localStorage,expected);const due=core.claimDue(localStorage,expected,prefs,new Date());
      for(const item of due){const p=document.createElement('p');p.textContent=`A little time for ${item.label}, at your pace.`;$('reminder-message').append(p);$('reminder-banner').hidden=false;
        if(prefs.system&&supported()&&Notification.permission==='granted')try{const n=new Notification('Soulanova reminder',{body:p.textContent,tag:core.localDay(new Date())+':'+item.id});shown.add(n);n.onclose=()=>shown.delete(n);}catch{status('Your reminder is shown on this page; system delivery is unavailable.');}
      }
    });}catch{status('Reminder storage is unavailable. Delivery is paused to avoid duplicates; existing data was preserved.');}
  }
  window.addEventListener('storage',event=>{if(member&&event.key===core.prefsKey(member))draw();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)void tick();});window.addEventListener('focus',()=>void tick());
  let timer=null;const resumeTimer=()=>{if(timer===null)timer=setInterval(()=>void tick(),10000);};resumeTimer();window.addEventListener('pagehide',()=>{clearInterval(timer);timer=null;});window.addEventListener('pageshow',resumeTimer);
  const cfg=window.SOULANOVA_SUPABASE;if(!cfg?.url||!cfg?.publishableKey||!window.supabase){applyMember(null);status('Member connection is unavailable.');return;}
  const client=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  client.auth.onAuthStateChange((_event,session)=>applyMember(session?.user||null));const revision=authRevision;
  client.auth.getUser().then(({data,error})=>{if(revision!==authRevision)return;if(error){applyMember(null);status('Sign-in could not be verified.');}else applyMember(data?.user);}).catch(()=>{if(revision===authRevision){applyMember(null);status('Sign-in could not be verified.');}});
})();
