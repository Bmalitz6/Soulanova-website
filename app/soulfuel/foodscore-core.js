'use strict';
(() => {
  const VERSION = 'soulanova-provisional-2';
  const nullable = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
  const bands = score => score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Moderate' : score >= 30 ? 'Limit frequency' : 'Occasional';
  const GROUPS = {
    oils: ['en:fats-and-oils','en:vegetable-oils','en:olive-oils','en:olive-oil','en:extra-virgin-olive-oils'],
    beverages: ['en:beverages','en:waters','en:fruit-juices','en:plant-based-beverages'],
    snacks: ['en:snacks','en:salty-snacks','en:sweet-snacks'], meals: ['en:meals','en:prepared-meals'],
  };
  function categoryOf(tags) {
    if (!Array.isArray(tags) || !tags.length) return null;
    if (tags.some(tag => /(?:alcoholic-beverages|baby-foods|infant-formulas|food-supplements)/.test(tag))) return 'unsupported';
    const matches = Object.keys(GROUPS).filter(key => tags.some(tag => GROUPS[key].includes(tag)));
    return matches.length > 1 ? 'ambiguous' : matches[0] || 'foods';
  }
  // Intentionally small, explicit taxonomy. No percentages inferred from names/order.
  const preferred = new Set(['en:whole-wheat-flour','en:whole-grain-oats','en:whole-oat-flour','en:oat-flakes','en:whole-grains','en:chickpea','en:chickpeas','en:lentils','en:beans','en:almonds','en:walnuts','en:apple','en:apples','en:strawberry','en:banana','en:tomato','en:tomatoes','en:spinach','en:carrot','en:carrots','en:broccoli','en:olive-oil','en:extra-virgin-olive-oil','en:rapeseed-oil']);
  const neutral = new Set(['en:water','en:salt','en:sugar','en:wheat-flour','en:rice','en:milk','en:egg','en:eggs','en:citric-acid','en:lemon-juice','en:apple-juice']);
  function ingredientEvidence(list, category) {
    if (!Array.isArray(list) || !list.length) return null;
    let sum = 0, favorable = 0;
    for (const item of list) {
      if (!item || nullable(item.percent) === null || item.percent > 100 || (!preferred.has(item.id) && !neutral.has(item.id)) || item.ingredients?.length) return null;
      sum += item.percent;
      if (preferred.has(item.id) || (category === 'beverages' && item.id === 'en:water')) favorable += item.percent;
    }
    if (Math.abs(sum - 100) > 0.5) return null;
    return { points: 25 * favorable / sum, percent: 100 * favorable / sum };
  }
  function scoreFood(n) {
    const missing = [], notes = [], factors = [];
    const category = n.category || null;
    const fail = () => ({ status: 'insufficient-data', missing: [...new Set(missing)], notes, category, version: VERSION, factors });
    if (!category || ['unsupported','ambiguous'].includes(category)) missing.push('Supported, unambiguous product category');
    if (category === 'beverages' && n.baseUnit !== 'ml') missing.push('Confirmed liquid basis (100 ml)');
    if (['foods','meals','snacks'].includes(category) && n.baseUnit !== 'g') missing.push('Confirmed solid-food basis (100 g)');
    const required = category === 'oils' ? ['calories','fat','satfat','mono','poly'] : category === 'beverages' ? ['calories','sugar','sodium','satfat'] : ['calories','protein','carbs','fat','sugar','fiber','satfat','sodium'];
    for (const key of required) if (nullable(n[key]) === null) missing.push(key);
    if (!n.ingredients) missing.push('Ingredient list');
    if (n.invalid) missing.push('Consistent nutrient values');
    if (missing.length) return fail();
    const metric = (label, value, low, high, max, group = 'nutrition') => {
      const points = value <= low ? max : value <= high ? max / 2 : 0;
      factors.push({ label, value, points, max, group }); return points;
    };
    const reward = (label, value, mid, high, max) => {
      const points = value >= high ? max : value >= mid ? max / 2 : 0;
      factors.push({ label, value, points, max, group: 'nutrition' }); return points;
    };
    let nutrition;
    if (category === 'oils') {
      if (!(n.fat > 0) || n.mono + n.poly > n.fat + 0.5) { missing.push('Consistent reported fatty-acid composition'); return fail(); }
      nutrition = reward('Reported unsaturated / total fat ratio', (n.mono + n.poly) / n.fat, .6, .8, 40) + metric('Saturated / total fat ratio', n.satfat / n.fat, .15, .3, 20);
      notes.push('Oil profile uses reported fat composition; no fiber/protein requirement. Energy is displayed and portion size still matters.');
    } else if (category === 'beverages') {
      nutrition = metric('Total sugars (g / 100 ml)', n.sugar, 2.5, 11.25, 30) + metric('Sodium (mg / 100 ml)', n.sodium, 120, 300, 10) + metric('Saturated fat (g / 100 ml)', n.satfat, .75, 2.5, 10) + metric('Energy context (kcal / 100 ml)', n.calories, 20, 50, 10);
      notes.push('Beverage profile does not require fiber or protein. Energy cutoffs are Soulanova design choices.');
    } else {
      const added = nullable(n.addedSugar);
      nutrition = metric(added === null ? 'Total sugars proxy (g / 100 g)' : 'Reported added sugars (g / 100 g)', added === null ? n.sugar : added, added === null ? 5 : 2.5, added === null ? 22.5 : 10, 15) + metric('Saturated fat (g / 100 g)', n.satfat, 1.5, 5, 15) + metric('Sodium (mg / 100 g)', n.sodium, 120, 600, 10) + reward('Fiber (g / 100 g)', n.fiber, 3, 6, 10) + reward('Protein energy share (%)', n.calories > 0 ? 400 * n.protein / n.calories : 0, 12, 20, 10);
      if(added === null)missing.push('Added sugar unavailable; disclosed total-sugar proxy used');
      notes.push(added === null ? 'Added sugar is unavailable: total sugar is a disclosed proxy, not an estimate of added sugar.' : 'Added-sugar cutoffs are provisional Soulanova choices, not a validated rating.');
      if (category === 'snacks' || category === 'meals') notes.push('Same solid-food concentration thresholds; compare selected portions, not just per-100 g scores.');
    }
    const ingredient = ingredientEvidence(n.ingredientList, category);
    const processing = [1,2,3,4].includes(n.nova) ? ({1:15,2:12,3:10,4:7})[n.nova] : null;
    if (!ingredient) missing.push('Complete recognized ingredient percentages (25 points not assessed)');
    if (processing === null) missing.push('Reported NOVA context (15 points not assessed)');
    if (ingredient) factors.push({label:'Declared preferred ingredient share (%)',value:ingredient.percent,points:ingredient.points,max:25,group:'ingredients'});
    if (processing !== null) factors.push({label:`Reported NOVA group ${n.nova}; processing alone does not determine suitability`,value:n.nova,points:processing,max:15,group:'processing'});
    const coverage = 60 + (ingredient ? 25 : 0) + (processing !== null ? 15 : 0);
    if (coverage < 75) { missing.push('At least 75 of 100 weighted points must be assessable'); return fail(); }
    const earned = nutrition + (ingredient?.points || 0) + (processing || 0);
    const score = Math.max(0, Math.min(100, Math.round(100 * earned / coverage)));
    notes.push('Data coverage is completeness, not a probability or accuracy guarantee. Missing components are excluded, never assumed favorable. Scores with different coverage are not directly comparable.');
    return { status:'scored',score,band:bands(score),version:VERSION,category,coverage,confidence:coverage === 100 ? 'All component weights assessed · source unverified' : 'Limited component coverage · source unverified',missing,notes,factors,components:{nutritionalBalance:nutrition,ingredientQuality:ingredient?.points ?? null,processingContext:processing},earned };
  }
  function normalizeOpenFoodFactsProduct(product, barcode) {
    const raw = product.nutriments && typeof product.nutriments === 'object' ? product.nutriments : {};
    const get = (base,suffix) => nullable(raw[`${base}${suffix}`]);
    const category = categoryOf(product.categories_tags);
    const quantityUnit = product.product_quantity_unit || product.serving_quantity_unit;
    const baseUnit = ['ml','l','cl'].includes(quantityUnit) ? 'ml' : category === 'beverages' && !['g','kg'].includes(quantityUnit) ? null : 'g';
    const per = suffix => {
      let calories=get('energy-kcal',suffix);const kj=get('energy-kj',suffix) ?? get('energy',suffix);if(calories===null&&kj!==null)calories=kj/4.184;
      const sodium=get('sodium',suffix),salt=get('salt',suffix);
      return {calories,protein:get('proteins',suffix),carbs:get('carbohydrates',suffix),sugar:get('sugars',suffix),addedSugar:get('added-sugars',suffix),fat:get('fat',suffix),fiber:get('fiber',suffix),satfat:get('saturated-fat',suffix),sodium:sodium!==null?sodium*1000:salt!==null?salt/2.5*1000:null,mono:get('monounsaturated-fat',suffix),poly:get('polyunsaturated-fat',suffix)};
    };
    const per100g=per('_100g'),perServing=per('_serving');
    const ingredients=(typeof product.ingredients_text==='string'&&product.ingredients_text.trim())||(typeof product.ingredients_text_en==='string'&&product.ingredients_text_en.trim())||'';
    const invalid = (per100g.calories !== null && per100g.protein !== null && per100g.protein * 4 > per100g.calories * 1.2 + 5) || per100g.satfat !== null && per100g.fat !== null && per100g.satfat > per100g.fat + .5 || per100g.sugar !== null && per100g.carbs !== null && per100g.sugar > per100g.carbs + .5 || per100g.addedSugar !== null && per100g.sugar !== null && per100g.addedSugar > per100g.sugar + .5 || Object.entries(per100g).some(([k,v])=>!['calories','sodium'].includes(k)&&v!==null&&v>100);
    const n={...per100g,category,baseUnit,ingredients,ingredientList:product.ingredients,nova:nullable(product.nova_group),invalid};
    return {barcode:String(barcode),name:product.product_name||product.product_name_en||null,brand:product.brands||null,image:null,servingSize:product.serving_size||null,baseUnit,category,per100g,perServing,ingredients,nova:Number.isInteger(n.nova)?n.nova:null,nutriScore:typeof product.nutriscore_grade==='string'?product.nutriscore_grade.toUpperCase():null,score:scoreFood(n)};
  }
  function scaleProductNutrition(product, servings = 1, amount = null, unit = product.baseUnit || 'g') {
    const count=Number(servings),quantity=amount===null||amount===''?null:Number(amount);
    if(!Number.isFinite(count)||count<=0)throw Error('Enter a serving amount greater than zero.');
    if(quantity!==null&&(!Number.isFinite(quantity)||quantity<=0))throw Error('Enter a portion amount greater than zero, or leave it blank.');
    if(quantity!==null && (!product.baseUnit || unit!==product.baseUnit))throw Error('Portion units must match the reported nutrition basis; no density conversion is assumed.');
    const source=quantity===null?product.perServing:product.per100g,multiplier=quantity===null?count:quantity/100;
    const values=Object.fromEntries(['calories','protein','carbs','fat','fiber','sugar','satfat','sodium'].map(key=>[key,nullable(source?.[key])===null?null:source[key]*multiplier]));
    if(Object.values(values).some(value=>value!==null&&!Number.isFinite(value)))throw Error('Portion is too large to calculate safely.');
    return {values,basis:quantity===null?`${count} serving${count===1?'':'s'}`:`${quantity} ${unit}`};
  }
  const api={VERSION,bands,categoryOf,ingredientEvidence,scoreFood,normalizeOpenFoodFactsProduct,scaleProductNutrition};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(typeof window!=='undefined')window.SoulanovaFoodScore=api;
})();
