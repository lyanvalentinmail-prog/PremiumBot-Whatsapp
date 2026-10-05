import { command, choose, requireText } from '../_helpers.js';
import { getMentions, jidToMention, randomInt } from '../../lib/utils.js';

const jokes = ['¿Por qué el bot fue a la escuela? Para mejorar sus *bytes*.', 'No discuto con Wi-Fi: cuando se va, pierdo la conexión.', 'Un bug entra a un bar. El bar deja de responder.'];

export default [
  command({ name: 'joke', aliases: ['chiste'], description: 'Envía un chiste.', category: 'fun', execute: (ctx) => ctx.reply(`😄 ${choose(jokes)}`) }),
  command({ name: 'ship', args: '<@usuario1> <@usuario2>', description: 'Calcula una compatibilidad al azar.', category: 'fun', execute: (ctx) => { const people = getMentions(ctx.message); if (people.length < 2) throw Object.assign(new Error('Menciona a dos usuarios.'), { code: 'MISSING_ARGUMENT' }); const value = randomInt(1, 100); return ctx.reply(`💘 ${jidToMention(people[0])} + ${jidToMention(people[1])}\nCompatibilidad: *${value}%*`, { mentions: people }); } }),
  command({ name: 'rate', args: '<texto/@usuario>', description: 'Puntúa algo del 1 al 10.', category: 'fun', execute: (ctx) => ctx.reply(`⭐ ${requireText(ctx, 'algo para puntuar')}: *${randomInt(1, 10)}/10*`) }),
  command({ name: '8ball', aliases: ['bola8'], args: '<pregunta>', description: 'Consulta la bola mágica.', category: 'fun', execute: (ctx) => { requireText(ctx, 'una pregunta'); return ctx.reply(`🎱 ${choose(['Sí.', 'No.', 'Probablemente.', 'Pregunta más tarde.', 'No cuentes con ello.'])}`); } }),
  command({ name: 'choose', aliases: ['elige'], args: '<opciones>', description: 'Elige entre opciones separadas por |.', category: 'fun', execute: (ctx) => { const options = requireText(ctx, 'opciones').split('|').map((item) => item.trim()).filter(Boolean); if (options.length < 2) throw Object.assign(new Error('Separa al menos dos opciones con |.'), { code: 'INVALID_OPTIONS' }); return ctx.reply(`🎯 Elijo: *${choose(options)}*`); } }),
  command({ name: 'reverse', aliases: ['reversa'], args: '<texto>', description: 'Invierte un texto.', category: 'fun', execute: (ctx) => ctx.reply([...requireText(ctx)].reverse().join('')) })
];
