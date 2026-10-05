const values = new Map();

export async function cached(key, ttlMs, work) {
  const entry = values.get(key);
  if (entry && entry.expiresAt > Date.now()) return entry.value;
  const value = await work();
  values.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export function clearCache() { values.clear(); }
