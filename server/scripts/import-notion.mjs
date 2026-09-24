import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
try { loadEnvFile(fileURLToPath(new URL('../.env', import.meta.url))); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const { migrate, closeDb } = await import('../src/db.ts');
try {
  await migrate();
  const { importNotionSnapshot } = await import('../src/services/importNotion.ts');
  console.log(`Imported ${await importNotionSnapshot(false)} Notion briefings from the bundled snapshot (not live sync).`);
} finally { await closeDb(); }
