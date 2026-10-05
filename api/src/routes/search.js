import { config } from '../config.js';
import { fetchJson } from '../services/http.js';
import { ApiError, assert, success } from '../utils/response.js';
import { cached } from '../utils/cache.js';

const requiredQuery = (request) => { const q = String(request.query?.q || '').trim(); assert(q, 'VALIDATION_ERROR', 'El parámetro q es obligatorio.'); return q; };
const missing = () => { throw new ApiError('PROVIDER_NOT_CONFIGURED', 'Este servicio no está configurado.', 503); };
export default async function searchRoutes(app, options) {
  const creator = options.creator;
  app.get('/google', async (request) => {
    const q = requiredQuery(request); if (!config.googleCseKey || !config.googleCseId) missing();
    const endpoint = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(config.googleCseKey)}&cx=${encodeURIComponent(config.googleCseId)}&q=${encodeURIComponent(q)}`;
    const data = await fetchJson(endpoint); return success({ items: (data.items || []).map((item) => ({ title: item.title, url: item.link, snippet: item.snippet })) }, creator);
  });
  app.get('/youtube', async (request) => {
    const q = requiredQuery(request); if (!config.youtubeKey) missing();
    const endpoint = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(q)}&key=${encodeURIComponent(config.youtubeKey)}`;
    const data = await fetchJson(endpoint); return success({ items: (data.items || []).map((item) => ({ title: item.snippet.title, url: `https://www.youtube.com/watch?v=${item.id.videoId}`, snippet: item.snippet.description })) }, creator);
  });
  app.get('/images', async (request) => {
    const q = requiredQuery(request); if (!config.googleCseKey || !config.googleCseId) missing();
    const endpoint = `https://www.googleapis.com/customsearch/v1?searchType=image&key=${encodeURIComponent(config.googleCseKey)}&cx=${encodeURIComponent(config.googleCseId)}&q=${encodeURIComponent(q)}`;
    const data = await fetchJson(endpoint); return success({ items: (data.items || []).map((item) => ({ title: item.title, url: item.link, thumbnail: item.image?.thumbnailLink })) }, creator);
  });
  app.get('/lyrics', async (request) => {
    const q = requiredQuery(request); if (!config.geniusToken) missing();
    const data = await fetchJson(`https://api.genius.com/search?q=${encodeURIComponent(q)}`, { headers: { authorization: `Bearer ${config.geniusToken}` } });
    return success({ items: (data.response?.hits || []).slice(0, 5).map((hit) => ({ title: hit.result.full_title, url: hit.result.url, snippet: 'Consulta la letra en la fuente oficial enlazada.' })) }, creator);
  });
  app.get('/wikipedia', async (request) => {
    const q = requiredQuery(request);
    const data = await cached(`wiki:${q}`, 60_000, () => fetchJson(`https://en.wikipedia.org/w/rest.php/v1/search/title?q=${encodeURIComponent(q)}&limit=5`));
    return success({ items: (data.pages || []).map((item) => ({ title: item.title, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.key)}`, snippet: item.excerpt?.replace(/<[^>]*>/g, '') || '' })) }, creator);
  });
  app.get('/github', async (request) => {
    const q = requiredQuery(request);
    const data = await fetchJson(`https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&per_page=5`, { headers: { 'user-agent': 'PremiumBot' } });
    return success({ items: (data.items || []).map((item) => ({ title: item.full_name, url: item.html_url, snippet: item.description || '' })) }, creator);
  });
  app.get('/npm', async (request) => {
    const q = requiredQuery(request);
    const data = await fetchJson(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(q)}&size=5`);
    return success({ items: (data.objects || []).map((item) => ({ title: item.package.name, url: `https://www.npmjs.com/package/${encodeURIComponent(item.package.name)}`, snippet: item.package.description || '' })) }, creator);
  });
}
