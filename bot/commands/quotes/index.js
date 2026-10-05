import { command, choose } from '../_helpers.js';

const sets = {
  quote: ['La constancia supera al talento cuando el talento no es constante.', 'Haz hoy algo que tu yo futuro agradecerá.'],
  lovequote: ['Amar también es cuidar los detalles pequeños.', 'Donde hay respeto, el amor encuentra hogar.'],
  motivation: ['Un paso pequeño sigue siendo progreso.', 'La disciplina te lleva donde la motivación no alcanza.'],
  wisdom: ['Escucha para comprender, no solo para responder.', 'La experiencia es una maestra exigente.']
};
export default [
  ...Object.entries(sets).map(([name, values]) => command({ name, description: 'Envía una cita aleatoria.', category: 'quotes', execute: (ctx) => ctx.reply(`❝ ${choose(values)} ❞`) })),
  command({ name: 'dailyquote', description: 'Muestra una cita diaria determinista.', category: 'quotes', execute: (ctx) => { const values = Object.values(sets).flat(); const day = Math.floor(Date.now() / 86400000); return ctx.reply(`☀️ ${values[day % values.length]}`); } })
];
