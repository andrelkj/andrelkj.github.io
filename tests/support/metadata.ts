import type { Page } from '@playwright/test';

/** Result of parsing one JSON-LD block: the value, or the parse error. */
export type JsonLdBlock =
  { readonly ok: true; readonly value: unknown } | { readonly ok: false; readonly error: string };

/** Search/social metadata from <head>, plus every JSON-LD block parsed. Missing tags are null. */
export interface PageMetadata {
  readonly description: string | null;
  readonly canonical: string | null;
  readonly og: Readonly<Record<'title' | 'description' | 'url' | 'type', string | null>>;
  readonly jsonLd: readonly JsonLdBlock[];
}

export async function readMetadata(page: Page): Promise<PageMetadata> {
  return page.evaluate(() => {
    const attr = (selector: string, name: string): string | null =>
      document.head.querySelector(selector)?.getAttribute(name) ?? null;
    const og = (property: string): string | null =>
      attr(`meta[property="og:${property}"]`, 'content');
    return {
      description: attr('meta[name="description"]', 'content'),
      canonical: attr('link[rel="canonical"]', 'href'),
      og: { title: og('title'), description: og('description'), url: og('url'), type: og('type') },
      jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => {
        try {
          return { ok: true, value: JSON.parse(s.textContent) as unknown } as const;
        } catch (error) {
          return { ok: false, error: String(error) } as const;
        }
      }),
    };
  });
}
