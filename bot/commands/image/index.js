import { command } from '../_helpers.js';
import { transformQuotedMedia, readQuotedMedia } from '../../lib/media.js';

const image = (name, description, ffmpegArgs) => command({ name, description, category: 'image', execute: async (ctx) => { const result = await transformQuotedMedia(ctx, { outputExtension: 'jpg', outputKind: 'image', argsBuilder: () => ['-vf', ffmpegArgs, '-frames:v', '1', '-q:v', '3'] }); return ctx.reply({ image: result.data, caption: `🖼️ ${description}` }); } });

export default [
  image('resize', 'Reduce la imagen citada al 50%.', 'scale=iw*0.5:ih*0.5'),
  image('crop', 'Recorta al centro cuadrado.', 'crop=min(iw\\,ih):min(iw\\,ih)'),
  image('rotate', 'Rota la imagen 90 grados.', 'transpose=1'),
  image('blur', 'Desenfoca la imagen.', 'boxblur=8:2'),
  image('grayscale', 'Convierte a escala de grises.', 'hue=s=0'),
  command({ name: 'compress', description: 'Comprime una imagen citada a JPEG.', category: 'image', execute: async (ctx) => { const result = await transformQuotedMedia(ctx, { outputExtension: 'jpg', outputKind: 'image', argsBuilder: () => ['-frames:v', '1', '-q:v', '12'] }); return ctx.reply({ image: result.data, caption: '🗜️ Imagen comprimida.' }); } }),
  command({ name: 'removebg', description: 'Quita fondo con remove.bg.', category: 'image', premium: true, execute: async (ctx) => { const { source, mediaType } = await readQuotedMedia(ctx); if (!['image', 'sticker'].includes(mediaType)) throw Object.assign(new Error('Responde a una imagen o sticker.'), { code: 'MEDIA_REQUIRED' }); const data = await ctx.api.post('/api/v1/image/remove-bg', { imageBase64: source.toString('base64') }); return ctx.reply({ image: Buffer.from(data.imageBase64, 'base64'), caption: '✂️ Fondo eliminado.' }); } }),
  command({ name: 'upscale', description: 'Escala una imagen con un proveedor configurado.', category: 'image', premium: true, execute: async (ctx) => { const { source, mediaType } = await readQuotedMedia(ctx); if (!['image', 'sticker'].includes(mediaType)) throw Object.assign(new Error('Responde a una imagen o sticker.'), { code: 'MEDIA_REQUIRED' }); const data = await ctx.api.post('/api/v1/image/upscale', { imageBase64: source.toString('base64') }); return ctx.reply({ image: Buffer.from(data.imageBase64, 'base64'), caption: '🔎 Imagen escalada.' }); } }),
  command({ name: 'tojpg', description: 'Convierte medio citado a JPEG.', category: 'image', execute: async (ctx) => { const result = await transformQuotedMedia(ctx, { outputExtension: 'jpg', outputKind: 'image', argsBuilder: () => ['-frames:v', '1', '-q:v', '3'] }); return ctx.reply({ image: result.data, caption: '🖼️ Convertido a JPG.' }); } })
];
