import { fetchJson } from '../services/http.js';
import { assert, success } from '../utils/response.js';
import { cached } from '../utils/cache.js';

export default async function mangaRoutes(app, options) {
  app.get('/search', async (request) => {
    const q = String(request.query?.q || '').trim();
    assert(q, 'VALIDATION_ERROR', 'El parámetro q es obligatorio.');
    const data = await cached(`manga:${q}`, 60_000, () => fetchJson(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(q)}&limit=5`));
    return success({ items: (data.data || []).map((item) => ({ id: item.mal_id, title: item.title, titleEnglish: item.title_english, score: item.score, type: item.type, url: item.url, image: item.images?.jpg?.image_url })) }, options.creator);
  });
}
