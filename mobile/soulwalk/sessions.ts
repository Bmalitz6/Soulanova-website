import type { SupabaseClient } from '@supabase/supabase-js';

// Native iOS and Android use the same existing Supabase table and auth.uid()
// row-level security rules as the SoulWalk website.
export type SoulWalkSession = {
  id: string;
  user_id: string;
  week_number: number;
  duration_minutes: number;
  distance_miles: number | null;
  steps: number | null;
  source: string;
  created_at: string;
};

export type NewSoulWalkSession = {
  week_number: number;
  duration_minutes: number;
  distance_miles?: number | null;
  steps?: number | null;
  source: 'ios' | 'android';
};

const briskMinutes = [5, 7, 9, 11, 13, 15, 18, 20, 23, 26, 28, 30] as const;
export const requiredMinutes = (week: number) => {
  if (!Number.isInteger(week) || week < 1 || week > 12) throw Error('Invalid walking week');
  return briskMinutes[week - 1] + 10;
};

export async function saveSoulWalkSession(db: SupabaseClient, session: NewSoulWalkSession) {
  const { data: auth, error: authError } = await db.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw Error('Please sign in to Soulanova.');
  if (!['ios', 'android'].includes(session.source)) throw Error('Invalid platform');
  if (!Number.isFinite(session.duration_minutes) || session.duration_minutes <= 0) throw Error('Invalid duration');
  requiredMinutes(session.week_number);
  if (session.steps != null && (!Number.isInteger(session.steps) || session.steps < 0 || session.steps > 150000)) throw Error('Invalid steps');
  if (session.distance_miles != null && (!Number.isFinite(session.distance_miles) || session.distance_miles < 0)) throw Error('Invalid distance');
  const { error } = await db.from('soulwalk_sessions').insert({
    user_id: auth.user.id,
    week_number: session.week_number,
    duration_minutes: session.duration_minutes,
    distance_miles: session.distance_miles ?? null,
    steps: session.steps ?? null,
    source: session.source,
  });
  if (error) throw error;
}

export async function getSoulWalkSessions(db: SupabaseClient, limit = 50): Promise<SoulWalkSession[]> {
  const { data: auth, error: authError } = await db.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw Error('Please sign in to Soulanova.');
  if (!Number.isInteger(limit) || limit < 1 || limit > 500) throw Error('Invalid limit');
  const { data, error } = await db.from('soulwalk_sessions')
    .select('id,user_id,week_number,duration_minutes,distance_miles,steps,source,created_at')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []) as SoulWalkSession[];
}

export function weekProgress(sessions: SoulWalkSession[]) {
  return briskMinutes.map((_, i) => {
    const week = i + 1;
    const qualifying = sessions.filter(
      s => s.week_number === week && s.duration_minutes >= requiredMinutes(week) - 0.01,
    ).length;
    return { week, qualifying, goal: 5, reached: qualifying >= 5 };
  });
}
