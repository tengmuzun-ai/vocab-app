import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const { data: userData } = token ? await supabase.auth.getUser(token) : { data: {} };
  if (!userData?.user) return res.status(401).json({ error: 'ログインが必要です' });
  const { id, known } = req.body || {};
  if (!id) return res.status(400).json({ error: 'id is required' });
  const { data: current, error: fetchErr } = await supabase.from('words').select('review_count, ease_factor').eq('id', id).eq('user_id', userData.user.id).single();
  if (fetchErr) return res.status(500).json({ error: fetchErr.message });
  let review_count = Number(current.review_count || 0);
  let ease_factor = Number(current.ease_factor || 2.5);
  let nextDays;
  if (known) { review_count += 1; ease_factor = Math.min(ease_factor + 0.1, 3); nextDays = Math.max(1, Math.round(review_count * ease_factor)); }
  else { review_count = 0; ease_factor = Math.max(1.3, ease_factor - 0.2); nextDays = 1; }
  const nextReview = new Date(); nextReview.setDate(nextReview.getDate() + nextDays);
  const { error: updateErr } = await supabase.from('words').update({ review_count, ease_factor, next_review: nextReview.toISOString() }).eq('id', id).eq('user_id', userData.user.id);
  if (updateErr) return res.status(500).json({ error: updateErr.message });
  return res.status(200).json({ success: true, next_review: nextReview.toISOString() });
}
