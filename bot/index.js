import { initDatabase, closeDatabase } from './database/index.js';
import { loadCommands } from './handler.js';
import { createConnection } from './connection.js';
import { logger } from './lib/logger.js';
import { selectLoginMethod } from './login.js';

let controller;
export async function startBot({ shutdown, loginMethod } = {}) {
  if (controller) return controller;
  await initDatabase();
  const registry = await loadCommands();
  const selectedLogin = loginMethod || await selectLoginMethod();
  controller = await createConnection({ registry, startedAt: Date.now(), shutdown, loginMethod: selectedLogin });
  return controller;
}
export async function stopBot() {
  if (controller) await controller.stop();
  controller = undefined;
  await closeDatabase();
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  const stop = async () => { await stopBot(); process.exit(0); };
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
  startBot({ shutdown: stop }).catch((error) => { logger.error({ err: error }, 'No se pudo iniciar WhatsApp'); process.exitCode = 1; });
}
