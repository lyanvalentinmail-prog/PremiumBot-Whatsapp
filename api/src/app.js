import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { config } from './config.js';
import { logger } from '../../bot/lib/logger.js';
import { requireApiKey } from './middleware/auth.js';
import { installErrorHandler } from './middleware/errors.js';
import { success } from './utils/response.js';
import aiRoutes from './routes/ai.js';
import animeRoutes from './routes/anime.js';
import mangaRoutes from './routes/manga.js';
import searchRoutes from './routes/search.js';
import toolsRoutes from './routes/tools.js';
import internetRoutes from './routes/internet.js';
import stalkRoutes from './routes/stalk.js';
import quranRoutes from './routes/quran.js';
import imageRoutes from './routes/image.js';
import downloaderRoutes from './routes/downloader.js';

const startedAt = Date.now();
function corsOrigin() {
  if (!config.apiCorsOrigin) return false;
  if (config.apiCorsOrigin === '*') return true;
  return config.apiCorsOrigin.split(',').map((item) => item.trim()).filter(Boolean);
}
export async function buildApp() {
  const app = Fastify({ loggerInstance: logger, bodyLimit: 1_500_000, trustProxy: false });
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, { origin: corsOrigin(), credentials: false });
  await app.register(rateLimit, { max: config.rateLimitMax, timeWindow: config.rateLimitWindow, errorResponseBuilder: () => ({ success: false, error: { code: 'RATE_LIMITED', message: 'Demasiadas solicitudes. Inténtalo más tarde.' } }) });
  installErrorHandler(app);

  app.get('/', async () => ({ name: config.botName, service: 'PremiumBot API', status: 'online', documentation: '/api' }));
  app.get('/api', async () => ({ name: config.botName, version: config.botVersion, authentication: 'Bearer API key required for /api/v1/*', status: '/api/v1/status' }));
  app.addHook('onRequest', async (request) => {
    if (request.raw.url?.startsWith('/api/v1/')) await requireApiKey(request);
  });
  app.get('/api/v1/status', async () => success({ status: 'online', version: config.botVersion, uptime: Math.floor((Date.now() - startedAt) / 1000), timestamp: new Date().toISOString() }, config.ownerName));
  const options = { creator: config.ownerName };
  await app.register(aiRoutes, { prefix: '/api/v1/ai', ...options });
  await app.register(animeRoutes, { prefix: '/api/v1/anime', ...options });
  await app.register(mangaRoutes, { prefix: '/api/v1/manga', ...options });
  await app.register(searchRoutes, { prefix: '/api/v1/search', ...options });
  await app.register(toolsRoutes, { prefix: '/api/v1/tools', ...options });
  await app.register(internetRoutes, { prefix: '/api/v1/internet', ...options });
  await app.register(stalkRoutes, { prefix: '/api/v1/stalk', ...options });
  await app.register(quranRoutes, { prefix: '/api/v1/quran', ...options });
  await app.register(imageRoutes, { prefix: '/api/v1/image', ...options });
  await app.register(downloaderRoutes, { prefix: '/api/v1/download', ...options });
  return app;
}
