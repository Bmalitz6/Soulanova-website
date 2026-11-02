export const briskMinutes = Object.freeze([5, 7, 9, 11, 13, 15, 18, 20, 23, 26, 28, 30]);

export const treadmillLevels = Object.freeze({
  beginner: Object.freeze({
    label: 'Beginner',
    phases: Object.freeze({
      warmup: Object.freeze({ speed: [1.5, 2.0], incline: [0, 0] }),
      steady: Object.freeze({ speed: [2.0, 2.8], incline: [0, 1] }),
      brisk: Object.freeze({ speed: [2.5, 3.3], incline: [0, 2] }),
      cooldown: Object.freeze({ speed: [1.5, 2.0], incline: [0, 0] })
    })
  }),
  intermediate: Object.freeze({
    label: 'Intermediate',
    phases: Object.freeze({
      warmup: Object.freeze({ speed: [2.0, 2.5], incline: [0, 1] }),
      steady: Object.freeze({ speed: [2.8, 3.4], incline: [1, 2] }),
      brisk: Object.freeze({ speed: [3.3, 3.8], incline: [2, 4] }),
      cooldown: Object.freeze({ speed: [2.0, 2.5], incline: [0, 0] })
    })
  }),
  advanced: Object.freeze({
    label: 'Advanced',
    phases: Object.freeze({
      warmup: Object.freeze({ speed: [2.5, 3.0], incline: [0, 1] }),
      steady: Object.freeze({ speed: [3.3, 3.8], incline: [2, 4] }),
      brisk: Object.freeze({ speed: [3.8, 4.3], incline: [4, 6] }),
      cooldown: Object.freeze({ speed: [2.0, 2.7], incline: [0, 0] })
    })
  })
});

const phases = Object.freeze(['warmup', 'steady', 'brisk', 'cooldown']);

export function totalWalkSeconds(weekIndex) {
  if (!Number.isInteger(weekIndex) || weekIndex < 0 || weekIndex >= briskMinutes.length) {
    throw new RangeError('Week index must be from 0 through 11.');
  }
  return 600 + briskMinutes[weekIndex] * 60;
}

// The existing brisk-walk block is split evenly for optional treadmill guidance.
// Total workout length and the existing five-minute milestones remain unchanged.
export function phaseAt(weekIndex, elapsedSeconds) {
  const total = totalWalkSeconds(weekIndex);
  const coreEnd = total - 300;
  const steadyEnd = 300 + Math.ceil((coreEnd - 300) / 2);
  const elapsed = Math.max(0, Math.min(total, Number(elapsedSeconds) || 0));
  if (elapsed >= total) return { current: null, next: null, total };
  const index = elapsed < 300 ? 0 : elapsed < steadyEnd ? 1 : elapsed < coreEnd ? 2 : 3;
  return { current: phases[index], next: phases[index + 1] || null, total };
}

export function accountChangeState(previousOwner, nextOwner, weekIndex) {
  const previous = previousOwner || null;
  const next = nextOwner || null;
  if (previous === next) return null;
  return Object.freeze({
    owner: next,
    week: weekIndex,
    elapsed: 0,
    finished: false,
    saved: false,
    mode: 'outdoor',
    level: 'beginner',
    gpsMiles: 0,
    events: Object.freeze([]),
    actuals: Object.freeze({ distance: '', speed: '', incline: '', steps: '' }),
    manual: Object.freeze({ speed: '', incline: '' })
  });
}
