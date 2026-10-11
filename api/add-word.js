import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'ログインが必要です' });
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !userData?.user) return res.status(401).json({ error: 'ログインが必要です' });
  const { word, reading, meaning, source_note, source_type, source_title, source_url, note, example_sentence, history_id } = req.body || {};
  if (!String(word || '').trim() || !String(meaning || '').trim()) return res.status(400).json({ error: 'word and meaning are required' });
  const { data, error } = await supabase.from('words').insert([{ user_id: userData.user.id, word: String(word).trim(), reading: reading || null, meaning: String(meaning).trim(), source_note: source_note || null, source_type: source_type || null, source_title: source_title || null, source_url: source_url || null, note: note || null, example_sentence: example_sentence || null }]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  if (history_id) await supabase.from('search_history').update({ registered_word_id: data.id }).eq('id', history_id).eq('user_id', userData.user.id);
  return res.status(200).json({ success: true, data });
}
