# David of Today — creator’s manual

This manual is for the person tuning, testing, and maintaining the game. The app supports Anthropic and OpenAI behind one provider-neutral judging boundary. Both adapters share the same tool schemas, local validation, and scoring calculations.

## Install and run

Requirements: Node.js 22 and npm 10 or newer.

```bash
npm install
npm run dev
npm test
npm run build
npm run preview
```

`npm run build` first runs the source-configuration tests, then TypeScript and the Vite production build. `npm run test:e2e` builds and previews the app at the production GitHub Pages subpath before running Playwright. The first Playwright run may require `npx playwright install chromium`.

The production base is `/DavidOfToday/`, set in `vite.config.ts`. Change it if the GitHub repository is renamed. Hash routes (`#/dashboard`, for example) make deep navigation independent of server rewrites.

## GitHub Pages deployment

`.github/workflows/pages.yml` runs unit tests and a production build on pushes to `main`, uploads `dist`, and deploys it with GitHub’s official Pages actions. In the repository’s **Settings → Pages**, select **GitHub Actions** as the source. No provider key is needed in Actions because judging calls are made only from the recipient’s browser.

The PWA precaches only the compiled app shell. Provider API responses are not cached, and there are no notifications. A waiting service worker produces an in-app update prompt; accepting it activates the new build. Offline mode can reopen history and drafts already stored on the device, but judging requires a network connection.

## Architecture and data flow

Important areas:

- `src/config/gameConfig.ts`: axes, onboarding content, and the daily question bank.
- `src/config/providers.ts`: provider metadata plus per-provider baseline and daily model defaults.
- `src/config/prompts.ts`: editable, versioned baseline and daily prompt templates.
- `src/domain`: Zod schemas, revisioned storage, balanced question cycling, conservative movement, streaks, and trend aggregation.
- `src/services/judgeClient.ts`: provider-neutral request/result contract and user-facing error categories.
- `src/services/anthropicJudgeClient.ts`: the only v1 provider implementation and its strict tool schema.
- `src/state/GameStateContext.tsx`: atomic browser persistence and cross-tab warnings.
- `src/screens` and `src/components`: routed, mobile-first UI and accessible chart equivalents.

The success path is:

1. A draft answer is written to the revisioned `GameState` in `localStorage`.
2. The screen interpolates a source-controlled prompt without the API key.
3. `JudgeClient.judge` receives a provider-neutral request.
4. Baseline judging forces the selected provider to call `record_axis_evidence`; daily judging forces `record_daily_movement` with one integer delta from `−2` through `+2` per axis.
5. The selected adapter passes the tool arguments into the shared protocol, which validates them with Zod, averages baseline observations, or adds daily deltas to current scores locally.
6. Domain scoring enforces global boundaries and one successful daily check-in per local date, then atomically stores the session.
7. Only a success clears the draft and commits the pending question-cycle advance. Any API or validation failure leaves both scores and draft unchanged.

The selected provider’s key is read separately just before the provider factory creates a judge client. Keys are not in `GameState`, prompts, sessions, errors, logs, or backup files.

## Tune axes and questions

Edit `src/config/gameConfig.ts`. Version 1 expects exactly four axes. Each axis needs:

- a stable `id` used in stored data and the shared judge tool schema;
- a recipient-facing bipolar `label` plus explicit left and right endpoint labels;
- a neutral `description` that makes both endpoints defensible and distinguishable.

The configured axes are bipolar orientations, not growth grades: `0` names the left endpoint and `100` the right. Avoid changing an axis ID after real browser data exists; an ID change is a schema migration, not a copy edit.

Question objects have a stable `id`, recipient-facing `text`, and prompt-only `purpose`. Onboarding questions declare one or two mapped `axisIds`; validation requires 16 single-axis questions, 12 paired questions, every pair exactly twice, and ten observations per axis. Each daily check-in contains one fixed open reflection plus one of 120 targeted prompts. The targeted bank contains 30 questions per axis: ten left probes, ten right probes, and ten contextual tension probes.

The daily deck consists of 30 randomized four-question blocks, each containing one prompt per axis. One prompt is drawn per check-in without repetition until all 120 are exhausted. A draw is placed in the draft, but the saved cycle advances only after a valid judgment. Reloads and retries therefore keep the same prompt. Obsolete placeholder IDs and old six-question drafts are discarded when a new daily draft is prepared.

Run `npm test` after content edits. The configuration suite enforces four unique axes, 28 onboarding questions, the required mapping distribution, globally unique question IDs, a valid draw count, and prompt tokens. Content changes require rebuilding and deploying. They do not mutate browser state or overwrite drafts; clear test-era baselines before interpreting scores under changed axis meanings.

## Edit and version prompts

Prompt templates and version strings live in `src/config/prompts.ts`. Keep the version string unchanged for wording-only experiments you do not need to distinguish; increment it whenever comparisons or audits should identify a new judging policy. Successful sessions record the provider, prompt version, and model ID.

Baseline tokens:

- `{{axes}}`: IDs, labels, and descriptions.
- `{{questions}}`: IDs, text, and author purposes.
- `{{answers}}`: question IDs paired with onboarding answers.

The baseline prompt treats `0` as the left endpoint, `50` as mixed or context-dependent evidence, and `100` as the right endpoint. The judge records one integer observation for every declared question-axis mapping. The client rejects missing, extra, fractional, or out-of-range observations, then calculates and rounds each ten-observation arithmetic mean locally. Neither endpoint nor the midpoint is treated as morally superior.

Daily tokens:

- `{{axes}}`: IDs, labels, and descriptions.
- `{{scores}}`: current absolute scores.
- `{{questions}}`: fixed and drawn question text plus purposes.
- `{{answers}}`: today’s answers.

The daily prompt treats current scores as a strong prior and zero movement as normal. The fixed answer may inform any axis; the targeted answer primarily informs its mapped axis and may spill over only with explicit, concrete evidence. Bare yes/no answers, aspirations, hypotheticals, eloquence, and ambiguous material produce no movement.

Tokens use lowercase letters and double braces. Do not invent a token without adding its value in `src/services/prompts.ts`. Tests reject a missing required token or an unresolved/unknown token. Never interpolate credentials or unrelated stored data.

## How scoring works

The baseline is stored once with a locally calculated score for each axis and `delta: null`; its safe raw tool output contains validated observations and short rationales. For a daily response, the judge supplies only strict integer deltas. The client validates `−2…+2`, adds each delta to the corresponding current score, and clamps at `0…100`. Domain logic verifies the movement again and rejects a second daily session for the same local date.

Every successful daily session remains in history with provider, model, before/after values, and the safe raw delta output. Streaks count consecutive local dates. The legacy `dailyCap` and `dailyCaps` fields remain in schema version 2 for compatibility but are inert and no longer appear as controls.

## Providers, models, and access testing

Anthropic defaults are `claude-sonnet-5` for baseline and `claude-haiku-4-5-20251001` for daily. OpenAI defaults are `gpt-5.6-sol` for baseline and `gpt-5.6-luna` for daily. Edit `src/config/providers.ts` to change future defaults. Existing browser settings are intentionally separate and will not be overwritten by a new build.

Setup calls the selected provider’s Models API, adds relevant models to the selectors, and retains configured defaults when no list is available. It then sends a minimal request to each distinct selected model before onboarding. OpenAI’s test uses a forced strict function call so a text-only but tool-incompatible model cannot be saved accidentally. Settings provides the same list/test/save operation later. Model IDs and availability change over time, so test with the recipient’s actual key rather than assuming a listed model is permitted.

Both official SDKs are initialized with their explicit `dangerouslyAllowBrowser: true` opt-in. A browser key is accessible to any script running on the same origin and may also be exposed by a compromised extension or device. Serve only the reviewed source build, avoid third-party runtime scripts, use narrowly restricted and spend-limited project keys, and rotate a key if exposure is suspected. OpenAI explicitly recommends routing production requests through a trusted backend rather than deploying API keys in browsers; direct keys are retained here because this is the chosen static personal-app architecture. See the [OpenAI key-safety guidance](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safet) and [Anthropic TypeScript SDK documentation](https://platform.claude.com/docs/en/cli-sdks-libraries/sdks/typescript).

Browser requests depend on each provider continuing to permit SDK browser usage and CORS from the deployed origin. If browser CORS policy changes, do not weaken browser security or proxy through an untrusted service; a small trusted backend would be a separate architecture and privacy decision.

## State, reset, and repeated onboarding tests

`GameState` is schema-versioned and revisioned. It includes baseline/current scores, timestamped points, all successful sessions, question-cycle state, both drafts, settings, and inert legacy cap fields. Zod validates storage before use. A malformed root is not overwritten automatically; the app loads a safe empty state and explains what happened.

Each write checks the stored revision. A stale tab is rejected rather than silently overwriting newer answers. A browser `storage` event also warns the open tab. For reliable manual testing, use one tab or reload after seeing the warning.

To repeat onboarding safely:

1. Export a backup in Settings if current results matter.
2. Use **Clear everything**, type `CLEAR`, and confirm.
3. Re-enter a test API key and complete setup.

For developer-only resets, clear the site’s local and session storage in browser DevTools, then unregister the service worker/cache if you also need to test first-install behavior. Clearing in-app data does not uninstall the PWA. Avoid manually editing production state because revisions and Zod invariants are intentional.

## Backups and schema migrations

An export is JSON with:

- `kind: "david-of-today-backup"`;
- the supported `schemaVersion`;
- an ISO `exportedAt` timestamp;
- a complete validated `state` object.

It excludes every local and session credential key for both providers. Import reads and validates the entire file, migrates supported v1 data to v2, displays a preview, and replaces game data in one revision-checked write only after confirmation. The receiving browser’s provider keys remain unchanged. Malformed data and future schema versions are rejected.

When changing persisted structure, increment `SCHEMA_VERSION`, define explicit old-version schemas, and write a pure migration from each supported old version to the new type. Test real exported fixtures, failed migrations, preservation of drafts/cycles/sessions, and the rule that credentials never enter migrated state. Do not merely make new fields optional indefinitely; that hides corrupt or ambiguous data.

## Debug safely

Use the History audit entry to inspect prompt version, model, token counts, before/after values, and the locally validated tool output. Baseline raw output contains only the exact mapped observations and four rationales; daily raw output contains only four deltas and rationales. Both strict tool schemas reject additional properties. Never add the API key, SDK request headers, full client object, or storage dump to logs or screenshots.

Common failures:

- Authentication: replace/rotate the key and test both models.
- Rate limit: wait and retry; the draft and scores are unchanged.
- Network/timeout: confirm connectivity and the selected provider’s status, then retry the preserved draft.
- Unavailable model: refresh the Models list and select one the key can access.
- Malformed response: keep the draft, inspect only the validated safe tool block if present, and refine prompt/schema tests. Never bypass local Zod validation to “make it work.”
- Old UI after deploy: accept the in-app update, or close every installed-app tab so the waiting worker can activate.

## Extension guide: another provider (not v1 functionality)

Do not add provider conditionals to screens or scoring. Implement the `JudgeClient` interface in `src/services/judgeClient.ts`:

```ts
interface JudgeClient {
  judge(request: JudgmentRequest): Promise<JudgeResult>
  listModels(): Promise<Array<{ id: string; name: string }>>
  testModel(modelId: string): Promise<void>
}
```

The implementation must force or otherwise guarantee exactly four known axes, validate `0–100` scores and nonempty rationales locally, normalize token usage, return a credential-free raw output, classify provider failures, and never mutate game state. Add a factory above the screen layer only after provider settings and credential isolation have a designed schema. Keep cap application, deltas, streaks, trends, history, and UI provider-neutral. Add mock-response unit coverage and full retry/no-mutation tests before making the provider selectable. This is an extension path, not a hidden or partially supported v1 feature.
