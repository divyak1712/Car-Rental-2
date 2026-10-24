import { spawnSync } from 'child_process';
import { loadTestDb, SERVER_DIR, venvPython } from './lib/test-db';

// Re-runs the safety comparison on every run, then applies the app's own idempotent
// schema + seed (`python -m db.migrate`, what `npm run db:setup` does) to the TEST database.
export default async function globalSetup() {
  const db = loadTestDb();
  const res = spawnSync(venvPython(), ['-m', 'db.migrate'], {
    cwd: SERVER_DIR,
    env: { ...process.env, DATABASE_URL: db.url, DB_SSL: db.ssl },
    encoding: 'utf-8',
  });
  if (res.status !== 0) {
    throw new Error(`db.migrate failed against the test DB:\n${res.stdout}\n${res.stderr}`);
  }
}
