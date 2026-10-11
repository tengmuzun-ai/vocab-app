import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'ログインが必要です' });
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !userData?.user) return res.status(401).json({ error: 'ログインが必要です' });
  const { data, error } = await supabase.from('words').select('*').eq('user_id', userData.user.id).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ words: data || [] });
}
