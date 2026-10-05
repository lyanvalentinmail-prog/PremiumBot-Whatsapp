import { startApi, stopApi } from './api/src/server.js';
import { startBot, stopBot } from './bot/index.js';
import { initDatabase } from './bot/database/index.js';
import { config } from './bot/config.js';
import { logger } from './bot/lib/logger.js';

let stopping = false;
async function shutdown(reason = 'signal') {
  if (stopping) return;
  stopping = true;
  logger.info({ reason }, 'Cerrando sistema');
  await Promise.allSettled([stopBot(), stopApi()]);
  process.exit(0);
}
process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

try {
  await initDatabase();
  await startApi();
  await startBot({ shutdown });
  console.log(`
╭──「 ✓ SISTEMA INICIADO 」
│
│ 🤖 Bot ☇ Online
│ 🌐 API ☇ ${config.botApiUrl}
│ 📦 Database ☇ Online
│ 🔐 API Auth ☇ Activa
│
╰────────────────────⬣
`);
} catch (error) {
  logger.error({ err: error }, 'No se pudo iniciar el sistema');
  await shutdown('startup-error');
  process.exitCode = 1;
}
