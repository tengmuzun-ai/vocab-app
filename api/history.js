import { createClient } from '@supabase/supabase-js';

function getClient(req) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return { client: null, token: null };
  return {
    token,
    client: createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })
  };
}

export default async function handler(req, res) {
  const { client, token } = getClient(req);
  if (!client || !token) return res.status(401).json({ error: 'ログインが必要です' });
  const { data: userData, error: authError } = await client.auth.getUser(token);
  const user = userData?.user;
  if (authError || !user) return res.status(401).json({ error: 'ログインが必要です' });

  if (req.method === 'GET') {
    const { data, error } = await client.from('search_history').select('*').eq('user_id', user.id).order('searched_at', { ascending: false }).limit(100);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ history: data || [] });
  }
  if (req.method === 'POST') {
    const { word, meanings, example_sentence } = req.body || {};
    if (!word) return res.status(400).json({ error: 'word is required' });
    const { data, error } = await client.from('search_history').insert([{ user_id: user.id, word, meanings: meanings || [], example_sentence: example_sentence || null }]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ history: data });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
