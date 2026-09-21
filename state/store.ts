import { create } from 'zustand';
import type { Asset, GameState } from '../engine/types';
import type { CharacterCreateOptions } from '../engine/character';
import { newGame } from '../engine/newGame';
import { ageUp, resolveEventChoice } from '../engine/ageUp';
import { performFamilyAction, type FamilyActionType } from '../engine/familyActions';
import { applyForJob, workHard, quitJob, retireFromJob } from '../engine/career';
import { studyAction, skipAction, applyToUniversity } from '../engine/education';
import { buyAsset, sellAsset } from '../engine/assets';
import {
  browseDatingApp,
  startDating,
  passOnProspect,
  breakUp,
  proposeMarriage,
  divorce,
  cheatOnPartner,
  haveChild,
} from '../engine/relationships';
import { visitDoctor, goToGym, followDietPlan, meditate } from '../engine/health';
import { pettyTheft, robbery, dealDrugs, gamble, attemptPrisonEscape } from '../engine/crime';
import { goOnVacation, volunteer, goShopping } from '../engine/lifestyle';
import { appendFeedText } from '../engine/feed';
import { Rng } from '../engine/rng';
import {
  saveGame,
  loadGame,
  clearSave,
  loadUnlockedAchievements,
  saveUnlockedAchievements,
  loadThemePreference,
  saveThemePreference,
  type ThemePreference,
} from './persistence';

export type Screen = 'loading' | 'title' | 'create' | 'playing' | 'summary' | 'achievements' | 'settings';

/** An engine action's result shape: { state, feedText }, shared by career/education/assets/relationships/health/crime/lifestyle. */
interface ActionOutcome {
  state: GameState;
  feedText: string;
}

interface AppStore {
  screen: Screen;
  game: GameState | null;
  hasSave: boolean;
  /** Achievement ids unlocked across every life ever played on this device. */
  unlockedAchievements: string[];
  themePreference: ThemePreference;

  hydrate: () => Promise<void>;
  setThemePreference: (preference: ThemePreference) => void;
  startNewLife: (options: CharacterCreateOptions) => void;
  continueGame: () => void;
  ageUpYear: () => void;
  chooseEventOption: (choiceId: string) => void;
  doFamilyAction: (type: FamilyActionType, memberId: string, amount?: number) => void;

  applyForJob: (jobId: string) => void;
  workHard: () => void;
  quitJob: () => void;
  retireFromJob: () => void;

  study: () => void;
  skipSchool: () => void;
  enrollInUniversity: (majorId: string) => void;

  buyAsset: (type: Asset['type'], name: string, value: number, upkeepPerYear?: number) => void;
  sellAsset: (assetId: string) => void;

  browseDatingApp: () => void;
  startDating: () => void;
  passOnProspect: () => void;
  breakUp: () => void;
  proposeMarriage: () => void;
  divorce: () => void;
  cheatOnPartner: () => void;
  haveChild: () => void;

  visitDoctor: () => void;
  goToGym: () => void;
  followDietPlan: () => void;
  meditate: () => void;
  goOnVacation: () => void;
  volunteer: () => void;
  goShopping: () => void;
  pettyTheft: () => void;
  robbery: () => void;
  dealDrugs: () => void;
  gamble: (amount: number) => void;
  attemptPrisonEscape: () => void;

  goToCreate: () => void;
  goToTitle: () => void;
  goToAchievements: () => void;
  goToSettings: () => void;
  backToTitle: () => void;
}

export const useAppStore = create<AppStore>((set, get) => {
  /** Persists a new GameState: saves it, merges any newly unlocked achievements into the all-time list, updates the screen. */
  function commit(next: GameState, screen?: Screen) {
    const { unlockedAchievements } = get();
    const merged =
      next.achievements.length > 0 && next.achievements.some((id) => !unlockedAchievements.includes(id))
        ? Array.from(new Set([...unlockedAchievements, ...next.achievements]))
        : unlockedAchievements;

    set({ game: next, unlockedAchievements: merged, ...(screen ? { screen } : {}) });
    void saveGame(next);
    if (merged !== unlockedAchievements) {
      void saveUnlockedAchievements(merged);
    }
  }

  /** Runs an engine action that returns {state, feedText}, appends the feed entry, and commits. */
  function runAction(action: (game: GameState) => ActionOutcome) {
    const { game } = get();
    if (!game || !game.isAlive) return;
    const result = action(game);
    commit(appendFeedText(result.state, result.feedText));
  }

  /** Same as runAction, but the activity may only be used once per year (see GameState.activitiesUsedThisYear). */
  function runOncePerYearActivity(activityId: string, action: (game: GameState) => ActionOutcome) {
    const { game } = get();
    if (!game || !game.isAlive) return;
    if (game.activitiesUsedThisYear.includes(activityId)) return;
    const result = action(game);
    const withFeed = appendFeedText(result.state, result.feedText);
    commit({ ...withFeed, activitiesUsedThisYear: [...withFeed.activitiesUsedThisYear, activityId] });
  }

  return {
    screen: 'loading',
    game: null,
    hasSave: false,
    unlockedAchievements: [],
    themePreference: 'system',

    hydrate: async () => {
      const [saved, unlockedAchievements, themePreference] = await Promise.all([
        loadGame(),
        loadUnlockedAchievements(),
        loadThemePreference(),
      ]);
      if (saved) {
        set({ game: saved, hasSave: true, screen: 'title', unlockedAchievements, themePreference });
      } else {
        set({ hasSave: false, screen: 'title', unlockedAchievements, themePreference });
      }
    },

    setThemePreference: (preference: ThemePreference) => {
      set({ themePreference: preference });
      void saveThemePreference(preference);
    },

    startNewLife: (options: CharacterCreateOptions) => {
      const game = newGame(options);
      set({ game, screen: 'playing', hasSave: true });
      void saveGame(game);
    },

    continueGame: () => {
      const { game } = get();
      if (game) {
        set({ screen: game.isAlive ? 'playing' : 'summary' });
      }
    },

    ageUpYear: () => {
      const { game } = get();
      if (!game || !game.isAlive || game.pendingEvent) return;
      const next = ageUp(game);
      commit(next, next.isAlive ? 'playing' : 'summary');
    },

    chooseEventOption: (choiceId: string) => {
      const { game } = get();
      if (!game || !game.pendingEvent) return;
      const next = resolveEventChoice(game, choiceId);
      commit(next, next.isAlive ? 'playing' : 'summary');
    },

    doFamilyAction: (type: FamilyActionType, memberId: string, amount?: number) => {
      const { game } = get();
      if (!game || !game.isAlive) return;
      commit(performFamilyAction(game, type, memberId, amount));
    },

    applyForJob: (jobId: string) => runAction((game) => applyForJob(game, jobId)),
    workHard: () => runAction((game) => workHard(game)),
    quitJob: () => runAction((game) => quitJob(game)),
    retireFromJob: () => runAction((game) => retireFromJob(game)),

    study: () => {
      const { game } = get();
      if (!game || !game.isAlive) return;
      commit(studyAction(game));
    },

    skipSchool: () => {
      const { game } = get();
      if (!game || !game.isAlive) return;
      commit(skipAction(game));
    },

    enrollInUniversity: (majorId: string) => runAction((game) => applyToUniversity(game, majorId)),

    buyAsset: (type: Asset['type'], name: string, value: number, upkeepPerYear = 0) => {
      const { game } = get();
      if (!game || !game.isAlive) return;
      const rng = new Rng(game.rngState);
      const result = buyAsset(game, rng, type, name, value, upkeepPerYear);
      commit(appendFeedText(result.state, result.feedText));
    },
    sellAsset: (assetId: string) => runAction((game) => sellAsset(game, assetId)),

    browseDatingApp: () => runAction((game) => browseDatingApp(game)),
    startDating: () => runAction((game) => startDating(game)),
    passOnProspect: () => runAction((game) => passOnProspect(game)),
    breakUp: () => runAction((game) => breakUp(game)),
    proposeMarriage: () => runAction((game) => proposeMarriage(game)),
    divorce: () => runAction((game) => divorce(game)),
    cheatOnPartner: () => runAction((game) => cheatOnPartner(game)),
    haveChild: () => runAction((game) => haveChild(game)),

    visitDoctor: () => runOncePerYearActivity('doctor', (game) => visitDoctor(game)),
    goToGym: () => runOncePerYearActivity('gym', (game) => goToGym(game)),
    followDietPlan: () => runOncePerYearActivity('diet', (game) => followDietPlan(game)),
    meditate: () => runOncePerYearActivity('meditate', (game) => meditate(game)),
    goOnVacation: () => runOncePerYearActivity('vacation', (game) => goOnVacation(game)),
    volunteer: () => runOncePerYearActivity('volunteer', (game) => volunteer(game)),
    goShopping: () => runOncePerYearActivity('shopping', (game) => goShopping(game)),
    pettyTheft: () => runOncePerYearActivity('pettyTheft', (game) => pettyTheft(game)),
    robbery: () => runOncePerYearActivity('robbery', (game) => robbery(game)),
    dealDrugs: () => runOncePerYearActivity('dealDrugs', (game) => dealDrugs(game)),
    gamble: (amount: number) => runOncePerYearActivity('gamble', (game) => gamble(game, amount)),
    attemptPrisonEscape: () => runOncePerYearActivity('prisonEscape', (game) => attemptPrisonEscape(game)),

    goToCreate: () => set({ screen: 'create' }),

    goToTitle: () => {
      void clearSave();
      set({ game: null, hasSave: false, screen: 'title' });
    },

    goToAchievements: () => set({ screen: 'achievements' }),

    goToSettings: () => set({ screen: 'settings' }),

    backToTitle: () => set({ screen: 'title' }),
  };
});
