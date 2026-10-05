import { command, requireText } from '../_helpers.js';

const media = (entry) => `${entry.title}${entry.titleEnglish ? ` (${entry.titleEnglish})` : ''}\n⭐ ${entry.score ?? 'N/A'} · ${entry.type || 'N/A'}\n${entry.url || ''}`;

export default [
  command({ name: 'animeinfo', args: '<nombre>', description: 'Busca anime en Jikan/MyAnimeList.', category: 'anime', limit: true, execute: async (ctx) => { const data = await ctx.api.get('/api/v1/anime/search', { q: requireText(ctx, 'un anime') }); if (!data.items.length) throw Object.assign(new Error('No se encontraron animes.'), { code: 'NOT_FOUND' }); return ctx.reply(`🎌 ${media(data.items[0])}`); } }),
  command({ name: 'mangainfo', args: '<nombre>', description: 'Busca manga en Jikan/MyAnimeList.', category: 'anime', limit: true, execute: async (ctx) => { const data = await ctx.api.get('/api/v1/manga/search', { q: requireText(ctx, 'un manga') }); if (!data.items.length) throw Object.assign(new Error('No se encontraron mangas.'), { code: 'NOT_FOUND' }); return ctx.reply(`📚 ${media(data.items[0])}`); } }),
  command({ name: 'character', args: '<nombre>', description: 'Busca personajes de anime públicos.', category: 'anime', limit: true, execute: async (ctx) => { const data = await ctx.api.get('/api/v1/anime/character', { q: requireText(ctx, 'un personaje') }); if (!data.items.length) throw Object.assign(new Error('No se encontraron personajes.'), { code: 'NOT_FOUND' }); const item = data.items[0]; return ctx.reply(`✨ *${item.name}*\nFavoritos: ${item.favorites ?? 'N/A'}\n${item.url}`); } }),
  command({ name: 'waifu', description: 'Envía una imagen aleatoria segura para el trabajo.', category: 'anime', limit: true, execute: async (ctx) => { const data = await ctx.api.get('/api/v1/anime/waifu'); return ctx.reply({ image: { url: data.url }, caption: '✿ Waifu aleatoria (SFW).' }); } }),
  command({ name: 'animequote', description: 'Envía una cita aleatoria de anime.', category: 'anime', execute: async (ctx) => { const data = await ctx.api.get('/api/v1/anime/quote'); return ctx.reply(`❝ ${data.quote}\n— ${data.author}`); } })
];
