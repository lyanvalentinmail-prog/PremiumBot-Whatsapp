import { config } from '../config.js';
import { generateText } from '../services/ai/index.js';
import { fetchJson } from '../services/http.js';
import { ApiError, assert, success } from '../utils/response.js';

const domain = (value) => {
  const input = String(value || '').trim().toLowerCase();
  if (!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(input)) throw new ApiError('VALIDATION_ERROR', 'El dominio no es válido.');
  return input;
};
export default async function toolsRoutes(app, options) {
  const creator = options.creator;
  app.post('/translate', async (request) => {
    const text = String(request.body?.text || '').trim(); const target = String(request.body?.target || '').trim();
    assert(text && target, 'VALIDATION_ERROR', 'Los campos target y text son obligatorios.');
    return success({ text: await generateText(`Traduce al idioma ${target}. Devuelve solo la traducción.`, text) }, creator);
  });
  app.get('/weather', async (request) => {
    const city = String(request.query?.city || '').trim(); assert(city, 'VALIDATION_ERROR', 'El parámetro city es obligatorio.');
    if (!config.weatherKey) throw new ApiError('PROVIDER_NOT_CONFIGURED', 'Este servicio no está configurado.', 503);
    const data = await fetchJson(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${encodeURIComponent(config.weatherKey)}&units=metric&lang=es`);
    return success({ city: data.name, country: data.sys?.country, description: data.weather?.[0]?.description || 'Sin descripción', temperature: data.main?.temp, feelsLike: data.main?.feels_like, humidity: data.main?.humidity, wind: data.wind?.speed }, creator);
  });
  app.get('/whois', async (request) => {
    const value = domain(request.query?.domain);
    const data = await fetchJson(`https://rdap.org/domain/${encodeURIComponent(value)}`);
    const event = (type) => data.events?.find((item) => item.eventAction === type)?.eventDate || null;
    const registrar = data.entities?.find((entity) => entity.roles?.includes('registrar'))?.vcardArray?.[1]?.find((part) => part[0] === 'fn')?.[3] || null;
    return success({ domain: data.ldhName || value, status: data.status || [], registrar, created: event('registration'), expires: event('expiration') }, creator);
  });
}
