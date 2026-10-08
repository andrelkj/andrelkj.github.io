import type { Page } from '@playwright/test';

export type LinkKind = 'anchor' | 'asset' | 'external' | 'mailto';

/** One `<a href>` on the page, as the browser sees it. */
export interface PageLink {
  /** The href attribute exactly as written in the HTML. */
  readonly href: string;
  /** The absolute URL the browser resolves it to. */
  readonly url: string;
  readonly text: string;
  readonly target: string | null;
  readonly rel: string | null;
  readonly download: boolean;
  readonly kind: LinkKind;
}

/** Collects every link on the page and classifies it. */
export async function collectLinks(page: Page): Promise<PageLink[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll('a[href]')].map((a) => {
      const anchor = a as HTMLAnchorElement;
      const href = anchor.getAttribute('href') ?? '';
      const kind = href.startsWith('#')
        ? 'anchor'
        : href.startsWith('mailto:')
          ? 'mailto'
          : new URL(anchor.href).origin === location.origin
            ? 'asset'
            : 'external';
      return {
        href,
        url: anchor.href,
        text: anchor.textContent.replace(/\s+/g, ' ').trim(),
        target: anchor.getAttribute('target'),
        rel: anchor.getAttribute('rel'),
        download: anchor.hasAttribute('download'),
        kind,
      } as const;
    }),
  );
}

/**
 * Lists links that are unsafe or fragile:
 * - opening a new tab without rel="noopener" (or "noreferrer", which implies it),
 * - external links over plain http.
 */
export function findUnsafeLinks(links: readonly PageLink[]): string[] {
  const problems: string[] = [];
  for (const link of links) {
    const rel = (link.rel ?? '').split(/\s+/);
    if (link.target === '_blank' && !rel.includes('noopener') && !rel.includes('noreferrer')) {
      problems.push(`${link.href}: target="_blank" without rel="noopener"`);
    }
    if (link.kind === 'external' && link.url.startsWith('http://')) {
      problems.push(`${link.href}: external link is not https`);
    }
  }
  return problems;
}

/** Lists in-page links (`#id`) that point at an id that doesn't exist. `#` alone is ignored. */
export async function findBrokenAnchors(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll('a[href^="#"]')]
      .map((a) => a.getAttribute('href') ?? '')
      .filter(
        (href) => href.length > 1 && !document.getElementById(decodeURIComponent(href.slice(1))),
      )
      .map((href) => `${href}: no element with this id`),
  );
}

/** An icon declared in <head> with `<link rel="icon">` (any rel containing "icon"). */
export interface DeclaredIcon {
  /** Absolute URL. */
  readonly url: string;
  /** The declared `type` attribute, e.g. "image/svg+xml", or null when absent. */
  readonly type: string | null;
}

/** Reads every icon the page declares, so new icons are covered without editing tests. */
export async function collectIcons(page: Page): Promise<DeclaredIcon[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')].map((link) => ({
      url: link.href,
      type: link.getAttribute('type'),
    })),
  );
}

/**
 * Returns the root element name of an SVG document ("svg" when valid), or "parsererror"
 * when the text isn't well-formed SVG/XML. Parsed in the browser with DOMParser.
 */
export async function svgRootName(page: Page, svgText: string): Promise<string> {
  return page.evaluate((text) => {
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    return doc.querySelector('parsererror') ? 'parsererror' : doc.documentElement.nodeName;
  }, svgText);
}
