'use strict';
(() => {
  const nullable = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
  function scoreFood(n) {
    const missing=[];
    for(const [key,label] of [['calories','Calories'],['protein','Protein'],['carbs','Carbohydrates'],['sugar','Sugar'],['fiber','Fiber'],['satfat','Saturated fat'],['sodium','Sodium']]) if(n[key]===null)missing.push(label);
    if(!n.ingredients)missing.push('Ingredients');
    if(![1,2,3,4].includes(n.nova))missing.push('Processing classification');
    if(missing.length)return{status:'insufficient-data',missing};
    const points=(value,low,high,max)=>value<=low?max:value<=high?Math.round(max*.53):0;
    const salt=n.sodium*2.5,proteinShare=n.calories>0?n.protein*4/n.calories*100:0;
    const nutritionSugar=points(n.sugar,5,22.5,15),nutritionSaturatedFat=points(n.satfat,1.5,5,15),nutritionSodium=points(salt,.3,1.5,15),nutritionProtein=proteinShare>=12?15:0;
    const processing=({1:25,2:18,3:9,4:0})[n.nova];
    const wholeFoodFiber=(n.fiber>=6?10:n.fiber>=3?6:0)+(n.nova===1?5:n.nova===2?2:0);
    const score=Math.max(1,Math.min(100,nutritionSugar+nutritionSaturatedFat+nutritionSodium+nutritionProtein+processing+wholeFoodFiber));
    const band=score>=80?'Excellent':score>=60?'Good':score>=40?'Moderate':score>=20?'Limited':'Poor';
    const positive=[],neutral=[],negative=[];
    if(n.sugar<=5)positive.push('Sugar is in the low band per 100 g');else if(n.sugar<=22.5)neutral.push('Sugar is in the medium band per 100 g');else negative.push('Sugar is in the high band per 100 g');
    if(n.satfat<=1.5)positive.push('Saturated fat is in the low band per 100 g');else if(n.satfat<=5)neutral.push('Saturated fat is in the medium band per 100 g');else negative.push('Saturated fat is in the high band per 100 g');
    if(salt<=.3)positive.push('Salt equivalent is in the low band per 100 g');else if(salt<=1.5)neutral.push('Salt equivalent is in the medium band per 100 g');else negative.push('Salt equivalent is in the high band per 100 g');
    if(proteinShare>=12)positive.push('Meets the EU “source of protein” energy threshold');else neutral.push('Protein is below the EU source-of-protein threshold');
    if(n.fiber>=6)positive.push('Meets the EU “high fibre” threshold per 100 g');else if(n.fiber>=3)positive.push('Meets the EU “source of fibre” threshold per 100 g');else neutral.push('Fiber is below the EU source-of-fibre threshold');
    (n.nova<=2?positive:negative).push(`Open Food Facts lists NOVA group ${n.nova}`);
    neutral.push('Calories and carbohydrates are displayed but do not directly add or subtract points','Ingredient list is displayed; the ingredient/processing points use the reported NOVA classification only');
    return{status:'scored',score,band,components:{nutritionalBalance:nutritionSugar+nutritionSaturatedFat+nutritionSodium+nutritionProtein,ingredientsProcessing:processing,wholeFoodFiber},positive,neutral,negative};
  }
  function normalizeOpenFoodFactsProduct(product,barcode) {
    const raw=product.nutriments&&typeof product.nutriments==='object'?product.nutriments:{};
    const get=(base,suffix)=>nullable(raw[`${base}${suffix}`]);
    let kcal100=get('energy-kcal','_100g');if(kcal100===null&&get('energy','_100g')!==null)kcal100=get('energy','_100g')/4.184;
    let kcalServing=get('energy-kcal','_serving');if(kcalServing===null&&get('energy','_serving')!==null)kcalServing=get('energy','_serving')/4.184;
    const per=suffix=>{const sodium=get('sodium',suffix),salt=get('salt',suffix);return{calories:suffix==='_100g'?kcal100:kcalServing,protein:get('proteins',suffix),carbs:get('carbohydrates',suffix),sugar:get('sugars',suffix),fiber:get('fiber',suffix),satfat:get('saturated-fat',suffix),sodium:sodium!==null?sodium*1000:salt!==null?salt/2.5*1000:null}};
    const per100g=per('_100g'),perServing=per('_serving'),nova=nullable(product.nova_group);
    const ingredients=(typeof product.ingredients_text==='string'&&product.ingredients_text.trim())||(typeof product.ingredients_text_en==='string'&&product.ingredients_text_en.trim())||'';
    const normalized={calories:per100g.calories,protein:per100g.protein,carbs:per100g.carbs,sugar:per100g.sugar,fiber:per100g.fiber,satfat:per100g.satfat,sodium:per100g.sodium===null?null:per100g.sodium/1000,ingredients,nova:Number.isInteger(nova)?nova:null};
    return{barcode:String(product.code||barcode),name:product.product_name||product.product_name_en||null,brand:product.brands||null,image:product.image_front_url||product.image_url||null,servingSize:product.serving_size||null,per100g,perServing,ingredients,nova:Number.isInteger(nova)?nova:null,nutriScore:typeof product.nutriscore_grade==='string'?product.nutriscore_grade.toUpperCase():null,score:scoreFood(normalized)};
  }
  const api={scoreFood,normalizeOpenFoodFactsProduct};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(typeof window!=='undefined')window.SoulanovaFoodScore=api;
})();
