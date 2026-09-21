import { create } from 'zustand';
import type { Asset, GameState } from '../engine/types';
import type { CharacterCreateOptions } from '../engine/character';
import { newGame } from '../engine/newGame';
import { ageUp, resolveEventChoice } from '../engine/ageUp';
import { performFamilyAction, type FamilyActionType } from '../engine/familyActions';
import { applyForJob, workHard, quitJob, retireFromJob } from '../engine/career';
import { studyAction, skipAction, applyToUniversity } from '../engine/education';
import { buyAsset, sellAsset } from '../engine/assets';
import { appendFeedText } from '../engine/feed';
import { Rng } from '../engine/rng';
import { saveGame, loadGame, clearSave } from './persistence';

export type Screen = 'loading' | 'title' | 'create' | 'playing' | 'summary';

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

  goToCreate: () => void;
  goToTitle: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
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

  applyForJob: (jobId: string) => {
    const { game } = get();
    if (!game || !game.isAlive) return;
    const result = applyForJob(game, jobId);
    const next = appendFeedText(result.state, result.feedText);
    set({ game: next });
    void saveGame(next);
  },

  workHard: () => {
    const { game } = get();
    if (!game || !game.isAlive) return;
    const result = workHard(game);
    const next = appendFeedText(result.state, result.feedText);
    set({ game: next });
    void saveGame(next);
  },

  quitJob: () => {
    const { game } = get();
    if (!game || !game.isAlive) return;
    const result = quitJob(game);
    const next = appendFeedText(result.state, result.feedText);
    set({ game: next });
    void saveGame(next);
  },

  retireFromJob: () => {
    const { game } = get();
    if (!game || !game.isAlive) return;
    const result = retireFromJob(game);
    const next = appendFeedText(result.state, result.feedText);
    set({ game: next });
    void saveGame(next);
  },

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

  enrollInUniversity: (majorId: string) => {
    const { game } = get();
    if (!game || !game.isAlive) return;
    const result = applyToUniversity(game, majorId);
    const next = appendFeedText(result.state, result.feedText);
    set({ game: next });
    void saveGame(next);
  },

  buyAsset: (type: Asset['type'], name: string, value: number, upkeepPerYear = 0) => {
    const { game } = get();
    if (!game || !game.isAlive) return;
    const rng = new Rng(game.rngState);
    const result = buyAsset(game, rng, type, name, value, upkeepPerYear);
    const next = appendFeedText(result.state, result.feedText);
    set({ game: next });
    void saveGame(next);
  },

  sellAsset: (assetId: string) => {
    const { game } = get();
    if (!game || !game.isAlive) return;
    const result = sellAsset(game, assetId);
    const next = appendFeedText(result.state, result.feedText);
    set({ game: next });
    void saveGame(next);
  },

  goToCreate: () => set({ screen: 'create' }),

  goToTitle: () => {
    void clearSave();
    set({ game: null, hasSave: false, screen: 'title' });
  },
}));
