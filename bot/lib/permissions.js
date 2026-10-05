import { config } from '../config.js';
import { jidToNumber } from './utils.js';

export const isOwner = (jid) => config.owners.includes(jidToNumber(jid));
export const isGroup = (jid = '') => jid.endsWith('@g.us');
export const isAdmin = (jid, adminJids = []) => adminJids.some((admin) => jidToNumber(admin) === jidToNumber(jid));

export function permissionMarker(command) {
  if (command.owner) return ' Ⓞ';
  if (command.admin) return ' Ⓐ';
  if (command.premium) return ' Ⓟ';
  if (command.limit) return ' Ⓛ';
  return '';
}
