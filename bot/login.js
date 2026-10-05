import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import { config } from './config.js';
import { logger } from './lib/logger.js';

export const normalizePhoneNumber = (value = '') => String(value).replace(/\D/g, '');

async function hasLinkedSession() {
  try {
    const content = await fs.readFile(path.join(config.sessionDir, 'creds.json'), 'utf8');
    return Boolean(JSON.parse(content).registered);
  } catch {
    return false;
  }
}

function configuredMethod() {
  const method = String(process.env.BOT_AUTH_METHOD || '').trim().toLowerCase();
  return ['qr', 'pairing'].includes(method) ? method : null;
}

/**
 * Selects a login flow only for a session that is not linked yet.
 * Non-interactive environments retain .env behavior and never wait for stdin.
 */
export async function selectLoginMethod() {
  if (await hasLinkedSession()) return { type: 'session' };

  const forced = configuredMethod();
  if (forced === 'pairing') {
    const number = normalizePhoneNumber(config.pairingNumber);
    if (!number) throw new Error('BOT_AUTH_METHOD=pairing requiere PAIRING_NUMBER en .env.');
    return { type: 'pairing', number };
  }
  if (forced === 'qr') return { type: 'qr' };

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    // Existing .env installations continue working on PM2/systemd without a prompt.
    return config.pairingNumber ? { type: 'pairing', number: normalizePhoneNumber(config.pairingNumber) } : { type: 'qr' };
  }

  const terminal = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    console.log('\n╭──「 VINCULACIÓN WHATSAPP 」\n│\n│ 1. Código de vinculación\n│ 2. Código QR\n│');
    const choice = (await terminal.question('╰─ Selecciona una opción [1/2, predeterminado 2]: ')).trim();
    if (choice === '1') {
      const entered = await terminal.question(`Número de WhatsApp con código de país${config.pairingNumber ? ` [${config.pairingNumber}]` : ''}: `);
      const number = normalizePhoneNumber(entered || config.pairingNumber);
      if (number.length < 8 || number.length > 15) {
        logger.warn('Número inválido para pairing; se utilizará QR.');
        return { type: 'qr' };
      }
      return { type: 'pairing', number };
    }
    if (choice && choice !== '2') logger.warn('Opción no válida; se utilizará QR.');
    return { type: 'qr' };
  } finally {
    terminal.close();
  }
}
