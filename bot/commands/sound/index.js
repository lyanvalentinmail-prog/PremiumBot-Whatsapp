import fs from 'node:fs/promises';
import path from 'node:path';
import { command } from '../_helpers.js';
import { config } from '../../config.js';

export default [
  command({ name: 'sound', args: '<nombre>', description: 'Envía un audio local de assets/sounds.', category: 'sound', execute: async (ctx) => { const name = ctx.args[0]?.replace(/[^a-zA-Z0-9_-]/g, ''); if (!name) throw Object.assign(new Error('Indica el nombre de un sonido local.'), { code: 'MISSING_ARGUMENT' }); const folder = path.join(config.rootDir, 'assets', 'sounds'); const files = await fs.readdir(folder).catch(() => []); const file = files.find((entry) => path.parse(entry).name === name && ['.mp3', '.ogg', '.m4a'].includes(path.extname(entry).toLowerCase())); if (!file) throw Object.assign(new Error('Sonido no encontrado. Añade un .mp3/.ogg/.m4a en assets/sounds.'), { code: 'NOT_FOUND' }); const audio = await fs.readFile(path.join(folder, file)); return ctx.reply({ audio, mimetype: path.extname(file) === '.ogg' ? 'audio/ogg' : 'audio/mpeg', ptt: false }); } })
];
