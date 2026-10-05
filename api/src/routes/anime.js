import { fetchJson } from '../services/http.js';
import { assert, success } from '../utils/response.js';
import { cached } from '../utils/cache.js';

const query = (request) => String(request.query?.q || '').trim();
const compact = (item) => ({ id: item.mal_id, title: item.title, titleEnglish: item.title_english, score: item.score, type: item.type, url: item.url, image: item.images?.jpg?.image_url });
const quotes = [
  { quote: 'La lección sin dolor no tiene sentido.', author: 'Edward Elric — Fullmetal Alchemist' },
  { quote: 'El poder viene en respuesta a una necesidad, no a un deseo.', author: 'Goku — Dragon Ball Z' },
  { quote: 'Si no tomas riesgos, no puedes crear un futuro.', author: 'Monkey D. Luffy — One Piece' }
];

export default async function animeRoutes(app, options) {
  const creator = options.creator;
  app.get('/search', async (request) => {
    const q = query(request); assert(q, 'VALIDATION_ERROR', 'El parámetro q es obligatorio.');
    const data = await cached(`anime:${q}`, 60_000, () => fetchJson(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=5`));
    return success({ items: (data.data || []).map(compact) }, creator);
  });
  app.get('/info', async (request) => {
    const id = Number(request.query?.id); assert(Number.isInteger(id) && id > 0, 'VALIDATION_ERROR', 'El parámetro id debe ser un entero positivo.');
    const data = await cached(`anime-info:${id}`, 60_000, () => fetchJson(`https://api.jikan.moe/v4/anime/${id}/full`));
    return success({ ...compact(data.data), synopsis: data.data.synopsis, episodes: data.data.episodes, status: data.data.status, genres: data.data.genres?.map((genre) => genre.name) || [] }, creator);
  });
  app.get('/character', async (request) => {
    const q = query(request); assert(q, 'VALIDATION_ERROR', 'El parámetro q es obligatorio.');
    const data = await cached(`character:${q}`, 60_000, () => fetchJson(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(q)}&limit=5`));
    return success({ items: (data.data || []).map((item) => ({ id: item.mal_id, name: item.name, favorites: item.favorites, url: item.url, image: item.images?.jpg?.image_url })) }, creator);
  });
  app.get('/waifu', async () => {
    const data = await fetchJson('https://api.waifu.pics/sfw/waifu');
    return success({ url: data.url }, creator);
  });
  app.get('/quote', async () => success(quotes[Math.floor(Math.random() * quotes.length)], creator));
}
