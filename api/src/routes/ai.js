import { generateImage, generateText } from '../services/ai/index.js';
import { ApiError, assert, success } from '../utils/response.js';

const bodyText = (body) => {
  const text = String(body?.text || '').trim();
  assert(text, 'VALIDATION_ERROR', 'El campo text es obligatorio.');
  assert(text.length <= 8000, 'VALIDATION_ERROR', 'El texto supera el máximo permitido.');
  return text;
};

export default async function aiRoutes(app, options) {
  const creator = options.creator;
  app.post('/chat', async (request) => success({ text: await generateText('Responde en español de forma útil y segura.', bodyText(request.body)) }, creator));
  app.post('/summarize', async (request) => success({ text: await generateText('Resume el siguiente texto en español preservando los puntos importantes.', bodyText(request.body)) }, creator));
  app.post('/rewrite', async (request) => success({ text: await generateText('Reescribe el siguiente texto en español, claro y natural. Devuelve solo la versión reescrita.', bodyText(request.body)) }, creator));
  app.post('/grammar', async (request) => success({ text: await generateText('Corrige gramática y ortografía en español. Devuelve solamente el texto corregido.', bodyText(request.body)) }, creator));
  app.post('/translate', async (request) => {
    const text = bodyText(request.body);
    const target = String(request.body?.target || '').trim();
    assert(target, 'VALIDATION_ERROR', 'El campo target es obligatorio.');
    return success({ text: await generateText(`Traduce al idioma ${target}. Devuelve solo la traducción.`, text) }, creator);
  });
  app.post('/imagine', async (request) => {
    const prompt = String(request.body?.prompt || '').trim();
    assert(prompt, 'VALIDATION_ERROR', 'El campo prompt es obligatorio.');
    assert(prompt.length <= 3000, 'VALIDATION_ERROR', 'El prompt supera el máximo permitido.');
    return success({ imageBase64: await generateImage(prompt) }, creator);
  });
}
