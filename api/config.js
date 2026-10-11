export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  return res.status(200).json({
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY
  });
}
