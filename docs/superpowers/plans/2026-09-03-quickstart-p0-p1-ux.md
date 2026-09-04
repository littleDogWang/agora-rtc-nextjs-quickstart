# Quickstart P0/P1 UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make inviting the second participant obvious, default device handling automatic, and Node.js compatibility bounded and continuously verified.

**Architecture:** A shared invite button owns clipboard behavior and feedback, while pre-join and connected waiting views decide where it appears. Device selection remains available but moves behind the existing settings interaction so browser-selected devices are the default path. Runtime support is expressed once as supported LTS major lines and mirrored by doctor, CI, and documentation.

**Tech Stack:** Next.js 16, React 19, TypeScript, Agora RTC Web SDK, Vitest, Testing Library, GitHub Actions.

---

### Task 1: Visible invitation workflow

**Files:**
- Create: `components/invite-button.tsx`
- Modify: `components/pre-join.tsx`
- Modify: `components/call-view.tsx`
- Modify: `components/call-controls.tsx`
- Modify: `components/video-tile.tsx`
- Test: `tests/starter-ui.test.tsx`

- [x] Add failing component tests asserting a visible `Copy invite link` action before join, an `Invite participant` action while waiting, and copied feedback after clipboard success.
- [x] Run `pnpm test -- tests/starter-ui.test.tsx` and confirm the new assertions fail.
- [x] Add a reusable invite button that writes `window.location.href`, reports copied state, and exposes a labelled icon-only mode for the compact control bar.
- [x] Render the shared button on pre-join, inside the empty remote-participant tile, and in the compact in-call control bar.
- [x] Run `pnpm test -- tests/starter-ui.test.tsx` and confirm all invitation tests pass.

### Task 2: Automatic devices with optional manual settings

**Files:**
- Modify: `components/pre-join.tsx`
- Modify: `components/room-experience.tsx`
- Test: `tests/starter-ui.test.tsx`
- Test: `tests/media-devices.test.ts`

- [x] Add a failing UI test asserting device dropdowns are hidden initially and become available through the `Select devices` control.
- [x] Run the focused starter UI test and confirm it fails.
- [x] Keep Agora track creation without explicit device IDs, retain device-change refresh and fallback, and move pre-join selectors into an on-demand settings panel.
- [x] Run focused UI and media-device tests and confirm automatic creation, partial-media behavior, switching, and listener cleanup still pass.

### Task 3: Bounded Node.js support

**Files:**
- Modify: `package.json`, `scripts/doctor.mjs`, `.github/workflows/ci.yml`
- Modify: `README.md`, `CONTRIBUTING.md`, `AGENTS.md`, `ARCHITECTURE.md`
- Modify: `docs/ai/RECIPE.md`, `docs/ai/L1/01_setup.md`, `docs/ai/L1/02_architecture.md`, `docs/ai/L1/05_workflows.md`
- Test: `tests/node-support.test.mjs`

- [x] Add tests for supported Node 22/24 and rejected Node 23/25 behavior through a pure version-support helper.
- [x] Run `pnpm test -- tests/node-support.test.mjs` and confirm it fails before the helper exists.
- [x] Set `engines.node` to `>=22 <23 || >=24 <25`, preserve Node 22 as `.nvmrc` and Docker's reference runtime, and run CI on Node 22 and 24.
- [x] Update doctor and all owning documentation to state that Node 22 and 24 LTS are supported and tested.
- [x] Run focused tests, then `pnpm run verify` under each available supported Node line.
- [x] Inspect desktop and mobile pre-join/waiting layouts in a browser and confirm controls do not overlap.

No commit or remote write is included; those require separate authorization.
