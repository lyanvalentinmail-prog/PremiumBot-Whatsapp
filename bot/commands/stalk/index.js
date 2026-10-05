import { command, requireText } from '../_helpers.js';

export default [
  command({ name: 'githubstalk', args: '<usuario>', description: 'Consulta un perfil público de GitHub.', category: 'stalk', limit: true, execute: async (ctx) => { const username = requireText(ctx, 'un usuario de GitHub'); const data = await ctx.api.get('/api/v1/stalk/github', { username }); return ctx.reply(`🐙 *${data.login}*\n${data.name || 'Sin nombre'}\nSeguidores: ${data.followers} · Siguiendo: ${data.following}\nRepos públicos: ${data.publicRepos}\n${data.url}`); } }),
  command({ name: 'robloxstalk', args: '<usuario>', description: 'Consulta un perfil público de Roblox.', category: 'stalk', limit: true, execute: async (ctx) => { const username = requireText(ctx, 'un usuario de Roblox'); const data = await ctx.api.get('/api/v1/stalk/roblox', { username }); return ctx.reply(`🎮 *${data.name}* (@${data.displayName})\nID: ${data.id}\nCreado: ${data.created}\n${data.description || 'Sin descripción'}`); } })
];
