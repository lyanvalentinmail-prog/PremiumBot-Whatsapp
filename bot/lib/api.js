import { config } from '../config.js';

export class InternalApiError extends Error {
  constructor(code, message, status = 500) {
    super(message);
    this.name = 'InternalApiError';
    this.code = code;
    this.status = status;
  }
}

async function request(method, endpoint, payload) {
  if (!config.botApiKey) throw new InternalApiError('API_NOT_CONFIGURED', 'La API interna no está configurada. Ejecuta npm run setup.');
  const url = new URL(endpoint, config.botApiUrl);
  const options = {
    method,
    headers: {
      authorization: `Bearer ${config.botApiKey}`,
      accept: 'application/json'
    },
    signal: AbortSignal.timeout(config.apiTimeoutMs)
  };
  if (method === 'GET' && payload) {
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== '').forEach(([key, value]) => url.searchParams.set(key, String(value)));
  }
  if (method !== 'GET' && payload !== undefined) {
    options.headers['content-type'] = 'application/json';
    options.body = JSON.stringify(payload);
  }
  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    const message = error.name === 'TimeoutError' ? 'La API interna tardó demasiado en responder.' : 'No se pudo conectar con la API interna.';
    throw new InternalApiError('API_UNAVAILABLE', message, 503);
  }
  let body;
  try { body = await response.json(); } catch { throw new InternalApiError('API_INVALID_RESPONSE', 'La API interna devolvió una respuesta inválida.', 502); }
  if (!response.ok || !body.success) throw new InternalApiError(body?.error?.code || 'API_ERROR', body?.error?.message || 'La API interna no pudo procesar la solicitud.', response.status);
  return body.data;
}

export const api = Object.freeze({
  get: (endpoint, params) => request('GET', endpoint, params),
  post: (endpoint, body) => request('POST', endpoint, body)
});
