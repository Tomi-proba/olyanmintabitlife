import type { GameState, EducationStage } from './types';
import type { Rng } from './rng';
import {
  SCHOOL_STAGES,
  MAJORS,
  UNIVERSITY_MIN_AGE,
  UNIVERSITY_MAX_AGE,
  UNIVERSITY_DURATION_YEARS,
  UNIVERSITY_TUITION_PER_YEAR,
  UNIVERSITY_MIN_GPA,
} from '../data/schools';

function clampStat(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function clampGpa(value: number): number {
  return Math.max(0, Math.min(4, Math.round(value * 100) / 100));
}

export function isEnrolled(stage: EducationStage): boolean {
  return stage !== 'none' && stage !== 'graduated';
}

/** Marks that the player chose to study this year; applied on the next ageUp. */
export function studyAction(state: GameState): GameState {
  if (!isEnrolled(state.education.stage)) return state;
  return { ...state, education: { ...state.education, studiedThisYear: true } };
}

/** Marks that the player chose to skip schoolwork this year; applied on the next ageUp. */
export function skipAction(state: GameState): GameState {
  if (!isEnrolled(state.education.stage)) return state;
  return { ...state, education: { ...state.education, studiedThisYear: false } };
}

export interface UniversityApplicationResult {
  state: GameState;
  feedText: string;
}

export function applyToUniversity(state: GameState, majorId: string): UniversityApplicationResult {
  const age = state.player.age;
  const eligible =
    age >= UNIVERSITY_MIN_AGE &&
    age <= UNIVERSITY_MAX_AGE &&
    !!state.flags.highSchoolDiploma &&
    !state.flags.bachelorDegree &&
    state.education.gpa >= UNIVERSITY_MIN_GPA &&
    state.education.stage !== 'university';

  if (!eligible) {
    return { state, feedText: "You don't meet the requirements to enroll in university right now." };
  }

  const major = MAJORS.find((m) => m.id === majorId) ?? MAJORS[0];
  const money = state.player.money - UNIVERSITY_TUITION_PER_YEAR;

  return {
    state: {
      ...state,
      player: { ...state.player, money },
      education: {
        ...state.education,
        stage: 'university',
        major: major.name,
        universityYear: 1,
        gpa: 2.5,
      },
    },
    feedText: `You enrolled at university to study ${major.name}!${money < 0 ? ' You took out a student loan to cover tuition.' : ''}`,
  };
}

/** Runs the yearly study-drift, stage transitions, and graduation checks. Called from ageUp. */
export function applyYearlyEducationUpdate(state: GameState, rng: Rng): { state: GameState; feedTexts: string[] } {
  const age = state.player.age;
  const feedTexts: string[] = [];
  let education = state.education;
  let stats = state.player.stats;
  let flags = state.flags;
  let money = state.player.money;

  if (isEnrolled(education.stage)) {
    let gpaDelta: number;
    let smartsDelta = 0;
    let happinessDelta = 0;

    if (education.studiedThisYear === true) {
      gpaDelta = rng.float() * 0.4 + 0.05;
      smartsDelta = rng.int(2, 5);
      happinessDelta = -rng.int(0, 2);
    } else if (education.studiedThisYear === false) {
      gpaDelta = -(rng.float() * 0.3 + 0.05);
      happinessDelta = rng.int(1, 3);
      if (rng.chance(0.25)) {
        happinessDelta -= 3;
        feedTexts.push(`${state.player.firstName} got detention for slacking off in class.`);
      }
    } else {
      gpaDelta = rng.float() * 0.2 - 0.1;
    }

    education = { ...education, gpa: clampGpa(education.gpa + gpaDelta), studiedThisYear: undefined };
    stats = {
      ...stats,
      smarts: clampStat(stats.smarts + smartsDelta),
      happiness: clampStat(stats.happiness + happinessDelta),
    };
  }

  if (education.stage === 'university') {
    const yearsIn = (education.universityYear ?? 1) + 1;
    if (yearsIn > UNIVERSITY_DURATION_YEARS) {
      flags = { ...flags, bachelorDegree: true };
      education = { ...education, stage: 'graduated' };
      feedTexts.push(`${state.player.firstName} graduated from university with a degree in ${education.major}!`);
    } else {
      money -= UNIVERSITY_TUITION_PER_YEAR;
      education = { ...education, universityYear: yearsIn };
    }
  } else if (education.stage !== 'graduated') {
    const stageDef = SCHOOL_STAGES.find((s) => age >= s.minAge && age <= s.maxAge);
    if (stageDef && stageDef.stage !== education.stage) {
      education = { ...education, stage: stageDef.stage, grade: education.grade + 1 };
      feedTexts.push(`${state.player.firstName} started ${stageDef.label}.`);
    } else if (!stageDef && education.stage === 'high') {
      const passed = education.gpa >= 1.0;
      flags = { ...flags, highSchoolDiploma: passed, highSchoolDropout: !passed };
      education = { ...education, stage: 'graduated' };
      feedTexts.push(
        passed
          ? `${state.player.firstName} graduated high school!`
          : `${state.player.firstName} left high school without graduating.`,
      );
    }
  }

  return {
    state: { ...state, education, flags, player: { ...state.player, stats, money } },
    feedTexts,
  };
}
