'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Diary = require('../app/soulfuel/food-diary-core.js');

function storage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    values,
  };
}

test('manual diary add, edit, delete and retry preserve existing FoodScore records', () => {
  const store = storage();
  const legacy = { id: 'foodscore:123:scan1', day: '2026-11-09', meal: 'Lunch', name: 'Existing lookup item', source: 'Open Food Facts', calories: 44, score: null, scoreBand: null, barcode: '123' };
  Diary.writeDiary(store, 'member-a', [legacy]);
  const entry = Diary.makeManualEntry({ name: 'Lentil soup', portion: '1 bowl', day: '2026-11-09', meal: 'Dinner', calories: '220', protein: '12', carbs: '', fat: '', fiber: '8', water: '' }, 'manual:one');
  Diary.saveEntry(store, 'member-a', entry);
  Diary.saveEntry(store, 'member-a', entry);
  let saved = Diary.readDiary(store, 'member-a');
  assert.equal(saved.length, 2, 'same ID retry does not duplicate the manual entry');
  assert.deepEqual(saved[0], legacy, 'pre-existing FoodScore entry is preserved byte-for-value');
  assert.equal(saved[1].nutritionStatus, 'user-supplied');
  assert.equal(saved[1].calories, 220);
  const edited = { ...entry, name: 'Lentil soup, updated', calories: 240 };
  Diary.saveEntry(store, 'member-a', edited);
  saved = Diary.readDiary(store, 'member-a');
  assert.equal(saved.length, 2);
  assert.equal(saved[1].name, 'Lentil soup, updated');
  assert.equal(saved[1].calories, 240);
  Diary.deleteEntry(store, 'member-a', 'manual:one');
  assert.deepEqual(Diary.readDiary(store, 'member-a'), [legacy]);
});

test('diary and goals remain isolated by signed-in member ID', () => {
  const store = storage();
  const a = Diary.makeManualEntry({ name: 'Oats', day: '2026-11-09', meal: 'Breakfast' }, 'a1');
  const b = Diary.makeManualEntry({ name: 'Salad', day: '2026-11-09', meal: 'Lunch' }, 'b1');
  const product = { id: 'off-a', type: 'product', name: 'Product fixture', day: '2026-11-09', meal: 'Snack', calories: 50, nutritionStatus: 'product-data', source: 'Open Food Facts' };
  Diary.saveEntry(store, 'member-a', a);
  Diary.saveEntry(store, 'member-a', product);
  Diary.saveEntry(store, 'member-b', b);
  Diary.writeGoals(store, 'member-a', { calories: 2000, protein: 100, carbs: '', fat: '', fiber: 25, water: 1800 });
  Diary.writeGoals(store, 'member-b', { calories: 1800 });
  assert.deepEqual(Diary.readDiary(store, 'member-a').map(x => x.id), ['a1', 'off-a']);
  assert.deepEqual(Diary.readDiary(store, 'member-b').map(x => x.id), ['b1']);
  assert.equal(Diary.dailyTotals(Diary.readDiary(store, 'member-a'), '2026-11-09').totals.calories, 0, 'unverified product data remains outside the user-entered/verified totals');
  assert.equal(Diary.readGoals(store, 'member-a').calories, 2000);
  assert.equal(Diary.readGoals(store, 'member-b').calories, 1800);
  assert.throws(() => Diary.readDiary(store, ''), /signed-in member/);
});

test('totals include only nutrition explicitly verified or entered by the member', () => {
  const entries = [
    { day: '2026-11-09', calories: 100, protein: 5, nutritionStatus: 'user-supplied' },
    { day: '2026-11-09', calories: 50, protein: 4, nutritionStatus: 'verified' },
    { day: '2026-11-09', calories: 999, protein: 99, source: 'Open Food Facts' },
    { day: '2026-11-09', calories: 300, protein: 20, nutritionStatus: 'product-data', source: 'Open Food Facts' },
    { day: '2026-11-08', calories: 500, nutritionStatus: 'user-supplied' },
  ];
  const result = Diary.dailyTotals(entries, '2026-11-09');
  assert.equal(result.totals.calories, 150);
  assert.equal(result.totals.protein, 9);
  assert.equal(result.counted.calories, 2);
});

test('empty optional nutrition and goals are omitted; invalid local data is never overwritten', () => {
  const store = storage();
  const entry = Diary.makeManualEntry({ name: 'Water', day: '2026-11-09', meal: 'Snack', calories: '', water: '350' }, 'water1');
  assert.equal(Object.hasOwn(entry, 'calories'), false);
  assert.equal(entry.water, 350);
  Diary.writeGoals(store, 'member-a', { calories: '', protein: 80, carbs: -1, fat: 'n/a', fiber: null, water: 2000 });
  assert.deepEqual(Diary.readGoals(store, 'member-a'), { protein: 80, water: 2000 });
  store.setItem(Diary.diaryKey('member-a'), '{broken');
  assert.throws(() => Diary.saveEntry(store, 'member-a', entry));
  assert.equal(store.getItem(Diary.diaryKey('member-a')), '{broken');
});

test('SoulFuel exposes manual diary actions, date navigation and six local goal fields while FoodScore stays off', () => {
  const page = fs.readFileSync(path.resolve(__dirname, '../app/soulfuel/index.html'), 'utf8');
  const script = fs.readFileSync(path.resolve(__dirname, '../app/soulfuel/foodscore.js'), 'utf8');
  const gate = fs.readFileSync(path.resolve(__dirname, '../app/soulfuel/foodscore-availability.js'), 'utf8');
  for (const id of ['manual-entry-form', 'entry-name', 'entry-meal', 'diary-date', 'previous-day', 'next-day', 'today-day', 'nutrition-goals-form', 'goal-calories', 'goal-protein', 'goal-carbs', 'goal-fat', 'goal-fiber', 'goal-water']) assert.match(page, new RegExp(`id="${id}"`));
  assert.match(script, /Diary\.saveEntry\(localStorage,memberId/);
  assert.match(script, /Diary\.deleteEntry\(localStorage,memberId/);
  assert.match(script, /authRevision/);
  assert.match(gate, /enabled:\s*false/);
});
