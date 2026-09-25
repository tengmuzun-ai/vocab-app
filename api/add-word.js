import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { word, reading, meaning, source_note } = req.body;

  if (!word || !meaning) {
    return res.status(400).json({ error: 'word and meaning are required' });
  }

  const { data, error } = await supabase
    .from('words')
    .insert([{ word, reading, meaning, source_note }])
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true, data });
}