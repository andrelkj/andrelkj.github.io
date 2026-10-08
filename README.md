# andrelkj.github.io

Personal portfolio of **André Kreutzer** — Sr. QA Engineer / SDET (Playwright · C# · API · Mobile · AI-assisted QA).

Live: https://andrelkj.github.io/

## Stack

Plain HTML, CSS and vanilla JavaScript — no build step.

- `index.html` — page content (English copy lives here)
- `script.js` — PT-BR translations, language/theme toggles, mobile menu, active-section nav
- `styles.css` — design tokens (dark + light themes) and layout
- `assets/` — resume PDF and favicon

## Preview locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml`, which publishes the site files to GitHub Pages
(repo **Settings → Pages → Source: GitHub Actions**).

## Editing content

To change copy, edit the text in `index.html`, then update the matching `data-i18n` key in the `PT` dictionary in `script.js`.
Screen-reader labels work the same way: an element with `aria-label` gets a `data-i18n-label` key, and its PT value goes in the same dictionary.
Text that should stay identical in both languages (names, tools, code) has no key; the test suite keeps an approved list of it in `tests/data/i18n-fixed-text.ts`.
