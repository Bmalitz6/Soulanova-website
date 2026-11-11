import {bounded,requireMember} from '/app/member-data.mjs';
// Existing member-owned table only. No service-role credentials, migrations or anonymous writes.
export async function saveMemberWalk(db,record,isCurrent=()=>true){
 const user=await requireMember(db,record.user_id);
 if(user.is_anonymous||!isCurrent())throw Error('Your account changed. Sign in before saving.');
 const result=await bounded(signal=>db.from('soulwalk_sessions').insert(record).abortSignal(signal));
 if(result.error&&result.error.code!=='23505')throw result.error;
 await requireMember(db,record.user_id);
 if(!isCurrent())throw Error('Your account changed. Save outcome must be checked in the original account.');
 const check=await bounded(signal=>db.from('soulwalk_sessions').select('id,user_id,duration_minutes').eq('id',record.id).eq('user_id',record.user_id).abortSignal(signal));
 if(check.error)throw check.error;
 const saved=check.data?.find(row=>row.id===record.id&&row.user_id===record.user_id);
 if(!saved||Math.abs(Number(saved.duration_minutes)-record.duration_minutes)>1e-8)throw Error('Save is not confirmed. Retry this same walk to check safely.');
 return saved;
}
