import type { Locator, Page } from '@playwright/test';
import type { Lang } from '../support/types';

/** At this width and below the nav becomes a tab bar and the header hides on scroll (styles.css). */
export const COMPACT_MAX_WIDTH = 820;

/** Sections linked from the primary nav, in page order. */
export const NAV_SECTIONS = ['about', 'experience', 'work', 'stack', 'contact'] as const;
export type NavSection = (typeof NAV_SECTIONS)[number];

/** Every content section with an id, in page order (hero excluded). */
export const SECTIONS = [
  'about',
  'experience',
  'work',
  'built-with-ai',
  'stack',
  'education',
  'contact',
] as const;
export type Section = (typeof SECTIONS)[number];

/**
 * The sticky header: brand, primary nav, language switch and theme toggle.
 *
 * Locators are language-independent on purpose, so the same page object works in EN and PT:
 * nav links are found by their target (`href`), the toggle by an EN|PT name pattern.
 */
export class TopBar {
  readonly root: Locator;
  readonly nav: Locator;
  readonly languageSwitch: Locator;
  readonly themeToggle: Locator;
  /** The section links of the primary nav, in order (the brand link is not included). */
  readonly navLinks: Locator;
  /** The nav link(s) currently marked `aria-current` (should always be at most one). */
  readonly currentNavLink: Locator;

  constructor(page: Page) {
    this.root = page.getByRole('banner');
    this.nav = this.root.getByRole('navigation', { name: /^(Primary|Principal)$/ });
    this.navLinks = this.nav.getByRole('list').getByRole('link');
    this.currentNavLink = this.nav.locator('a[aria-current="true"]');
    this.languageSwitch = this.root.getByRole('group', { name: /^(Language|Idioma)$/ });
    this.themeToggle = this.root.getByRole('button', { name: /theme|tema/i });
  }

  /** Nav link that points at a section, whatever language it is displayed in. */
  navLink(section: NavSection): Locator {
    return this.nav.locator(`a[href="#${section}"]`);
  }

  /** The sun (shown in dark theme) or moon (shown in light theme) icon inside the toggle. */
  themeIcon(icon: 'sun' | 'moon'): Locator {
    return this.themeToggle.locator(`svg.icon-${icon}`);
  }

  /** The EN or PT button of the language switch. */
  languageButton(lang: Lang): Locator {
    return this.languageSwitch.getByRole('button', { name: lang.toUpperCase(), exact: true });
  }
}

/** The portfolio is a single page; this object is the only place that knows its structure. */
export class PortfolioPage {
  readonly page: Page;
  readonly topBar: TopBar;
  /** `<html>`: carries `data-theme` and `lang`. */
  readonly html: Locator;
  readonly main: Locator;
  readonly heading: Locator;
  /** The `h2` of every content section, in page order. */
  readonly sectionHeadings: Locator;
  readonly skipLink: Locator;
  readonly footer: Locator;
  readonly footerYear: Locator;

  constructor(page: Page) {
    this.page = page;
    this.topBar = new TopBar(page);
    this.html = page.locator('html');
    this.main = page.getByRole('main');
    this.heading = page.getByRole('heading', { level: 1 });
    this.sectionHeadings = this.main.getByRole('heading', { level: 2 });
    this.skipLink = page.locator('a.skip-link');
    this.footer = page.getByRole('contentinfo');
    this.footerYear = this.footer.locator('#year');
  }

  /** Opens the page and waits for script.js to finish its first language pass. */
  async goto(): Promise<void> {
    await this.page.goto('/');
    // script.js sets aria-pressed on the language buttons during init; once one is pressed,
    // translations and labels have been applied.
    await this.topBar.languageSwitch.locator('[aria-pressed="true"]').waitFor();
    await this.waitForIntroAnimations();
  }

  /**
   * Waits until every finite CSS animation has finished (the hero's line-by-line reveal takes
   * ~2.8 s). Half-faded text would give axe false contrast failures and make screenshots flaky.
   * Infinite animations (blinking caret, status dot) are decorative and ignored.
   */
  async waitForIntroAnimations(): Promise<void> {
    await this.page.waitForFunction(() =>
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .every((animation) => animation.playState === 'finished'),
    );
  }

  /** Every link on the page whose href is exactly `href`. */
  linksTo(href: string): Locator {
    return this.page.locator(`a[href="${href}"]`);
  }

  /**
   * Waits for web fonts and reports whether Inter and JetBrains Mono actually loaded. Screenshots
   * taken with fallback fonts would differ from the baselines for reasons unrelated to the site.
   */
  async webFontsLoaded(): Promise<boolean> {
    return this.page.evaluate(async () => {
      await document.fonts.ready;
      return (
        document.fonts.check('400 16px Inter') && document.fonts.check('400 16px "JetBrains Mono"')
      );
    });
  }

  /**
   * Clip for a full-page screenshot, rounded down to whole pixels. The page is 6948.23px tall;
   * Chromium's full-page capture rounds that fractional height inconsistently (6948 vs 6949
   * between consecutive shots), so the screenshot never stabilizes without a fixed clip.
   */
  async fullPageClip(): Promise<{ x: number; y: number; width: number; height: number }> {
    return this.page.evaluate(() => ({
      x: 0,
      y: 0,
      width: document.documentElement.clientWidth,
      height: Math.floor(document.body.getBoundingClientRect().height),
    }));
  }

  /** A content section by id. */
  section(id: Section): Locator {
    return this.page.locator(`section#${id}`);
  }

  /** Scrolls the window to `y` instantly (the page uses smooth scrolling by default). */
  async scrollTo(y: number): Promise<void> {
    await this.page.evaluate((top) => {
      window.scrollTo({ top, behavior: 'instant' });
    }, y);
  }

  /** Scrolls a section to the top, as following its link would (respects scroll-padding). */
  async scrollToSection(id: Section): Promise<void> {
    await this.section(id).evaluate((el) => {
      el.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  }

  /** Scrolls to the very bottom of the page. */
  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
    });
  }

  async switchLanguage(lang: Lang): Promise<void> {
    await this.topBar.languageButton(lang).click();
  }

  async toggleTheme(): Promise<void> {
    await this.topBar.themeToggle.click();
  }
}
