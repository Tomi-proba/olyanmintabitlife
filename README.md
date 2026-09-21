# Second Chance

A mobile life-simulation game, in the spirit of BitLife: live an entire life
one year at a time, making choices that shape your character. Built with
React Native, Expo, and TypeScript. All names, UI, and art are original.

## Status

Phase 3 of 6 complete:

- **Phase 1** — project setup, character creation, the main life feed, the
  Age +1 loop, core stats (Happiness/Health/Smarts/Looks), death and a
  life-summary screen, autosave/continue via AsyncStorage.
- **Phase 2** — the data-driven random event engine (55 events at launch)
  and the family system: randomly generated mother, father, and 0-3
  siblings, each with their own stats and a relationship meter. Family
  members age and can die of natural causes just like the player. From the
  Relationships tab you can Spend Time, give a Gift, Argue, or Ask for
  Money. Events can present a 2-4 choice decision modal, or auto-resolve as
  pure narration.
- **Phase 3** — school (preschool → high school, GPA, Study/Skip, detention),
  optional university (10 majors, tuition/loans, 4-year program), the career
  system (34 jobs across 4 tiers, a Job Board, interviews, Work Hard,
  promotions, getting fired, quitting, retiring at 55+), and money (salary,
  progressive tax, cost of living, debt interest, asset upkeep, and a small
  shop for property/cars/stocks/crypto with random yearly investment
  returns). All of it lives behind the Occupation and Assets tabs.

Relationships beyond family (dating/marriage/kids), health activities,
crime, and achievements land in later phases — see the project's task list
for the roadmap.

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
            ageUp (the yearly tick), death rolls, life summary, the family
            system, the random-event engine, effect application, education,
            careers, money, and assets. No UI imports — safe to unit test
            in isolation.
/data       Game content as data, not code: names, countries, events (55 at
            launch), jobs (34), schools/majors, and a small asset shop.
            Achievements data lands in Phase 6.
/state      Zustand store (screen routing + current game) and AsyncStorage
            save/load (autosave after every year, "Continue" on the title
            screen).
/ui
  /screens    Title, Character Create, Main Feed, Occupation (school/job
              board), Assets (bank + shop), Relationships (family), Life
              Summary (Activities and Achievements/Settings screens land in
              later phases).
  /components Reusable UI: StatBar, PrimaryButton, Card, LifeFeed, EventModal.
  /theme      Light/dark color palettes and the useTheme() hook.
__tests__   Jest tests for the engine.
```

## Adding new random events

Events live in `/data/events.ts` as plain `EventDefinition` objects — no
engine code changes needed. Example:

```ts
{
  id: 'family_parent_praise',       // must be unique across all events
  category: 'family',               // freeform grouping label
  probability: 0.22,                 // 0-1 chance this event fires once eligible
  weight: 1,                         // relative odds vs other events that fired the same year
  text: '{subject} told you how proud they are of you.',
  condition: {
    minAge: 4,
    maxAge: 100,
    // genders: ['female'],          // optional: restrict by player gender
    // requiredFlags: { hasPet: true },   // optional: state.flags must match
    requiresSubject: 'parent',       // optional: 'mother' | 'father' | 'parent' | 'sibling' | 'any-family'
  },
  choices: [
    // 1 choice = the event auto-resolves as narration (no popup).
    // 2-4 choices = a decision modal is shown to the player.
    { id: 'ok', label: 'Smile', effects: { happiness: 5, relationship: 4 } },
  ],
}
```

Template tokens available in `text` and in a choice's `label`/`resultText`:
`{name}` (the player's first name), `{subject}` (e.g. "your mother Elena",
only when `requiresSubject` is set), `{subjectName}` (just their first
name). A choice's `effects` can set any of `happiness`, `health`, `smarts`,
`looks`, `money`, `karma` (all deltas), `relationship` (applied to the
event's subject, if any), and `flags` (merged into `state.flags`, useful
for gating later events or unlocking achievements).

Every event in the pool is checked with its own `probability` each year it's
eligible; if more than one "fires" the same year, `weight` breaks the tie
and one event is shown. See `engine/events.ts` for the selection logic and
`__tests__/events.test.ts` for the invariants events are expected to hold.

## Adding new jobs

Jobs live in `/data/jobs.ts` as plain `JobDefinition` objects — no engine
code changes needed. Example:

```ts
{
  id: 'software_engineer',            // must be unique
  field: 'Technology',                // freeform grouping label, shown in the job board
  tier: 3,                            // 1 entry/part-time, 2 skilled, 3 professional, 4 executive
  titles: ['Junior Software Engineer', 'Software Engineer', 'Senior Software Engineer'], // level 1/2/3 titles
  minAge: 21,
  partTime: false,                    // part-time jobs only ever show up for teens (14-18)
  minEducation: 'bachelor',           // 'none' | 'highschool' | 'bachelor'
  minSmarts: 70,                      // minimum Smarts stat required
  baseSalary: 75000,                  // annual salary at level 1
}
```

Applying rolls an interview (odds improve with Smarts above the job's
minimum, Looks, and Karma). Once hired, Work Hard raises performance and can
trigger a promotion (next title in `titles`, salary × 1.35); coasting decays
performance and risks getting fired. See `engine/career.ts` for the full
logic and `__tests__/career.test.ts` for its invariants.

## Adding new majors or school stages

Majors and the compulsory school stages (age ranges, tuition, GPA
requirements) live in `/data/schools.ts`, in the same "just add an object"
style as events and jobs.

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
- `engine/family.ts` — generates a starting mother, father, and siblings;
  ages family members and rolls their natural death each year (reusing
  `engine/death.ts`); and the four family actions (spend time, gift, argue,
  ask for money).
- `engine/events.ts` — matches `data/events.ts` definitions against the
  current age/gender/flags/family, picks a subject family member when an
  event needs one, and fills in the event's text templates.
- `engine/effects.ts` — applies an event choice's effects (stats, money,
  karma, relationship-to-subject, flags) to a `GameState`.
- `engine/ageUp.ts` — the yearly tick. `ageUp(state) => newState` is pure
  and never mutates its input. If the year's event needs a player decision,
  the year is left unfinished (age/stats/family already advanced, but no
  death roll yet) until `resolveEventChoice(state, choiceId)` completes it.
- `engine/education.ts` — moves the player through the compulsory school
  stages by age, applies GPA drift from the Study/Skip choice, handles
  graduation (sets the `highSchoolDiploma`/`bachelorDegree` flags jobs check
  against), and optional university enrollment with a chosen major.
- `engine/career.ts` — the job board, applying (an interview roll weighted
  by Smarts/Looks/Karma), Work Hard (performance → promotions), quitting,
  retiring (55+), and the yearly passive performance decay/fire-risk roll.
- `engine/money.ts` — yearly salary, progressive income tax (part-time teen
  jobs are exempt), asset upkeep, cost of living for adults, and interest on
  debt (a negative bank balance).
- `engine/assets.ts` — buying/selling property, cars, stocks, and crypto,
  plus each asset's yearly value change (stocks/crypto swing widely;
  property appreciates slowly; cars depreciate).
