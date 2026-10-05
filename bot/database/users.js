import { all, db, one, transaction } from './index.js';

const now = () => Date.now();
const defaultName = (name) => String(name || 'Usuario').slice(0, 120);

function mapUser(user) {
  if (!user) return null;
  return {
    ...user,
    banned: Boolean(user.banned),
    isPremium: Number(user.premium_end) > Date.now(),
    premium_end: Number(user.premium_end),
    premium_start: Number(user.premium_start)
  };
}

export async function ensureUser(jid, name = 'Usuario') {
  return transaction((instance) => {
    const timestamp = now();
    instance.run(
      `INSERT INTO users (jid, name, created_at, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(jid) DO UPDATE SET name = CASE WHEN excluded.name != 'Usuario' THEN excluded.name ELSE users.name END, updated_at = excluded.updated_at`,
      [jid, defaultName(name), timestamp, timestamp]
    );
    return mapUser(one(instance, 'SELECT * FROM users WHERE jid = ?', [jid]));
  });
}

export async function getUser(jid) {
  const instance = await db();
  return mapUser(one(instance, 'SELECT * FROM users WHERE jid = ?', [jid]));
}

export async function getOrCreateUser(jid, name) {
  return (await getUser(jid)) || ensureUser(jid, name);
}

export async function updateUser(jid, fields) {
  const allowed = new Set(['name', 'xp', 'level', 'last_xp_at', 'balance', 'limits_used', 'limits_date', 'daily_at', 'premium_start', 'premium_end', 'banned', 'rpg_health', 'rpg_level', 'rpg_xp', 'rpg_weapon', 'rpg_last_adventure', 'rpg_last_hunt', 'rpg_quest_at']);
  const entries = Object.entries(fields).filter(([key]) => allowed.has(key));
  if (!entries.length) return getUser(jid);
  return transaction((instance) => {
    const sql = `UPDATE users SET ${entries.map(([key]) => `${key} = ?`).join(', ')}, updated_at = ? WHERE jid = ?`;
    instance.run(sql, [...entries.map(([, value]) => value), now(), jid]);
    return mapUser(one(instance, 'SELECT * FROM users WHERE jid = ?', [jid]));
  });
}

export async function setBan(jid, banned) {
  await getOrCreateUser(jid);
  return updateUser(jid, { banned: banned ? 1 : 0 });
}

export async function setPremium(jid, days) {
  const current = await getOrCreateUser(jid);
  const timestamp = now();
  const base = Number(current.premium_end) > timestamp ? Number(current.premium_end) : timestamp;
  return updateUser(jid, { premium_start: timestamp, premium_end: base + (days * 86400000) });
}

export async function removePremium(jid) {
  await getOrCreateUser(jid);
  return updateUser(jid, { premium_start: 0, premium_end: 0 });
}

export async function addXp(jid, amount, cooldownMs = 45_000) {
  return transaction((instance) => {
    const user = one(instance, 'SELECT * FROM users WHERE jid = ?', [jid]);
    if (!user) return null;
    const timestamp = now();
    if (timestamp - Number(user.last_xp_at) < cooldownMs) return { awarded: false, user: mapUser(user) };
    const xp = Number(user.xp) + amount;
    const level = Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
    instance.run('UPDATE users SET xp = ?, level = ?, last_xp_at = ?, updated_at = ? WHERE jid = ?', [xp, level, timestamp, timestamp, jid]);
    return { awarded: true, user: mapUser(one(instance, 'SELECT * FROM users WHERE jid = ?', [jid])) };
  });
}

export async function userLeaderboard(column, limit = 10) {
  const fields = new Set(['xp', 'balance', 'level']);
  if (!fields.has(column)) throw new Error('Campo de clasificación inválido');
  const instance = await db();
  return all(instance, `SELECT jid, name, ${column} FROM users WHERE banned = 0 ORDER BY ${column} DESC, updated_at ASC LIMIT ?`, [limit]);
}

export async function allUserJids() {
  const instance = await db();
  return all(instance, 'SELECT jid FROM users WHERE banned = 0').map((row) => row.jid);
}

export async function getGroup(jid) {
  const instance = await db();
  return one(instance, 'SELECT * FROM groups WHERE jid = ?', [jid]);
}

export async function ensureGroup(jid) {
  return transaction((instance) => {
    instance.run('INSERT INTO groups (jid, updated_at) VALUES (?, ?) ON CONFLICT(jid) DO NOTHING', [jid, now()]);
    return one(instance, 'SELECT * FROM groups WHERE jid = ?', [jid]);
  });
}

export async function updateGroup(jid, fields) {
  const allowed = new Set(['welcome', 'goodbye', 'antilink', 'welcome_text', 'goodbye_text']);
  const entries = Object.entries(fields).filter(([key]) => allowed.has(key));
  return transaction((instance) => {
    instance.run('INSERT INTO groups (jid, updated_at) VALUES (?, ?) ON CONFLICT(jid) DO NOTHING', [jid, now()]);
    if (entries.length) instance.run(`UPDATE groups SET ${entries.map(([key]) => `${key} = ?`).join(', ')}, updated_at = ? WHERE jid = ?`, [...entries.map(([, value]) => value), now(), jid]);
    return one(instance, 'SELECT * FROM groups WHERE jid = ?', [jid]);
  });
}
