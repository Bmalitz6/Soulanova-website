'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Core=require('../app/soulfuel/foodscore-core.js');
function product(overrides={}){return {...structuredClone(require('./fixtures/soulfuel-product.json')),...overrides};}
const normalize=p=>Core.normalizeOpenFoodFactsProduct(p,'0123456789012');
test('60/25/15 factors and proposed bands are transparent and versioned',()=>{
 const s=normalize(product()).score;
 assert.equal(s.status,'scored');assert.equal(s.coverage,100);assert.equal(s.components.nutritionalBalance,55);assert.equal(s.components.ingredientQuality,24.75);assert.equal(s.components.processingContext,10);assert.equal(s.score,90);assert.equal(s.band,'Excellent');assert.equal(s.factors.reduce((a,f)=>a+f.max,0),100);assert.match(s.version,/provisional-2/);
 assert.deepEqual([0,29,30,49,50,69,70,84,85,100].map(Core.bands),['Occasional','Occasional','Limit frequency','Limit frequency','Moderate','Moderate','Good','Good','Excellent','Excellent']);
});
test('added sugar is used only when reported; otherwise disclose total-sugar proxy',()=>{
 const p=product();p.nutriments={...p.nutriments,sugars_100g:20,'added-sugars_100g':0};const s=normalize(p).score;assert.equal(s.factors[0].points,15);assert.match(s.factors[0].label,/added/);
 delete p.nutriments['added-sugars_100g'];const fallback=normalize(p).score;assert.equal(fallback.factors[0].points,7.5);assert.ok(fallback.notes.some(n=>/not an estimate/.test(n)));
});
test('unknown ingredient percentages and estimated percentages are not fabricated',()=>{
 const p=product({ingredients:[{id:'en:chickpeas',percent_estimate:100}]});const s=normalize(p).score;assert.equal(s.coverage,75);assert.equal(s.components.ingredientQuality,null);assert.match(s.confidence,/Limited/);assert.ok(s.missing.some(m=>/percentages/.test(m)));assert.equal(s.score,Math.round(100*65/75));
 const incomplete=normalize(product({ingredients:[],nova_group:undefined})).score;assert.equal(incomplete.status,'insufficient-data');
 for(const ingredients of [[{id:'en:unknown',percent:100}],[{id:'en:chickpeas',percent:50}],[{id:'en:chickpeas',percent:100,ingredients:[{id:'en:salt'}]}]])assert.equal(Core.ingredientEvidence(ingredients,'meals'),null);
});
test('absent category/nutrients, contradictory data and unsupported foods suppress a score',()=>{
 for(const p of [product({categories_tags:[]}),product({categories_tags:['en:food-supplements']}),product({categories_tags:['en:beverages','en:meals']}),product({ingredients_text:''})])assert.equal(normalize(p).score.status,'insufficient-data');
 const p=product();delete p.nutriments.fiber_100g;assert.equal(normalize(p).score.status,'insufficient-data');assert.equal(normalize(p).per100g.fiber,null);
 p.nutriments.fiber_100g=6;p.nutriments['saturated-fat_100g']=50;assert.equal(normalize(p).score.status,'insufficient-data');
});
test('oils use actual unsaturated-fat composition rather than solid-food fiber requirements',()=>{
 const p=product({categories_tags:['en:olive-oils'],ingredients_text:'Olive oil 100%',ingredients:[{id:'en:olive-oil',percent:100}],nova_group:2,nutriments:{'energy-kcal_100g':900,fat_100g:100,'saturated-fat_100g':14,'monounsaturated-fat_100g':75,'polyunsaturated-fat_100g':10}});
 const s=normalize(p).score;assert.equal(s.status,'scored');assert.equal(s.components.nutritionalBalance,60);assert.equal(s.score,97);
 delete p.nutriments['polyunsaturated-fat_100g'];assert.equal(normalize(p).score.status,'insufficient-data');
});
test('beverages require declared liquid units and apply 100 ml thresholds',()=>{
 const p=product({categories_tags:['en:beverages'],product_quantity_unit:'ml',ingredients_text:'Water, sugar',ingredients:[{id:'en:water',percent:96},{id:'en:sugar',percent:4}],nova_group:3,nutriments:{'energy-kcal_100g':16,sugars_100g:4,'saturated-fat_100g':0,sodium_100g:0}});
 const s=normalize(p).score;assert.equal(s.status,'scored');assert.equal(s.factors[0].points,15);assert.equal(s.components.nutritionalBalance,45);
 assert.equal(normalize({...p,product_quantity_unit:undefined}).score.status,'insufficient-data');
 const portion=Core.scaleProductNutrition(normalize(p),1,250,'ml');assert.equal(portion.values.calories,40);assert.equal(portion.basis,'250 ml');assert.throws(()=>Core.scaleProductNutrition(normalize(p),1,250,'g'),/units/);
});
test('meals and snacks retain solid thresholds and add portion context; processing is not a verdict',()=>{
 for(const category of ['en:meals','en:snacks']){
  const s=normalize(product({categories_tags:[category],nova_group:4})).score;assert.equal(s.components.processingContext,7);assert.ok(s.score>70);assert.ok(s.notes.some(n=>/selected portions/.test(n)));
 }
});
test('portion scaling keeps unknowns null and never invents a serving or swaps grams and ml',()=>{
 const p=normalize(product());assert.equal(Core.scaleProductNutrition(p,1.5).values.calories,337.5);assert.equal(Core.scaleProductNutrition(p,1,75).values.calories,112.5);assert.equal(Core.scaleProductNutrition(p,1,75).values.sugar,1.5);assert.equal(Core.scaleProductNutrition(p,2).values.sugar,null);
 assert.throws(()=>Core.scaleProductNutrition(p,1,30,'ml'),/units/);assert.throws(()=>Core.scaleProductNutrition(p,NaN),/greater/);
 const noBasis=normalize(product({categories_tags:['en:beverages'],product_quantity_unit:undefined}));assert.throws(()=>Core.scaleProductNutrition(noBasis,1,100),/units/);
});

test('impossible volume/weight interpretation and overflowing portion values are not scored or saved',()=>{
 const soup=normalize(product({product_quantity_unit:'ml'}));assert.equal(soup.score.status,'insufficient-data');
 assert.throws(()=>Core.scaleProductNutrition(normalize(product()),1e308),/too large/);
});
