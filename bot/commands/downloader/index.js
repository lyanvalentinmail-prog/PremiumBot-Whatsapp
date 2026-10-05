import { command, requireText } from '../_helpers.js';

const downloader = (name, endpoint, args, description) => command({ name, args, description, category: 'downloader', limit: true, execute: async (ctx) => { const url = requireText(ctx, 'una URL'); const data = await ctx.api.post(endpoint, { url, quality: ctx.args[1] }); return ctx.reply(data.message || 'Solicitud recibida.'); } });

export default [
  downloader('ytmp3', '/api/v1/download/youtube', '<url>', 'Solicita descarga de audio público permitido.'),
  downloader('ytmp4', '/api/v1/download/youtube', '<url> [calidad]', 'Solicita descarga de video público permitido.'),
  downloader('tiktok', '/api/v1/download/tiktok', '<url>', 'Solicita descarga de contenido público permitido.'),
  downloader('instagram', '/api/v1/download/instagram', '<url>', 'Solicita descarga de contenido público permitido.')
];
