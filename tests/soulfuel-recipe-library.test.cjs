'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const lib = path.join(root, 'app/soulfuel/recipe-library/Soulanova_Mediterranean_Recipe_Library');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('recovers all 75 unique source recipes in the approved category counts', () => {
  const data = JSON.parse(fs.readFileSync(path.join(lib, 'recipes.json'), 'utf8'));
  assert.equal(data.count, 75);
  assert.deepEqual(Object.fromEntries(Object.entries(data.categories).map(([category, recipes]) => [category, recipes.length])), {
    breakfast: 23, lunch: 22, dinner: 21, snack: 9,
  });
  const recipes = Object.values(data.categories).flat();
  assert.equal(recipes.length, 75);
  assert.equal(new Set(recipes.map(recipe => recipe.id)).size, 75);
  assert.equal(new Set(recipes.map(recipe => recipe.title.trim().toLocaleLowerCase())).size, 75);
  assert.ok(recipes.every(recipe => recipe.ingredients.length && recipe.directions.length));
});

test('all four recovered category pages retain searchable cards and one-recipe print controls', () => {
  const expected = { breakfast: 23, lunch: 22, dinner: 21, snacks: 9 };
  for (const [category, count] of Object.entries(expected)) {
    const html = fs.readFileSync(path.join(lib, `${category}.html`), 'utf8');
    assert.equal((html.match(/<article class="recipe-card"/g) || []).length, count, category);
    assert.match(html, /id="recipe-search"/i, `${category} search control`);
    assert.match(html, /data-search=/, `${category} searchable recipe text`);
    assert.match(html, /window\.printRecipe=function\(id\)/, `${category} print handler`);
    assert.match(html, /body\.print-one \.recipe-card:not\(\.print-target\)\{display:none!important\}/, `${category} one-recipe print rule`);
  }
  const index = fs.readFileSync(path.join(lib, 'index.html'), 'utf8');
  for (const category of Object.keys(expected)) assert.match(index, new RegExp(`href="${category}\\.html"`, 'i'));
});

test('SoulFuel links to the recovered categories without replacing the six existing recipes', () => {
  const page = read('app/soulfuel/index.html');
  assert.match(page, /href="#recipe-library"/);
  assert.match(page, /23 recipes/);
  assert.match(page, /22 recipes/);
  assert.match(page, /21 recipes/);
  assert.match(page, /9 recipes/);
  for (const category of ['breakfast', 'lunch', 'dinner', 'snacks']) {
    assert.match(page, new RegExp(`\\/${category}\\.html`));
  }

  const source = read('app/free-content.js');
  const match = source.match(/const recipes=(\[.*?\]);\s*const articles=/s);
  assert.ok(match, 'existing six-recipe catalog remains present');
  const existing = vm.runInNewContext(match[1]);
  const imported = JSON.parse(fs.readFileSync(path.join(lib, 'recipes.json'), 'utf8'));
  const importedTitles = new Set(Object.values(imported.categories).flat().map(recipe => recipe.title.trim().toLocaleLowerCase()));
  assert.equal(existing.length, 6);
  assert.ok(existing.every(([title]) => !importedTitles.has(title.trim().toLocaleLowerCase())));
});

test('Recipe 20 correction is preserved verbatim and visibly flagged against source disagreement', () => {
  const html = fs.readFileSync(path.join(lib, 'breakfast.html'), 'utf8');
  const start = html.indexOf('id="breakfast-20"');
  const end = html.indexOf('</article>', start);
  assert.ok(start >= 0 && end > start);
  const card = html.slice(start, end);
  for (const value of ['2⅓ cups', '343', '55g', '12g', '29g', '6g', '14g', '2g', '2265 IU', '36mg', '96mcg', '199mg', '310mg', '1051mg']) {
    assert.ok(card.includes(value), `Recipe 20 correction contains ${value}`);
  }
  assert.match(card, /owner-supplied nutrition panel/i);
  assert.match(card, /absent from the structured JSON, review CSV, and print-ready ZIP/i);
  const data = JSON.parse(fs.readFileSync(path.join(lib, 'recipes.json'), 'utf8'));
  const recipe = data.categories.breakfast.find(item => item.id === 'breakfast-20');
  assert.deepEqual(recipe.nutrition_panels, [], 'source JSON remains unchanged and its missing value remains explicit');
  const csv = fs.readFileSync(path.join(lib, 'recipe_content_review.csv'), 'utf8');
  assert.match(csv, /Really Green Smoothie,0,,Nutrition not supplied/);
});

test('the provisionally associated Veggie Sandwich nutrition panel keeps its verification warning', () => {
  const lunch = fs.readFileSync(path.join(lib, 'lunch.html'), 'utf8');
  const start = lunch.indexOf('id="lunch-20"');
  const end = lunch.indexOf('</article>', start);
  assert.ok(start >= 0 && end > start);
  assert.match(lunch.slice(start, end), /provisionally associated with this sandwich.*please verify before publishing/i);
});

test('FoodScore remains default-off after recipe recovery', () => {
  assert.match(read('app/soulfuel/foodscore-availability.js'), /enabled: false/);
});
