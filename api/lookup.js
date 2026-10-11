export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const word = String(req.query?.word || '').trim();
  if (!word) return res.status(400).json({ error: 'word is required' });
  const hasJapanese = /[ぁ-んァ-ン一-龯々]/.test(word);
  const source = hasJapanese ? 'ja|en' : 'en|ja';
  try {
    const translated = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=${source}`);
    const translationJson = await translated.json();
    const translatedText = translationJson?.responseData?.translatedText || '';
    let definitions = [];
    if (!hasJapanese) {
      try {
        const dict = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
        if (dict.ok) {
          const dictJson = await dict.json();
          definitions = (dictJson || []).flatMap(entry => (entry.meanings || []).flatMap(m =>
            (m.definitions || []).slice(0, 8).map(d => ({ partOfSpeech: m.partOfSpeech || '', definition: d.definition || '', example: d.example || '' }))
          ));
        }
      } catch (_) {}
    }
    const meanings = [];
    if (translatedText) meanings.push({ label: hasJapanese ? '英語訳' : '日本語訳', text: translatedText });
    definitions.forEach(d => meanings.push({ label: d.partOfSpeech || '英語の定義', text: d.definition, example: d.example }));
    return res.status(200).json({ word, meanings, example_sentence: definitions.find(d => d.example)?.example || '' });
  } catch (error) {
    return res.status(502).json({ error: '意味検索に失敗しました', detail: error.message });
  }
}
