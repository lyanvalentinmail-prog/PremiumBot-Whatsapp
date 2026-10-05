import { all, db, one, transaction } from './index.js';

export async function isCommandBlocked(name) {
  const instance = await db();
  return Boolean(one(instance, 'SELECT command FROM command_blocks WHERE command = ?', [name]));
}
export async function blockedCommands() {
  const instance = await db();
  return all(instance, 'SELECT command FROM command_blocks ORDER BY command').map((row) => row.command);
}
export async function blockCommand(name) {
  return transaction((instance) => instance.run('INSERT INTO command_blocks (command, created_at) VALUES (?, ?) ON CONFLICT(command) DO NOTHING', [name, Date.now()]));
}
export async function unblockCommand(name) {
  return transaction((instance) => instance.run('DELETE FROM command_blocks WHERE command = ?', [name]));
}
