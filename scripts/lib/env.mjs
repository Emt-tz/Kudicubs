// Connection settings for the local KudiCubs stack. Env vars win; otherwise `supabase status -o env`.
import { execSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

export function loadEnv() {
  let st = {};
  if (!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_ANON_KEY)) {
    const out = execSync('supabase status -o env', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
    for (const line of out.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/);
      if (m) st[m[1]] = m[2];
    }
  }
  return {
    url: process.env.SUPABASE_URL || st.API_URL,
    anonKey: process.env.SUPABASE_ANON_KEY || st.ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || st.SERVICE_ROLE_KEY,
    mailUrl: process.env.MAILPIT_URL || st.MAILPIT_URL || 'http://127.0.0.1:56324',
    root,
  };
}
