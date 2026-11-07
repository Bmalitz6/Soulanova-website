(() => {
  function isProductionWebsiteHost(hostname) {
    const host = String(hostname || '').toLowerCase();
    return host === 'soulanova.com'
      || host === 'www.soulanova.com'
      || /^soulanova-website-[a-z0-9]+-soulanova\.vercel\.app$/.test(host);
  }

  function isExpectedSupabaseUrl(value, expectedValue) {
    try {
      const actual = new URL(value);
      const expected = new URL(expectedValue);
      return actual.protocol === 'https:' && actual.origin === expected.origin;
    } catch {
      return false;
    }
  }

  function mergeCompletionRecords(memberId, localRecords, remoteRecords) {
    const byId = new Map();
    [...(localRecords || []), ...(remoteRecords || [])].forEach(record => {
      if (!record || record.user_id !== memberId || typeof record.completion_id !== 'string') return;
      if (!byId.has(record.completion_id)) byId.set(record.completion_id, record);
    });
    return [...byId.values()].sort((left, right) => String(right.completed_at).localeCompare(String(left.completed_at)));
  }

  function completionCounts(records) {
    return (records || []).reduce((counts, record) => {
      if (record && typeof record.workout_id === 'string') counts[record.workout_id] = (counts[record.workout_id] || 0) + 1;
      return counts;
    }, {});
  }

  function pendingCompletionRecords(memberId, records, syncedIds) {
    const synced = syncedIds instanceof Set ? syncedIds : new Set(syncedIds || []);
    return (records || []).filter(record => record?.user_id === memberId && typeof record.completion_id === 'string' && !synced.has(record.completion_id));
  }

  function getRecommendedWorkout(workouts, records) {
    if (!Array.isArray(workouts) || workouts.length === 0) return null;
    const latestByWorkout = new Map();
    (records || []).forEach(record => {
      const previous = latestByWorkout.get(record.workout_id) || '';
      if (String(record.completed_at) > previous) latestByWorkout.set(record.workout_id, String(record.completed_at));
    });
    return workouts.find(workout => !latestByWorkout.has(workout.id))
      || [...workouts].sort((left, right) => (latestByWorkout.get(left.id) || '').localeCompare(latestByWorkout.get(right.id) || ''))[0];
  }

  const api = { isProductionWebsiteHost, isExpectedSupabaseUrl, mergeCompletionRecords, completionCounts, pendingCompletionRecords, getRecommendedWorkout };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else globalThis.SoulStrengthProgress = api;
})();
