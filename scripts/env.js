import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export const generateKey = () => `api_${crypto.randomBytes(32).toString('hex')}`;
export async function ensureEnv(rootDir) {
  const envPath = path.join(rootDir, '.env');
  try { await fs.access(envPath); } catch { await fs.copyFile(path.join(rootDir, '.env.example'), envPath); }
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
