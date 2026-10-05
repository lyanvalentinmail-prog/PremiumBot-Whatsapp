import { ApiError, failure } from '../utils/response.js';
import { isProduction } from '../config.js';

export function installErrorHandler(app) {
  app.setErrorHandler((error, request, reply) => {
    const status = error instanceof ApiError ? error.status : error.validation ? 400 : 500;
    const code = error instanceof ApiError ? error.code : error.validation ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR';
    const message = error instanceof ApiError ? error.message : error.validation ? 'Solicitud inválida.' : 'Error interno del servidor.';
    request.log[status >= 500 ? 'error' : 'warn']({ err: error, code }, 'Error API');
    if (!isProduction() && status >= 500) reply.header('x-error-type', error.name);
    return reply.code(status).send(failure(code, message));
  });
}
