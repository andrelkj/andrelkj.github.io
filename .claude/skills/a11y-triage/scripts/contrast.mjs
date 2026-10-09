#!/usr/bin/env node
/**
 * WCAG 2.x contrast ratios, computed exactly instead of guessed.
 *
 *   node contrast.mjs '#5b6b65' '#f6f8f7'     one foreground / background pair
 *   node contrast.mjs --tokens [styles.css]   every text token vs every background token, both themes
 *
 * Thresholds: AA 4.5 (normal text), AA 3.0 (large text ≥ 24px, or ≥ 18.66px bold; and UI parts).
 */
import { readFileSync } from 'node:fs';

function parseHex(hex) {
  const h = hex.trim().replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  if (!/^[0-9a-f]{6}$/i.test(full)) throw new Error(`Not a hex color: ${hex}`);
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}

function luminance([r, g, b]) {
  const channel = (v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(fg, bg) {
  const [a, b] = [luminance(parseHex(fg)), luminance(parseHex(bg))].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

function verdict(ratio) {
  if (ratio >= 4.5) return 'AA ✓';
  if (ratio >= 3) return 'AA large only';
  return 'FAIL';
}

/** Reads `--name: #hex;` tokens from a CSS block. */
function tokens(block) {
  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{3,6})\s*;/gi)].map((m) => [m[1], m[2]]),
  );
}

function tokenReport(cssPath) {
  const css = readFileSync(cssPath, 'utf8');
  const dark = tokens(css.match(/:root\s*\{([^}]*)\}/)?.[1] ?? '');
  const light = {
    ...dark,
    ...tokens(css.match(/:root\[data-theme="light"\]\s*\{([^}]*)\}/)?.[1] ?? ''),
  };
  const texts = ['text', 'text-muted', 'text-dim', 'accent', 'accent-strong'];
  const backgrounds = ['bg', 'bg-elev', 'surface', 'surface-2'];
  for (const [theme, t] of [
    ['dark', dark],
    ['light', light],
  ]) {
    console.log(`\n${theme} theme`);
    for (const fg of texts) {
      for (const bg of backgrounds) {
        if (!t[fg] || !t[bg]) continue;
        const ratio = contrast(t[fg], t[bg]);
        console.log(
          `  --${fg} ${t[fg]} on --${bg} ${t[bg]}: ${ratio.toFixed(2)}:1  ${verdict(ratio)}`,
        );
      }
    }
    if (t['accent-ink'] && t.accent) {
      const ratio = contrast(t['accent-ink'], t.accent);
      console.log(`  --accent-ink on --accent (buttons): ${ratio.toFixed(2)}:1  ${verdict(ratio)}`);
    }
  }
}

const args = process.argv.slice(2);
if (args[0] === '--tokens') {
  tokenReport(args[1] ?? 'styles.css');
} else if (args.length === 2) {
  const ratio = contrast(args[0], args[1]);
  console.log(`${args[0]} on ${args[1]}: ${ratio.toFixed(2)}:1  ${verdict(ratio)}`);
} else {
  console.error("Usage: contrast.mjs '#fg' '#bg'  |  contrast.mjs --tokens [styles.css]");
  process.exit(2);
}
