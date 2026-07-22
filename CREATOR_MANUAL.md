# David of Today — creator’s manual

This manual is for the person tuning, testing, and maintaining the game. Version 1 deliberately supports Claude only. The internal provider boundary exists to keep scoring and screens independent from Anthropic, not to imply that another provider is currently available.

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

`.github/workflows/pages.yml` runs unit tests and a production build on pushes to `main`, uploads `dist`, and deploys it with GitHub’s official Pages actions. In the repository’s **Settings → Pages**, select **GitHub Actions** as the source. No key is needed in Actions because Claude is called only from the recipient’s browser.

The PWA precaches only the compiled app shell. Anthropic POST responses are not cached, and there are no notifications. A waiting service worker produces an in-app update prompt; accepting it activates the new build. Offline mode can reopen history and drafts already stored on the device, but judging requires a network connection.

## Architecture and data flow

Important areas:

- `src/config/gameConfig.ts`: axes, question banks, draw count, default cap, and default model IDs.
- `src/config/prompts.ts`: editable, versioned baseline and daily prompt templates.
- `src/domain`: Zod schemas, revisioned storage, question cycling, scoring caps, streaks, and trend aggregation.
- `src/services/judgeClient.ts`: provider-neutral request/result contract and user-facing error categories.
- `src/services/anthropicJudgeClient.ts`: the only v1 provider implementation and its strict tool schema.
- `src/state/GameStateContext.tsx`: atomic browser persistence and cross-tab warnings.
- `src/screens` and `src/components`: routed, mobile-first UI and accessible chart equivalents.

The success path is:

1. A draft answer is written to the revisioned `GameState` in `localStorage`.
2. The screen interpolates a source-controlled prompt without the API key.
3. `JudgeClient.judge` receives a provider-neutral request.
4. Claude is forced to call `record_scores` with exactly the four configured axis IDs.
5. The Anthropic client validates the tool result with Zod.
6. Domain scoring treats those values as proposals, applies `0–100` and daily-cap boundaries, then atomically stores the successful session.
7. Only a success clears the draft and commits the pending question-cycle advance. Any API or validation failure leaves both scores and draft unchanged.

The key is read separately just before creating `AnthropicJudgeClient`. It is not in `GameState`, prompts, sessions, errors, logs, or backup files.

## Tune axes and questions

Edit `src/config/gameConfig.ts`. Version 1 expects exactly four axes. Each axis needs:

- a stable `id` used in stored data and Claude’s tool schema;
- a recipient-facing `label`;
- a clear `description` that helps Claude distinguish the dimension.

The repository starts with `Axis A` through `Axis D`. Replace all labels and descriptions before the real release. Avoid changing an axis ID after real browser data exists; an ID change is a schema migration, not a copy edit.

Question objects have a stable `id`, recipient-facing `text`, and an author-only `purpose`. Claude receives the purpose so it knows what evidence the answer is intended to reveal. Replace all 28 onboarding placeholders and all 12 rotating daily placeholders. Three fixed questions always appear in each daily check-in.

`DAILY_POOL_DRAW_COUNT` controls how many rotating questions accompany the fixed set. It must be a positive integer no larger than the pool. Pool IDs are shuffled, drawn without repetition until exhausted, and then reshuffled. A draw is placed in the daily draft, but the saved cycle advances only after a valid judgment. Reloads and retries therefore keep the same questions.

Run `npm test` after content edits. The configuration suite enforces four unique axes, 28 onboarding questions, globally unique question IDs, a valid draw count, and prompt tokens. Content changes require rebuilding and deploying. They do not mutate browser state or overwrite drafts.

## Edit and version prompts

Prompt templates and version strings live in `src/config/prompts.ts`. Keep the version string unchanged for wording-only experiments you do not need to distinguish; increment it whenever comparisons or audits should identify a new judging policy. Successful sessions record the prompt version and model ID.

Baseline tokens:

- `{{axes}}`: IDs, labels, and descriptions.
- `{{questions}}`: IDs, text, and author purposes.
- `{{answers}}`: question IDs paired with onboarding answers.

Daily tokens:

- `{{axes}}`: IDs, labels, and descriptions.
- `{{scores}}`: current absolute scores.
- `{{questions}}`: fixed and drawn question text plus purposes.
- `{{answers}}`: today’s answers.

Tokens use lowercase letters and double braces. Do not invent a token without adding its value in `src/services/prompts.ts`. Tests reject a missing required token or an unresolved/unknown token. Never interpolate credentials or unrelated stored data.

## How scoring works

The baseline is stored once with an applied score for each axis and `delta: null`. Every daily response contains four proposed absolute scores and rationales. Application code—not Claude—does the following for each axis:

1. Clamp to the global range `0–100`.
2. On the first successful check-in of a local calendar day, snapshot both the configured positive-integer cap and that day’s starting scores.
3. Clamp every check-in that day to `start score − cap` through `start score + cap`, also respecting `0–100`.
4. Calculate the displayed delta from the immediately previous applied score.

This allows honest same-day reversals while preventing cumulative check-ins from walking beyond the day’s band. A reversal can have a delta larger than the cap—for example, moving from the top of the band to its bottom—while both scores remain within the same snapshotted range. A setting change after the first success applies on the next local day. There is deliberately no configured upper bound on the positive integer cap.

When an applied value differs from Claude’s proposal, the result and history identify that axis as limited. Every successful session remains in history. Charts aggregate one point per local date by selecting the last successful entry that day. Streaks count distinct consecutive local dates, so multiple daily entries cannot inflate a streak.

## Claude models and access testing

Defaults are `claude-sonnet-5` for baseline and `claude-haiku-4-5-20251001` for daily. Edit the constants in `src/config/gameConfig.ts` to change future defaults. Existing browser settings are intentionally separate and will not be overwritten by a new build.

Setup calls Anthropic’s Models API, adds available models to the selectors, and retains configured defaults when offline. It then sends a minimal request to each distinct selected model before onboarding. Settings provides the same list/test/save operation later. Model IDs and availability change over time, so test with the recipient’s actual key rather than assuming a listed model is permitted.

The official SDK is initialized with its explicit `dangerouslyAllowBrowser: true` opt-in. A browser key is accessible to any script running on the same origin and may also be exposed by a compromised extension or device. Serve only the reviewed source build, avoid third-party runtime scripts, use a narrowly restricted/spend-limited key where the Anthropic account allows it, and rotate a key if exposure is suspected. See the [Anthropic TypeScript SDK documentation](https://platform.claude.com/docs/en/cli-sdks-libraries/sdks/typescript) and [model overview](https://platform.claude.com/docs/en/about-claude/models/overview).

Browser requests also depend on Anthropic continuing to permit SDK browser usage and CORS from the deployed origin. If browser CORS policy changes, do not weaken browser security or proxy through an untrusted service; a small trusted backend would be a separate architecture and privacy decision.

## State, reset, and repeated onboarding tests

`GameState` is schema-versioned and revisioned. It includes baseline/current scores, timestamped points, all successful sessions, question-cycle state, both drafts, settings, and daily cap snapshots. Zod validates storage before use. A malformed root is not overwritten automatically; the app loads a safe empty state and explains what happened.

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

It excludes both possible credential keys. Import reads and validates the entire file, displays a preview, and replaces game data in one revision-checked write only after confirmation. The receiving browser’s API key remains unchanged. Malformed data and future schema versions are rejected.

When changing persisted structure, increment `SCHEMA_VERSION`, define explicit old-version schemas, and write a pure migration from each supported old version to the new type. Test real exported fixtures, failed migrations, preservation of drafts/cycles/sessions, and the rule that credentials never enter migrated state. Do not merely make new fields optional indefinitely; that hides corrupt or ambiguous data.

## Debug safely

Use the History audit entry to inspect prompt version, model, token counts, proposals, applied results, cap flags, and the locally validated tool output. The raw block should contain only four scores and rationales because the strict tool schema disallows additional properties. Never add the API key, SDK request headers, full client object, or storage dump to logs or screenshots.

Common failures:

- Authentication: replace/rotate the key and test both models.
- Rate limit: wait and retry; the draft and scores are unchanged.
- Network/timeout: confirm connectivity and Anthropic status, then retry the preserved draft.
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
