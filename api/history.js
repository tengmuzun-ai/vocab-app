import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
async function userFrom(req) { const token = req.headers.authorization?.replace(/^Bearer\s+/i, ''); if (!token) return null; const { data } = await supabase.auth.getUser(token); return data?.user || null; }
export default async function handler(req, res) {
  const user = await userFrom(req); if (!user) return res.status(401).json({ error: 'ログインが必要です' });
  if (req.method === 'GET') { const { data, error } = await supabase.from('search_history').select('*').eq('user_id', user.id).order('searched_at', { ascending: false }).limit(100); if (error) return res.status(500).json({ error: error.message }); return res.status(200).json({ history: data || [] }); }
  if (req.method === 'POST') { const { word, meanings, example_sentence } = req.body || {}; if (!word) return res.status(400).json({ error: 'word is required' }); const { data, error } = await supabase.from('search_history').insert([{ user_id: user.id, word, meanings: meanings || [], example_sentence: example_sentence || null }]).select().single(); if (error) return res.status(500).json({ error: error.message }); return res.status(200).json({ history: data }); }
  return res.status(405).json({ error: 'Method not allowed' });
}
