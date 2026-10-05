import dns from 'node:dns/promises';
import net from 'node:net';
import { ApiError } from '../utils/response.js';
import { config } from '../config.js';

export async function fetchJson(url, options = {}) {
  let response;
  try {
    response = await fetch(url, { ...options, signal: options.signal || AbortSignal.timeout(config.apiTimeoutMs), headers: { accept: 'application/json', ...options.headers } });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') throw new ApiError('PROVIDER_TIMEOUT', 'El proveedor tardó demasiado en responder.', 504);
    throw new ApiError('PROVIDER_UNAVAILABLE', 'No se pudo conectar con el proveedor.', 502);
  }
  if (!response.ok) {
    if (response.status === 404) throw new ApiError('NOT_FOUND', 'No se encontraron resultados.', 404);
    throw new ApiError('PROVIDER_ERROR', 'El proveedor devolvió un error.', 502);
  }
  try { return await response.json(); } catch { throw new ApiError('PROVIDER_INVALID_RESPONSE', 'El proveedor devolvió una respuesta inválida.', 502); }
}

const privateV4 = (ip) => {
  const parts = ip.split('.').map(Number);
  return parts[0] === 0 || parts[0] === 10 || parts[0] === 127 || (parts[0] === 169 && parts[1] === 254) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168) || (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) || parts[0] >= 224;
};
const privateV6 = (ip) => {
  const normalized = ip.toLowerCase();
  return normalized === '::1' || normalized === '::' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:') || normalized.startsWith('::ffff:127.') || normalized.startsWith('::ffff:10.') || normalized.startsWith('::ffff:192.168.');
};
export const isPrivateAddress = (address) => net.isIP(address) === 4 ? privateV4(address) : net.isIP(address) === 6 ? privateV6(address) : true;

export async function safePublicUrl(input) {
  let parsed;
  try { parsed = new URL(input); } catch { throw new ApiError('INVALID_URL', 'La URL no es válida.', 400); }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new ApiError('INVALID_URL', 'Solo se aceptan URLs HTTP/HTTPS públicas.', 400);
  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local') || hostname.includes('metadata.google.internal')) throw new ApiError('INVALID_URL', 'La URL apunta a un destino no permitido.', 400);
  if (net.isIP(hostname)) {
    if (isPrivateAddress(hostname)) throw new ApiError('INVALID_URL', 'La URL apunta a un destino no permitido.', 400);
  } else {
    let records;
    try { records = await dns.lookup(hostname, { all: true, verbatim: true }); } catch { throw new ApiError('INVALID_URL', 'No se pudo resolver el dominio.', 400); }
    if (!records.length || records.some((record) => isPrivateAddress(record.address))) throw new ApiError('INVALID_URL', 'La URL apunta a un destino no permitido.', 400);
  }
  return parsed;
}

export async function fetchPublicUrl(input) {
  const url = await safePublicUrl(input);
  let response;
  try {
    response = await fetch(url, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(config.apiTimeoutMs), headers: { 'user-agent': 'PremiumBot/1.0 URL checker' } });
  } catch (error) { throw new ApiError('URL_UNREACHABLE', 'No se pudo consultar la URL.', 502); }
  return { url, response };
}
