import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(rootDir, '.env') });

const integer = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizedOwners = (process.env.OWNER_NUMBER || '')
  .split(',')
  .map((number) => number.replace(/\D/g, ''))
  .filter(Boolean);

export const config = Object.freeze({
  rootDir,
  botName: process.env.BOT_NAME || 'NombreBot',
  botVersion: process.env.BOT_VERSION || '1.0.0',
  prefix: process.env.PREFIX || '.',
  ownerName: process.env.OWNER_NAME || 'Owner',
  owners: normalizedOwners,
  botMode: (process.env.BOT_MODE || 'public').toLowerCase() === 'private' ? 'private' : 'public',
  pairingNumber: (process.env.PAIRING_NUMBER || '').replace(/\D/g, ''),
  apiHost: process.env.API_HOST || '127.0.0.1',
  apiPort: integer(process.env.API_PORT, 3000),
  botApiUrl: (process.env.BOT_API_URL || `http://127.0.0.1:${process.env.API_PORT || 3000}`).replace(/\/$/, ''),
  botApiKey: process.env.BOT_API_KEY || '',
  apiCorsOrigin: process.env.API_CORS_ORIGIN || '',
  rateLimitMax: integer(process.env.RATE_LIMIT_MAX, 100),
  rateLimitWindow: integer(process.env.RATE_LIMIT_WINDOW, 60000),
  maxDailyLimit: integer(process.env.MAX_DAILY_LIMIT, 10),
  premiumDailyLimit: integer(process.env.PREMIUM_DAILY_LIMIT, 50),
  apiTimeoutMs: integer(process.env.API_TIMEOUT_MS, 15000),
  nodeEnv: process.env.NODE_ENV || 'production',
  openAiKey: process.env.OPENAI_API_KEY || '',
  openAiModel: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
  geminiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  weatherKey: process.env.WEATHER_API_KEY || '',
  removeBgKey: process.env.REMOVE_BG_API_KEY || '',
  googleCseKey: process.env.GOOGLE_CSE_API_KEY || '',
  googleCseId: process.env.GOOGLE_CSE_ID || '',
  youtubeKey: process.env.YOUTUBE_API_KEY || '',
  geniusToken: process.env.GENIUS_ACCESS_TOKEN || '',
  dbFile: path.join(rootDir, 'data', 'bot.db'),
  sessionDir: path.join(rootDir, 'sessions'),
  tempDir: path.join(rootDir, 'assets', 'temp'),
  bannerPath: path.join(rootDir, 'assets', 'banner.jpg')
});

export function isProduction() {
  return config.nodeEnv === 'production';
}
