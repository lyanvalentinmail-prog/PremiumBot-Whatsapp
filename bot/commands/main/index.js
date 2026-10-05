import { command } from '../_helpers.js';
import { categoryList, categoryMenu, sendMainMenu } from '../../lib/menu.js';
import { formatUptime, humanDate, jidToMention, getMentions } from '../../lib/utils.js';
import { getLimitStatus } from '../../lib/limits.js';
import { getOrCreateUser, getUser } from '../../database/users.js';

export default [
  command({ name: 'menu', aliases: ['menú'], args: '[categoria]', description: 'Abre el menú principal o una categoría.', category: 'main', execute: async (ctx) => {
    const selected = ctx.args[0]?.toLowerCase();
    if (selected === 'list' || selected === 'lista') return ctx.reply(categoryList(ctx.registry.commands));
    if (selected) {
      const rendered = categoryMenu(ctx.registry.commands, selected);
      if (!rendered) throw Object.assign(new Error(`Categoría no encontrada. Usa ${ctx.prefix}menu list.`), { code: 'CATEGORY_NOT_FOUND' });
      return ctx.reply(rendered);
    }
    return sendMainMenu(ctx);
  }}),
  command({ name: 'help', aliases: ['ayuda'], args: '[comando]', description: 'Muestra ayuda de un comando.', category: 'main', execute: async (ctx) => {
    if (!ctx.args[0]) return ctx.reply(`Usa ${ctx.prefix}menu list para ver las categorías o ${ctx.prefix}help <comando>.`);
    const key = ctx.args[0].toLowerCase().replace(/^\./, '');
    const found = ctx.registry.byName.get(key);
    if (!found) throw Object.assign(new Error('Comando no encontrado.'), { code: 'COMMAND_NOT_FOUND' });
    return ctx.reply(`📖 *${ctx.prefix}${found.name}*\n${found.description}\n\nUso:\n${ctx.prefix}${found.name}${found.args ? ` ${found.args}` : ''}${found.aliases.length ? `\nAliases: ${found.aliases.map((alias) => `${ctx.prefix}${alias}`).join(', ')}` : ''}`);
  }}),
  command({ name: 'commands', aliases: ['comandos'], description: 'Lista todas las categorías.', category: 'main', execute: (ctx) => ctx.reply(categoryList(ctx.registry.commands)) }),
  command({ name: 'ping', description: 'Comprueba la latencia del bot.', category: 'main', execute: (ctx) => ctx.reply(`🏓 Pong: ${Date.now() - ctx.receivedAt} ms`) }),
  command({ name: 'status', description: 'Muestra el estado del sistema.', category: 'main', execute: async (ctx) => {
    let apiStatus = 'no disponible';
    try { apiStatus = (await ctx.api.get('/api/v1/status')).status; } catch { /* status remains useful while API starts */ }
    return ctx.reply(`🤖 Bot: Online\n🌐 API: ${apiStatus}\n📦 Base de datos: Online\n⏱️ Activo: ${formatUptime((Date.now() - ctx.startedAt) / 1000)}\n🧩 Comandos: ${ctx.registry.commands.length}`);
  }}),
  command({ name: 'profile', aliases: ['perfil'], args: '[@usuario]', description: 'Consulta un perfil local.', category: 'main', execute: async (ctx) => {
    const target = getMentions(ctx.message)[0] || ctx.sender;
    const user = await getOrCreateUser(target);
    const limits = await getLimitStatus(target);
    return ctx.reply(`👤 *${user.name}*\n🪪 ${jidToMention(target)}\n⭐ Nivel ${user.level} · ${user.xp} XP\n💰 ${user.balance} monedas\n🎟️ Límite: ${limits.remaining === Infinity ? 'ilimitado' : `${limits.remaining}/${limits.max}`}\n💎 Premium: ${user.isPremium ? `hasta ${humanDate(user.premium_end)}` : 'no'}`, { mentions: [target] });
  }}),
  command({ name: 'runtime', aliases: ['uptime'], description: 'Muestra el tiempo activo.', category: 'main', execute: (ctx) => ctx.reply(`⏱️ Tiempo activo: ${formatUptime((Date.now() - ctx.startedAt) / 1000)}`) }),
  command({ name: 'limit', aliases: ['mylimit'], description: 'Consulta tu límite diario.', category: 'main', execute: async (ctx) => {
    const status = await getLimitStatus(ctx.sender);
    return ctx.reply(status.remaining === Infinity ? '🎟️ Límite: ilimitado (owner).' : `🎟️ Límite diario: ${status.remaining}/${status.max} restante(s).`);
  }}),
  command({ name: 'premium', aliases: ['premiumstatus'], description: 'Consulta tu estado Premium.', category: 'main', execute: async (ctx) => {
    const user = await getOrCreateUser(ctx.sender);
    return ctx.reply(user.isPremium ? `💎 Premium activo hasta ${humanDate(user.premium_end)}.` : '💎 No tienes Premium activo.');
  }})
];
