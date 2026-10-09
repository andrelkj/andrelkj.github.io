/**
 * Waits until the live site serves this commit's index.html, byte for byte.
 * Pages' CDN can keep serving the previous deploy for a short while; smoke-testing that would
 * prove nothing about the new deploy.
 *
 *   node scripts/ci/wait-for-live.mjs <url> [attempts=12] [intervalSeconds=10]
 */
import { readFileSync } from 'node:fs';

const [url, attempts = '12', interval = '10'] = process.argv.slice(2);
if (!url) {
  console.error('Usage: wait-for-live.mjs <url> [attempts] [intervalSeconds]');
  process.exit(2);
}
const expected = readFileSync('index.html', 'utf8');

for (let attempt = 1; attempt <= Number(attempts); attempt++) {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (response.ok && (await response.text()) === expected) {
      console.log(`${url} serves this commit's index.html (attempt ${String(attempt)}).`);
      process.exit(0);
    }
    console.log(
      `Attempt ${String(attempt)}: HTTP ${String(response.status)}, not this commit yet.`,
    );
  } catch (error) {
    console.log(`Attempt ${String(attempt)}: ${String(error)}`);
  }
  await new Promise((resolve) => setTimeout(resolve, Number(interval) * 1000));
}
console.error(`${url} still doesn't serve this commit's index.html.`);
process.exit(1);
