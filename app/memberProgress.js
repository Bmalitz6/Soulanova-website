'use strict';

(function attachMemberProgress(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SoulanovaMemberProgress = api;
})(typeof globalThis === 'undefined' ? this : globalThis, function createMemberProgress() {
  function mergeHistory(memberId, workoutSessions, strengthCompletions) {
    if (!memberId) return [];
    const entries = [];
    const seen = new Set();
    for (const row of workoutSessions || []) {
      if (!row?.id || row.user_id !== memberId) continue;
      const key = `session:${row.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      entries.push({
        id: row.id,
        source: 'workout_sessions',
        at: row.completed_at,
        dbid: row.id,
        minutes: row.duration_minutes,
        name: row.workout_name,
        category: row.category,
      });
    }
    for (const row of strengthCompletions || []) {
      if (!row?.completion_id || row.user_id !== memberId) continue;
      const key = `strength:${row.completion_id}`;
      if (seen.has(key)) continue;
      const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const completedAt = Date.parse(row.completed_at || '');
      const existingSession = entries.some(entry => {
        const sessionAt = Date.parse(entry.at || '');
        return normalize(entry.category).includes('strength')
          && normalize(entry.name) === normalize(row.workout_title)
          && entry.minutes === row.duration_minutes
          && Number.isFinite(completedAt) && Number.isFinite(sessionAt)
          && Math.abs(completedAt - sessionAt) <= 60_000;
      });
      if (existingSession) continue;
      seen.add(key);
      entries.push({
        id: 'strength',
        source: 'strength_workout_completions',
        completionId: row.completion_id,
        at: row.completed_at,
        minutes: row.duration_minutes,
        name: row.workout_title,
        category: 'Strength',
      });
    }
    return entries.sort((left, right) => String(left.at || '').localeCompare(String(right.at || '')));
  }

  function isMissingWorkoutSessionsTable(error) {
    if (!error) return false;
    const message = String(error.message || '').toLowerCase();
    return error.code === '42P01'
      || (error.code === 'PGRST205' && message.includes('workout_sessions'));
  }

  return { mergeHistory, isMissingWorkoutSessionsTable };
});
