'use strict';

const fs = require('node:fs');
const path = require('node:path');

function csvCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function matrixCsv(plan, catalog) {
  const movements = new Map(catalog.movements.map(item => [item.id, item]));
  const heading = [
    'proposal_status', 'workout_id', 'level', 'workout_title', 'emphasis', 'design_note',
    'loops_per_movement', 'movement_count', 'estimated_duration_with_transitions',
    'ordered_movement_ids', 'ordered_movement_names'
  ];
  const rows = [heading];
  for (const level of plan.levels) {
    const loops = plan.playback.loopCountsByLevel[level.id];
    for (const workout of level.workouts) {
      const mediaSeconds = workout.movementIds.reduce((sum, id) => sum + movements.get(id).durationSeconds, 0) * loops;
      const estimate = mediaSeconds + (workout.movementIds.length - 1) * plan.playback.transitionDurationSeconds;
      const rounded = Math.round(estimate);
      const duration = `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`;
      rows.push([
        plan.proposalStatus === 'owner_approved_2026-11-13' ? 'OWNER APPROVED 2026-11-13' : 'PENDING OWNER APPROVAL', workout.id, level.name, workout.title, workout.emphasis, workout.designNote,
        loops, workout.movementIds.length, duration, workout.movementIds.join(' > '),
        workout.movementIds.map(id => movements.get(id).name).join(' > ')
      ]);
    }
  }
  return rows.map(row => row.map(csvCell).join(',')).join('\n') + '\n';
}

if (require.main === module) {
  const root = path.resolve(__dirname, '..');
  const plan = JSON.parse(fs.readFileSync(path.join(root, 'app/chair-yoga/chair-yoga-programs.json'), 'utf8'));
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'app/chair-yoga/catalog.json'), 'utf8'));
  const output = path.join(root, 'docs/chair-yoga/proposed-36-workout-matrix.csv');
  fs.writeFileSync(output, matrixCsv(plan, catalog));
  process.stdout.write(`Wrote ${plan.totalWorkouts} ${plan.proposalStatus === 'owner_approved_2026-11-13' ? 'owner-approved' : 'proposed'} workouts to ${output}\n`);
}

module.exports = { matrixCsv };
