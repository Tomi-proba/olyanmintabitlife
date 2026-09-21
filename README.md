# Second Chance

A mobile life-simulation game, in the spirit of BitLife: live an entire life
one year at a time, making choices that shape your character. Built with
React Native, Expo, and TypeScript. All names, UI, and art are original.

## Status

Phase 1 of 6 complete: project setup, character creation, the main life
feed, the Age +1 loop, core stats (Happiness/Health/Smarts/Looks), death and
a life-summary screen, and autosave/continue via AsyncStorage. Family,
schools, careers, relationships, health, crime, and the full random-event
system land in later phases — see the project's task list for the roadmap.

## Requirements

- Node.js 20+
- npm

## Setup

```bash
npm install
npx expo start
```

This opens the Expo dev tools. From there you can run the app:

- Press `w` for web
- Press `i` for iOS simulator (macOS only)
- Press `a` for Android emulator
- Or scan the QR code with the Expo Go app on a physical device

You can also run a platform directly:

```bash
npm run web
npm run ios
npm run android
```

## Deploying the web build to Vercel

The app is also a static web app (via `react-native-web`), so it can be
deployed to Vercel as-is — no server/API routes needed.

1. Push this repo to GitHub (already done if you're reading this from the
   remote).
2. In Vercel, "Add New Project" → import this repository.
3. Vercel picks up the included `vercel.json`, which sets:
   - Build command: `npx expo export --platform web`
   - Output directory: `dist`
   - `framework: null` (so Vercel doesn't try to auto-detect Next.js/etc.)
4. Deploy. No environment variables are required for Phase 1.

To reproduce the exact same build locally before pushing:

```bash
npx expo export --platform web
npx serve dist   # or any static file server, to preview the output
```

## Tests

The game engine (`/engine`) is pure TypeScript with no UI imports, so it's
fully unit-testable with Jest:

```bash
npm test
```

## Project structure

```
/engine     Pure TS game logic: types, seedable RNG, character creation,
            ageUp (the yearly tick), death rolls, life summary. No UI
            imports — safe to unit test in isolation.
/data       Game content as data, not code: names, countries. Events, jobs,
            schools, and achievements data files are added in later phases.
/state      Zustand store (screen routing + current game) and AsyncStorage
            save/load (autosave after every year, "Continue" on the title
            screen).
/ui
  /screens    Title, Character Create, Main Feed, Life Summary (more are
              added in later phases: Occupation, Assets, Relationships,
              Activities, Achievements, Settings).
  /components Reusable UI: StatBar, PrimaryButton, Card, LifeFeed.
  /theme      Light/dark color palettes and the useTheme() hook.
__tests__   Jest tests for the engine.
```

## Adding new random events

*(The event engine ships in Phase 2. Once `/data/events.ts` exists, new
events are added there as plain data objects — no engine code changes
needed. This section will be filled in with the exact schema and examples
at that point.)*

## Adding new jobs

*(The career system ships in Phase 3. Once `/data/jobs.ts` exists, new jobs
are added there as plain data objects — no engine code changes needed. This
section will be filled in with the exact schema and examples at that
point.)*

## How the engine works

- `engine/rng.ts` — a seedable RNG (mulberry32). Every `GameState` carries
  its `seed` and current `rngState`, so a full life can be replayed
  deterministically from a seed (see `__tests__/ageUp.test.ts` for an
  example of a reproducible run).
- `engine/newGame.ts` — builds a fresh `GameState` from character-creation
  options.
- `engine/ageUp.ts` — the yearly tick. It's a pure function:
  `ageUp(state) => newState`. It never mutates its input, which is what
  makes it easy to test and easy for the Zustand store to reason about.
- `engine/death.ts` — yearly death probability (rises with age and falls
  with health) and cause-of-death selection.
