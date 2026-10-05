import { config } from '../config.js';
import { transaction, one } from '../database/index.js';
import { getOrCreateUser } from '../database/users.js';
import { isOwner } from './permissions.js';

const utcDay = () => new Date().toISOString().slice(0, 10);

export async function getLimitStatus(jid) {
  const user = await getOrCreateUser(jid);
  if (isOwner(jid)) return { used: 0, max: Infinity, remaining: Infinity, isOwner: true, isPremium: true };
  const day = utcDay();
  const used = user.limits_date === day ? Number(user.limits_used) : 0;
  const max = user.isPremium ? config.premiumDailyLimit : config.maxDailyLimit;
  return { used, max, remaining: Math.max(0, max - used), isOwner: false, isPremium: user.isPremium };
}

export async function consumeLimit(jid) {
  if (isOwner(jid)) return { consumed: false, unlimited: true };
  await getOrCreateUser(jid);
  return transaction((instance) => {
    const user = one(instance, 'SELECT limits_used, limits_date, premium_end FROM users WHERE jid = ?', [jid]);
    const day = utcDay();
    const used = user.limits_date === day ? Number(user.limits_used) : 0;
    const max = Number(user.premium_end) > Date.now() ? config.premiumDailyLimit : config.maxDailyLimit;
    if (used >= max) return { consumed: false, exhausted: true, used, max };
    instance.run('UPDATE users SET limits_used = ?, limits_date = ?, updated_at = ? WHERE jid = ?', [used + 1, day, Date.now(), jid]);
    return { consumed: true, used: used + 1, max };
  });
}

export async function refundLimit(jid) {
  if (isOwner(jid)) return;
  return transaction((instance) => {
    const user = one(instance, 'SELECT limits_used, limits_date FROM users WHERE jid = ?', [jid]);
    if (!user || user.limits_date !== utcDay() || Number(user.limits_used) <= 0) return;
    instance.run('UPDATE users SET limits_used = limits_used - 1, updated_at = ? WHERE jid = ?', [Date.now(), jid]);
  });
}
