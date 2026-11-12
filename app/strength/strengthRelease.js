'use strict';
(function(root){
 // Never remove or reorder original workouts or exercise sequences to match media coverage.
 const selection=workout=>workout;
 const library=workouts=>workouts.slice();
 const api={selection,library};if(typeof module==='object'&&module.exports)module.exports=api;else root.SoulanovaStrengthRelease=api;
})(globalThis);
