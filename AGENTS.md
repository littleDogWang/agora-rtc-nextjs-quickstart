# Agent Development Guide

This repository is the Agora RTC Web one-to-one quickstart for Next.js.

## Start Here

- Read `README.md` for setup, user flows, verification, and the public-demo boundary.
- Read `docs/superpowers/specs/2026-08-26-rtc-nextjs-quickstart-design.md` before changing architecture or scope.
- Run `pnpm run verify` before declaring implementation changes complete.

## System Shape

- Next.js App Router and React
- Direct `agora-rtc-sdk-ng` integration; do not add `agora-rtc-react`
- Server-side RTC token generation through `POST /api/token`
- URL-only room identity; no room database
- Starter-aligned home, pre-join, and in-call UI

## Invariants

1. Keep `NEXT_AGORA_APP_CERTIFICATE` server-side only. Never return, log, screenshot, or bundle it.
2. Generate RTC-only tokens with `RtcTokenBuilder.buildTokenWithUid` and `RtcRole.PUBLISHER`.
3. Pass relative `3600` seconds for token and privilege expiration. Do not pass an epoch timestamp.
4. Use the same `roomId` and numeric `uid` for token generation, `client.join`, and renewal.
5. Register client event handlers before `client.join`.
6. Handle `user-published` independently for audio and video, subscribing before playback.
7. Keep exactly one RTC client per mounted room session and make cleanup idempotent.
8. Unpublish tracks, then call `stop()` and `close()` on each local track, then leave the channel.
9. A missing camera or microphone must not block the other available media type.
10. Do not add RTM, chat, AI agents, recording, screen sharing, authentication, or persistence without an explicit scope decision.

## UI Contract

- The current `agent-quickstart-nextjs` rendered UI is the first visual reference.
- Preserve its cool page background, dark interaction surface, Agora cyan CTA, Lucide icon style, in-call header, and Powered by Agora attribution.
- Keep local and remote video tile dimensions stable between waiting and peer-present states.
- Use icons and tooltips for familiar call controls. Keep visible text operational, not tutorial copy.
- Update README screenshots whenever material UI changes make existing evidence stale.

## Testing

Mock `agora-rtc-sdk-ng` at the owned module/client boundary. Tests must cover:

- correct room and UID on join
- local track publication
- independent audio and video subscription
- token renewal before expiry
- device switching and partial media failures
- cleanup ordering and idempotency
- single-client waiting and two-participant UI states

Do not mark implementation work complete without tests.

## Commands

```bash
pnpm install
pnpm run doctor
pnpm dev
pnpm run verify
```

## Documentation Synchronization

When a route, environment key, lifecycle rule, UI workflow, success condition, or deployment boundary changes, update `README.md`, this file, affected tests, and the design/plan documents in the same local change.

## Deployment Boundary

Vercel deployment is a public development demo. The token route has no application login, room authorization, or built-in rate limiting. Never describe this repository as a production token service. Production use requires authentication, room authorization, server-controlled identity and role, rate limiting, abuse controls, and monitoring.
