// 004 T003: a static server for prototype/ using Node built-ins only. Used by the tests (Playwright webServer)
// and for local preview. Never a directory listing; 404 for anything missing.
//   node serve.mjs [--base /Kudicubs/]   (PORT env, default 4173; bound to 127.0.0.1)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { ROOT } from './lib.mjs';

const PROTO = path.join(ROOT, 'prototype');
const PORT = Number(process.env.PORT || 4173);
const baseArg = process.argv.indexOf('--base');
const baseVal = baseArg > -1 ? process.argv[baseArg + 1] : null;
if (baseArg > -1 && !baseVal) { console.error('--base needs a path, e.g. --base /Kudicubs/'); process.exit(2); }
const BASE = baseVal ? ('/' + baseVal.replace(/^\/|\/$/g, '') + '/').replace('//', '/') : '/';
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4', '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
};

const server = createServer(async (req, res) => {
  let p;
  try { p = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400).end('bad request'); return; }
  if (!p.startsWith(BASE)) { res.writeHead(404).end('not found'); return; }
  p = p.slice(BASE.length);
  if (p === '' || p.endsWith('/')) p += 'index.html';
  const file = path.normalize(path.join(PROTO, p));
  if (!file.startsWith(PROTO + path.sep)) { res.writeHead(404).end('not found'); return; }
  try {
    const s = await stat(file);
    if (!s.isFile()) throw new Error('not a file');
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache', 'content-length': body.length });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('not found');
  }
});
server.listen(PORT, '127.0.0.1', () => console.log(`prototype on http://127.0.0.1:${PORT}${BASE}`));
