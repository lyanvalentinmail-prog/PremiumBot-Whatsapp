import { config } from '../config.js';
import { ApiError, assert, success } from '../utils/response.js';

function imageInput(body) {
  const imageBase64 = String(body?.imageBase64 || '');
  assert(imageBase64, 'VALIDATION_ERROR', 'El campo imageBase64 es obligatorio.');
  let bytes;
  try { bytes = Buffer.from(imageBase64, 'base64'); } catch { throw new ApiError('VALIDATION_ERROR', 'La imagen no está codificada correctamente.'); }
  assert(bytes.length > 0 && bytes.length <= 1_000_000, 'VALIDATION_ERROR', 'La imagen debe pesar como máximo 1 MB.');
  return bytes;
}
export default async function imageRoutes(app, options) {
  app.post('/remove-bg', async (request) => {
    if (!config.removeBgKey) throw new ApiError('PROVIDER_NOT_CONFIGURED', 'Este servicio no está configurado.', 503);
    const bytes = imageInput(request.body);
    const form = new FormData();
    form.append('image_file', new Blob([bytes]), 'image.png');
    form.append('size', 'auto');
    let response;
    try { response = await fetch('https://api.remove.bg/v1.0/removebg', { method: 'POST', headers: { 'X-Api-Key': config.removeBgKey }, body: form, signal: AbortSignal.timeout(config.apiTimeoutMs) }); } catch { throw new ApiError('PROVIDER_UNAVAILABLE', 'No se pudo conectar con el proveedor.', 502); }
    if (!response.ok) throw new ApiError('PROVIDER_ERROR', 'El proveedor no pudo procesar la imagen.', 502);
    const output = Buffer.from(await response.arrayBuffer());
    return success({ imageBase64: output.toString('base64') }, options.creator);
  });
  app.post('/upscale', async () => {
    throw new ApiError('FEATURE_UNAVAILABLE', 'No hay un proveedor oficial de escalado configurado.', 501);
  });
}
