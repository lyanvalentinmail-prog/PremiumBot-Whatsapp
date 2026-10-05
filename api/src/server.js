import { buildApp } from './app.js';
import { config } from './config.js';
import { logger } from '../../bot/lib/logger.js';

let app;
export async function startApi() {
  if (app) return app;
  app = await buildApp();
  await app.listen({ host: config.apiHost, port: config.apiPort });
  logger.info({ host: config.apiHost, port: config.apiPort }, 'API interna iniciada');
  return app;
}
export async function stopApi() {
  if (!app) return;
  await app.close();
  app = undefined;
  logger.info('API interna detenida');
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  startApi().catch((error) => { logger.error({ err: error }, 'No se pudo iniciar la API'); process.exitCode = 1; });
}
