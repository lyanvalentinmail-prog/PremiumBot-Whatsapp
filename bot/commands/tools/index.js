import crypto from 'node:crypto';
import QRCode from 'qrcode';
import { command, requireText } from '../_helpers.js';

function calculate(expression) {
  const cleaned = expression.replace(/\s+/g, '');
  if (!/^[0-9+\-*/%^().]+$/.test(cleaned) || cleaned.length > 120) throw Object.assign(new Error('Operación no permitida. Usa números y + - * / % ^ ( ).'), { code: 'INVALID_EXPRESSION' });
  const tokens = cleaned.match(/\d*\.?\d+|[+\-*/%^()]/g);
  if (!tokens || tokens.join('') !== cleaned) throw Object.assign(new Error('Operación inválida.'), { code: 'INVALID_EXPRESSION' });
  let index = 0;
  const parseExpression = () => { let value = parseTerm(); while (['+', '-'].includes(tokens[index])) { const op = tokens[index++]; const right = parseTerm(); value = op === '+' ? value + right : value - right; } return value; };
  const parseTerm = () => { let value = parsePower(); while (['*', '/', '%'].includes(tokens[index])) { const op = tokens[index++]; const right = parsePower(); if ((op === '/' || op === '%') && right === 0) throw Object.assign(new Error('No puedes dividir entre cero.'), { code: 'DIVIDE_BY_ZERO' }); value = op === '*' ? value * right : op === '/' ? value / right : value % right; } return value; };
  const parsePower = () => { let value = parseAtom(); if (tokens[index] === '^') { index++; value **= parsePower(); } return value; };
  const parseAtom = () => { const token = tokens[index++]; if (token === '(') { const value = parseExpression(); if (tokens[index++] !== ')') throw Object.assign(new Error('Paréntesis sin cerrar.'), { code: 'INVALID_EXPRESSION' }); return value; } if (token === '-') return -parseAtom(); if (!token || Number.isNaN(Number(token))) throw Object.assign(new Error('Operación inválida.'), { code: 'INVALID_EXPRESSION' }); return Number(token); };
  const value = parseExpression();
  if (index !== tokens.length || !Number.isFinite(value)) throw Object.assign(new Error('Resultado inválido.'), { code: 'INVALID_EXPRESSION' });
  return value;
}

export default [
  command({ name: 'calc', args: '<operacion>', description: 'Calcula una operación matemática segura.', category: 'tools', execute: (ctx) => { const expression = requireText(ctx, 'una operación'); return ctx.reply(`🧮 ${expression} = *${calculate(expression)}*`); } }),
  command({ name: 'qr', args: '<texto>', description: 'Genera un código QR.', category: 'tools', execute: async (ctx) => { const text = requireText(ctx); const image = await QRCode.toBuffer(text, { type: 'png', width: 600, errorCorrectionLevel: 'M' }); return ctx.reply({ image, caption: '🔳 Código QR generado.' }); } }),
  command({ name: 'translate', aliases: ['traducir'], args: '<idioma> <texto>', description: 'Traduce mediante el proveedor de IA configurado.', category: 'tools', limit: true, execute: async (ctx) => { const [target, ...content] = ctx.args; const text = content.join(' '); if (!target || !text) throw Object.assign(new Error('Debes indicar idioma y texto.'), { code: 'MISSING_ARGUMENT' }); const data = await ctx.api.post('/api/v1/tools/translate', { target, text }); return ctx.reply(`🌐 *${target}*\n${data.text}`); } }),
  command({ name: 'base64', args: '<texto>', description: 'Codifica texto en Base64.', category: 'tools', execute: (ctx) => ctx.reply(Buffer.from(requireText(ctx), 'utf8').toString('base64')) }),
  command({ name: 'decode64', args: '<texto>', description: 'Decodifica texto Base64.', category: 'tools', execute: (ctx) => { const input = requireText(ctx); if (!/^[A-Za-z0-9+/]*={0,2}$/.test(input) || input.length % 4 === 1) throw Object.assign(new Error('Base64 inválido.'), { code: 'INVALID_BASE64' }); return ctx.reply(Buffer.from(input, 'base64').toString('utf8')); } }),
  command({ name: 'hash', args: '<tipo> <texto>', description: 'Calcula hash sha256, sha512 o md5.', category: 'tools', execute: (ctx) => { const [algorithm, ...parts] = ctx.args; if (!['sha256', 'sha512', 'md5'].includes(algorithm?.toLowerCase()) || !parts.length) throw Object.assign(new Error('Usa sha256, sha512 o md5 seguido de texto.'), { code: 'MISSING_ARGUMENT' }); return ctx.reply(crypto.createHash(algorithm.toLowerCase()).update(parts.join(' ')).digest('hex')); } }),
  command({ name: 'timestamp', args: '[fecha]', description: 'Convierte una fecha a timestamp.', category: 'tools', execute: (ctx) => { const value = ctx.args.length ? new Date(ctx.args.join(' ')) : new Date(); if (Number.isNaN(value.getTime())) throw Object.assign(new Error('Fecha inválida.'), { code: 'INVALID_DATE' }); return ctx.reply(`🕒 ${value.toISOString()}\nUnix: ${Math.floor(value.getTime() / 1000)}`); } }),
  command({ name: 'weather', aliases: ['clima'], args: '<ciudad>', description: 'Consulta el clima (OpenWeather).', category: 'tools', limit: true, execute: async (ctx) => { const city = requireText(ctx, 'una ciudad'); const data = await ctx.api.get('/api/v1/tools/weather', { city }); return ctx.reply(`🌦️ *${data.city}, ${data.country}*\n${data.description}\n🌡️ ${data.temperature}°C (sensación ${data.feelsLike}°C)\n💧 Humedad: ${data.humidity}%\n💨 Viento: ${data.wind} m/s`); } })
];
