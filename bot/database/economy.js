import { all, db, one, transaction } from './index.js';
import { getOrCreateUser } from './users.js';

export const shopItems = Object.freeze({
  pocion: { name: 'Poción', buy: 80, sell: 40, description: 'Restaura 25 puntos de vida RPG.' },
  espada: { name: 'Espada', buy: 500, sell: 250, description: 'Mejora el botín de aventura.' },
  escudo: { name: 'Escudo', buy: 400, sell: 200, description: 'Reduce el daño en combates.' }
});

export async function inventoryFor(jid) {
  const instance = await db();
  return all(instance, 'SELECT item, quantity FROM inventory WHERE jid = ? AND quantity > 0 ORDER BY item', [jid]);
}

export async function buyItem(jid, item, quantity = 1) {
  const key = String(item).toLowerCase();
  const product = shopItems[key];
  if (!product) throw Object.assign(new Error('Artículo no encontrado.'), { code: 'ITEM_NOT_FOUND' });
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 20) throw Object.assign(new Error('Cantidad inválida (1 a 20).'), { code: 'INVALID_QUANTITY' });
  await getOrCreateUser(jid);
  return transaction((instance) => {
    const user = one(instance, 'SELECT * FROM users WHERE jid = ?', [jid]);
    const cost = product.buy * quantity;
    if (Number(user.balance) < cost) throw Object.assign(new Error('No tienes monedas suficientes.'), { code: 'INSUFFICIENT_FUNDS' });
    instance.run('UPDATE users SET balance = balance - ?, updated_at = ? WHERE jid = ?', [cost, Date.now(), jid]);
    instance.run('INSERT INTO inventory (jid, item, quantity) VALUES (?, ?, ?) ON CONFLICT(jid,item) DO UPDATE SET quantity = quantity + excluded.quantity', [jid, key, quantity]);
    return { item: product, quantity, cost, balance: one(instance, 'SELECT balance FROM users WHERE jid = ?', [jid]).balance };
  });
}

export async function sellItem(jid, item, quantity = 1) {
  const key = String(item).toLowerCase();
  const product = shopItems[key];
  if (!product) throw Object.assign(new Error('Artículo no encontrado.'), { code: 'ITEM_NOT_FOUND' });
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 20) throw Object.assign(new Error('Cantidad inválida.'), { code: 'INVALID_QUANTITY' });
  await getOrCreateUser(jid);
  return transaction((instance) => {
    const owned = one(instance, 'SELECT quantity FROM inventory WHERE jid = ? AND item = ?', [jid, key]);
    if (!owned || Number(owned.quantity) < quantity) throw Object.assign(new Error('No tienes suficientes unidades.'), { code: 'INSUFFICIENT_ITEM' });
    const revenue = product.sell * quantity;
    instance.run('UPDATE inventory SET quantity = quantity - ? WHERE jid = ? AND item = ?', [quantity, jid, key]);
    instance.run('UPDATE users SET balance = balance + ?, updated_at = ? WHERE jid = ?', [revenue, Date.now(), jid]);
    return { item: product, quantity, revenue, balance: one(instance, 'SELECT balance FROM users WHERE jid = ?', [jid]).balance };
  });
}

export async function transferMoney(from, to, amount) {
  if (from === to) throw Object.assign(new Error('No puedes enviarte monedas a ti mismo.'), { code: 'SAME_USER' });
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 100_000) throw Object.assign(new Error('Cantidad inválida.'), { code: 'INVALID_AMOUNT' });
  await Promise.all([getOrCreateUser(from), getOrCreateUser(to)]);
  return transaction((instance) => {
    const sender = one(instance, 'SELECT balance FROM users WHERE jid = ?', [from]);
    if (Number(sender.balance) < amount) throw Object.assign(new Error('Saldo insuficiente.'), { code: 'INSUFFICIENT_FUNDS' });
    const timestamp = Date.now();
    instance.run('UPDATE users SET balance = balance - ?, updated_at = ? WHERE jid = ?', [amount, timestamp, from]);
    instance.run('UPDATE users SET balance = balance + ?, updated_at = ? WHERE jid = ?', [amount, timestamp, to]);
    return { amount, balance: one(instance, 'SELECT balance FROM users WHERE jid = ?', [from]).balance };
  });
}

export async function claimDaily(jid) {
  await getOrCreateUser(jid);
  return transaction((instance) => {
    const user = one(instance, 'SELECT daily_at, balance FROM users WHERE jid = ?', [jid]);
    const timestamp = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;
    if (timestamp - Number(user.daily_at) < cooldown) return { claimed: false, nextAt: Number(user.daily_at) + cooldown };
    const reward = 150;
    instance.run('UPDATE users SET daily_at = ?, balance = balance + ?, updated_at = ? WHERE jid = ?', [timestamp, reward, timestamp, jid]);
    return { claimed: true, reward, balance: Number(user.balance) + reward };
  });
}

export async function usePotion(jid) {
  await getOrCreateUser(jid);
  return transaction((instance) => {
    const potion = one(instance, "SELECT quantity FROM inventory WHERE jid = ? AND item = 'pocion'", [jid]);
    if (!potion || Number(potion.quantity) < 1) throw Object.assign(new Error('No tienes una poción.'), { code: 'ITEM_NOT_FOUND' });
    const user = one(instance, 'SELECT rpg_health FROM users WHERE jid = ?', [jid]);
    if (Number(user.rpg_health) >= 100) throw Object.assign(new Error('Tu vida ya está completa.'), { code: 'HEALTH_FULL' });
    const health = Math.min(100, Number(user.rpg_health) + 25);
    instance.run("UPDATE inventory SET quantity = quantity - 1 WHERE jid = ? AND item = 'pocion'", [jid]);
    instance.run('UPDATE users SET rpg_health = ?, updated_at = ? WHERE jid = ?', [health, Date.now(), jid]);
    return { health };
  });
}

export async function claimQuest(jid) {
  await getOrCreateUser(jid);
  return transaction((instance) => {
    const user = one(instance, 'SELECT * FROM users WHERE jid = ?', [jid]);
    const day = new Date().toISOString().slice(0, 10);
    const lastDay = Number(user.rpg_quest_at) ? new Date(Number(user.rpg_quest_at)).toISOString().slice(0, 10) : '';
    if (lastDay === day) return { claimed: false, reason: 'claimed' };
    const todayStart = new Date(`${day}T00:00:00.000Z`).getTime();
    if (Number(user.rpg_last_adventure) < todayStart || Number(user.rpg_last_hunt) < todayStart) return { claimed: false, reason: 'incomplete' };
    const reward = 100;
    instance.run('UPDATE users SET balance = balance + ?, rpg_quest_at = ?, updated_at = ? WHERE jid = ?', [reward, Date.now(), Date.now(), jid]);
    return { claimed: true, reward };
  });
}

export async function changeRpg(jid, operation) {
  await getOrCreateUser(jid);
  return transaction((instance) => {
    const user = one(instance, 'SELECT * FROM users WHERE jid = ?', [jid]);
    const result = operation({ ...user });
    if (!result || !result.fields) throw new Error('Operación RPG inválida');
    const entries = Object.entries(result.fields);
    if (entries.length) {
      instance.run(`UPDATE users SET ${entries.map(([field]) => `${field} = ?`).join(', ')}, updated_at = ? WHERE jid = ?`, [...entries.map(([, value]) => value), Date.now(), jid]);
    }
    return { ...result, user: one(instance, 'SELECT * FROM users WHERE jid = ?', [jid]) };
  });
}
