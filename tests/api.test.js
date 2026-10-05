import test from 'node:test';
import assert from 'node:assert/strict';

process.env.BOT_API_KEY = 'api_test_key_012345678901234567890123456789012345678901234567890123';
process.env.NODE_ENV = 'test';

const { buildApp } = await import('../api/src/app.js');
const { loadCommands } = await import('../bot/handler.js');
const { categoryMenu } = await import('../bot/lib/menu.js');

test('API protege status con los códigos esperados', async () => {
  const app = await buildApp();
  const missing = await app.inject({ method: 'GET', url: '/api/v1/status' });
  assert.equal(missing.statusCode, 401);
  assert.deepEqual(missing.json(), { success: false, error: { code: 'UNAUTHORIZED', message: 'API Key requerida.' } });
  const invalid = await app.inject({ method: 'GET', url: '/api/v1/status', headers: { authorization: 'Bearer incorrecta' } });
  assert.equal(invalid.statusCode, 403);
  assert.equal(invalid.json().error.code, 'INVALID_API_KEY');
  const ok = await app.inject({ method: 'GET', url: '/api/v1/status', headers: { authorization: `Bearer ${process.env.BOT_API_KEY}` } });
  assert.equal(ok.statusCode, 200);
  assert.equal(ok.json().data.status, 'online');
  await app.close();
});

test('carga plugins y calcula menú de categoría dinámicamente', async () => {
  const registry = await loadCommands();
  assert.ok(registry.commands.length >= 160);
  assert.ok(registry.byName.has('weather'));
  const ai = categoryMenu(registry.commands, 'ai');
  assert.match(ai, /ᴛᴏᴛᴀʟ : 10/);
  assert.match(ai, /\.ɪᴍᴀɢɪɴᴇ.*Ⓟ/);
  assert.doesNotMatch(ai, /público/i);
});
