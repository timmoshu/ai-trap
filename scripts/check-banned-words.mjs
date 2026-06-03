#!/usr/bin/env node
/**
 * CI gate (PRD FR-4.3): the words "economist-proof" and "backtest" are banned
 * from product copy. We use "transparency" and "directional sign check" instead.
 * This script fails the build if either appears in user-facing source.
 * It scans app/, components/, styles/, and lib/ — NOT itself, node_modules, or planning docs.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOTS = ['app', 'components', 'styles', 'lib'];
const EXfTS = new Set(['.ts', '.tsx', '.css', '.md', '.mdx']);
const BANNED = [/economist[-\s]?proof/i, /\bbacktest(s|ed|ing)?\b/i];

let hits = 0;
function walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      walk(p);
    } else if (EXfTS.has(extname(p))) {
      const text = readFileSync(p, 'utf8');
      for (const re of BANNED) {
        const m = text.match(re);
        if (m) {
          const line = text.slice(0, m.index).split('\n').length;
          console.error(`✗ banned word "${m[0]}" found at ${p}:${line}`);
          hits++;
        }
      }
    }
  }
}

for (const r of ROOTS) walk(r);

if (hits > 0) {
  console.error(
    `\nBanned-words check FAILED (${hits} hit${hits > 1 ? 's' : ''}). Use "transparency" / "directional sign check".`,
  );
  process.exit(1);
}
console.log('✓ banned-words check passed (no "economist-proof" / "backtest" in product copy)');
