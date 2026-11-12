'use strict';
(function(root){
 // Source definitions are immutable; verified demo replacements apply to those exact positions only.
 const selection=workout=>workout;
 const library=workouts=>workouts.slice();
 const approvedWorkouts=new Set(['beginner-chest-and-arms','beginner-pressing-practice','intermediate-strength-balance','intermediate-lower-body-mix','intermediate-side-to-side','intermediate-total-body','advanced-squat-press','advanced-side-balance','advanced-core-and-press','advanced-balanced-volume']);
 const approvedHash='ef0433a6e4f1b889b5bf183715c139d0bb96a797728f126651907fb65fbc9705';
 function applyDemonstrationMappings(workouts,record){
  if(!Array.isArray(workouts)||workouts.length!==36||record?.schema!==1||!Array.isArray(record.mappings)||record.mappings.length!==10)throw Error('Invalid approved demonstration mapping.');
  const byWorkout=new Map();
  for(const m of record.mappings){
   const w=workouts.find(w=>w.id===m.workoutId),step=w?.exercises[m.stepIndex];
   if(!approvedWorkouts.has(m.workoutId)||byWorkout.has(m.workoutId)||!Number.isInteger(m.stepIndex)||m.stepIndex<0||m.fromExerciseId!=='STR-053'||m.toExerciseId!=='STR-112'||m.sha256!==approvedHash||step?.exerciseId!==m.fromExerciseId||step.name!=='Incline Dumbbell Press')throw Error('Unverified demonstration replacement.');
   byWorkout.set(m.workoutId,m);
  }
  return workouts.map(w=>{const m=byWorkout.get(w.id);return m?{...w,exercises:w.exercises.map((step,i)=>i===m.stepIndex?{...step,exerciseId:m.toExerciseId}:step)}:w;});
 }
 const api={selection,library,applyDemonstrationMappings};if(typeof module==='object'&&module.exports)module.exports=api;else root.SoulanovaStrengthRelease=api;
})(globalThis);
