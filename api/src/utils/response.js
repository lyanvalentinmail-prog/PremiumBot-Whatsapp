export function success(data, creator) {
  return { success: true, creator, data };
}
export function failure(code, message) {
  return { success: false, error: { code, message } };
}
export class ApiError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}
export const assert = (condition, code, message, status = 400) => {
  if (!condition) throw new ApiError(code, message, status);
};
