import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureEnv, generateKey, setEnvValue } from '../../scripts/env.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const envPath = await ensureEnv(rootDir);
const key = generateKey();
await setEnvValue(envPath, 'BOT_API_KEY', key);
console.log('✓ API Key rotada correctamente. Reinicia el bot y la API para aplicar el cambio.');
console.log(`API Key nueva: ${key}`);
