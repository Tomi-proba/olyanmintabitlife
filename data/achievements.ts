import type { GameState } from '../engine/types';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  check: (state: GameState) => boolean;
}

function flagNumber(state: GameState, key: string): number {
  const value = state.flags[key];
  return typeof value === 'number' ? value : 0;
}

function assetTotal(state: GameState, type: string): number {
  return state.assets.filter((a) => a.type === type).reduce((sum, a) => sum + a.value, 0);
}

/**
 * 26 achievements, checked once per year (see engine/achievements.ts). Add a
 * new one here — no engine changes needed, as long as `check` only reads
 * from GameState.
 */
export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: 'millionaire', name: 'Millionaire', description: 'Amass $1,000,000 in the bank.', check: (s) => s.player.money >= 1_000_000 },
  { id: 'lived_to_100', name: 'Centenarian', description: 'Live to see your 100th birthday.', check: (s) => s.player.age >= 100 },
  { id: 'married_three_times', name: 'Serial Romantic', description: 'Get married three times.', check: (s) => flagNumber(s, 'marriageCount') >= 3 },
  { id: 'big_family', name: 'Big Family', description: 'Have 5 or more children.', check: (s) => s.children.length >= 5 },
  { id: 'genius', name: 'Genius', description: 'Reach 95 Smarts.', check: (s) => s.player.stats.smarts >= 95 },
  { id: 'heartthrob', name: 'Heartthrob', description: 'Reach 95 Looks.', check: (s) => s.player.stats.looks >= 95 },
  { id: 'zen_master', name: 'Zen Master', description: 'Reach 95 Happiness.', check: (s) => s.player.stats.happiness >= 95 },
  { id: 'iron_health', name: 'Iron Health', description: 'Keep 95+ Health after age 60.', check: (s) => s.player.age >= 60 && s.player.stats.health >= 95 },
  { id: 'college_graduate', name: 'College Graduate', description: 'Earn a bachelor’s degree.', check: (s) => !!s.flags.bachelorDegree },
  { id: 'high_school_graduate', name: 'High School Graduate', description: 'Graduate high school.', check: (s) => !!s.flags.highSchoolDiploma },
  { id: 'dropout', name: 'Dropout', description: 'Leave high school without graduating.', check: (s) => !!s.flags.highSchoolDropout },
  { id: 'executive', name: 'Executive', description: 'Reach a tier 4 executive career.', check: (s) => s.job?.tier === 4 },
  { id: 'homeowner', name: 'Homeowner', description: 'Own a property.', check: (s) => s.assets.some((a) => a.type === 'property') },
  { id: 'car_collector', name: 'Car Collector', description: 'Own 2 or more cars at once.', check: (s) => s.assets.filter((a) => a.type === 'car').length >= 2 },
  { id: 'crypto_millionaire', name: 'Crypto Millionaire', description: 'Hold $1,000,000 in crypto.', check: (s) => assetTotal(s, 'crypto') >= 1_000_000 },
  { id: 'ex_con', name: 'Ex-Con', description: 'Spend time in prison.', check: (s) => !!s.flags.wasIncarcerated },
  { id: 'prison_escape', name: 'Prison Escape', description: 'Successfully escape from prison.', check: (s) => !!s.flags.prisonEscape },
  { id: 'philanthropist', name: 'Philanthropist', description: 'Reach 80 Karma.', check: (s) => s.player.hidden.karma >= 80 },
  { id: 'criminal_mastermind', name: 'Criminal Mastermind', description: 'Drop to -80 Karma.', check: (s) => s.player.hidden.karma <= -80 },
  { id: 'high_roller', name: 'High Roller', description: 'Win $5,000 or more in a single gamble.', check: (s) => flagNumber(s, 'biggestGambleWin') >= 5000 },
  { id: 'gym_rat', name: 'Gym Rat', description: 'Hit the gym 15 times.', check: (s) => flagNumber(s, 'gymVisits') >= 15 },
  { id: 'globe_trotter', name: 'Globe Trotter', description: 'Go on 5 vacations.', check: (s) => flagNumber(s, 'vacationsTaken') >= 5 },
  { id: 'deep_in_debt', name: 'Deep in Debt', description: 'Fall $10,000 or more into debt.', check: (s) => s.player.money <= -10_000 },
  { id: 'widowed', name: 'Widowed', description: 'Lose a spouse.', check: (s) => !!s.flags.widowed },
  { id: 'straight_a_student', name: 'Straight-A Student', description: 'Reach a perfect 4.0 GPA while enrolled.', check: (s) => s.education.gpa >= 4.0 && s.education.stage !== 'none' && s.education.stage !== 'graduated' },
  { id: 'self_made', name: 'Self-Made', description: 'Reach a net worth of $500,000.', check: (s) => s.player.money + s.assets.reduce((sum, a) => sum + a.value, 0) >= 500_000 },
];
