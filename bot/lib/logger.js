import pino from 'pino';
import { config } from '../config.js';

export const logger = pino({
  level: process.env.LOG_LEVEL || (config.nodeEnv === 'production' ? 'info' : 'debug'),
  redact: {
    paths: [
      'req.headers.authorization',
      'req.url',
      'req.query',
      'req.body',
      'headers.authorization',
      'authorization',
      'BOT_API_KEY',
      'OPENAI_API_KEY',
      'GEMINI_API_KEY',
      'REMOVE_BG_API_KEY',
      'credentials',
      'token'
    ],
    censor: '[REDACTED]'
  },
  base: { service: 'premiumbot' }
});
