import { safePublicUrl } from '../services/http.js';
import { ApiError } from '../utils/response.js';

export default async function downloaderRoutes(app) {
  const unavailable = async (request) => {
    const url = String(request.body?.url || '').trim();
    if (url) await safePublicUrl(url);
    throw new ApiError('FEATURE_UNAVAILABLE', 'Las descargas no están configuradas. Este proyecto no implementa bypass de DRM, autenticación, CAPTCHA ni controles de acceso.', 501);
  };
  app.post('/youtube', unavailable);
  app.post('/tiktok', unavailable);
  app.post('/instagram', unavailable);
}
