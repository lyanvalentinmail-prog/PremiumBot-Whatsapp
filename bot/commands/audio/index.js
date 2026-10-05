import { command } from '../_helpers.js';
import { transformQuotedMedia } from '../../lib/media.js';

const audio = (name, description, filters = [], args = '') => command({ name, args, description, category: 'audio', execute: async (ctx) => { const result = await transformQuotedMedia(ctx, { outputExtension: 'mp3', outputKind: 'audio', argsBuilder: () => ['-vn', ...(filters.length ? ['-af', filters.join(',')] : []), '-codec:a', 'libmp3lame', '-q:a', '3'] }); return ctx.reply({ audio: result.data, mimetype: 'audio/mpeg', ptt: false }); } });

export default [
  audio('bass', 'Aumenta bajos del audio citado.', ['bass=g=8']),
  audio('nightcore', 'Acelera y sube el tono del audio citado.', ['asetrate=44100*1.25,aresample=44100']),
  audio('slow', 'Hace más lento el audio citado.', ['atempo=0.8']),
  audio('speed', 'Acelera el audio citado.', ['atempo=1.25']),
  audio('volume', 'Aumenta volumen del audio citado.', ['volume=1.5']),
  command({ name: 'trim', description: 'Recorta los primeros 30 segundos del audio citado.', category: 'audio', execute: async (ctx) => { const result = await transformQuotedMedia(ctx, { outputExtension: 'mp3', outputKind: 'audio', argsBuilder: () => ['-t', '30', '-vn', '-codec:a', 'libmp3lame', '-q:a', '3'] }); return ctx.reply({ audio: result.data, mimetype: 'audio/mpeg' }); } }),
  audio('mp3', 'Convierte el medio citado a MP3.')
];
