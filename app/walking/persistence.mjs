import {bounded,requireMember} from '/app/member-data.mjs';
// Existing member-owned table only. No service-role credentials, migrations or anonymous writes.
const columns=['id','user_id','week_number','walk_mode','fitness_level','duration_minutes','distance_miles','distance_source','steps','steps_source','treadmill_speed_mph','treadmill_incline_percent','source'];
const numeric=new Set(['week_number','duration_minutes','distance_miles','steps','treadmill_speed_mph','treadmill_incline_percent']);
function matches(saved,record){
 return Object.entries(record).every(([key,value])=>{
  if(!columns.includes(key)||!Object.hasOwn(saved,key))return false;
  const actual=saved[key];
  if(value===null)return actual===null;
  if(numeric.has(key))return actual!==null&&actual!==''&&Number.isFinite(Number(actual))&&Number.isFinite(Number(value))&&Math.abs(Number(actual)-Number(value))<=1e-8;
  return actual===value;
 });
}
export async function saveMemberWalk(db,record,isCurrent=()=>true){
 const user=await requireMember(db,record.user_id);
 if(user.is_anonymous||!isCurrent())throw Error('Your account changed. Sign in before saving.');
 const result=await bounded(signal=>db.from('soulwalk_sessions').insert(record).abortSignal(signal));
 if(result.error&&result.error.code!=='23505')throw result.error;
 await requireMember(db,record.user_id);
 if(!isCurrent())throw Error('Your account changed. Save outcome must be checked in the original account.');
 const check=await bounded(signal=>db.from('soulwalk_sessions').select(columns.join(',')).eq('id',record.id).eq('user_id',record.user_id).abortSignal(signal));
 if(check.error)throw check.error;
 if(!isCurrent())throw Error('Your account changed. Save outcome must be checked in the original account.');
 const saved=check.data?.find(row=>row.id===record.id&&row.user_id===record.user_id);
 if(!saved)throw Error('Save is not confirmed. Retry this same walk to check safely.');
 if(!matches(saved,record))throw Error('Saved readings do not match this review. Refresh walking history to check the existing walk; changed readings were not confirmed saved.');
 return saved;
}
