import { supabase, getUid } from '../lib/supabase.js';

export async function submitFeedback({ message, rating, category, pageUrl }) {
  const uid = await getUid();
  const { error } = await supabase.from('feedback').insert({
    user_id:  uid,
    message:  message.trim(),
    rating:   rating ?? null,
    category: category ?? null,
    page_url: pageUrl ?? window.location.pathname,
  });
  if (error) throw error;
}
