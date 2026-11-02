(() => {
  const allowed=new Set(['home','workouts','meals','free-library','progress']);
  let destination=location.hash.slice(1);
  function enter(){const app=document.getElementById('member-app');if(!app||app.hidden||!allowed.has(destination))return;const button=document.querySelector(`[data-tab="${destination}"]`);if(button){button.click();destination='';}}
  new MutationObserver(enter).observe(document.getElementById('member-app'),{attributes:true,attributeFilter:['hidden']});
  addEventListener('hashchange',()=>{destination=location.hash.slice(1);enter();});enter();
})();
