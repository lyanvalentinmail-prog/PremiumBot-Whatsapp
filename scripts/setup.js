import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDatabase, closeDatabase } from '../bot/database/index.js';
import { config } from '../bot/config.js';
import { ensureEnv, generateKey, getEnvValue, setEnvValue } from './env.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const major = Number(process.versions.node.split('.')[0]);
if (!Number.isInteger(major) || major < 20) {
  console.error(`❌ Node.js ${process.versions.node} detectado. Se requiere Node.js 20 o superior.`);
  process.exit(1);
}
await Promise.all([
  fs.mkdir(path.join(rootDir, 'data'), { recursive: true }),
  fs.mkdir(path.join(rootDir, 'sessions'), { recursive: true }),
  fs.mkdir(path.join(rootDir, 'assets', 'temp'), { recursive: true }),
  fs.mkdir(path.join(rootDir, 'assets', 'sounds'), { recursive: true })
]);
const envPath = await ensureEnv(rootDir);
let key = await getEnvValue(envPath, 'BOT_API_KEY');
let generated = false;
if (!key) {
  key = generateKey();
  await setEnvValue(envPath, 'BOT_API_KEY', key);
  generated = true;
}
await initDatabase();
await closeDatabase();
console.log(`
╭──「 ✓ CONFIGURACIÓN 」
│
│ 🤖 Bot ☇ ${config.botName}
│ 🌐 API ☇ ${config.botApiUrl}
│ 🔑 API Key ☇ ${generated ? key : 'ya configurada (oculta)'}
│ 📦 Base de datos ☇ Preparada
│
│ Ejecuta:
│ npm start
│
╰────────────────────⬣
`);
