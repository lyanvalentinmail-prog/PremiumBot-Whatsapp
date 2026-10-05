import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { config } from '../config.js';
import { logger } from './logger.js';

export async function hasFfmpeg() {
  return new Promise((resolve) => {
    const process = spawn('ffmpeg', ['-version'], { stdio: 'ignore' });
    process.once('error', () => resolve(false));
    process.once('exit', (code) => resolve(code === 0));
  });
}

export function quotedMediaType(context) {
  const quoted = context.quotedMessage || {};
  if (quoted.imageMessage) return 'image';
  if (quoted.videoMessage) return 'video';
  if (quoted.audioMessage) return 'audio';
  if (quoted.stickerMessage) return 'sticker';
  return null;
}

function execute(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true });
    let output = '';
    child.stderr.on('data', (data) => { output += data.toString(); });
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolve() : reject(Object.assign(new Error('FFmpeg no pudo procesar el archivo.'), { details: output.slice(-500) })));
  });
}

export async function readQuotedMedia(context) {
  const mediaType = quotedMediaType(context);
  if (!mediaType) throw Object.assign(new Error('Responde a una imagen, video, audio o sticker con este comando.'), { code: 'MEDIA_REQUIRED' });
  const source = await downloadMediaMessage({ message: context.quotedMessage }, 'buffer', {}, { logger });
  return { source, mediaType };
}

export async function textToSpeech(text) {
  if (!await hasFfmpeg()) throw Object.assign(new Error('Esta función requiere FFmpeg. En Termux ejecuta: pkg install ffmpeg -y'), { code: 'FFMPEG_REQUIRED' });
  const token = crypto.randomBytes(10).toString('hex');
  const wav = `${config.tempDir}/${token}.wav`;
  const mp3 = `${config.tempDir}/${token}.mp3`;
  await fs.mkdir(config.tempDir, { recursive: true });
  try {
    try {
      await execute('espeak', ['-v', 'es', '-w', wav, String(text).slice(0, 800)]);
    } catch {
      try { await execute('espeak-ng', ['-v', 'es', '-w', wav, String(text).slice(0, 800)]); } catch {
        throw Object.assign(new Error('Esta función requiere eSpeak. En Termux ejecuta: pkg install espeak -y'), { code: 'ESPEAK_REQUIRED' });
      }
    }
    await execute('ffmpeg', ['-y', '-i', wav, '-codec:a', 'libmp3lame', '-q:a', '4', mp3]);
    return fs.readFile(mp3);
  } finally {
    await Promise.allSettled([fs.unlink(wav), fs.unlink(mp3)]);
  }
}

export async function transformQuotedMedia(context, { outputExtension, argsBuilder, outputKind }) {
  if (!await hasFfmpeg()) throw Object.assign(new Error('Esta función requiere FFmpeg. En Termux ejecuta: pkg install ffmpeg -y'), { code: 'FFMPEG_REQUIRED' });
  const mediaType = quotedMediaType(context);
  if (!mediaType) throw Object.assign(new Error('Responde a una imagen, video, audio o sticker con este comando.'), { code: 'MEDIA_REQUIRED' });
  const token = crypto.randomBytes(10).toString('hex');
  const input = `${config.tempDir}/${token}.input`;
  const output = `${config.tempDir}/${token}.${outputExtension}`;
  await fs.mkdir(config.tempDir, { recursive: true });
  try {
    const source = await downloadMediaMessage({ message: context.quotedMessage }, 'buffer', {}, { logger });
    await fs.writeFile(input, source);
    await execute('ffmpeg', ['-y', '-i', input, ...argsBuilder(mediaType), output]);
    return { data: await fs.readFile(output), kind: outputKind };
  } finally {
    await Promise.allSettled([fs.unlink(input), fs.unlink(output)]);
  }
}
