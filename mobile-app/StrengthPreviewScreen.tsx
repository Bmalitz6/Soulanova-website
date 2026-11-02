import React, { useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, ImageBackground, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STRENGTH_CATEGORIES, STRENGTH_EXERCISES, STRENGTH_ROUTINES, StrengthCategory, StrengthExercise } from './strengthCatalog';

const C = { ink: '#173238', teal: '#086B63', sage: '#E8F1EC', cream: '#F7F8F5', muted: '#71827B', line: '#DFE8E2', white: '#FFFFFF' };
const STRENGTH_IMAGE = 'https://soulanova.com/app/images/workouts/strength.jpg';
type Routine = keyof typeof STRENGTH_ROUTINES;
type Level = 'Beginner' | 'Intermediate' | 'Advanced';
type SetEntry = { id: string; reps: number; unit: 'reps' | 'sec'; loadLb: number | null; rpe: number; formConfirmed: boolean; loggedAt: string };
type PlannedExercise = { id: string; name: string; prescription: string; sets: number; targetReps: number; unit: 'reps' | 'sec'; completedSets: SetEntry[] };
type Workout = { id: string; date: string; startedAt: string; finishedAt?: string; durationSeconds: number; level: Level; routine: Routine; status: 'active' | 'paused' | 'ready-to-finish' | 'complete'; exerciseIndex: number; exercises: PlannedExercise[]; pending: { reps: string; load: string; rpe: string; formConfirmed: boolean }; restRemaining: number; pendingFinish?: boolean };
type PreviewStore = { sessions: Workout[]; draft: Workout | null };

const emptyStore: PreviewStore = { sessions: [], draft: null };
const formatTime = (total: number) => `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const scopeHash = (value: string) => { let hash = 2166136261; for (let index = 0; index < value.length; index += 1) { hash ^= value.charCodeAt(index); hash = Math.imul(hash, 16777619); } return (hash >>> 0).toString(16); };

export default function StrengthPreviewScreen({ onBack, previewScope }: { onBack: () => void; previewScope: string }) {
  const storageKey = `soulanova.soulstrength.preview.v1.${scopeHash(previewScope)}`;
  const [level, setLevel] = useState<Level>('Beginner');
  const [routine, setRoutine] = useState<Routine>('Full body');
  const [category, setCategory] = useState<StrengthCategory | 'All'>('All');
  const [customExerciseIds, setCustomExerciseIds] = useState<string[]>([...STRENGTH_ROUTINES.Custom]);
  const [search, setSearch] = useState('');
  const [store, setStore] = useState<PreviewStore>(emptyStore);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [status, setStatus] = useState('Preview only · No account history is read or written.');
  const [hydrated, setHydrated] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const finishing = useRef(false);
  const isRunning = workout?.status === 'active';

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(storageKey).then(raw => {
      if (!mounted) return;
      if (raw) {
        const parsed = JSON.parse(raw) as PreviewStore;
        const safeStore = { sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [], draft: parsed.draft ?? null };
        setStore(safeStore);
        if (safeStore.draft) {
          const recovered = { ...safeStore.draft, status: 'paused' as const };
          setWorkout(recovered);
          setStore({ ...safeStore, draft: recovered });
          setStatus('Recovered unfinished preview · paused for safety. Resume when ready.');
        }
      }
    }).catch(() => {
      if (mounted) { setStorageError(true); setStatus('Local storage could not be read. This session will remain in memory until the app closes.'); }
    }).finally(() => { if (mounted) setHydrated(true); });
    return () => { mounted = false; };
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated || !workout || workout.status === 'complete') return;
    const next = { ...store, draft: workout };
    AsyncStorage.setItem(storageKey, JSON.stringify(next)).then(() => setStorageError(false)).catch(() => {
      setStorageError(true); setStatus('Could not persist locally. Your workout remains on screen; retry storage or keep the app open.');
    });
  }, [workout, hydrated, store, storageKey]);

  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => setWorkout(current => {
      if (!current || current.status !== 'active') return current;
      const restRemaining = Math.max(0, current.restRemaining - 1);
      return { ...current, durationSeconds: current.durationSeconds + 1, restRemaining, status: current.pendingFinish && restRemaining === 0 ? 'ready-to-finish' : 'active' };
    }), 1000);
    return () => clearInterval(timer);
  }, [isRunning]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      if (next !== 'active') setWorkout(current => current && current.status === 'active' ? { ...current, status: 'paused' } : current);
    });
    return () => sub.remove();
  }, []);

  const routineItems = useMemo(() => (routine === 'Custom' ? customExerciseIds : STRENGTH_ROUTINES[routine]).map(id => STRENGTH_EXERCISES.find(item => item.id === id)).filter((item): item is StrengthExercise => !!item), [routine, customExerciseIds]);
  const filtered = useMemo(() => STRENGTH_EXERCISES.filter(item => (category === 'All' || item.categories.includes(category)) && item.name.toLowerCase().includes(search.toLowerCase().trim())), [category, search]);
  const activeExercise = workout?.exercises[workout.exerciseIndex];
  const totalSets = workout?.exercises.reduce((count, item) => count + item.completedSets.length, 0) ?? 0;
  const plannedSets = workout?.exercises.reduce((count, item) => count + item.sets, 0) ?? 0;

  const persistFinal = async (next: PreviewStore) => {
    try { await AsyncStorage.setItem(storageKey, JSON.stringify(next)); setStorageError(false); return true; }
    catch { setStorageError(true); setStatus('Could not save the local recap. Your workout is still here; retry saving when storage is available.'); return false; }
  };

  const begin = (selectedRoutine = routine, selectedLevel = level) => {
    const selectedIds = selectedRoutine === 'Custom' ? customExerciseIds : STRENGTH_ROUTINES[selectedRoutine];
    const items = selectedIds.map(id => STRENGTH_EXERCISES.find(item => item.id === id)).filter((item): item is StrengthExercise => !!item);
    if (!items.length) return;
    finishing.current = false;
    const next: Workout = { id: uid(), date: new Date().toISOString(), startedAt: new Date().toISOString(), durationSeconds: 0, level: selectedLevel, routine: selectedRoutine, status: 'active', exerciseIndex: 0, exercises: items.map(item => ({ id: item.id, name: item.name, prescription: item.prescription, sets: 3, targetReps: Number(item.prescription.match(/×\s*(\d+)/)?.[1] ?? 10), unit: /sec/i.test(item.prescription) ? 'sec' : 'reps', completedSets: [] })), pending: { reps: String(Number(items[0].prescription.match(/×\s*(\d+)/)?.[1] ?? 10)), load: '', rpe: '', formConfirmed: false }, restRemaining: 0 };
    setWorkout(next); setStatus('Local preview workout started. Nothing is sent to your account.');
  };

  const updatePending = (field: keyof Workout['pending'], value: string | boolean) => setWorkout(current => current ? { ...current, pending: { ...current.pending, [field]: value } } : current);
  const setPaused = () => setWorkout(current => current ? { ...current, status: current.status === 'active' ? 'paused' : 'active' } : current);

  const completeSet = () => {
    if (!workout || workout.status !== 'active' || !activeExercise) return;
    const reps = Number(workout.pending.reps), rpe = Number(workout.pending.rpe), loadLb = workout.pending.load.trim() === '' ? null : Number(workout.pending.load);
    if (!Number.isInteger(reps) || reps < 1 || !Number.isFinite(rpe) || rpe < 1 || rpe > 10 || (loadLb !== null && (!Number.isFinite(loadLb) || loadLb < 0)) || !workout.pending.formConfirmed) {
      setStatus('Enter actual reps and RPE from 1–10, then confirm your own technique before logging.'); return;
    }
    if (activeExercise.completedSets.length >= activeExercise.sets) return;
    const entry: SetEntry = { id: uid(), reps, unit: activeExercise.unit, loadLb, rpe, formConfirmed: true, loggedAt: new Date().toISOString() };
    const nextExercises = workout.exercises.map((item, index) => index === workout.exerciseIndex ? { ...item, completedSets: [...item.completedSets, entry] } : item);
    const lastSet = activeExercise.completedSets.length + 1 >= activeExercise.sets;
    const nextIndex = lastSet && workout.exerciseIndex < workout.exercises.length - 1 ? workout.exerciseIndex + 1 : workout.exerciseIndex;
    const isDone = lastSet && workout.exerciseIndex === workout.exercises.length - 1;
    const nextExercise = nextExercises[nextIndex];
    const next: Workout = { ...workout, exercises: nextExercises, exerciseIndex: nextIndex, status: 'active', pendingFinish: isDone, restRemaining: 75, pending: { reps: String(nextExercise.targetReps), load: '', rpe: '', formConfirmed: false } };
    setWorkout(next);
    setStatus(isDone ? 'All planned sets are complete. Review and save your local recap.' : 'Set recorded in this local preview. Rest timer started for 75 seconds.');
  };

  const finish = async () => {
    if (!workout || finishing.current || workout.status === 'complete') return;
    finishing.current = true;
    const existing = store.sessions.some(item => item.id === workout.id);
    if (existing) { setStatus('This preview session is already recorded; no duplicate was added.'); finishing.current = false; return; }
    const completed: Workout = { ...workout, status: 'complete', finishedAt: new Date().toISOString() };
    const next: PreviewStore = { sessions: [...store.sessions, completed], draft: null };
    if (await persistFinal(next)) { setStore(next); setWorkout(completed); setStatus('Recap saved to this device preview only.'); }
    else setStatus('Recap remains on screen but was not added to local history. Retry after storage recovers.');
    finishing.current = false;
  };

  const retryLocalSave = async () => {
    if (workout?.status === 'ready-to-finish') { await finish(); return; }
    const next: PreviewStore = { ...store, draft: workout && workout.status !== 'complete' ? workout : store.draft };
    if (await persistFinal(next)) { setStore(next); setStorageError(false); setStatus('Local preview saved on this device.'); }
  };

  const reset = () => { setWorkout(null); setStatus('Preview only · No account history is read or written.'); };
  const previous = activeExercise ? store.sessions.filter(item => item.status === 'complete').flatMap(item => item.exercises.filter(e => e.id === activeExercise.id).flatMap(e => e.completedSets.map(set => ({ date: item.date, set })))).at(-1) : undefined;
  const qualifiedSessions = activeExercise ? store.sessions.filter(item => item.status === 'complete').filter(item => {
    const movement = item.exercises.find(e => e.id === activeExercise.id);
    return !!movement && movement.completedSets.length === movement.sets && movement.completedSets.every(set => set.formConfirmed && set.rpe === 8 && set.loadLb !== null && set.reps >= movement.targetReps);
  }).length : 0;

  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
    <View style={s.header}><Pressable accessibilityRole="button" onPress={onBack} style={s.back}><Ionicons name="arrow-back" size={19} color={C.teal} /><Text style={s.backText}>Home</Text></Pressable><Text style={s.brand}>SOULANOVA</Text><View style={s.preview}><Text style={s.previewText}>PREVIEW</Text></View></View>
    <ImageBackground source={{ uri: STRENGTH_IMAGE }} imageStyle={s.heroImage} style={s.hero}><View style={s.heroShade} /><Text style={s.eyebrow}>SOULSTRENGTH · MOVE WITH CONTROL</Text><Text style={s.heroTitle}>Build strength at your own pace.</Text><Text style={s.heroCopy}>Thoughtful dumbbell training with Soulanova’s Strength instructor.</Text></ImageBackground>
    <Text style={s.section}>Choose your level</Text><View style={s.levels}>{(['Beginner', 'Intermediate', 'Advanced'] as Level[]).map(value => <Pressable disabled={!!workout && workout.status !== 'complete'} accessibilityRole="button" accessibilityState={{ selected: level === value, disabled: !!workout && workout.status !== 'complete' }} key={value} onPress={() => setLevel(value)} style={[s.level, level === value && s.levelSelected]}><Text style={[s.levelText, level === value && s.levelTextSelected]}>{value}</Text></Pressable>)}</View>
    <Text style={s.section}>Choose a routine</Text><View style={s.routines}>{(Object.keys(STRENGTH_ROUTINES) as Routine[]).map(value => <Pressable disabled={!!workout && workout.status !== 'complete'} key={value} onPress={() => setRoutine(value)} style={[s.routine, routine === value && s.routineSelected]}><Text style={[s.routineText, routine === value && s.routineTextSelected]}>{value}</Text></Pressable>)}</View>
    <View style={s.workoutCard}><View style={s.cardTop}><View style={{ flex: 1 }}><Text style={s.section}>Workout tracking</Text><Text style={s.sub}>3 sets × 10 controlled reps by default · Rest 60–90 sec</Text></View><Ionicons name="barbell-outline" size={24} color={C.teal} /></View>
      {!workout && <><View style={s.routineList}>{routineItems.map((item, index) => <View key={item.id} style={s.routineItem}><View style={s.number}><Text style={s.numberText}>{index + 1}</Text></View><View style={{ flex: 1 }}><Text style={s.itemName}>{item.name}</Text><Text style={s.itemSub}>{item.prescription} · 3 sets</Text></View></View>)}</View><Pressable style={s.primaryButton} onPress={() => begin()}><Text style={s.primaryText}>Start preview workout</Text></Pressable></>}
      {workout && activeExercise && workout.status !== 'complete' && <View style={s.activeCard}><View style={s.cardTop}><Text style={s.eyebrowDark}>{workout.status === 'paused' ? 'PAUSED' : 'ACTIVE'} · {workout.level.toUpperCase()}</Text><Text style={s.timer}>{formatTime(workout.durationSeconds)}</Text></View><Text style={s.exerciseName}>{activeExercise.name}</Text><Text style={s.prescription}>{activeExercise.prescription} · Set {Math.min(activeExercise.completedSets.length + 1, 3)} of 3</Text><Text style={s.cue}>Use a controllable load, breathe through the effort, and keep a comfortable range of motion.</Text>
        <View style={s.fields}><Field label={activeExercise.unit === 'sec' ? 'ACTUAL SEC' : 'ACTUAL REPS'} value={workout.pending.reps} onChange={value => updatePending('reps', value)} /><Field label="LOAD · LB" value={workout.pending.load} onChange={value => updatePending('load', value)} placeholder="Optional" /><Field label="EFFORT · RPE" value={workout.pending.rpe} onChange={value => updatePending('rpe', value)} placeholder="1–10" keyboardType="numeric" /></View>
        <Text style={s.previous}>{previous ? `Previous preview weight: ${previous.set.loadLb ?? 'not entered'} lb · ${new Date(previous.date).toLocaleDateString()}` : 'Previous weight: no completed local preview set'}</Text>
        {qualifiedSessions >= 2 && <View style={s.suggestion}><Text style={s.suggestionText}>Optional: {qualifiedSessions} previous preview sessions had your form confirmation and RPE 8 (about 2 reps in reserve). You may choose a small 2.5 lb increase next time. Nothing changes automatically.</Text></View>}
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: workout.pending.formConfirmed }} onPress={() => updatePending('formConfirmed', !workout.pending.formConfirmed)} style={s.formCheck}><View style={[s.checkbox, workout.pending.formConfirmed && s.checkboxOn]}>{workout.pending.formConfirmed && <Ionicons name="checkmark" size={14} color={C.white} />}</View><Text style={s.formText}>I completed this set with controlled technique and no concerning discomfort.</Text></Pressable>
        <View style={s.progressTrack}><View style={[s.progressFill, { width: `${plannedSets ? Math.min(100, totalSets / plannedSets * 100) : 0}%` }]} /></View><Text style={s.progressText}>{totalSets} of {plannedSets} sets complete · {formatTime(workout.durationSeconds)}</Text>
        {workout.restRemaining > 0 && <View style={s.restBox}><Text style={s.restText}>Rest · {workout.restRemaining}s</Text><Pressable onPress={() => setWorkout(current => current ? { ...current, restRemaining: 0, status: current.pendingFinish ? 'ready-to-finish' : current.status } : current)}><Text style={s.linkText}>Skip rest</Text></Pressable></View>}
        {workout.status !== 'ready-to-finish' && <View style={s.activeActions}><Pressable style={s.secondaryButton} onPress={setPaused}><Text style={s.secondaryText}>{workout.status === 'paused' ? 'Resume' : 'Pause'}</Text></Pressable><Pressable style={[s.primaryButton, s.completeButton]} onPress={completeSet} disabled={workout.status !== 'active' || workout.restRemaining > 0}><Text style={s.primaryText}>{workout.restRemaining > 0 ? `Rest · ${workout.restRemaining}s` : 'Complete set'}</Text></Pressable></View>}
        {workout.status === 'ready-to-finish' && <Pressable style={s.primaryButton} onPress={finish}><Text style={s.primaryText}>Finish workout & save local recap</Text></Pressable>}
      </View>}
      {workout?.status === 'complete' && <View style={s.activeCard}><Text style={s.exerciseName}>Workout recap</Text><Text style={s.itemSub}>{new Date(workout.date).toLocaleString()} · {workout.level} · {formatTime(workout.durationSeconds)} · {totalSets} sets</Text>{workout.exercises.flatMap(item => item.completedSets.map((set, index) => <Text key={set.id} style={s.recapLine}>✓ {item.name} · set {index + 1}: {set.reps} {set.unit} · {set.loadLb == null ? 'load not entered' : `${set.loadLb} lb`} · RPE {set.rpe} · form self-confirmed</Text>))}<Text style={s.previewNote}>Saved on this device preview only · separate from Soulanova account history</Text><Pressable style={s.secondaryButton} onPress={reset}><Text style={s.secondaryText}>Start new preview workout</Text></Pressable></View>}
      <Text style={s.notice}>{storageError ? 'Local storage error · workout stays in memory; retry or keep this screen open.' : status}</Text>{storageError && <Pressable style={s.secondaryButton} onPress={retryLocalSave}><Text style={s.secondaryText}>Retry local save</Text></Pressable>}<Text style={s.notice}>Device-only preview, scoped to this sign-in · not uploaded to member history.</Text>
    </View>
    <Text style={s.section}>Movement library <Text style={s.count}>38 unique movements</Text></Text><View style={s.searchBox}><Ionicons name="search" size={17} color={C.muted} /><TextInput value={search} onChangeText={setSearch} placeholder="Search movement" placeholderTextColor="#87958E" style={s.search} /></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categoryRow}>{(['All', ...STRENGTH_CATEGORIES] as const).map(item => <Pressable key={item} onPress={() => setCategory(item)} style={[s.category, category === item && s.categorySelected]}><Text style={[s.categoryText, category === item && s.categoryTextSelected]}>{item}</Text></Pressable>)}</ScrollView>
    <View style={s.exerciseList}>{filtered.map(item => <Pressable key={item.id} onPress={() => { if (routine !== 'Custom' || (workout && workout.status !== 'complete')) return; setCustomExerciseIds(ids => ids.includes(item.id) ? ids.filter(id => id !== item.id) : [...ids, item.id]); }} style={s.libraryItem}><View style={{ flex: 1 }}><Text style={s.itemName}>{item.name}</Text><Text style={s.itemSub}>{item.categories.join(' · ')}{routine === 'Custom' ? (customExerciseIds.includes(item.id) ? ' · In custom plan' : ' · Tap to add') : ''}</Text></View><Text style={s.prescriptionSmall}>{item.prescription}</Text></Pressable>)}</View>
    {!!store.sessions.length && <View style={s.historyCard}><Text style={s.itemName}>Recent local preview workouts</Text>{store.sessions.slice().reverse().slice(0, 5).map(item => <Text key={item.id} style={s.historyLine}>{new Date(item.date).toLocaleDateString()} · {item.level} · {formatTime(item.durationSeconds)} · {item.exercises.reduce((sum, movement) => sum + movement.completedSets.length, 0)} sets · device preview only</Text>)}</View>}
    <View style={s.safety}><Text style={s.safetyText}>Optional guidance only · no automatic weight changes · preview data remains on this device</Text></View>
  </ScrollView></SafeAreaView>;
}

function Field({ label, value, onChange, placeholder, keyboardType = 'decimal-pad' }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; keyboardType?: 'numeric' | 'decimal-pad' }) {
  return <View style={s.field}><Text style={s.fieldLabel}>{label}</Text><TextInput accessibilityLabel={label} keyboardType={keyboardType} value={value} onChangeText={onChange} placeholder={placeholder} style={s.input} /></View>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream }, container: { padding: 17, paddingBottom: 40 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }, back: { flexDirection: 'row', alignItems: 'center', gap: 5, minWidth: 70 }, backText: { color: C.teal, fontWeight: '700' }, brand: { color: C.teal, fontSize: 11, fontWeight: '900', letterSpacing: 1.7 }, preview: { backgroundColor: '#FBF3DF', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 9 }, previewText: { color: '#956D2D', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  hero: { overflow: 'hidden', borderRadius: 23, padding: 20, minHeight: 190, justifyContent: 'flex-end', marginBottom: 16, backgroundColor: '#115B56' }, heroImage: { borderRadius: 23 }, heroShade: { ...StyleSheet.absoluteFill, backgroundColor: '#092f32a6' }, eyebrow: { color: '#B4D8CB', fontSize: 9, letterSpacing: 1.3, fontWeight: '900' }, heroTitle: { color: '#FFF', fontSize: 27, lineHeight: 32, fontWeight: '800', marginTop: 7, maxWidth: 330 }, heroCopy: { color: '#E2EEE8', fontSize: 11, lineHeight: 17, marginTop: 6, maxWidth: 300 }, section: { color: C.ink, fontSize: 18, fontWeight: '800', marginBottom: 10, marginTop: 7 }, levels: { flexDirection: 'row', gap: 7 }, level: { flex: 1, minHeight: 48, backgroundColor: C.white, borderColor: C.line, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }, levelSelected: { backgroundColor: C.teal, borderColor: C.teal }, levelText: { color: C.ink, fontSize: 11, fontWeight: '800' }, levelTextSelected: { color: C.white }, routines: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 14 }, routine: { backgroundColor: C.white, borderColor: C.line, borderWidth: 1, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 9 }, routineSelected: { backgroundColor: C.sage, borderColor: '#B8D2C4' }, routineText: { color: C.ink, fontSize: 10, fontWeight: '700' }, routineTextSelected: { color: C.teal },
  workoutCard: { backgroundColor: C.white, borderRadius: 20, borderWidth: 1, borderColor: C.line, padding: 15, marginBottom: 18 }, cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, sub: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: -4 }, routineList: { marginTop: 7 }, routineItem: { minHeight: 48, borderTopWidth: 1, borderTopColor: '#EEF2EF', flexDirection: 'row', alignItems: 'center', gap: 10 }, number: { width: 27, height: 27, borderRadius: 9, backgroundColor: C.sage, alignItems: 'center', justifyContent: 'center' }, numberText: { color: C.teal, fontSize: 10, fontWeight: '900' }, itemName: { color: C.ink, fontSize: 11, fontWeight: '800' }, itemSub: { color: C.muted, fontSize: 9, marginTop: 3 }, primaryButton: { minHeight: 45, backgroundColor: C.teal, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15, marginTop: 12 }, primaryText: { color: C.white, fontSize: 13, fontWeight: '800' }, notice: { color: C.muted, fontSize: 9, lineHeight: 14, textAlign: 'center', marginTop: 8 },
  activeCard: { backgroundColor: '#F8FAF8', borderColor: C.line, borderWidth: 1, borderRadius: 16, padding: 13, marginTop: 12 }, eyebrowDark: { color: C.teal, fontSize: 9, letterSpacing: 1, fontWeight: '900' }, timer: { color: C.teal, fontSize: 18, fontWeight: '900', fontVariant: ['tabular-nums'] }, exerciseName: { color: C.ink, fontWeight: '800', fontSize: 20, marginTop: 10 }, prescription: { color: C.teal, fontSize: 11, fontWeight: '800', marginTop: 3 }, cue: { color: C.muted, backgroundColor: C.sage, borderRadius: 12, padding: 10, fontSize: 10, lineHeight: 15, marginTop: 10 }, fields: { flexDirection: 'row', gap: 7, marginTop: 11 }, field: { flex: 1, minWidth: 0 }, fieldLabel: { color: C.muted, fontSize: 8, fontWeight: '900' }, input: { height: 40, borderColor: C.line, borderWidth: 1, borderRadius: 10, marginTop: 5, paddingHorizontal: 7, color: C.ink, fontSize: 11, backgroundColor: C.white }, previous: { color: C.muted, fontSize: 9, marginTop: 8 }, suggestion: { backgroundColor: '#FBF3DF', borderRadius: 11, padding: 10, marginTop: 8 }, suggestionText: { color: '#755D32', fontSize: 9, lineHeight: 14 }, formCheck: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderColor: C.line, borderWidth: 1, borderRadius: 11, backgroundColor: C.white, marginTop: 10 }, checkbox: { width: 19, height: 19, borderRadius: 5, borderWidth: 1, borderColor: '#AFC1B6', alignItems: 'center', justifyContent: 'center' }, checkboxOn: { backgroundColor: C.teal, borderColor: C.teal }, formText: { flex: 1, color: C.ink, fontSize: 10, lineHeight: 15 }, progressTrack: { height: 6, backgroundColor: '#E4ECE6', borderRadius: 9, overflow: 'hidden', marginTop: 12 }, progressFill: { height: 6, backgroundColor: C.teal }, progressText: { color: C.muted, fontSize: 9, marginTop: 5 }, restBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 9, backgroundColor: C.sage, borderRadius: 10, marginTop: 8 }, restText: { color: C.teal, fontWeight: '800', fontSize: 11 }, linkText: { color: C.teal, fontWeight: '800', fontSize: 10 }, activeActions: { flexDirection: 'row', gap: 8, marginTop: 10 }, secondaryButton: { borderColor: C.line, borderWidth: 1, borderRadius: 12, minHeight: 42, paddingHorizontal: 13, justifyContent: 'center', alignItems: 'center', marginTop: 10 }, secondaryText: { color: C.teal, fontSize: 11, fontWeight: '800' }, completeButton: { flex: 1, marginTop: 0 }, recapLine: { color: C.ink, fontSize: 9, lineHeight: 14, marginTop: 7 }, previewNote: { color: C.muted, fontSize: 9, marginTop: 9 },
  count: { color: C.teal, fontSize: 10, fontWeight: '700' }, searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.white, borderRadius: 12, borderColor: C.line, borderWidth: 1, paddingHorizontal: 11, height: 42 }, search: { flex: 1, color: C.ink, fontSize: 12 }, categoryRow: { gap: 6, paddingVertical: 10 }, category: { borderColor: C.line, borderWidth: 1, borderRadius: 99, paddingHorizontal: 11, paddingVertical: 7, backgroundColor: C.white }, categorySelected: { backgroundColor: C.teal, borderColor: C.teal }, categoryText: { color: C.ink, fontSize: 9, fontWeight: '700' }, categoryTextSelected: { color: C.white }, exerciseList: { backgroundColor: C.white, borderRadius: 16, borderColor: C.line, borderWidth: 1, paddingHorizontal: 11 }, libraryItem: { minHeight: 52, borderBottomWidth: 1, borderBottomColor: '#EEF2EF', flexDirection: 'row', alignItems: 'center', gap: 8 }, historyCard: { backgroundColor: C.white, borderColor: C.line, borderWidth: 1, borderRadius: 15, padding: 12, marginTop: 14 }, historyLine: { color: C.muted, fontSize: 9, lineHeight: 15, marginTop: 6 }, prescriptionSmall: { color: C.teal, fontSize: 8, fontWeight: '800' }, safety: { backgroundColor: '#F0F4F1', borderRadius: 13, padding: 11, marginTop: 14 }, safetyText: { color: C.muted, fontSize: 9, lineHeight: 14, textAlign: 'center' },
});
