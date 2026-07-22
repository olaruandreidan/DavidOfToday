# David of Today

A mobile-first, installable daily reflection game for one recipient. Claude proposes four-axis scores; the app validates and constrains them locally. There is no backend, account, analytics, synchronization, or notification service.

## Quick start

```bash
npm install
npm run dev
```

Run `npm test`, `npm run build`, and `npm run test:e2e` before deployment. See [CREATOR_MANUAL.md](./CREATOR_MANUAL.md) for tuning, architecture, data safety, testing, and extension details.

The app stores game data in browser `localStorage`. The Anthropic key is stored separately in `localStorage` or `sessionStorage`, according to the recipient’s choice, and is never part of an export.

