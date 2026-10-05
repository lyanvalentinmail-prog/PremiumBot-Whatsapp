import { command } from '../_helpers.js';
import { config } from '../../config.js';
import { getMentions, jidToMention, formatUptime } from '../../lib/utils.js';
import { getOrCreateUser, userLeaderboard } from '../../database/users.js';

const targetUser = async (ctx) => getOrCreateUser(getMentions(ctx.message)[0] || ctx.sender);

export default [
  command({ name: 'info', aliases: ['botinfo'], description: 'Información del bot.', category: 'info', execute: (ctx) => ctx.reply(`🤖 *${config.botName}*\nVersión: ${config.botVersion}\nPrefijo: ${config.prefix}\nModo: ${config.botMode}\nComandos cargados: ${ctx.registry.commands.length}`) }),
  command({ name: 'user', aliases: ['userinfo'], args: '[@usuario]', description: 'Consulta información de un usuario local.', category: 'info', execute: async (ctx) => { const user = await targetUser(ctx); return ctx.reply(`👤 ${user.name}\n⭐ Nivel ${user.level} · ${user.xp} XP\n💰 ${user.balance} monedas`); } }),
  command({ name: 'groupinfo', description: 'Muestra información del grupo actual.', category: 'info', group: true, execute: (ctx) => ctx.reply(`👥 *${ctx.groupMetadata.subject}*\n👤 Participantes: ${ctx.groupMetadata.participants.length}\n🆔 ${ctx.chat}`) }),
  command({ name: 'admins', description: 'Lista los administradores del grupo.', category: 'info', group: true, execute: (ctx) => { const admins = ctx.groupMetadata.participants.filter((p) => p.admin).map((p) => jidToMention(p.id)); return ctx.reply(`🛡️ Administradores:\n${admins.join('\n') || 'No encontrados.'}`, { mentions: ctx.adminJids }); } }),
  command({ name: 'ownerinfo', description: 'Muestra al propietario configurado.', category: 'info', execute: (ctx) => ctx.reply(`⛩️ Propietario: *${config.ownerName}*${config.owners[0] ? `\n📱 @${config.owners[0]}` : '\n⚠️ OWNER_NUMBER no está configurado.'}`, { mentions: config.owners.map((number) => `${number}@s.whatsapp.net`) }) }),
  command({ name: 'version', description: 'Muestra la versión.', category: 'info', execute: (ctx) => ctx.reply(`🏮 ${config.botName} v${config.botVersion}`) }),
  command({ name: 'stats', args: '[@usuario]', description: 'Muestra estadísticas de actividad.', category: 'info', execute: async (ctx) => { const user = await targetUser(ctx); return ctx.reply(`📊 *${user.name}*\nXP: ${user.xp}\nNivel: ${user.level}\nSaldo: ${user.balance}\nActivo del bot: ${formatUptime((Date.now() - ctx.startedAt) / 1000)}`); } })
];
