import assert from 'node:assert/strict';
import test from 'node:test';
import { corsOrigins, validateEnvironment } from '../config.js';
import { resolveApiUrl } from '../../../src/services/apiConfig.js';

test('local web uses matching loopback host; remote/native require explicit API', () => {
  assert.equal(resolveApiUrl('', { hostname: '127.0.0.1', protocol: 'http:' }), 'http://127.0.0.1:3000');
  assert.throws(() => resolveApiUrl(undefined, { hostname: 'app.example.com', protocol: 'https:' }), /EXPO_PUBLIC_API_URL/);
  assert.throws(() => resolveApiUrl(), /EXPO_PUBLIC_API_URL/);
});
test('API URL normalization and unsafe configuration rejection', () => {
  assert.equal(resolveApiUrl(' https://api.example.com/api/ '), 'https://api.example.com/api');
  assert.throws(() => resolveApiUrl('http://api.example.com', { hostname: 'app.example.com', protocol: 'https:' }), /HTTPS/);
  assert.throws(() => resolveApiUrl('http://localhost:3000', { hostname: 'app.example.com', protocol: 'http:' }), /localhost/);
  for (const url of ['garbage', 'ftp://example.com', 'https://user:pass@example.com', 'https://example.com?q=1']) assert.throws(() => resolveApiUrl(url));
});
test('CORS trims whitespace and slash, defaults locally, fails closed in production', () => {
  assert.deepEqual(corsOrigins({ CORS_ORIGIN: ' http://localhost:8081/, https://app.example.com ' }), ['http://localhost:8081', 'https://app.example.com']);
  assert.ok(corsOrigins({}).includes('http://127.0.0.1:8081'));
  assert.throws(() => corsOrigins({ NODE_ENV: 'production' }), /CORS_ORIGIN/);
  assert.throws(() => corsOrigins({ CORS_ORIGIN: '*' }));
  assert.throws(() => corsOrigins({ CORS_ORIGIN: 'https://example.com/path' }));
});
test('required environment and port are validated before startup', () => {
  const env = { DATABASE_URL: 'postgresql://localhost/test', AUTH_SECRET: 'a'.repeat(32) };
  assert.doesNotThrow(() => validateEnvironment(env));
  assert.throws(() => validateEnvironment({ ...env, DATABASE_URL: '' }), /DATABASE_URL/);
  assert.throws(() => validateEnvironment({ ...env, AUTH_SECRET: '' }), /AUTH_SECRET/);
  assert.throws(() => validateEnvironment({ ...env, PORT: 'NaN' }), /PORT/);
});
