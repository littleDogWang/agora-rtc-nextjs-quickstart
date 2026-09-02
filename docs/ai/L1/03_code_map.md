# 03 Code Map

> Directory and module responsibilities for navigating this quickstart.

## Directory Tree

```text
app/          Next.js pages and token API
components/   pre-join, in-call, controls, devices, and visual shell
lib/          room identity, tokens, devices, and RTC lifecycle
scripts/      local environment doctor
tests/        token, RTC, device, room, and UI contracts
public/       Agora marks and favicon
.github/      CI, Docker CI, and README assets
docs/ai/      progressive coding-agent context
```

## Core Files

- `app/api/token/route.ts`: HTTP token contract
- `components/room-experience.tsx`: device and call state machine
- `lib/token.ts`: publisher token construction
- `lib/rtc-session.ts`: join, media events, renewal, cleanup
- `lib/media-devices.ts`: track and device ownership
- `lib/room-id.ts`: UUID and numeric UID validation
- `next.config.mjs`: Next.js and standalone build configuration

## Ownership Map

README owns user operation, ARCHITECTURE owns topology, AGENTS owns Agent
constraints, RECIPE owns extension contracts, CI owns canonical project checks,
and Dockerfile plus Docker workflow own container packaging.

## Related Deep Dives

None.
