import { newGame } from '../engine/newGame';
import { listAvailableJobs, meetsJobRequirements, applyForJob, workHard, quitJob, retireFromJob } from '../engine/career';
import { JOBS } from '../data/jobs';

function adultState(seed: number, smarts = 90) {
  let state = newGame({ firstName: 'Employ' }, seed);
  state = { ...state, player: { ...state.player, age: 25, stats: { ...state.player.stats, smarts } } };
  return state;
}

describe('JOBS data', () => {
  it('has at least 30 jobs', () => {
    expect(JOBS.length).toBeGreaterThanOrEqual(30);
  });

  it('has unique ids and 3 titles each', () => {
    const ids = JOBS.map((j) => j.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const job of JOBS) {
      expect(job.titles).toHaveLength(3);
      expect(job.baseSalary).toBeGreaterThan(0);
    }
  });
});

describe('meetsJobRequirements / listAvailableJobs', () => {
  it('excludes jobs the player is too young or unqualified for', () => {
    const state = newGame({ firstName: 'Kid' }, 1);
    const stillAChild = { ...state, player: { ...state.player, age: 8 } };
    expect(listAvailableJobs(stillAChild)).toHaveLength(0);
  });

  it('includes low-requirement jobs for a qualified adult', () => {
    const state = adultState(2);
    const stateWithDiploma = { ...state, flags: { ...state.flags, highSchoolDiploma: true } };
    const jobs = listAvailableJobs(stateWithDiploma);
    expect(jobs.length).toBeGreaterThan(0);
    expect(jobs.every((j) => meetsJobRequirements(stateWithDiploma, j))).toBe(true);
  });

  it('excludes bachelor-required jobs without the degree flag', () => {
    const state = adultState(3);
    const jobs = listAvailableJobs(state);
    expect(jobs.some((j) => j.minEducation === 'bachelor')).toBe(false);
  });

  it('offers part-time jobs to a qualified teen but not to an adult', () => {
    const state = newGame({ firstName: 'Teen' }, 4);
    const teen = { ...state, player: { ...state.player, age: 15 } };
    expect(listAvailableJobs(teen).some((j) => j.partTime)).toBe(true);

    const adult = adultState(4);
    expect(listAvailableJobs(adult).some((j) => j.partTime)).toBe(false);
  });
});

describe('applyForJob', () => {
  it('either hires the player or leaves job undefined, and always advances rng', () => {
    const state = adultState(4);
    const def = JOBS.find((j) => j.minEducation === 'none' && !j.partTime)!;
    const result = applyForJob(state, def.id);
    expect(result.state.rngState).not.toBe(state.rngState);
    if (result.state.job) {
      expect(result.state.job.jobId).toBe(def.id);
      expect(result.state.job.level).toBe(1);
    }
  });

  it('refuses a job the player does not qualify for', () => {
    const state = newGame({ firstName: 'Young' }, 5);
    const child = { ...state, player: { ...state.player, age: 8 } };
    const def = JOBS[0];
    const result = applyForJob(child, def.id);
    expect(result.state.job).toBeUndefined();
    expect(result.feedText).toContain("don't meet");
  });
});

describe('workHard / quitJob / retireFromJob', () => {
  function hiredState(seed: number) {
    let state = adultState(seed);
    state = { ...state, flags: { ...state.flags, highSchoolDiploma: true } };
    const def = JOBS.find((j) => j.minEducation === 'highschool')!;
    return { state: { ...state, job: { jobId: def.id, title: def.titles[0], field: def.field, tier: def.tier, level: 1 as const, salary: def.baseSalary, yearsWorked: 0, performance: 50, partTime: def.partTime } }, def };
  }

  it('workHard never decreases performance and may promote at high performance', () => {
    const { state } = hiredState(6);
    const result = workHard(state);
    expect(result.state.job!.performance).toBeGreaterThanOrEqual(state.job!.performance);
  });

  it('quitJob clears the job', () => {
    const { state } = hiredState(7);
    const result = quitJob(state);
    expect(result.state.job).toBeUndefined();
  });

  it('retireFromJob refuses under age 55', () => {
    const { state } = hiredState(8);
    const result = retireFromJob(state);
    expect(result.state.job).toBeDefined();
  });

  it('retireFromJob at 55+ clears the job and pays a bonus', () => {
    const { state } = hiredState(9);
    const older = { ...state, player: { ...state.player, age: 60 } };
    const result = retireFromJob(older);
    expect(result.state.job).toBeUndefined();
    expect(result.state.player.money).toBeGreaterThan(older.player.money);
    expect(result.state.flags.retired).toBe(true);
  });
});
