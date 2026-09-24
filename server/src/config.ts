export function corsOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const values = env.CORS_ORIGIN?.split(',').map(value => value.trim()).filter(Boolean);
  if (!values?.length) {
    if (env.NODE_ENV === 'production') throw new Error('CORS_ORIGIN is required in production');
    return ['http://localhost:8081', 'http://127.0.0.1:8081'];
  }
  return [...new Set(values.map(value => {
    let url: URL;
    try { url = new URL(value); } catch { throw new Error('CORS_ORIGIN must contain comma-separated http(s) origins'); }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
      throw new Error('CORS_ORIGIN must contain origins only, without paths or credentials');
    }
    return url.origin;
  }))];
}

export function validateEnvironment(env: NodeJS.ProcessEnv = process.env): void {
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is required; configure server/.env');
  let database: URL;
  try { database = new URL(env.DATABASE_URL); } catch { throw new Error('DATABASE_URL must be a PostgreSQL URL'); }
  if (!['postgres:', 'postgresql:'].includes(database.protocol)) throw new Error('DATABASE_URL must be a PostgreSQL URL');
  if (!env.AUTH_SECRET || env.AUTH_SECRET.trim().length < 32) throw new Error('AUTH_SECRET must be at least 32 characters; configure server/.env');
  const port = Number(env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer from 1 to 65535');
  corsOrigins(env);
}
