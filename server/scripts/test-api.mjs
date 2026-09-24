import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';

try { loadEnvFile(fileURLToPath(new URL('../.env', import.meta.url))); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
assert.ok(process.env.DATABASE_URL, 'Use a disposable PostgreSQL database for API tests');
const port = process.env.TEST_API_PORT || '3001';
const base = `http://127.0.0.1:${port}`;
const origin = 'http://localhost:8081';
const email = `api-test-${randomUUID()}@example.com`;
const child = spawn(process.execPath, ['--import', 'tsx', 'src/bootstrap.ts'], {
  cwd: fileURLToPath(new URL('..', import.meta.url)),
  env: { ...process.env, PORT: port, CORS_ORIGIN: ` ${origin}/, http://127.0.0.1:8081 `, NEWS_JSON_URL: '' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let logs = '';
child.stdout.on('data', data => { logs += data; });
child.stderr.on('data', data => { logs += data; });
const exited = new Promise(resolve => child.once('exit', resolve));
const post = (path, body) => fetch(base + path, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw new Error(`API exited before ready: ${logs}`);
    // Only probe after our child has bound the port, avoiding an unrelated server.
    if (logs.includes('API ready')) { ready = true; break; }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, `API startup timed out: ${logs}`);
  const health = await fetch(base + '/health', { headers: { Origin: origin } });
  assert.equal(health.status, 200);
  assert.equal((await health.json()).ok, true);
  const archive = (await (await fetch(base + '/news')).json()).filter(x => x.briefing);
  assert.equal(archive.length, 7);
  const detail = await (await fetch(base + '/news/' + archive[0].id)).json();
  assert.ok(detail.content.length > 1000);
  assert.ok(detail.briefing.blocks.length > 5);
  assert.equal(detail.briefing.date, '2026-09-24');
  assert.match(detail.briefing.notionUrl, /notion.so/);
  const filtered = await (await fetch(base + '/news?category=' + encodeURIComponent('한국'))).json();
  assert.equal(filtered.filter(x => x.briefing).length, 7);
  const weekly = await (await fetch(base + '/reports/weekly')).json();
  assert.equal(weekly.highlights.length, 1);
  assert.equal(weekly.highlights[0].briefing.period, 'weekly');
  const monthly = await (await fetch(base + '/reports/monthly')).json();
  assert.equal(monthly.highlights.length, 0);
  assert.match(monthly.summary, /없습니다/);
  for (const path of ['/auth/register', '/auth/login']) {
    const preflight = await fetch(base + path, { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' } });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('access-control-allow-origin'), origin);
    assert.match(preflight.headers.get('access-control-allow-headers'), /content-type/i);
  }
  const denied = await fetch(base + '/health', { headers: { Origin: 'https://untrusted.example' } });
  assert.equal(denied.headers.get('access-control-allow-origin'), null);
  const credentials = { name: 'API Test', email, password: `Test-${randomUUID()}` };
  const registered = await post('/auth/register', credentials);
  assert.equal(registered.status, 201);
  assert.equal(registered.headers.get('access-control-allow-origin'), origin);
  const session = await registered.json();
  assert.equal(session.user.email, email);
  assert.equal(session.user.role, 'user');
  assert.equal((await post('/auth/register', credentials)).status, 409);
  assert.equal((await post('/auth/login', { email, password: 'wrong-password' })).status, 401);
  const loggedIn = await post('/auth/login', credentials);
  assert.equal(loggedIn.status, 200);
  const login = await loggedIn.json();
  assert.ok(login.accessToken && login.refreshToken);
  const saved = await fetch(base + '/saved/' + detail.id, { method: 'POST', headers: { Authorization: `Bearer ${login.accessToken}` } });
  assert.equal(saved.status, 201);
  const savedItems = await (await fetch(base + '/saved', { headers: { Authorization: `Bearer ${login.accessToken}` } })).json();
  assert.equal(savedItems[0].id, detail.id);
  const tasks = await fetch(base + '/demo/tasks', { headers: { Authorization: `Bearer ${login.accessToken}`, Origin: origin } });
  assert.equal(tasks.status, 200);
  assert.ok(Array.isArray(await tasks.json()));
  assert.equal((await post('/auth/refresh', { refreshToken: login.refreshToken })).status, 200);
  assert.equal((await post('/auth/logout', { refreshToken: session.refreshToken })).status, 204);
  assert.equal((await post('/auth/refresh', { refreshToken: session.refreshToken })).status, 401);
  console.log('PASS: Notion archive 7 rows, full body, region filter, weekly/monthly reports, saved briefing; PostgreSQL health, CORS, authentication, refresh and logout');
} finally {
  child.kill();
  await exited;
  const db = new Pool({ connectionString: process.env.DATABASE_URL });
  try { await db.query('DELETE FROM users WHERE email = $1', [email]); } finally { await db.end(); }
}
