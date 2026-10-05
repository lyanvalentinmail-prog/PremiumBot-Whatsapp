import { command, requireText } from '../_helpers.js';

const escapeXml = (value) => value.replace(/[<>&"']/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char]);
const svg = (text, style = {}) => {
  const safe = escapeXml(text).slice(0, 220);
  const lines = safe.match(/.{1,34}(?:\s|$)|\S+?(?:\s|$)/g) || [safe];
  const content = lines.slice(0, 5).map((line, index) => `<text x="600" y="${260 + index * 100}" text-anchor="middle" font-family="sans-serif" font-size="64" font-weight="bold" fill="${style.color || '#ffffff'}">${line.trim()}</text>`).join('');
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><linearGradient id="g"><stop stop-color="${style.background || '#151b3d'}"/><stop offset="1" stop-color="${style.background2 || '#6b21a8'}"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g)" rx="36"/>${content}</svg>`);
};
const maker = (name, description, style) => command({ name, args: '<texto>', description, category: 'maker', execute: (ctx) => ctx.reply({ document: svg(requireText(ctx), style), mimetype: 'image/svg+xml', fileName: `${name}.svg`, caption: `✎ ${description}` }) });

export default [
  maker('logo', 'Crea un logo SVG de texto.', { background: '#0f172a', background2: '#2563eb' }),
  maker('banner', 'Crea un banner SVG de texto.', { background: '#7c2d12', background2: '#f97316' }),
  maker('quoteimg', 'Crea una imagen de cita SVG.', { background: '#1f2937', background2: '#374151' }),
  maker('neon', 'Crea un texto neón SVG.', { background: '#111827', background2: '#0f766e', color: '#67e8f9' }),
  maker('watermark', 'Crea una marca de agua SVG.', { background: '#4c1d95', background2: '#7e22ce' })
];
