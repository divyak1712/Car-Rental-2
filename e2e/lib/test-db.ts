import { parse } from 'dotenv';
import fs from 'fs';
import path from 'path';

export const E2E_DIR = path.resolve(__dirname, '..');
export const APP_DIR = path.resolve(E2E_DIR, '..');
export const SERVER_DIR = path.join(APP_DIR, 'server');

export function normalizeDbUrl(url: string): string {
  return url.trim().replace(/\/+$/, '').toLowerCase();
}

// host + port + database, ignoring scheme (mysql:// vs mysql+pymysql://) and credentials.
function dbIdentity(url: string): string {
  const u = new URL(url.trim().replace(/^mysql\+\w+:/i, 'mysql:'));
  return `${u.hostname.toLowerCase()}:${u.port || '3306'}/${u.pathname.replace(/^\/+/, '').toLowerCase()}`;
}

export interface TestDb {
  url: string;
  ssl: string;
}

/**
 * Loads the test DB from e2e/.env.e2e and REFUSES (throws) if it resolves to the same
 * host+port+database as the app's real DATABASE_URL in server/.env. Called from both
 * playwright.config.ts (webServers start before globalSetup) and global-setup.ts, every run.
 */
export function loadTestDb(): TestDb {
  const envFile = path.join(E2E_DIR, '.env.e2e');
  if (!fs.existsSync(envFile)) {
    throw new Error('e2e/.env.e2e not found — copy .env.e2e.example and set E2E_DATABASE_URL.');
  }
  const cfg = parse(fs.readFileSync(envFile));
  const raw = cfg.E2E_DATABASE_URL;
  if (!raw) throw new Error('E2E_DATABASE_URL is not set in e2e/.env.e2e');
  const url = raw.replace(/^mysql:\/\//i, 'mysql+pymysql://');

  const realEnvFile = path.join(SERVER_DIR, '.env');
  if (fs.existsSync(realEnvFile)) {
    const real = parse(fs.readFileSync(realEnvFile)).DATABASE_URL;
    if (real && (normalizeDbUrl(real) === normalizeDbUrl(url) || dbIdentity(real) === dbIdentity(url))) {
      throw new Error(
        'REFUSING TO RUN: E2E_DATABASE_URL points at the same host/database as server/.env DATABASE_URL. ' +
          'The e2e suite must use a dedicated test database.',
      );
    }
  }
  return { url, ssl: cfg.E2E_DB_SSL ?? 'true' };
}

export function venvPython(): string {
  return path.join(SERVER_DIR, 'venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
}
