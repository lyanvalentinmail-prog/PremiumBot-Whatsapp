import { command, requireText } from '../_helpers.js';

const textCommand = (name, args, description, endpoint, mapper = (data) => data.text, options = {}) => command({ name, args, description, category: 'ai', limit: true, ...options, execute: async (ctx) => { const text = requireText(ctx, args.includes('pregunta') ? 'una pregunta' : 'texto'); const data = await ctx.api.post(endpoint, { text }); return ctx.reply(mapper(data)); } });

export default [
  textCommand('chat', '<mensaje>', 'Conversación con IA.', '/api/v1/ai/chat'),
  textCommand('ask', '<pregunta>', 'Pregunta a la IA.', '/api/v1/ai/chat'),
  textCommand('summarize', '<texto>', 'Resume un texto.', '/api/v1/ai/summarize'),
  textCommand('rewrite', '<texto>', 'Reescribe un texto.', '/api/v1/ai/rewrite'),
  textCommand('grammar', '<texto>', 'Corrige gramática.', '/api/v1/ai/grammar', (data) => data.text, { limit: false }),
  textCommand('explain', '<tema>', 'Explica un tema.', '/api/v1/ai/chat'),
  textCommand('code', '<peticion>', 'Pide ayuda de programación.', '/api/v1/ai/chat'),
  command({ name: 'translateai', args: '<idioma> <texto>', description: 'Traduce mediante IA.', category: 'ai', limit: true, execute: async (ctx) => { const [target, ...rest] = ctx.args; if (!target || !rest.length) throw Object.assign(new Error('Debes indicar idioma y texto.'), { code: 'MISSING_ARGUMENT' }); const data = await ctx.api.post('/api/v1/ai/translate', { target, text: rest.join(' ') }); return ctx.reply(data.text); } }),
  command({ name: 'prompt', args: '<idea>', description: 'Convierte una idea en un prompt detallado.', category: 'ai', limit: true, execute: async (ctx) => { const idea = requireText(ctx, 'una idea'); const data = await ctx.api.post('/api/v1/ai/rewrite', { text: `Crea un prompt visual detallado y seguro para esta idea: ${idea}` }); return ctx.reply(data.text); } }),
  command({ name: 'imagine', args: '<prompt>', description: 'Genera una imagen con OpenAI.', category: 'ai', premium: true, execute: async (ctx) => { const data = await ctx.api.post('/api/v1/ai/imagine', { prompt: requireText(ctx, 'un prompt') }); return ctx.reply({ image: Buffer.from(data.imageBase64, 'base64'), caption: '🎨 Imagen generada.' }); } })
];
