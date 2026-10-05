import crypto from 'node:crypto';
import { config } from '../config.js';
import { ApiError } from '../utils/response.js';

export async function requireApiKey(request) {
  const value = request.headers.authorization;
  if (!value?.startsWith('Bearer ')) throw new ApiError('UNAUTHORIZED', 'API Key requerida.', 401);
  if (!config.botApiKey) throw new ApiError('API_NOT_CONFIGURED', 'La API no está configurada.', 503);
  const supplied = Buffer.from(value.slice(7));
  const expected = Buffer.from(config.botApiKey);
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) throw new ApiError('INVALID_API_KEY', 'API Key inválida.', 403);
}
