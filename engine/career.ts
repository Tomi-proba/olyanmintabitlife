import type { GameState, Job } from './types';
import { Rng } from './rng';
import { JOBS, type JobDefinition } from '../data/jobs';

const PROMOTION_SALARY_GROWTH = 1.35;

function hasEducation(state: GameState, required: JobDefinition['minEducation']): boolean {
  if (required === 'none') return true;
  if (required === 'highschool') return !!state.flags.highSchoolDiploma || !!state.flags.bachelorDegree;
  return !!state.flags.bachelorDegree;
}

const TEEN_JOB_MAX_AGE = 18;

export function meetsJobRequirements(state: GameState, def: JobDefinition): boolean {
  if (def.partTime && state.player.age > TEEN_JOB_MAX_AGE) return false;
  return (
    state.player.age >= def.minAge &&
    state.player.stats.smarts >= def.minSmarts &&
    hasEducation(state, def.minEducation)
  );
}

export function listAvailableJobs(state: GameState): JobDefinition[] {
  return JOBS.filter((def) => meetsJobRequirements(state, def));
}

function interviewChance(state: GameState, def: JobDefinition): number {
  const smartsEdge = (state.player.stats.smarts - def.minSmarts) / 200;
  const looksEdge = (state.player.stats.looks - 50) / 400;
  const karmaEdge = state.player.hidden.karma / 500;
  return Math.max(0.1, Math.min(0.9, 0.45 + smartsEdge + looksEdge + karmaEdge));
}

export interface JobActionResult {
  state: GameState;
  feedText: string;
}

export function applyForJob(state: GameState, jobId: string): JobActionResult {
  const def = JOBS.find((j) => j.id === jobId);
  if (!def || !meetsJobRequirements(state, def)) {
    return { state, feedText: "You don't meet the requirements for that job." };
  }

  const rng: Rng = new Rng(state.rngState);
  const chance = interviewChance(state, def);

  if (!rng.chance(chance)) {
    return {
      state: { ...state, rngState: rng.state },
      feedText: `You interviewed for ${def.titles[0]}, but didn't get the job.`,
    };
  }

  const job: Job = {
    jobId: def.id,
    title: def.titles[0],
    field: def.field,
    tier: def.tier,
    level: 1,
    salary: def.baseSalary,
    yearsWorked: 0,
    performance: 50,
    partTime: def.partTime,
  };

  return {
    state: { ...state, rngState: rng.state, job },
    feedText: `You got the job! You're now working as a ${job.title}.`,
  };
}

export function workHard(state: GameState): JobActionResult {
  if (!state.job) {
    return { state, feedText: 'You have no job to work hard at.' };
  }

  const rng: Rng = new Rng(state.rngState);
  const performanceGain = rng.int(6, 16);
  const happinessCost = rng.int(1, 4);
  let job = { ...state.job, performance: Math.min(100, state.job.performance + performanceGain) };

  let feedText = 'You worked hard this year.';
  if (job.level < 3 && job.performance >= 85 && rng.chance(0.45)) {
    const def = JOBS.find((j) => j.id === job.jobId);
    const nextLevel = (job.level + 1) as 1 | 2 | 3;
    const newSalary = Math.round(job.salary * PROMOTION_SALARY_GROWTH);
    job = {
      ...job,
      level: nextLevel,
      salary: newSalary,
      performance: 50,
      title: def ? def.titles[nextLevel - 1] : job.title,
    };
    feedText = `Your hard work paid off — you were promoted to ${job.title}!`;
  }

  const happiness = Math.max(0, state.player.stats.happiness - happinessCost);

  return {
    state: {
      ...state,
      rngState: rng.state,
      job,
      player: { ...state.player, stats: { ...state.player.stats, happiness } },
    },
    feedText,
  };
}

export function quitJob(state: GameState): JobActionResult {
  if (!state.job) return { state, feedText: 'You have no job to quit.' };
  const title = state.job.title;
  return { state: { ...state, job: undefined }, feedText: `You quit your job as a ${title}.` };
}

export function retireFromJob(state: GameState): JobActionResult {
  if (!state.job) return { state, feedText: 'You have no job to retire from.' };
  if (state.player.age < 55) {
    return { state, feedText: "You're not old enough to retire yet." };
  }
  const bonus = Math.round(state.job.salary * 0.5);
  const title = state.job.title;
  return {
    state: {
      ...state,
      job: undefined,
      player: { ...state.player, money: state.player.money + bonus },
      flags: { ...state.flags, retired: true },
    },
    feedText: `You retired after a career as a ${title}, with a $${bonus.toLocaleString()} send-off bonus.`,
  };
}

/** Yearly passive drift: performance decays a little if you coast, and poor performance risks getting fired. */
export function applyYearlyJobDrift(state: GameState, rng: Rng): { state: GameState; feedTexts: string[] } {
  if (!state.job) return { state, feedTexts: [] };

  const decay = rng.int(0, 6);
  const performance = Math.max(0, state.job.performance - decay);
  const job = { ...state.job, performance, yearsWorked: state.job.yearsWorked + 1 };

  if (performance < 12 && rng.chance(0.3)) {
    return {
      state: { ...state, job: undefined },
      feedTexts: [`You were fired from your job as a ${job.title}.`],
    };
  }

  return { state: { ...state, job }, feedTexts: [] };
}
