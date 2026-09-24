import { existsSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const path = new URL('../.env', import.meta.url);
if (existsSync(path)) {
  console.log('server/.env already exists; keeping your settings.');
} else {
  writeFileSync(path, `PORT=3000\nDATABASE_URL=postgresql://market:market_dev_only@localhost:5432/market_insight\nAUTH_SECRET=${randomBytes(48).toString('hex')}\nCORS_ORIGIN=http://localhost:8081,http://127.0.0.1:8081\nNODE_ENV=development\n`, { flag: 'wx', mode: 0o600 });
  console.log('Created server/.env with a random local authentication secret.');
}
