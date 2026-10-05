import { command, requireText } from '../_helpers.js';
import { updateGroup, ensureGroup } from '../../database/users.js';
import { getMentions, jidToMention } from '../../lib/utils.js';

const toggle = (field, name) => command({ name, description: `Activa o desactiva ${name} en este grupo.`, category: 'panel', admin: true, group: true, args: '<on|off>', execute: async (ctx) => { const value = ctx.args[0]?.toLowerCase(); if (!['on', 'off'].includes(value)) throw Object.assign(new Error(`Usa ${ctx.prefix}${field} on u off.`), { code: 'MISSING_ARGUMENT' }); await updateGroup(ctx.chat, { [field]: value === 'on' ? 1 : 0 }); return ctx.reply(`⚙️ ${name}: ${value === 'on' ? 'activado' : 'desactivado'}.`); } });
const participant = (name, action, description) => command({ name, args: '<@usuario>', description, category: 'panel', admin: true, group: true, execute: async (ctx) => { if (!ctx.botIsAdmin) throw Object.assign(new Error('El bot necesita ser administrador para realizar esta acción.'), { code: 'BOT_NOT_ADMIN' }); const target = getMentions(ctx.message)[0]; if (!target) throw Object.assign(new Error('Menciona a un usuario.'), { code: 'MISSING_ARGUMENT' }); await ctx.socket.groupParticipantsUpdate(ctx.chat, [target], action); return ctx.reply(`✅ Acción aplicada a ${jidToMention(target)}.`, { mentions: [target] }); } });

export default [
  toggle('welcome', 'bienvenida'),
  toggle('goodbye', 'despedida'),
  toggle('antilink', 'antilink'),
  command({ name: 'setwelcome', args: '<texto>', description: 'Define el texto de bienvenida; usa @user.', category: 'panel', admin: true, group: true, execute: async (ctx) => { await updateGroup(ctx.chat, { welcome_text: requireText(ctx) }); return ctx.reply('✅ Mensaje de bienvenida actualizado.'); } }),
  command({ name: 'setgoodbye', args: '<texto>', description: 'Define el texto de despedida; usa @user.', category: 'panel', admin: true, group: true, execute: async (ctx) => { await updateGroup(ctx.chat, { goodbye_text: requireText(ctx) }); return ctx.reply('✅ Mensaje de despedida actualizado.'); } }),
  participant('kick', 'remove', 'Expulsa a un usuario mencionado.'),
  participant('promote', 'promote', 'Asciende a un usuario mencionado.'),
  participant('demote', 'demote', 'Quita administración a un usuario mencionado.')
];
