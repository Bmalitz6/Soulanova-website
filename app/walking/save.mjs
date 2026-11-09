const optionalNumber = (raw, label, min, max) => {
  const value = String(raw ?? '').trim();
  if (value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new Error(`Enter a valid ${label}.`);
  }
  return number;
};

export function parseStepCount(raw) {
  const value = String(raw ?? '').trim();
  if (value === '') return null;
  const steps = Number(value);
  if (!Number.isInteger(steps) || steps < 0 || steps > 150000) {
    throw new Error('Enter a valid steps count.');
  }
  return steps;
}

export function buildWalkSession({
  id,
  userId,
  weekIndex,
  mode,
  fitnessLevel,
  durationSeconds,
  gpsMiles,
  stepsRaw,
  treadmillDistanceRaw,
  treadmillSpeedRaw,
  treadmillInclineRaw
}) {
  if (!id || !userId) throw new Error('Sign in to save this walk.');
  if (!Number.isInteger(weekIndex) || weekIndex < 0 || weekIndex > 11) {
    throw new Error('Choose a valid program week.');
  }
  if (!['outdoor', 'treadmill'].includes(mode)) throw new Error('Choose Outdoor or Treadmill mode.');

  const steps = parseStepCount(stepsRaw);
  const treadmillDistance = mode === 'treadmill'
    ? optionalNumber(treadmillDistanceRaw, 'treadmill distance', 0, 100)
    : null;
  const treadmillSpeed = mode === 'treadmill'
    ? optionalNumber(treadmillSpeedRaw, 'actual treadmill speed', 0, 15)
    : null;
  const treadmillIncline = mode === 'treadmill'
    ? optionalNumber(treadmillInclineRaw, 'actual treadmill incline', 0, 20)
    : null;

  const distance = mode === 'treadmill'
    ? treadmillDistance
    : (Number.isFinite(gpsMiles) && gpsMiles > 0 ? Number(gpsMiles.toFixed(3)) : null);

  return {
    id,
    user_id: userId,
    week_number: weekIndex + 1,
    walk_mode: mode,
    fitness_level: fitnessLevel,
    duration_minutes: durationSeconds / 60,
    distance_miles: distance,
    distance_source: distance === null ? null : mode === 'treadmill' ? 'treadmill_manual' : 'outdoor_gps',
    steps,
    steps_source: String(stepsRaw ?? '').trim() === '' ? null : 'manual',
    treadmill_speed_mph: treadmillSpeed,
    treadmill_incline_percent: treadmillIncline,
    source: 'web'
  };
}

/**
 * Coordinates the button lifecycle. The save lock ends when persistence resolves,
 * before history refresh begins. Stable IDs are supplied by the walk state and
 * reused on retry so the existing insertOnce conflict recovery remains effective.
 */
export function createWalkSaveHandler({ canSave, capture, save, refreshHistory, onState }) {
  let inFlight = false;
  let operation = 0;
  const savedKeys = new Set();

  return async function handleSave() {
    if (inFlight || !canSave()) return { status: 'ignored' };

    let context;
    try {
      // Capture and validate form values synchronously before any auth/network await.
      context = capture();
    } catch (error) {
      onState({ saving: false, saved: false, message: `Could not save walk: ${walkSaveErrorMessage(error)}` }, null);
      return { status: 'failed', error };
    }

    const key = `${context.record.user_id}:${context.record.id}`;
    if (savedKeys.has(key)) return { status: 'ignored' };
    const ticket = ++operation;
    inFlight = true;
    onState({ saving: true, saved: false, message: 'Saving completed walk…' }, context);
    let inserted = false;
    try {
      await save(context);
      inserted = true;
      savedKeys.add(key);

      // Release the visual loading state as soon as the insert has succeeded.
      // saved=true continues to block duplicate taps while history refreshes.
      inFlight = false;
      onState({ saving: false, saved: true, message: 'Walk saved. Refreshing history…' }, context);

      let historyRefreshed = true;
      try {
        historyRefreshed = (await refreshHistory(context)) !== false;
      } catch {
        historyRefreshed = false;
      }

      const message = historyRefreshed
        ? 'Walk saved. See your personal walking history below.'
        : 'Walk saved, but history could not refresh. Use Refresh history to try again.';
      onState({ saving: false, saved: true, message }, context);
      return { status: 'saved', historyRefreshed };
    } catch (error) {
      onState({ saving: false, saved: inserted, message: `Could not save walk: ${walkSaveErrorMessage(error)}` }, context);
      return { status: 'failed', error, inserted };
    } finally {
      if (ticket === operation) {
        inFlight = false;
        onState({ saving: false, saved: inserted }, context);
      }
    }
  };
}


export function walkSaveErrorMessage(error) {
  const message = error?.message || String(error || 'Unknown error');
  const code = String(error?.code || '');
  const status = Number(error?.status || error?.statusCode || 0);
  if (code === 'PGRST204' || code === '42703') {
    return 'The account table is missing a field required for this walk. Your entered readings remain on this screen; database schema needs review.';
  }
  if (status === 403 || code === '42501' || /403|permission denied/i.test(message)) {
    return 'Supabase denied the walk insert. Your entered readings remain on this screen; account permissions need review.';
  }
  if (/sign in|session.{0,20}(expired|missing)|jwt expired|invalid.{0,15}token|not authenticated/i.test(message)) {
    return 'Your sign-in is missing or expired. Sign in again, then retry; your entered readings remain on this screen.';
  }
  if (/timed out|network|failed to fetch|connection/i.test(message)) {
    return 'The connection failed before the save was confirmed. Your readings remain here; retry is safe and reuses the same walk ID.';
  }
  return message;
}
