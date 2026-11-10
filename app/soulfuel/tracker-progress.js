'use strict';
((root, factory) => {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SoulanovaTrackerProgress = api;
})(typeof globalThis === 'undefined' ? this : globalThis, () => {
  function progress(consumed, goal) {
    const amount = Number.isFinite(consumed) && consumed >= 0 ? consumed : null;
    const target = Number.isFinite(goal) && goal > 0 ? goal : null;
    const percent = amount !== null && target !== null ? amount / target * 100 : null;
    if (percent !== null && !Number.isFinite(percent)) return {amount, target, percent: null, label: null, state: 'unknown', ring: 0};
    const state = target === null ? 'unset' : amount === null ? 'unknown' : amount > target ? 'over' : amount === target ? 'reached' : 'under';
    // Never round an over-goal value down to 100 or cap the displayed number.
    const rounded = percent === null ? null : Number(percent.toPrecision(12));
    const label = percent === null ? null : String((state === 'over' && rounded <= 100) || (state === 'under' && rounded >= 100) ? percent : rounded);
    return {amount, target, percent, label, state, ring: percent === null ? 0 : Math.min(100, percent)};
  }
  return {progress};
});
