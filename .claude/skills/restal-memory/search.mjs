#!/usr/bin/env node
// restal-memory search — hybrid retrieval over <repo>/.memory/*.md
// Usage: node search.mjs "<query>" [-k 5] [--grep]
// Semantic via local LM Studio embeddings; auto-degrades to grep if unreachable.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const here = dirname(fileURLToPath(import.meta.url));
// skill dir is <repo>/.claude/skills/restal-memory -> three levels up is repo root
const repoRoot = join(here, '..', '..', '..');
const memDir = join(repoRoot, '.memory');
const indexFile = join(memDir, '.index', 'embeddings.json');
const EMBED_URL = process.env.LMSTUDIO_EMBED_URL || 'http://localhost:1234/v1/embeddings';
const MODEL = process.env.LMSTUDIO_EMBED_MODEL || 'text-embedding-nomic-embed-text-v1.5';

// ---- args
const argv = process.argv.slice(2);
let k = 5, grepOnly = false, query = '';
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '-k') k = parseInt(argv[++i], 10) || 5;
  else if (argv[i] === '--grep') grepOnly = true;
  else query += (query ? ' ' : '') + argv[i];
}
if (!query) { console.error('usage: search.mjs "<query>" [-k N] [--grep]'); process.exit(2); }

// ---- collect sections (split on "## " headings, track line ranges)
function collectSections() {
  const out = [];
  if (!existsSync(memDir)) return out;
  for (const f of readdirSync(memDir).sort()) {
    if (!f.endsWith('.md')) continue;
    const lines = readFileSync(join(memDir, f), 'utf8').split('\n');
    let start = 0, title = '(preamble)';
    for (let i = 0; i <= lines.length; i++) {
      if (i === lines.length || /^## /.test(lines[i])) {
        const text = lines.slice(start, i).join('\n').trim();
        if (text) out.push({
          file: '.memory/' + f, title, startLine: start + 1, endLine: i,
          hash: crypto.createHash('md5').update(text).digest('hex'), text,
        });
        if (i < lines.length) { title = lines[i].slice(3).trim(); start = i; }
      }
    }
  }
  return out;
}

const sections = collectSections();
if (!sections.length) { console.log('no memory files in .memory/'); process.exit(0); }

// ---- index (lazy: re-embed only changed sections)
let index = {};
try { index = JSON.parse(readFileSync(indexFile, 'utf8')); } catch {}
const key = s => `${s.file}::${s.title}`;
const stale = sections.filter(s => !index[key(s)] || index[key(s)].hash !== s.hash);

async function embed(texts) {
  const res = await fetch(EMBED_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, input: texts }),
  });
  if (!res.ok) throw new Error('embed HTTP ' + res.status);
  return (await res.json()).data.sort(d => d.index).map(d => d.embedding);
}

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

function print(top, mode) {
  console.log(`MODE: ${mode}`);
  if (!top.length) { console.log('no matches'); return; }
  top.forEach((s, i) => {
    const preview = s.text.split('\n').slice(1).filter(l => l.trim()).slice(0, 2).join(' | ').slice(0, 160) || '(empty)';
    console.log(`${i + 1}. [${s.score.toFixed(3)}] ${s.file} :: ${s.title} (L${s.startLine}-L${s.endLine})\n   ${preview}`);
  });
}

function grepScored() {
  const tokens = query.toLowerCase().match(/[a-z0-9_]{3,}/g) || [];
  return sections.map(s => {
    const t = s.text.toLowerCase(); let score = 0;
    for (const tok of tokens) { let idx = 0; while ((idx = t.indexOf(tok, idx)) > -1) { score++; idx += tok.length; } }
    return { ...s, score };
  }).filter(s => s.score > 0).sort((a, b) => b.score - a.score);
}

try {
  if (grepOnly) throw new Error('grep-only requested');
  const vecs = await embed([...stale.map(s => s.text), query]);
  stale.forEach((s, i) => { index[key(s)] = { hash: s.hash, vector: vecs[i] }; });
  mkdirSync(dirname(indexFile), { recursive: true });
  writeFileSync(indexFile, JSON.stringify(index));
  const qv = vecs[stale.length];
  const scored = sections.map(s => ({ ...s, score: cosine(qv, index[key(s)].vector) }));
  scored.sort((a, b) => b.score - a.score);
  print(scored.slice(0, k), 'semantic');
} catch (e) {
  if (!grepOnly) console.error(`[warn] semantic unavailable (${e.message}); grep fallback`);
  print(grepScored().slice(0, k), 'grep');
}
