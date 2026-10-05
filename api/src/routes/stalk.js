import { fetchJson } from '../services/http.js';
import { ApiError, assert, success } from '../utils/response.js';

const username = (value) => { const input = String(value || '').trim(); assert(/^[A-Za-z0-9_-]{1,39}$/.test(input), 'VALIDATION_ERROR', 'El usuario no es válido.'); return input; };
export default async function stalkRoutes(app, options) {
  const creator = options.creator;
  app.get('/github', async (request) => {
    const value = username(request.query?.username);
    const data = await fetchJson(`https://api.github.com/users/${encodeURIComponent(value)}`, { headers: { 'user-agent': 'PremiumBot' } });
    return success({ login: data.login, name: data.name, followers: data.followers, following: data.following, publicRepos: data.public_repos, url: data.html_url, bio: data.bio, created: data.created_at }, creator);
  });
  app.get('/roblox', async (request) => {
    const value = username(request.query?.username);
    const found = await fetchJson('https://users.roblox.com/v1/usernames/users', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ usernames: [value], excludeBannedUsers: false }) });
    const id = found.data?.[0]?.id;
    if (!id) throw new ApiError('NOT_FOUND', 'No se encontró el usuario.', 404);
    const data = await fetchJson(`https://users.roblox.com/v1/users/${id}`);
    return success({ id: data.id, name: data.name, displayName: data.displayName, description: data.description, created: data.created, isBanned: data.isBanned }, creator);
  });
}
