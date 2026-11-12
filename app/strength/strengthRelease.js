'use strict';
(function(root){
 function selection(workout,available){const exercises=workout.exercises.filter(item=>available(item.exerciseId));if(!exercises.length)return null;return {...workout,exercises,thumbnailExerciseId:exercises[0].exerciseId,practiceOnly:true,originalMovementCount:workout.exercises.length,description:'Practice the approved movements available from this plan. The full original plan is not released.',guidance:workout.guidance};}
 function library(workouts,available){return workouts.map(w=>selection(w,available)).filter(Boolean);}
 const api={selection,library};if(typeof module==='object'&&module.exports)module.exports=api;else root.SoulanovaStrengthRelease=api;
})(globalThis);
