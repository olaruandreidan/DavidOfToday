# David of Today

A mobile-first, installable daily reflection game for one recipient. Onboarding places the respondent on four bipolar value tensions from 40 validated observations. One broad reflection plus one balanced random prompt can then move each axis by at most two points per day. There is no backend, account, analytics, synchronization, or notification service.

## Quick start

```bash
npm install
npm run dev
```

Run `npm test`, `npm run build`, and `npm run test:e2e` before deployment. See [CREATOR_MANUAL.md](./CREATOR_MANUAL.md) for tuning, architecture, data safety, testing, and extension details.

For a local end-to-end smoke test without answering all 28 onboarding questions, run `npm run dev:quick`. This mode shows one real scenario, marks the remaining answers as skipped neutral evidence, and still uses the selected provider’s real API, strict tool response, scoring, storage, results screen, and four-axis visualization. Its scores are a functional preview, not a meaningful profile.

The app supports Anthropic and OpenAI as interchangeable judge providers. Game data lives in browser `localStorage`; each provider key is stored separately in `localStorage` or `sessionStorage`, according to the recipient’s choice, and keys are never part of an export. This static direct-key architecture exposes keys to same-origin JavaScript and browser extensions, so use a reviewed build and restricted, spend-limited project keys.
