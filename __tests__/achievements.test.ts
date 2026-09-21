import { newGame } from '../engine/newGame';
import { evaluateAchievements } from '../engine/achievements';
import { ACHIEVEMENTS } from '../data/achievements';

describe('ACHIEVEMENTS data', () => {
  it('has at least 20 achievements with unique ids', () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(20);
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('a fresh game unlocks none of them', () => {
    const state = newGame({ firstName: 'Fresh' }, 1);
    const { newlyUnlocked } = evaluateAchievements(state);
    expect(newlyUnlocked).toHaveLength(0);
  });
});

describe('evaluateAchievements', () => {
  it('unlocks Millionaire once money crosses the threshold', () => {
    const state = newGame({ firstName: 'Rich' }, 2);
    const rich = { ...state, player: { ...state.player, money: 1_000_000 } };
    const { state: next, newlyUnlocked } = evaluateAchievements(rich);
    expect(newlyUnlocked.some((a) => a.id === 'millionaire')).toBe(true);
    expect(next.achievements).toContain('millionaire');
  });

  it('does not re-unlock an already-unlocked achievement', () => {
    const state = newGame({ firstName: 'Rich' }, 3);
    const rich = { ...state, player: { ...state.player, money: 1_000_000 }, achievements: ['millionaire'] };
    const { newlyUnlocked } = evaluateAchievements(rich);
    expect(newlyUnlocked.some((a) => a.id === 'millionaire')).toBe(false);
  });

  it('can unlock multiple achievements in the same check', () => {
    const state = newGame({ firstName: 'Prodigy' }, 4);
    const overachiever = {
      ...state,
      player: {
        ...state.player,
        age: 100,
        money: 1_000_000,
        stats: { ...state.player.stats, smarts: 95, looks: 95, happiness: 95, health: 95 },
      },
    };
    const { newlyUnlocked } = evaluateAchievements(overachiever);
    expect(newlyUnlocked.length).toBeGreaterThanOrEqual(4);
  });

  it('is a no-op (returns the same state) when nothing new unlocks', () => {
    const state = newGame({ firstName: 'Plain' }, 5);
    const { state: next } = evaluateAchievements(state);
    expect(next).toBe(state);
  });
});
