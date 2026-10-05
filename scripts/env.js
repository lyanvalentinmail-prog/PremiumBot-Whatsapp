import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const fallbackEnvExample = `# Archivo generado automáticamente por PremiumBot\nBOT_NAME=NombreBot\nBOT_VERSION=1.0.0\nPREFIX=.\nOWNER_NAME=Owner\nOWNER_NUMBER=\nBOT_MODE=public\nPAIRING_NUMBER=\nAPI_HOST=127.0.0.1\nAPI_PORT=3000\nBOT_API_URL=http://127.0.0.1:3000\nBOT_API_KEY=\nOPENAI_API_KEY=\nGEMINI_API_KEY=\nWEATHER_API_KEY=\nREMOVE_BG_API_KEY=\nRATE_LIMIT_MAX=100\nRATE_LIMIT_WINDOW=60000\nNODE_ENV=production\n`;

export const generateKey = () => `api_${crypto.randomBytes(32).toString('hex')}`;
export async function ensureEnv(rootDir) {
  const envPath = path.join(rootDir, '.env');
  try {
    await fs.access(envPath);
    return envPath;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  try {
    await fs.copyFile(path.join(rootDir, '.env.example'), envPath);
  } catch (error) {
    // setup must remain usable if a partial archive was extracted without dotfiles.
    if (error.code !== 'ENOENT') throw error;
    await fs.writeFile(envPath, fallbackEnvExample, { mode: 0o600 });
  }
  return envPath;
}
export async function readEnvFile(file) {
  return fs.readFile(file, 'utf8');
}
export async function setEnvValue(file, key, value) {
  let content = await readEnvFile(file);
  const expression = new RegExp(`^${key}=.*$`, 'm');
  const line = `${key}=${value}`;
  content = expression.test(content) ? content.replace(expression, line) : `${content.replace(/\s*$/, '')}\n${line}\n`;
  await fs.writeFile(file, content, { mode: 0o600 });
}
export async function getEnvValue(file, key) {
  const content = await readEnvFile(file);
  return content.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.trim() || '';
}
