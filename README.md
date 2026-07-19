# Café Urbano — Digital Menu

Menú digital de [Café Urbano](https://www.instagram.com/cafeurbanobsas/) — Café & Arte, Donado 1901 (esquina Sucre), Villa Urquiza, Buenos Aires.

**Demo (prototype)**: https://jimjabid.github.io/cafe-urbano/ — `noindex` until production cutover.

Astro 5 static · Tailwind CSS v4 · GSAP · React island for the menu (sticky category filter + accordion). All menu content lives in content collections — Decap CMS gets wired at production (DecapBridge).

## Edit the menu

- **Items**: `src/content/dishes/*.md` — one file per item (`name`, `price`, `category`, `variant`, `description`, `image`, `order`, `available`)
- **Categories**: `src/content/categories/*.yaml` — title, order, accent dot color, note
- **Promo banners**: `src/content/promos/*.yaml`
- **Business facts** (address, hours, IG, greeting): `src/content/site/settings.yaml`

Set `available: false` on a dish to hide it without deleting it.

## Develop

```bash
npm install
npm run dev
npm run build   # + npx tsc --noEmit before committing
```

Deploys to GitHub Pages on push to `main` (`.github/workflows/deploy.yml`).

Brief and menu source data: `agency-harness/projects/cafe-urbano/`.
