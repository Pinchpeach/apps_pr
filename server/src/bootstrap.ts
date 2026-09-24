import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
import { validateEnvironment } from './config.js';

try {
  try { loadEnvFile(fileURLToPath(new URL('../.env', import.meta.url))); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  validateEnvironment();
  // Import only after .env is loaded: auth and database read environment at module initialization.
  await import('./index.js');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'API startup failed');
  process.exit(1);
}
