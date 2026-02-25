# WarpCMS Deploy

Deploy WarpCMS headless CMS to Cloudflare Workers in one click.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/badmuriss/warpcms-deploy)

## What is WarpCMS?

WarpCMS is a minimal, edge-native headless CMS for Cloudflare Workers. Content types: images, PDFs, text, HTML, and files for download. Fork of [SonicJS](https://github.com/SonicJs-Org/sonicjs).

## Quick Start

### One-Click Deploy

Click the button above. Cloudflare will provision a D1 database, R2 bucket, and deploy your CMS.

### Manual Setup

```bash
git clone https://github.com/badmuriss/warpcms-deploy.git
cd warpcms-deploy
npm install
npm run dev
# Visit http://localhost:8787
```

### Database Setup

```bash
wrangler d1 create warpcms-db
# Update wrangler.toml with the database_id

wrangler r2 bucket create warpcms-media

npm run db:migrate
```

## Project Structure

```
src/
  index.ts              # Entry point
  collections/          # Your content collections
wrangler.toml           # Cloudflare config
package.json
```

## Adding Collections

Create files in `src/collections/` and register in `src/index.ts`:

```typescript
import { createWarpCMSApp, registerCollections } from '@warpcms/core'
import myCollection from './collections/my-collection'

registerCollections([myCollection])
export default createWarpCMSApp({ collections: { autoSync: true } })
```

## License

MIT
