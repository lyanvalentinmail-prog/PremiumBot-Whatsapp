import fs from 'node:fs/promises';
import path from 'node:path';
import initSqlJs from 'sql.js';
import { config } from '../config.js';
import { logger } from '../lib/logger.js';

let SQL;
let database;
let writeQueue = Promise.resolve();

const schema = `
  CREATE TABLE IF NOT EXISTS users (
    jid TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Usuario',
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    last_xp_at INTEGER NOT NULL DEFAULT 0,
    balance INTEGER NOT NULL DEFAULT 100,
    limits_used INTEGER NOT NULL DEFAULT 0,
    limits_date TEXT NOT NULL DEFAULT '',
    daily_at INTEGER NOT NULL DEFAULT 0,
    premium_start INTEGER NOT NULL DEFAULT 0,
    premium_end INTEGER NOT NULL DEFAULT 0,
    banned INTEGER NOT NULL DEFAULT 0,
    rpg_health INTEGER NOT NULL DEFAULT 100,
    rpg_level INTEGER NOT NULL DEFAULT 1,
    rpg_xp INTEGER NOT NULL DEFAULT 0,
    rpg_weapon TEXT NOT NULL DEFAULT '',
    rpg_last_adventure INTEGER NOT NULL DEFAULT 0,
    rpg_last_hunt INTEGER NOT NULL DEFAULT 0,
    rpg_quest_at INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS inventory (
    jid TEXT NOT NULL,
    item TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK(quantity >= 0),
    PRIMARY KEY (jid, item),
    FOREIGN KEY (jid) REFERENCES users(jid)
  );
  CREATE TABLE IF NOT EXISTS groups (
    jid TEXT PRIMARY KEY,
    welcome INTEGER NOT NULL DEFAULT 0,
    goodbye INTEGER NOT NULL DEFAULT 0,
    antilink INTEGER NOT NULL DEFAULT 0,
    welcome_text TEXT NOT NULL DEFAULT '¡Bienvenido, @user!',
    goodbye_text TEXT NOT NULL DEFAULT 'Hasta pronto, @user!',
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS command_blocks (
    command TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL
  );
`;

export async function initDatabase() {
  if (database) return database;
  await fs.mkdir(path.dirname(config.dbFile), { recursive: true });
  SQL = await initSqlJs({
    locateFile: (file) => path.join(config.rootDir, 'node_modules', 'sql.js', 'dist', file)
  });
  let source;
  try {
    source = await fs.readFile(config.dbFile);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  database = source ? new SQL.Database(source) : new SQL.Database();
  database.run('PRAGMA foreign_keys = ON;');
  database.run(schema);
  // Migration for databases created by versions before the RPG equipment field existed.
  try { database.run("ALTER TABLE users ADD COLUMN rpg_weapon TEXT NOT NULL DEFAULT ''"); } catch { /* column already exists */ }
  try { database.run('ALTER TABLE users ADD COLUMN rpg_quest_at INTEGER NOT NULL DEFAULT 0'); } catch { /* column already exists */ }
  await persist();
  logger.info({ database: path.relative(config.rootDir, config.dbFile) }, 'Base de datos preparada');
  return database;
}

export async function db() {
  return initDatabase();
}

export async function persist() {
  if (!database) return;
  const buffer = Buffer.from(database.export());
  const temporary = `${config.dbFile}.tmp`;
  await fs.writeFile(temporary, buffer, { mode: 0o600 });
  await fs.rename(temporary, config.dbFile);
}

export async function transaction(work) {
  const task = writeQueue.then(async () => {
    const instance = await initDatabase();
    instance.run('BEGIN IMMEDIATE');
    try {
      const result = await work(instance);
      instance.run('COMMIT');
      await persist();
      return result;
    } catch (error) {
      try { instance.run('ROLLBACK'); } catch { /* transaction was not opened */ }
      throw error;
    }
  });
  writeQueue = task.catch(() => undefined);
  return task;
}

export function one(instance, statement, params = []) {
  const prepared = instance.prepare(statement);
  try {
    prepared.bind(params);
    if (!prepared.step()) return null;
    return prepared.getAsObject();
  } finally {
    prepared.free();
  }
}

export function all(instance, statement, params = []) {
  const prepared = instance.prepare(statement);
  const rows = [];
  try {
    prepared.bind(params);
    while (prepared.step()) rows.push(prepared.getAsObject());
    return rows;
  } finally {
    prepared.free();
  }
}

export async function closeDatabase() {
  await writeQueue;
  if (!database) return;
  await persist();
  database.close();
  database = undefined;
  logger.info('Base de datos cerrada');
}
