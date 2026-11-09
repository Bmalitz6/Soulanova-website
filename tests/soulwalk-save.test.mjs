import test from 'node:test';
import assert from 'node:assert/strict';
import { requireMember } from '../app/member-data.mjs';
import { buildWalkSession, createWalkSaveHandler, parseStepCount, walkSaveErrorMessage } from '../app/walking/save.mjs';

const base = {
  id: 'walk-stable-id',
  userId: 'test-user',
  weekIndex: 3,
  mode: 'outdoor',
  fitnessLevel: 'beginner',
  durationSeconds: 1020,
  gpsMiles: 1.23456,
  stepsRaw: '4445',
  treadmillDistanceRaw: '',
  treadmillSpeedRaw: '',
  treadmillInclineRaw: ''
};

function fixture({ save = async () => {}, refreshHistory = async () => true, canSave = () => true } = {}) {
  const state = { saving: false, saved: false, message: '' };
  const entered = { ...base };
  const transitions = [];
  const handler = createWalkSaveHandler({
    canSave,
    capture: () => ({
      revision: 1,
      expectedOwner: entered.userId,
      record: buildWalkSession(entered)
    }),
    save,
    refreshHistory,
    onState: (next) => {
      Object.assign(state, next);
      transitions.push({ ...state });
    }
  });
  return { handler, state, entered, transitions };
}

test('4,445 manually entered steps validate and are preserved in the saved payload', () => {
  assert.equal(parseStepCount('4445'), 4445);
  const record = buildWalkSession(base);
  assert.equal(record.steps, 4445);
  assert.equal(record.steps_source, 'manual');
  assert.equal(record.distance_source, 'outdoor_gps');
  assert.equal(record.distance_miles, 1.235);
});

test('GPS and manual treadmill distances stay separate', () => {
  const treadmill = buildWalkSession({
    ...base,
    mode: 'treadmill',
    gpsMiles: 9.9,
    treadmillDistanceRaw: '2.25',
    treadmillSpeedRaw: '3.4',
    treadmillInclineRaw: '1.5'
  });
  assert.equal(treadmill.distance_miles, 2.25);
  assert.equal(treadmill.distance_source, 'treadmill_manual');
  assert.equal(treadmill.treadmill_speed_mph, 3.4);
  assert.equal(treadmill.treadmill_incline_percent, 1.5);
});

test('treadmill records never use GPS distance when no actual distance was entered', () => {
  const treadmill = buildWalkSession({ ...base, mode: 'treadmill', gpsMiles: 4.2 });
  assert.equal(treadmill.distance_miles, null);
  assert.equal(treadmill.distance_source, null);
});

test('invalid steps are rejected without transforming a valid manually entered count', () => {
  for (const value of ['4,445', '-1', '150001', '2.5', 'not a number']) {
    assert.throws(() => parseStepCount(value), /valid steps count/);
  }
  assert.equal(parseStepCount('4445'), 4445);
});

test('successful insert releases Save before a slow history refresh finishes', async () => {
  let resolveHistory;
  const slowHistory = new Promise((resolve) => { resolveHistory = resolve; });
  const { handler, state, transitions } = fixture({ refreshHistory: () => slowHistory });
  const operation = handler();

  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(state.saved, true);
  assert.equal(state.saving, false);
  assert.match(state.message, /Refreshing history/);
  assert.equal(transitions.some((item) => item.saving === true), true);

  resolveHistory(true);
  assert.deepEqual(await operation, { status: 'saved', historyRefreshed: true });
  assert.equal(state.saving, false);
  assert.equal(state.saved, true);
  assert.match(state.message, /personal walking history/);
});

test('expired or missing authentication failure restores Save and keeps entered steps', async () => {
  const expiredDb = { auth: { getUser: async () => ({ data: { user: null }, error: { message: 'JWT expired' } }) } };
  const { handler, state, entered } = fixture({ save: async (context) => requireMember(expiredDb, context.expectedOwner) });
  const result = await handler();
  assert.equal(result.status, 'failed');
  assert.equal(state.saving, false);
  assert.equal(state.saved, false);
  assert.equal(entered.stepsRaw, '4445');
  assert.match(state.message, /sign-in is missing or expired/i);
});

test('Supabase 403 permission failure restores Save and preserves the entered steps', async () => {
  const { handler, state, entered } = fixture({ save: async () => { throw new Error('HTTP 403: permission denied'); } });
  const result = await handler();
  assert.equal(result.status, 'failed');
  assert.equal(state.saving, false);
  assert.equal(state.saved, false);
  assert.equal(entered.stepsRaw, '4445');
  assert.match(state.message, /denied the walk insert/i);
});

test('network failure restores Save and leaves the session values available for retry', async () => {
  const { handler, state, entered } = fixture({ save: async () => { throw new Error('Network request failed'); } });
  const result = await handler();
  assert.equal(result.status, 'failed');
  assert.equal(state.saving, false);
  assert.equal(state.saved, false);
  assert.equal(entered.stepsRaw, '4445');
  assert.match(state.message, /connection failed before the save was confirmed/i);
});

test('concurrent duplicate taps submit only once and successful retry state blocks another insert', async () => {
  let finishSave;
  let insertCount = 0;
  const { handler, state } = fixture({ save: () => {
    insertCount += 1;
    return new Promise((resolve) => { finishSave = resolve; });
  } });
  const first = handler();
  const second = await handler();
  assert.deepEqual(second, { status: 'ignored' });
  assert.equal(insertCount, 1);
  finishSave();
  assert.equal((await first).status, 'saved');
  assert.equal(state.saved, true);
});

test('disabled write gate does not start a request or display a false success', async () => {
  let inserts = 0;
  const { handler, state } = fixture({ canSave: () => false, save: async () => { inserts += 1; } });
  assert.deepEqual(await handler(), { status: 'ignored' });
  assert.equal(inserts, 0);
  assert.equal(state.saving, false);
  assert.equal(state.saved, false);
});

test('an ambiguous timeout retry reuses the same walk ID and inserts one record', async () => {
  const records = new Map();
  let firstAttempt = true;
  const { handler, state, entered } = fixture({
    save: async (context) => {
      if (!records.has(context.record.id)) records.set(context.record.id, context.record);
      if (firstAttempt) {
        firstAttempt = false;
        throw new Error('Request timed out. Its outcome may be unconfirmed.');
      }
    }
  });

  assert.equal((await handler()).status, 'failed');
  assert.match(state.message, /retry is safe and reuses the same walk ID/i);
  assert.equal(entered.stepsRaw, '4445');
  assert.equal((await handler()).status, 'saved');
  assert.equal(records.size, 1);
  assert.equal([...records.keys()][0], 'walk-stable-id');
});

test('an insert schema mismatch is reported separately from permission failures', () => {
  assert.match(walkSaveErrorMessage({ code: 'PGRST204', message: 'Column walk_mode was not found' }), /table is missing a field/i);
  assert.match(walkSaveErrorMessage({ code: '42501', status: 403, message: 'permission denied' }), /denied the walk insert/i);
});

test('a history refresh failure does not relabel a successful insert as a save failure', async () => {
  const { handler, state } = fixture({ refreshHistory: async () => { throw new Error('history select denied'); } });
  assert.deepEqual(await handler(), { status: 'saved', historyRefreshed: false });
  assert.equal(state.saved, true);
  assert.equal(state.saving, false);
  assert.match(state.message, /Walk saved, but history could not refresh/);
});


test('a successful saved ID remains deduplicated even if a caller forgets its saved flag', async () => {
 let writes=0;const {handler}=fixture({save:async()=>{writes++;}});
 assert.equal((await handler()).status,'saved');assert.equal((await handler()).status,'ignored');assert.equal(writes,1);
});
test('all 72 week, level and mode payload combinations preserve 4,445 manual steps',()=>{
 const minutes=[5,7,9,11,13,15,18,20,23,26,28,30];let count=0;
 for(let weekIndex=0;weekIndex<12;weekIndex++)for(const fitnessLevel of ['beginner','intermediate','advanced'])for(const mode of ['outdoor','treadmill']){
  const row=buildWalkSession({...base,weekIndex,fitnessLevel,mode,durationSeconds:600+minutes[weekIndex]*60});
  assert.equal(row.steps,4445);assert.equal(row.fitness_level,fitnessLevel);assert.equal(row.duration_minutes,10+minutes[weekIndex]);assert.equal(Object.keys(row).length,13);if(mode==='treadmill')assert.equal(row.distance_miles,null);count++;
 }assert.equal(count,72);
});
test('a new walk saving is not unlocked by the old walk history completing',async()=>{
 let current='first',resolveOldHistory,resolveNewSave;
 const state={saving:false,saved:false};const oldHistory=new Promise(resolve=>resolveOldHistory=resolve);
 const handler=createWalkSaveHandler({canSave:()=>!state.saving,capture:()=>({record:{id:current,user_id:'a'}}),save:async context=>{if(context.record.id==='second')await new Promise(resolve=>resolveNewSave=resolve);},refreshHistory:context=>context.record.id==='first'?oldHistory:true,onState:(next,context)=>{if(context.record.id===current)Object.assign(state,next);}});
 const first=handler();await new Promise(resolve=>setImmediate(resolve));assert.equal(state.saving,false);current='second';state.saved=false;const second=handler();assert.equal(state.saving,true);resolveOldHistory(true);await first;assert.equal(state.saving,true);resolveNewSave();await second;assert.equal(state.saving,false);assert.equal(state.saved,true);
});
