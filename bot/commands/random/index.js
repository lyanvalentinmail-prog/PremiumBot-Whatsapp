import { command, choose } from '../_helpers.js';
import { randomInt } from '../../lib/utils.js';

const facts = ['Los pulpos tienen tres corazones.', 'Una vuelta completa de la Tierra dura aproximadamente 365.24 días.', 'La miel bien conservada puede durar muchísimo tiempo.'];
const countries = ['Argentina', 'Chile', 'Colombia', 'España', 'México', 'Perú', 'Uruguay'];
export default [
  command({ name: 'randomnumber', description: 'Genera un número aleatorio.', category: 'random', execute: (ctx) => ctx.reply(`🔢 ${randomInt(1, 100)}`) }),
  command({ name: 'randomuser', description: 'Genera un nombre ficticio.', category: 'random', execute: (ctx) => ctx.reply(`👤 ${choose(['Luna', 'Alex', 'Sam', 'Nora', 'Kai'])} ${choose(['Rivera', 'Soto', 'Vega', 'Mora'])}`) }),
  command({ name: 'randomcolor', description: 'Genera un color hexadecimal.', category: 'random', execute: (ctx) => { const color = `#${randomInt(0, 0xFFFFFF).toString(16).padStart(6, '0')}`; return ctx.reply(`🎨 ${color}`); } }),
  command({ name: 'randomfact', description: 'Envía un dato aleatorio.', category: 'random', execute: (ctx) => ctx.reply(`💡 ${choose(facts)}`) }),
  command({ name: 'randomquote', description: 'Envía una cita aleatoria.', category: 'random', execute: (ctx) => ctx.reply(`❝ ${choose(['Respira, avanza y aprende.', 'Cada día puede ser un comienzo.', 'La curiosidad abre caminos.'])} ❞`) }),
  command({ name: 'randomanime', description: 'Sugiere un anime conocido.', category: 'random', execute: (ctx) => ctx.reply(`🎌 ${choose(['Fullmetal Alchemist: Brotherhood', 'Frieren', 'Mob Psycho 100', 'Haikyuu!!'])}`) }),
  command({ name: 'randomcountry', description: 'Elige un país al azar.', category: 'random', execute: (ctx) => ctx.reply(`🗺️ ${choose(countries)}`) }),
  command({ name: 'randomemoji', description: 'Envía un emoji aleatorio.', category: 'random', execute: (ctx) => ctx.reply(choose(['🎌', '🍙', '🎲', '✨', '🗺️', '🌙', '🎵'])) })
];
