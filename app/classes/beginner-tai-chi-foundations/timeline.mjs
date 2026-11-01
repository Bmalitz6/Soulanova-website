/** Pure playback-position model shared by Tai Chi, Strength and Stretching. */
export function validateClass(data) {
  if (!data || !['tai_chi', 'strength', 'stretching'].includes(data.category)) throw Error('Unsupported class category');
  if (!Number.isFinite(data.duration) || data.duration <= 0) throw Error('Class duration is required');
  if (!Array.isArray(data.movements) || !data.movements.length) throw Error('An ordered movement list is required');
  let previousEnd = 0;
  const ids = new Set();
  for (const movement of data.movements) {
    if (!movement.id || ids.has(movement.id) || !movement.name) throw Error('Unique named movements are required');
    if (![movement.start, movement.end].every(Number.isFinite) || movement.start < previousEnd || movement.end <= movement.start || movement.end > data.duration) throw Error('Invalid movement timing');
    ids.add(movement.id); previousEnd = movement.end;
  }
  return data;
}

export function remainingSeconds(duration, position) {
  if (!Number.isFinite(duration) || duration < 0 || !Number.isFinite(position)) throw Error('Finite playback times are required');
  // Whole seconds remaining. The first frame is 10:00; the final second is
  // 00:00, matching the standalone video countdown convention.
  return Math.max(0, Math.floor(duration - Math.max(0, position) + 1e-7));
}

export function clock(seconds) {
  const value = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

export function playbackState(data, position) {
  const t = Math.min(data.duration, Math.max(0, Number.isFinite(position) ? position : 0));
  const movements = data.movements;
  let phase = 'opening', activeId = null, nextId = movements[0].id;
  if (t >= data.duration) { phase = 'completed'; nextId = null; }
  else if (t >= movements.at(-1).end) { phase = 'closing'; nextId = null; }
  else {
    for (let i = 0; i < movements.length; i++) {
      const movement = movements[i], next = movements[i + 1];
      if (t >= movement.start && t < movement.end) {
        phase = 'practice'; activeId = movement.id; nextId = next?.id ?? null; break;
      }
      if (next && t >= movement.end && t < next.start) {
        phase = 'transition'; activeId = movement.id; nextId = next.id; break;
      }
    }
  }
  const completedIds = movements.filter(m => t >= m.end).map(m => m.id);
  return { position: t, phase, activeId, nextId, completedIds,
    remaining: remainingSeconds(data.duration, t), progress: t / data.duration };
}
