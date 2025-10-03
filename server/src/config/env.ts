import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Simplified: only load server/.env (single source of truth)
const serverRoot = path.resolve(__dirname, '..', '..');
const serverEnv = path.join(serverRoot, '.env');
if (fs.existsSync(serverEnv)) {
  dotenv.config({ path: serverEnv });
}

// Optional: parse a single secret blob (e.g., injected via Secret Manager) containing newline-delimited KEY=VALUE pairs.
// If APP_ENV_BLOB is set, we parse it AFTER the file so it can override local dev values when deployed.
const blob = process.env.APP_ENV_BLOB;
if (blob) {
  // Some terminals or editors may have wrapped long lines when pasting secrets; recover by splitting on newlines
  // then further splitting any line that contains multiple KEY=VALUE sequences separated by whitespace.
  const rawLines = blob.split(/\r?\n/).filter(l => l.trim());
  const kvRegex = /([A-Z0-9_]+)=("[^"]*"|'[^']*'|[^\s]+)/g;
  for (const raw of rawLines) {
    if (raw.trim().startsWith('#')) continue;
    // If the line has multiple key=value pairs, extract them all
    let matchFound = false;
    let m: RegExpExecArray | null;
    while ((m = kvRegex.exec(raw)) !== null) {
      matchFound = true;
      const k = m[1];
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!process.env[k]) process.env[k] = v;
    }
    if (!matchFound) {
      // Fallback: attempt simple KEY=VALUE parse
      const eq = raw.indexOf('=');
      if (eq > 0) {
        const k = raw.slice(0, eq).trim();
        let v = raw.slice(eq + 1);
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
        if (!process.env[k]) process.env[k] = v;
      }
    }
  }
}

export const envLoadedPaths = fs.existsSync(serverEnv) ? [serverEnv] : [];

// Commonly accessed config helpers
export const SALES_EMAIL = process.env.SALES_EMAIL || 'sale@gmat.site';