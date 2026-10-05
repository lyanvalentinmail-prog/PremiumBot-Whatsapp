import { command, requireText } from '../_helpers.js';

const list = (title, items) => `${title}\n${items.slice(0, 5).map((item, index) => `${index + 1}. *${item.title || item.name}*\n${item.url || item.link || ''}${item.snippet ? `\n${item.snippet}` : ''}`).join('\n\n') || 'Sin resultados.'}`;
const search = (name, endpoint, description) => command({ name, args: '<consulta>', description, category: 'search', limit: true, execute: async (ctx) => { const data = await ctx.api.get(endpoint, { q: requireText(ctx, 'una consulta') }); return ctx.reply(list(`⌕ *${name}*`, data.items)); } });

export default [
  search('google', '/api/v1/search/google', 'Busca con Google Custom Search.'),
  search('youtube', '/api/v1/search/youtube', 'Busca videos con YouTube Data API.'),
  search('wikipedia', '/api/v1/search/wikipedia', 'Busca en Wikipedia.'),
  search('github', '/api/v1/search/github', 'Busca repositorios públicos de GitHub.'),
  search('npm', '/api/v1/search/npm', 'Busca paquetes de npm.'),
  search('pinterest', '/api/v1/search/images', 'Busca imágenes mediante Google Custom Search.'),
  search('lyrics', '/api/v1/search/lyrics', 'Busca canciones en Genius.'),
  search('animesearch', '/api/v1/anime/search', 'Busca anime.'),
  search('mangasearch', '/api/v1/manga/search', 'Busca manga.'),
  search('imagesearch', '/api/v1/search/images', 'Busca imágenes con Google Custom Search.')
];
