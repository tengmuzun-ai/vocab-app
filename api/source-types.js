import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
async function userFrom(req) { const token = req.headers.authorization?.replace(/^Bearer\s+/i, ''); if (!token) return null; const { data } = await supabase.auth.getUser(token); return data?.user || null; }
const defaults = ['YouTube', '洋楽', '海外ドラマ', '映画', 'ポッドキャスト', 'その他'];
export default async function handler(req, res) {
  const user = await userFrom(req); if (!user) return res.status(401).json({ error: 'ログインが必要です' });
  if (req.method === 'GET') { let { data, error } = await supabase.from('source_types').select('*').eq('user_id', user.id).order('created_at'); if (error) return res.status(500).json({ error: error.message }); if (!data?.length) { await supabase.from('source_types').insert(defaults.map(name => ({ user_id: user.id, name }))); const result = await supabase.from('source_types').select('*').eq('user_id', user.id).order('created_at'); data = result.data || []; } return res.status(200).json({ source_types: data }); }
  if (req.method === 'POST') { const name = String(req.body?.name || '').trim(); if (!name) return res.status(400).json({ error: 'name is required' }); const { data, error } = await supabase.from('source_types').insert([{ user_id: user.id, name }]).select().single(); if (error) return res.status(500).json({ error: error.message }); return res.status(200).json({ source_type: data }); }
  if (req.method === 'DELETE') { const id = req.query?.id; if (!id) return res.status(400).json({ error: 'id is required' }); const { error } = await supabase.from('source_types').delete().eq('id', id).eq('user_id', user.id); if (error) return res.status(500).json({ error: error.message }); return res.status(200).json({ success: true }); }
  return res.status(405).json({ error: 'Method not allowed' });
}
