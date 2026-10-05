import fs from 'node:fs/promises';
import { config } from '../config.js';
import { formatUptime } from './utils.js';
import { permissionMarker } from './permissions.js';

export const categories = Object.freeze({
  main: { title: '◈ MAIN', decoration: '◈ ᴍᴀɪɴ' },
  info: { title: 'ⓘ INFO', decoration: 'ⓘ ɪɴꜰᴏ' },
  fun: { title: '♢ FUN', decoration: '♢ ꜰᴜɴ' },
  tools: { title: '⚒ TOOLS', decoration: '⚒ ᴛᴏᴏʟꜱ' },
  internet: { title: '◎ INTERNET', decoration: '◎ ɪɴᴛᴇʀɴᴇᴛ' },
  stalk: { title: '◉ STALK', decoration: '◉ ꜱᴛᴀʟᴋ' },
  anime: { title: '✿ ANIME', decoration: '✿ ᴀɴɪᴍᴇ' },
  game: { title: '♟ GAME', decoration: '♟ ɢᴀᴍᴇ' },
  rpg: { title: '⚔ RPG', decoration: '⚔ ʀᴘɢ' },
  xp: { title: '★ XP', decoration: '★ xᴘ' },
  ai: { title: '◇ AI', decoration: '◇ ᴀɪ' },
  audio: { title: '♫ AUDIO', decoration: '♫ ᴀᴜᴅɪᴏ' },
  downloader: { title: '⇩ DOWNLOADER', decoration: '⇩ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ' },
  image: { title: '▣ IMAGE', decoration: '▣ ɪᴍᴀɢᴇ' },
  maker: { title: '✎ MAKER', decoration: '✎ ᴍᴀᴋᴇʀ' },
  panel: { title: '⚙ PANEL', decoration: '⚙ ᴘᴀɴᴇʟ' },
  quotes: { title: '❝ QUOTES', decoration: '❝ ǫᴜᴏᴛᴇꜱ' },
  quran: { title: '۞ QURAN', decoration: '۞ ǫᴜʀᴀɴ' },
  random: { title: '⟳ RANDOM', decoration: '⟳ ʀᴀɴᴅᴏᴍ' },
  search: { title: '⌕ SEARCH', decoration: '⌕ ꜱᴇᴀʀᴄʜ' },
  sound: { title: '♪ SOUND', decoration: '♪ ꜱᴏᴜɴᴅ' },
  sticker: { title: '◩ STICKER', decoration: '◩ ꜱᴛɪᴄᴋᴇʀ' },
  store: { title: '♜ STORE', decoration: '♜ ꜱᴛᴏʀᴇ' },
  voice: { title: '♬ VOICE', decoration: '♬ ᴠᴏɪᴄᴇ' },
  owner: { title: '♛ OWNER', decoration: '♛ ᴏᴡɴᴇʀ' }
});

const stylize = (value = '') => {
  const map = { a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ', i: 'ɪ', j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ', s: 'ꜱ', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ' };
  return String(value).replace(/[a-z]/gi, (char) => map[char.toLowerCase()] || char);
};

export function categoryMenu(commands, category) {
  const normalized = String(category || '').toLowerCase();
  const details = categories[normalized];
  if (!details) return null;
  const list = commands.filter((command) => command.category === normalized).sort((a, b) => a.name.localeCompare(b.name));
  const lines = list.map((command) => `┊ ✿ ${config.prefix}${stylize(command.name)}${command.args ? ` ${stylize(command.args)}` : ''}${permissionMarker(command)}`);
  return [`୨୧ ❏ ${details.decoration}`, ...lines, '୨୧', '', `ᴛᴏᴛᴀʟ : ${list.length} ꜰɪᴛᴜʀ`, 'Ⓟ ᴘʀᴇᴍɪᴜᴍ  Ⓛ ʟɪᴍɪᴛ  Ⓞ ᴏᴡɴᴇʀ  Ⓐ ᴀᴅᴍɪɴ'].join('\n');
}

export function categoryList(commands) {
  return ['📚 *Categorías disponibles*', ...Object.entries(categories).map(([key, value]) => {
    const total = commands.filter((command) => command.category === key).length;
    return `• ${value.title} (${total}) → ${config.prefix}menu ${key}`;
  }), '', `También puedes usar ${config.prefix}commands o ${config.prefix}help <comando>.`].join('\n');
}

export function mainMenu({ userName, commandCount, startedAt }) {
  const mode = config.botMode === 'public' ? 'PÚBLICO' : 'PRIVADO';
  return `¡Hola, *${userName}* 🎌\n\n*${config.botName}* está listo para acompañarte durante el día 🎐\n\n¡Toca el botón de abajo y elige una opción del menú!\n\n╭──( *${config.botName}* )\n║🎌 Nombre del bot ☇ *${config.botName}*\n│⛩️ Propietario ☇ *${config.ownerName}*\n║🏮 Versión ☇ *${config.botVersion}*\n│🍡 Modo ☇ *${mode}*\n║🎴 Estado ☇ *Online*\n│🎐 Tiempo activo ☇ *${formatUptime((Date.now() - startedAt) / 1000)}*\n║🍙 Usuario ☇ *${userName}*\n│🎋 Prefijo ☇ *${config.prefix}*\n║🗾 Total de comandos ☇ *${commandCount}*\n╰━━━━━━━━━━━━━━━━━━━⬣`;
}

export async function sendMainMenu(context) {
  const caption = mainMenu({ userName: context.user.name, commandCount: context.registry.commands.length, startedAt: context.startedAt });
  const hasBanner = await fs.access(config.bannerPath).then(() => true).catch(() => false);
  if (hasBanner) {
    // Always deliver the required banner first. Interactive support is a second, optional message.
    await context.reply({ image: { url: config.bannerPath }, caption });
  } else {
    await context.reply(caption);
  }
  try {
    // Legacy reply buttons are still accepted by compatible WhatsApp clients; text navigation remains the durable fallback.
    await context.reply({ text: 'Elige una categoría:', buttons: [{ buttonId: `${config.prefix}menu list`, buttonText: { displayText: '📚 VER LISTA DE COMANDOS' }, type: 1 }], headerType: 1 });
  } catch {
    // A client/server may reject legacy interactive messages. Never remove text navigation.
    await context.reply(`📚 VER LISTA DE COMANDOS: ${config.prefix}menu list`);
  }
}
