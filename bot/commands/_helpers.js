import crypto from 'node:crypto';
import { api } from '../lib/api.js';
import { truncate } from '../lib/utils.js';

export const command = (definition) => ({
  aliases: [],
  args: '',
  description: 'Sin descripción.',
  category: 'main',
  limit: false,
  premium: false,
  owner: false,
  admin: false,
  group: false,
  ...definition
});

export const joined = (args) => args.join(' ').trim();
export const requireText = (ctx, label = 'texto') => {
  const text = joined(ctx.args);
  if (!text) throw Object.assign(new Error(`Debes escribir ${label}.`), { code: 'MISSING_ARGUMENT' });
  return text;
};
export const fetchApi = async (ctx, method, path, payload) => {
  const result = await api[method](path, payload);
  return result;
};
export const apiErrorMessage = (error) => {
  if (error.code === 'PROVIDER_NOT_CONFIGURED') return '⚙️ Este servicio externo no está configurado por el propietario.';
  if (error.code === 'FEATURE_UNAVAILABLE') return '⚠️ Esta función aún no tiene un proveedor compatible configurado.';
  if (error.code === 'NOT_FOUND') return '❌ No se encontraron resultados.';
  return `❌ ${error.message || 'No se pudo completar la solicitud.'}`;
};
export const code = (value) => `\`\`\`${truncate(value, 3000)}\`\`\``;
export const choose = (values) => values[crypto.randomInt(0, values.length)];
export const publicProviderFailure = (error) => { throw error; };
