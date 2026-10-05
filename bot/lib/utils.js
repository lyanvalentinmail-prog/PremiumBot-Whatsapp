import crypto from 'node:crypto';

export const jidToNumber = (jid = '') => jid.split('@')[0].split(':')[0].replace(/\D/g, '');
export const jidToMention = (jid = '') => `@${jidToNumber(jid)}`;
export const formatUptime = (seconds = 0) => {
  const value = Math.max(0, Math.floor(seconds));
  const days = Math.floor(value / 86400);
  const hours = Math.floor((value % 86400) / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const remainder = value % 60;
  return `${days ? `${days}d ` : ''}${hours}h ${minutes}m ${remainder}s`;
};
export const truncate = (text, length = 1400) => {
  const value = String(text ?? '');
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
};
export const randomInt = (min, max) => crypto.randomInt(min, max + 1);
export const humanDate = (date) => new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
export const slug = (value = '') => value.toLowerCase().trim().replace(/^\./, '').replace(/[^a-z0-9_-]/g, '');
export const requiredArgs = (argsDeclaration = '') => [...argsDeclaration.matchAll(/<[^>]+>/g)].length;
export const getQuotedMessage = (message = {}) => message?.extendedTextMessage?.contextInfo?.quotedMessage;
export const getMentions = (message = {}) => message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
