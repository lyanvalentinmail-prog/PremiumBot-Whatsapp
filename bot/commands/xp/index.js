import { command } from '../_helpers.js';
import { userLeaderboard, getOrCreateUser } from '../../database/users.js';
import { getMentions, jidToMention } from '../../lib/utils.js';

const target = (ctx) => getMentions(ctx.message)[0] || ctx.sender;
const renderBoard = (title, rows, field) => `${title}\n${rows.map((row, index) => `${index + 1}. ${row.name || jidToMention(row.jid)} — ${row[field]}`).join('\n') || 'Sin datos.'}`;

export default [
  command({ name: 'xp', args: '[@usuario]', description: 'Consulta XP de un usuario.', category: 'xp', execute: async (ctx) => { const user = await getOrCreateUser(target(ctx)); return ctx.reply(`⭐ ${user.name}: ${user.xp} XP · nivel ${user.level}`); } }),
  command({ name: 'level', aliases: ['nivel'], args: '[@usuario]', description: 'Consulta el nivel.', category: 'xp', execute: async (ctx) => { const user = await getOrCreateUser(target(ctx)); return ctx.reply(`🏅 ${user.name} está en nivel ${user.level}.`); } }),
  command({ name: 'rank', args: '[@usuario]', description: 'Consulta rango global por XP.', category: 'xp', execute: async (ctx) => { const user = await getOrCreateUser(target(ctx)); const rows = await userLeaderboard('xp', 500); const rank = rows.findIndex((row) => row.jid === user.jid) + 1; return ctx.reply(`🏆 ${user.name}: puesto #${rank || 'fuera del top 500'}.`); } }),
  command({ name: 'leaderboard', aliases: ['topxp'], description: 'Muestra los diez mejores por XP.', category: 'xp', execute: async (ctx) => ctx.reply(renderBoard('🏆 *Top XP*', await userLeaderboard('xp', 10), 'xp')) }),
  command({ name: 'dailyxp', description: 'Explica el sistema de XP diario.', category: 'xp', execute: (ctx) => ctx.reply('⭐ Ganas 5 XP por actividad con un cooldown anti-spam de 45 segundos.') }),
  command({ name: 'progress', description: 'Muestra el progreso al siguiente nivel.', category: 'xp', execute: async (ctx) => { const user = await getOrCreateUser(ctx.sender); const next = user.level ** 2 * 100; return ctx.reply(`📈 Nivel ${user.level}\nXP: ${user.xp}/${next}\nFaltan: ${Math.max(0, next - user.xp)} XP`); } })
];
