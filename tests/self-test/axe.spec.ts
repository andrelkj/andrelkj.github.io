import type { AxeException } from '../data/axe-exceptions';
import { expect, test } from '../fixtures/test';
import { assertExceptionsNotExpired, scanA11y } from '../support/axe';

const ACCESSIBLE = `<!doctype html><html lang="en"><head><title>ok</title></head>
<body><main><h1>Fine</h1><p style="color:#000;background:#fff">Readable text</p>
<img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="dot"></main></body></html>`;

const INACCESSIBLE = `<!doctype html><html><head><title>bad</title></head>
<body><main><h1>Broken</h1><p style="color:#bbb;background:#fff">Low contrast text</p>
<img src="data:image/gif;base64,R0lGODlhAQABAAAAACw="><button></button></main></body></html>`;

test.describe('scanA11y', () => {
  test('reports nothing on an accessible page', async ({ page }, testInfo) => {
    await page.setContent(ACCESSIBLE);
    expect(await scanA11y(page, testInfo, { exceptions: [] })).toEqual([]);
  });

  test('names each violation on an inaccessible page', async ({ page }, testInfo) => {
    await page.setContent(INACCESSIBLE);
    const ids = (await scanA11y(page, testInfo, { exceptions: [] })).map(
      (line) => line.split(' ')[0],
    );
    expect(ids).toEqual(
      expect.arrayContaining(['color-contrast', 'image-alt', 'button-name', 'html-has-lang']),
    );
  });

  test('can scan a single rule', async ({ page }, testInfo) => {
    await page.setContent(INACCESSIBLE);
    const lines = await scanA11y(page, testInfo, { rules: ['color-contrast'], exceptions: [] });
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^color-contrast \[serious\]/);
  });

  test('an exception hides only its selector', async ({ page }, testInfo) => {
    await page.setContent(INACCESSIBLE);
    const exception: AxeException = {
      rule: 'image-alt',
      selector: 'img',
      reason: 'self-test',
      owner: 'self-test',
      expires: '2999-01-01',
    };
    const ids = (await scanA11y(page, testInfo, { exceptions: [exception] })).map(
      (line) => line.split(' ')[0],
    );
    expect(ids).not.toContain('image-alt');
    expect(ids).toContain('color-contrast');
  });

  test('an exception never hides other rules on the same element', async ({ page }, testInfo) => {
    await page.setContent(INACCESSIBLE);
    const exception: AxeException = {
      rule: 'color-contrast',
      selector: 'img',
      reason: 'self-test',
      owner: 'self-test',
      expires: '2999-01-01',
    };
    const ids = (await scanA11y(page, testInfo, { exceptions: [exception] })).map(
      (line) => line.split(' ')[0],
    );
    expect(ids).toContain('image-alt');
  });
});

test.describe('assertExceptionsNotExpired', () => {
  const exception: AxeException = {
    rule: 'color-contrast',
    selector: '.x',
    reason: 'r',
    owner: 'o',
    expires: '2026-01-31',
  };

  test('accepts an exception on its last day', () => {
    expect(() => {
      assertExceptionsNotExpired([exception], new Date('2026-01-31T12:00:00Z'));
    }).not.toThrow();
  });

  test('rejects an exception after it expires', () => {
    expect(() => {
      assertExceptionsNotExpired([exception], new Date('2026-02-01T00:00:00Z'));
    }).toThrow(/Expired axe exceptions/);
  });
});
