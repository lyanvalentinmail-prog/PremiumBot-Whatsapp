import { fetchJson } from '../services/http.js';
import { assert, success } from '../utils/response.js';

const number = (value, field, max) => { const parsed = Number(value); assert(Number.isInteger(parsed) && parsed >= 1 && parsed <= max, 'VALIDATION_ERROR', `El parámetro ${field} no es válido.`); return parsed; };
export default async function quranRoutes(app, options) {
  const creator = options.creator;
  app.get('/surah', async (request) => {
    const id = number(request.query?.id, 'id', 114);
    const data = await fetchJson(`https://api.alquran.cloud/v1/surah/${id}`);
    return success({ name: data.data.name, englishName: data.data.englishName, ayahs: data.data.ayahs.map((ayah) => ({ numberInSurah: ayah.numberInSurah, text: ayah.text })) }, creator);
  });
  app.get('/ayah', async (request) => {
    const surah = number(request.query?.surah, 'surah', 114); const ayah = number(request.query?.ayah, 'ayah', 286);
    const data = await fetchJson(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/editions/quran-uthmani,en.asad`);
    const arabic = data.data?.find((item) => item.edition?.identifier === 'quran-uthmani') || data.data?.[0];
    const translation = data.data?.find((item) => item.edition?.identifier === 'en.asad');
    return success({ surah: arabic.surah?.englishName || String(surah), numberInSurah: arabic.numberInSurah, text: arabic.text, translation: translation?.text || null }, creator);
  });
  app.get('/search', async (request) => {
    const q = String(request.query?.q || '').trim(); assert(q, 'VALIDATION_ERROR', 'El parámetro q es obligatorio.');
    const data = await fetchJson(`https://api.alquran.cloud/v1/search/${encodeURIComponent(q)}/all/en`);
    return success({ items: (data.data?.matches || []).slice(0, 8).map((item) => ({ surah: item.surah?.englishName || item.surah?.number, numberInSurah: item.numberInSurah, text: item.text })) }, creator);
  });
}
