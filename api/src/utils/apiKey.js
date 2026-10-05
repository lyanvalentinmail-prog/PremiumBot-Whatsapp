import crypto from 'node:crypto';
export const generateApiKey = () => `api_${crypto.randomBytes(32).toString('hex')}`;
