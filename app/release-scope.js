'use strict';
(()=>{
 if(window.SoulanovaMemberReleaseScope?.nutritionPreview===true){document.documentElement.setAttribute('data-nutrition-preview','');if(document.documentElement.hasAttribute('data-health-tools'))document.querySelector('.skip-link')?.setAttribute('href','#health-title');return;}
 document.documentElement.removeAttribute('data-nutrition-preview');
 // Stop feature modules before auth, local storage reads, listeners or mutations are initialized.
 if(!location.pathname.startsWith('/app/soulfuel')){
  const card=document.getElementById('soulfuel-dashboard-entry');
  if(card){for(const p of card.querySelectorAll('p'))p.textContent='Mediterranean recipes';}
  return;
 }
 for(const form of document.querySelectorAll('form'))for(const control of form.elements)control.disabled=true;
 const notice=document.getElementById('nutrition-release-notice')||document.createElement('section');notice.replaceChildren();notice.className='release-scope-notice';notice.id='nutrition-release-notice';notice.setAttribute('aria-label','SoulFuel release availability');
 const title=document.createElement(document.documentElement.hasAttribute('data-health-tools')?'h1':'h2');title.textContent='SoulFuel · Mediterranean Recipes';
 const message=document.createElement('p');message.textContent='Explore all 75 recipes. Food Diary, nutrition goals, personal health metrics and FoodScore are not available in this release. Existing browser records are unchanged; nothing is uploaded or migrated.';
 const link=document.createElement('a');link.href='/app/soulfuel/#recipe-library';link.textContent='Browse Mediterranean recipes';notice.append(title,message,link);
 (document.querySelector('main')||document.body).prepend(notice);
})();
