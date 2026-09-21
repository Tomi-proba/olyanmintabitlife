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
import { pettyTheft, robbery, dealDrugs, gamble } from '../engine/crime';
import { goOnVacation, volunteer, goShopping } from '../engine/lifestyle';
import { appendFeedText } from '../engine/feed';
import { Rng } from '../engine/rng';
import { saveGame, loadGame, clearSave } from './persistence';

export type Screen = 'loading' | 'title' | 'create' | 'playing' | 'summary';

/** An engine action's result shape: { state, feedText }, shared by career/education/assets/relationships/health/crime/lifestyle. */
interface ActionOutcome {
  state: GameState;
  feedText: string;
}

interface AppStore {
  screen: Screen;
  game: GameState | null;
  hasSave: boolean;

  hydrate: () => Promise<void>;
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

  goToCreate: () => void;
  goToTitle: () => void;
}

export const useAppStore = create<AppStore>((set, get) => {
  /** Runs an engine action that returns {state, feedText}, appends the feed entry, saves. */
  function runAction(action: (game: GameState) => ActionOutcome) {
    const { game } = get();
    if (!game || !game.isAlive) return;
    const result = action(game);
    const next = appendFeedText(result.state, result.feedText);
    set({ game: next });
    void saveGame(next);
  }

  /** Same as runAction, but the activity may only be used once per year (see GameState.activitiesUsedThisYear). */
  function runOncePerYearActivity(activityId: string, action: (game: GameState) => ActionOutcome) {
    const { game } = get();
    if (!game || !game.isAlive) return;
    if (game.activitiesUsedThisYear.includes(activityId)) return;
    const result = action(game);
    const withFeed = appendFeedText(result.state, result.feedText);
    const next = { ...withFeed, activitiesUsedThisYear: [...withFeed.activitiesUsedThisYear, activityId] };
    set({ game: next });
    void saveGame(next);
  }

  return {
    screen: 'loading',
    game: null,
    hasSave: false,

    hydrate: async () => {
      const saved = await loadGame();
      if (saved) {
        set({ game: saved, hasSave: true, screen: 'title' });
      } else {
        set({ hasSave: false, screen: 'title' });
      }
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
      set({ game: next, screen: next.isAlive ? 'playing' : 'summary' });
      void saveGame(next);
    },

    chooseEventOption: (choiceId: string) => {
      const { game } = get();
      if (!game || !game.pendingEvent) return;
      const next = resolveEventChoice(game, choiceId);
      set({ game: next, screen: next.isAlive ? 'playing' : 'summary' });
      void saveGame(next);
    },

    doFamilyAction: (type: FamilyActionType, memberId: string, amount?: number) => {
      const { game } = get();
      if (!game || !game.isAlive) return;
      const next = performFamilyAction(game, type, memberId, amount);
      set({ game: next });
      void saveGame(next);
    },

    applyForJob: (jobId: string) => runAction((game) => applyForJob(game, jobId)),
    workHard: () => runAction((game) => workHard(game)),
    quitJob: () => runAction((game) => quitJob(game)),
    retireFromJob: () => runAction((game) => retireFromJob(game)),

    study: () => {
      const { game } = get();
      if (!game || !game.isAlive) return;
      const next = studyAction(game);
      set({ game: next });
      void saveGame(next);
    },

    skipSchool: () => {
      const { game } = get();
      if (!game || !game.isAlive) return;
      const next = skipAction(game);
      set({ game: next });
      void saveGame(next);
    },

    enrollInUniversity: (majorId: string) => runAction((game) => applyToUniversity(game, majorId)),

    buyAsset: (type: Asset['type'], name: string, value: number, upkeepPerYear = 0) => {
      const { game } = get();
      if (!game || !game.isAlive) return;
      const rng = new Rng(game.rngState);
      const result = buyAsset(game, rng, type, name, value, upkeepPerYear);
      const next = appendFeedText(result.state, result.feedText);
      set({ game: next });
      void saveGame(next);
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

    goToCreate: () => set({ screen: 'create' }),

    goToTitle: () => {
      void clearSave();
      set({ game: null, hasSave: false, screen: 'title' });
    },
  };
});
