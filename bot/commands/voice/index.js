import { command, requireText } from '../_helpers.js';
import { textToSpeech, transformQuotedMedia } from '../../lib/media.js';

const effect = (name, description, filter) => command({ name, description, category: 'voice', execute: async (ctx) => { const result = await transformQuotedMedia(ctx, { outputExtension: 'mp3', outputKind: 'audio', argsBuilder: () => ['-vn', '-af', filter, '-codec:a', 'libmp3lame', '-q:a', '3'] }); return ctx.reply({ audio: result.data, mimetype: 'audio/mpeg', ptt: true }); } });
export default [
  command({ name: 'tts', args: '<texto>', description: 'Convierte texto a voz con eSpeak local.', category: 'voice', execute: async (ctx) => { const audio = await textToSpeech(requireText(ctx)); return ctx.reply({ audio, mimetype: 'audio/mpeg', ptt: true }); } }),
  effect('robotvoice', 'Aplica voz robótica.', 'asetrate=22050,aresample=44100'),
  effect('deepvoice', 'Aplica voz grave.', 'asetrate=44100*0.75,aresample=44100'),
  effect('chipmunk', 'Aplica voz aguda.', 'asetrate=44100*1.45,aresample=44100'),
  effect('slowvoice', 'Hace más lenta la voz.', 'atempo=0.75'),
  effect('fastvoice', 'Hace más rápida la voz.', 'atempo=1.3'),
  effect('reversevoice', 'Invierte una voz.', 'areverse'),
  effect('voicefx', 'Aplica un efecto eco.', 'aecho=0.8:0.9:1000:0.3')
];
