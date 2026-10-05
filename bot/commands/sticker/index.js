import { command } from '../_helpers.js';
import { transformQuotedMedia, quotedMediaType } from '../../lib/media.js';

const sticker = (name, description) => command({ name, description, category: 'sticker', execute: async (ctx) => { const result = await transformQuotedMedia(ctx, { outputExtension: 'webp', outputKind: 'sticker', argsBuilder: () => ['-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:-1:-1:color=0x00000000', '-vcodec', 'libwebp', '-lossless', '0', '-q:v', '70', '-loop', '0', '-an', '-vsync', '0'] }); return ctx.reply({ sticker: result.data }); } });
export default [
  sticker('sticker', 'Convierte medio citado a sticker.'),
  sticker('s', 'Alias corto para crear sticker.'),
  sticker('take', 'Crea una copia del sticker citado.'),
  command({ name: 'toimg', description: 'Convierte un sticker citado a JPG.', category: 'sticker', execute: async (ctx) => { const result = await transformQuotedMedia(ctx, { outputExtension: 'jpg', outputKind: 'image', argsBuilder: () => ['-frames:v', '1', '-q:v', '3'] }); return ctx.reply({ image: result.data, caption: '🖼️ Sticker convertido.' }); } }),
  command({ name: 'togif', description: 'Convierte sticker o video citado a GIF.', category: 'sticker', execute: async (ctx) => { const result = await transformQuotedMedia(ctx, { outputExtension: 'gif', outputKind: 'video', argsBuilder: () => ['-t', '10', '-vf', 'fps=12,scale=320:-1:flags=lanczos'] }); return ctx.reply({ video: result.data, gifPlayback: true, caption: '🎞️ GIF creado.' }); } }),
  sticker('circle', 'Crea un sticker cuadrado preparado para recorte circular.'),
  command({ name: 'emojimix', args: '<emoji1> <emoji2>', description: 'Mezcla emojis cuando se configure un proveedor compatible.', category: 'sticker', execute: () => { throw Object.assign(new Error('No hay un proveedor oficial configurado para Emoji Mix.'), { code: 'FEATURE_UNAVAILABLE' }); } }),
  command({ name: 'stickerinfo', description: 'Muestra información básica del medio citado.', category: 'sticker', execute: (ctx) => { const type = quotedMediaType(ctx); if (!type) throw Object.assign(new Error('Responde a un sticker o medio.'), { code: 'MEDIA_REQUIRED' }); return ctx.reply(`◩ Medio citado: ${type}.`); } })
];
