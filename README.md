# WarpCMS

Minimal, edge-native headless CMS for Cloudflare Workers. Fork of [WarpCMS](https://github.com/SonicJs-Org/warpcms).

## What is WarpCMS?

WarpCMS is a TypeScript-first headless CMS built for Cloudflare Workers. Manages content (images, PDFs, text, HTML, files) with a built-in admin UI.

- D1 (SQLite) for data
- R2 for file storage
- Zero cold starts
- Admin dashboard included

## Quick Deploy

See [`deploy/`](./deploy/) for one-click Cloudflare Workers deployment.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/badmuriss/warpcms-deploy)

## Monorepo Structure

```
warpcms/
  packages/
    core/         # @warpcms/core - CMS framework
    create-app/   # CLI scaffolder
  deploy/         # Standalone deploy template
```

## Development

```bash
npm install
npm run build:core
npm run dev
```

## License

MIT
