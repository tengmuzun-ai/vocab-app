import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, known } = req.body;
  if (!id) return res.status(400).json({ error: 'id is required' });

  // 簡易SRS: 覚えた→次回間隔を延ばす、わからない→リセット
  const { data: current, error: fetchErr } = await supabase
    .from('words')
    .select('review_count, ease_factor')
    .eq('id', id)
    .single();

  if (fetchErr) return res.status(500).json({ error: fetchErr.message });

  let { review_count, ease_factor } = current;
  let nextDays;

  if (known) {
    review_count += 1;
    ease_factor = Math.min(ease_factor + 0.1, 3.0);
    nextDays = Math.max(1, Math.round(review_count * ease_factor));
  } else {
    review_count = 0;
    ease_factor = Math.max(1.3, ease_factor - 0.2);
    nextDays = 1;
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + nextDays);

  const { error: updateErr } = await supabase
    .from('words')
    .update({
      review_count,
      ease_factor,
      next_review: nextReview.toISOString()
    })
    .eq('id', id);

  if (updateErr) return res.status(500).json({ error: updateErr.message });

  return res.status(200).json({ success: true });
}