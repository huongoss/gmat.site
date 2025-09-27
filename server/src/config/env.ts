import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables for local dev.
// Priority: repo root .env (base) then server/.env (override)
const loaded: string[] = [];

function loadIfExists(p: string) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    loaded.push(p);
  }
}

try {
  const here = __dirname; // e.g., server/dist/config at runtime
  const serverRoot = path.resolve(here, '..', '..'); // -> server
  const repoRoot = path.resolve(serverRoot, '..'); // -> repo root

  // Load base from repo root first, then override with server/.env if present
  loadIfExists(path.join(repoRoot, '.env'));
  loadIfExists(path.join(serverRoot, '.env'));
} catch {
  // ignore in production
}

export const envLoadedPaths = loaded;

// Commonly accessed config helpers
export const SALES_EMAIL = process.env.SALES_EMAIL || 'sale@gmat.site';