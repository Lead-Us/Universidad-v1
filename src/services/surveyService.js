import { supabase, getUid } from '../lib/supabase.js';

export async function getLastSurveyAt(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('last_survey_at')
    .eq('id', userId)
    .single();
  return data?.last_survey_at ?? null;
}

export async function submitSurvey({ score, comment = '' }) {
  const uid = await getUid();
  const now = new Date().toISOString();

  const { error: insertErr } = await supabase
    .from('user_surveys')
    .insert({ user_id: uid, score, comment });
  if (insertErr) throw insertErr;

  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ last_survey_at: now })
    .eq('id', uid);
  if (updateErr) throw updateErr;

  return now;
}
