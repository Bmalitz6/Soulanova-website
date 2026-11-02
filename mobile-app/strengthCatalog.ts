export type StrengthCategory = 'Chest' | 'Back' | 'Shoulders' | 'Biceps' | 'Triceps' | 'Legs' | 'Core' | 'Full Body';
export type StrengthExercise = { id: string; name: string; categories: StrengthCategory[]; prescription: string };

// Current SoulStrength preview inventory: 38 stable, distinct movement IDs.
export const STRENGTH_EXERCISES: StrengthExercise[] = [
  { id: 'chest-floor-press', name: 'Dumbbell Floor Press', categories: ['Chest'], prescription: '3 × 10' },
  { id: 'chest-bench-press', name: 'Dumbbell Bench Press', categories: ['Chest'], prescription: '3 × 10' },
  { id: 'chest-incline-press', name: 'Incline Dumbbell Press', categories: ['Chest'], prescription: '3 × 10' },
  { id: 'chest-fly', name: 'Dumbbell Chest Fly', categories: ['Chest'], prescription: '3 × 10' },
  { id: 'pullover', name: 'Dumbbell Pullover', categories: ['Chest', 'Back'], prescription: '3 × 10' },
  { id: 'one-arm-row', name: 'One-Arm Dumbbell Row', categories: ['Back'], prescription: '3 × 8–10 / side' },
  { id: 'bent-over-row', name: 'Bent-Over Dumbbell Row', categories: ['Back'], prescription: '3 × 10' },
  { id: 'chest-supported-row', name: 'Chest-Supported Dumbbell Row', categories: ['Back'], prescription: '3 × 10' },
  { id: 'reverse-fly', name: 'Reverse Fly', categories: ['Back', 'Shoulders'], prescription: '3 × 10' },
  { id: 'renegade-row', name: 'Renegade Row', categories: ['Back', 'Core', 'Full Body'], prescription: '3 × 6–8 / side' },
  { id: 'seated-overhead-press', name: 'Seated Dumbbell Overhead Press', categories: ['Shoulders'], prescription: '3 × 10' },
  { id: 'arnold-press', name: 'Arnold Press', categories: ['Shoulders'], prescription: '3 × 10' },
  { id: 'lateral-raise', name: 'Lateral Raise', categories: ['Shoulders'], prescription: '3 × 10' },
  { id: 'shrug', name: 'Dumbbell Shrug', categories: ['Shoulders'], prescription: '3 × 10' },
  { id: 'alternating-curl', name: 'Alternating Curl', categories: ['Biceps'], prescription: '3 × 8–10 / side' },
  { id: 'hammer-curl', name: 'Hammer Curl', categories: ['Biceps'], prescription: '3 × 10' },
  { id: 'concentration-curl', name: 'Concentration Curl', categories: ['Biceps'], prescription: '3 × 8–10 / side' },
  { id: 'zottman-curl', name: 'Zottman Curl', categories: ['Biceps'], prescription: '3 × 10' },
  { id: 'overhead-triceps-extension', name: 'Overhead Triceps Extension', categories: ['Triceps'], prescription: '3 × 10' },
  { id: 'triceps-kickback', name: 'Triceps Kickback', categories: ['Triceps'], prescription: '3 × 10' },
  { id: 'lying-triceps-extension', name: 'Lying Dumbbell Triceps Extension', categories: ['Triceps'], prescription: '3 × 10' },
  { id: 'close-grip-floor-press', name: 'Close-Grip Dumbbell Floor Press', categories: ['Triceps'], prescription: '3 × 10' },
  { id: 'goblet-squat', name: 'Goblet Squat', categories: ['Legs'], prescription: '3 × 10' },
  { id: 'sumo-squat', name: 'Sumo Squat', categories: ['Legs'], prescription: '3 × 10' },
  { id: 'romanian-deadlift', name: 'Dumbbell Romanian Deadlift', categories: ['Legs'], prescription: '3 × 10' },
  { id: 'reverse-lunge', name: 'Reverse Lunge', categories: ['Legs'], prescription: '3 × 8 / side' },
  { id: 'split-squat', name: 'Split Squat', categories: ['Legs'], prescription: '3 × 8 / side' },
  { id: 'step-up', name: 'Dumbbell Step-Up', categories: ['Legs'], prescription: '3 × 8 / side' },
  { id: 'calf-raise', name: 'Standing Calf Raise', categories: ['Legs'], prescription: '3 × 10' },
  { id: 'glute-bridge', name: 'Dumbbell Glute Bridge', categories: ['Legs'], prescription: '3 × 10' },
  { id: 'weighted-dead-bug', name: 'Weighted Dead Bug', categories: ['Core'], prescription: '3 × 8 / side' },
  { id: 'russian-twist', name: 'Dumbbell Russian Twist', categories: ['Core'], prescription: '3 × 10 / side' },
  { id: 'side-bend', name: 'Dumbbell Side Bend', categories: ['Core'], prescription: '3 × 10 / side' },
  { id: 'suitcase-march', name: 'Suitcase March', categories: ['Core', 'Full Body'], prescription: '3 × 30 sec / side' },
  { id: 'thruster', name: 'Dumbbell Thruster', categories: ['Full Body'], prescription: '3 × 6–8' },
  { id: 'clean-to-press', name: 'Dumbbell Clean to Press', categories: ['Full Body'], prescription: '3 × 6–8' },
  { id: 'farmer-carry', name: 'Farmer Carry', categories: ['Full Body'], prescription: '3 × 30–45 sec' },
  { id: 'dumbbell-snatch', name: 'Dumbbell Snatch', categories: ['Full Body'], prescription: '3 × 5 / side' },
];

export const STRENGTH_CATEGORIES: StrengthCategory[] = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Core', 'Full Body'];

export const STRENGTH_ROUTINES = {
  'Full body': ['goblet-squat', 'chest-floor-press', 'one-arm-row', 'romanian-deadlift', 'seated-overhead-press', 'weighted-dead-bug'],
  'Upper / Lower': ['chest-bench-press', 'chest-supported-row', 'seated-overhead-press', 'alternating-curl', 'overhead-triceps-extension'],
  'Body-part split': ['chest-floor-press', 'chest-fly', 'close-grip-floor-press'],
  Custom: ['goblet-squat', 'chest-floor-press', 'one-arm-row'],
} as const;
