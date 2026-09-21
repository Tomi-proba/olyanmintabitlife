import { create } from 'zustand';
import type { GameState } from '../engine/types';
import type { CharacterCreateOptions } from '../engine/character';
import { newGame } from '../engine/newGame';
import { ageUp } from '../engine/ageUp';
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
    if (!game || !game.isAlive) return;
    const next = ageUp(game);
    set({ game: next, screen: next.isAlive ? 'playing' : 'summary' });
    void saveGame(next);
  },

  goToCreate: () => set({ screen: 'create' }),

  goToTitle: () => {
    void clearSave();
    set({ game: null, hasSave: false, screen: 'title' });
  },
}));
