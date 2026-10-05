import dns from 'node:dns/promises';
import net from 'node:net';
import { fetchPublicUrl } from '../services/http.js';
import { ApiError, assert, success } from '../utils/response.js';

const domain = (value) => {
  const input = String(value || '').trim().toLowerCase();
  if (!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(input)) throw new ApiError('VALIDATION_ERROR', 'El dominio no es válido.');
  return input;
};
export default async function internetRoutes(app, options) {
  const creator = options.creator;
  app.get('/dns', async (request) => {
    const value = domain(request.query?.domain);
    const [a, aaaa, mx] = await Promise.all([
      dns.resolve4(value).catch(() => []),
      dns.resolve6(value).catch(() => []),
      dns.resolveMx(value).catch(() => [])
    ]);
    return success({ domain: value, a, aaaa, mx }, creator);
  });
  app.get('/ip', async (request) => {
    const ip = String(request.query?.ip || '').trim(); assert(net.isIP(ip), 'VALIDATION_ERROR', 'El parámetro ip no es válido.');
    return success({ ip, reverseDns: await dns.reverse(ip).catch(() => []) }, creator);
  });
  app.get('/urlcheck', async (request) => {
    const input = String(request.query?.url || '').trim(); assert(input, 'VALIDATION_ERROR', 'El parámetro url es obligatorio.');
    const { url, response } = await fetchPublicUrl(input);
    return success({ url: url.toString(), finalUrl: url.toString(), status: response.status, contentType: response.headers.get('content-type') || null, redirect: response.headers.get('location') || null }, creator);
  });
}
