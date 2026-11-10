'use strict';
((root, factory) => {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SoulanovaFoodDiary = api;
})(typeof globalThis === 'undefined' ? this : globalThis, () => {
  const DIARY_PREFIX = 'soulanova-foodscore-diary-v1:';
  const GOALS_PREFIX = 'soulanova-food-diary-goals-v1:';
  const NUTRIENTS = ['calories', 'protein', 'carbs', 'fat', 'fiber', 'water'];
  const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
  const isDateKey = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };

  function diaryKey(memberId) {
    if (!memberId) throw new Error('A signed-in member is required.');
    return `${DIARY_PREFIX}${memberId}`;
  }

  function goalsKey(memberId) {
    if (!memberId) throw new Error('A signed-in member is required.');
    return `${GOALS_PREFIX}${memberId}`;
  }

  function readArray(storage, key) {
    const raw = storage.getItem(key);
    if (raw === null) return [];
    const value = JSON.parse(raw);
    if (!Array.isArray(value) || value.some(item => !item || typeof item !== 'object' || Array.isArray(item))) throw new Error('Saved data has an invalid format. Existing data was left unchanged.');
    return value;
  }

  function readDiary(storage, memberId) {
    return readArray(storage, diaryKey(memberId));
  }

  function writeDiary(storage, memberId, entries) {
    if (!Array.isArray(entries)) throw new Error('Diary entries must be a list.');
    const serialized = JSON.stringify(entries);
    storage.setItem(diaryKey(memberId), serialized);
    if (storage.getItem(diaryKey(memberId)) !== serialized) throw new Error('Diary persistence could not be confirmed. Reload to check before retrying.');
  }

  function saveEntry(storage, memberId, entry) {
    if (!entry || !entry.id) throw new Error('A diary entry ID is required.');
    if (!MEALS.includes(entry.meal)) throw new Error('Choose breakfast, lunch, dinner, or snack.');
    if (!isDateKey(entry.day)) throw new Error('Choose a valid diary date.');
    const entries = readDiary(storage, memberId);
    const index = entries.findIndex(item => item.id === entry.id);
    if (index === -1) entries.push(entry);
    else entries[index] = { ...entries[index], ...entry };
    writeDiary(storage, memberId, entries);
    return entries;
  }

  function deleteEntry(storage, memberId, entryId) {
    const entries = readDiary(storage, memberId);
    const next = entries.filter(item => item.id !== entryId);
    if (next.length !== entries.length) writeDiary(storage, memberId, next);
    return next;
  }

  function readGoals(storage, memberId) {
    const raw = storage.getItem(goalsKey(memberId));
    if (raw === null) return {};
    const goals = JSON.parse(raw);
    if (!goals || typeof goals !== 'object' || Array.isArray(goals)) throw new Error('Saved goals have an invalid format. Existing data was left unchanged.');
    return goals;
  }

  function writeGoals(storage, memberId, goals) {
    const clean = {};
    for (const nutrient of NUTRIENTS) {
      const raw = goals[nutrient];
      if (raw === '' || raw === null || raw === undefined) continue;
      const value = Number(raw);
      if (Number.isFinite(value) && value >= 0) clean[nutrient] = value;
    }
    const serialized = JSON.stringify(clean);
    storage.setItem(goalsKey(memberId), serialized);
    if (storage.getItem(goalsKey(memberId)) !== serialized) throw new Error('Goal persistence could not be confirmed.');
    return clean;
  }

  function dailyTotals(entries, day) {
    const totals = Object.fromEntries(NUTRIENTS.map(name => [name, 0]));
    const counted = Object.fromEntries(NUTRIENTS.map(name => [name, 0]));
    for (const entry of entries) {
      if (entry.day !== day || !['verified', 'user-supplied'].includes(entry.nutritionStatus)) continue;
      for (const nutrient of NUTRIENTS) {
        const amount = entry[nutrient];
        if (typeof amount === 'number' && Number.isFinite(amount) && amount >= 0) {
          totals[nutrient] += amount;
          counted[nutrient] += 1;
        }
      }
    }
    return { totals, counted };
  }

  function trackerTotals(entries, day) {
    const reviewed = entries.filter(entry => entry && entry.day === day && (['verified','user-supplied'].includes(entry.nutritionStatus) || (entry.nutritionStatus === 'product-data' && entry.memberConfirmed === true)));
    const totals = dailyTotals(reviewed.map(entry => ({...entry,nutritionStatus:'user-supplied'})),day);
    return {...totals, communityEntries:reviewed.filter(entry=>entry.nutritionStatus==='product-data').length, entryCount:reviewed.length};
  }

  function makeManualEntry(input, id) {
    const name = String(input.name || '').trim();
    if (!name) throw new Error('Enter a food or drink name.');
    if (!MEALS.includes(input.meal)) throw new Error('Choose a meal.');
    if (!isDateKey(input.day)) throw new Error('Choose a valid diary date.');
    const entry = {
      id,
      type: 'manual',
      name,
      portion: String(input.portion || '').trim(),
      day: input.day,
      meal: input.meal,
      source: 'Manual entry',
      nutritionStatus: 'user-supplied',
    };
    for (const nutrient of NUTRIENTS) {
      const raw = input[nutrient];
      if (raw === '' || raw === null || raw === undefined) continue;
      const value = Number(raw);
      if (!Number.isFinite(value) || value < 0) throw new Error(`${nutrient} must be a non-negative number.`);
      entry[nutrient] = value;
    }
    return entry;
  }

  return { DIARY_PREFIX, GOALS_PREFIX, NUTRIENTS, MEALS, diaryKey, goalsKey, readDiary, writeDiary, saveEntry, deleteEntry, readGoals, writeGoals, dailyTotals, trackerTotals, makeManualEntry };
});
