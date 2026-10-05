import { config } from '../../config.js';
import { ApiError } from '../../utils/response.js';
import { fetchJson } from '../http.js';

function providerMissing() {
  throw new ApiError('PROVIDER_NOT_CONFIGURED', 'Este servicio no está configurado.', 503);
}

function extractOpenAi(data) {
  if (data.output_text) return data.output_text;
  const content = data.output?.flatMap((item) => item.content || []).find((item) => item.type === 'output_text')?.text;
  if (!content) throw new ApiError('PROVIDER_INVALID_RESPONSE', 'El proveedor no devolvió texto.', 502);
  return content;
}

export async function generateText(instruction, text) {
  if (config.openAiKey) {
    const data = await fetchJson('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { authorization: `Bearer ${config.openAiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: config.openAiModel, instructions: instruction, input: text })
    });
    return extractOpenAi(data);
  }
  if (config.geminiKey) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.geminiModel)}:generateContent?key=${encodeURIComponent(config.geminiKey)}`;
    const data = await fetchJson(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: `${instruction}\n\n${text}` }] }] })
    });
    const result = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
    if (!result) throw new ApiError('PROVIDER_INVALID_RESPONSE', 'El proveedor no devolvió texto.', 502);
    return result;
  }
  providerMissing();
}

export async function generateImage(prompt) {
  if (!config.openAiKey) providerMissing();
  const data = await fetchJson('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { authorization: `Bearer ${config.openAiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-image-1', prompt, size: '1024x1024' })
  });
  const imageBase64 = data.data?.[0]?.b64_json;
  if (!imageBase64) throw new ApiError('PROVIDER_INVALID_RESPONSE', 'El proveedor no devolvió una imagen.', 502);
  return imageBase64;
}
