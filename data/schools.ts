import type { EducationStage } from '../engine/types';

export interface SchoolStageDefinition {
  stage: EducationStage;
  minAge: number;
  maxAge: number;
  label: string;
}

/** Compulsory stages, in order. University is opt-in and handled separately. */
export const SCHOOL_STAGES: SchoolStageDefinition[] = [
  { stage: 'preschool', minAge: 3, maxAge: 5, label: 'Preschool' },
  { stage: 'elementary', minAge: 6, maxAge: 10, label: 'Elementary School' },
  { stage: 'middle', minAge: 11, maxAge: 13, label: 'Middle School' },
  { stage: 'high', minAge: 14, maxAge: 18, label: 'High School' },
];

export const UNIVERSITY_MIN_AGE = 19;
export const UNIVERSITY_MAX_AGE = 22;
export const UNIVERSITY_DURATION_YEARS = 4;
export const UNIVERSITY_TUITION_PER_YEAR = 12000;
export const UNIVERSITY_MIN_GPA = 2.0;

export interface MajorDefinition {
  id: string;
  name: string;
  /** Job fields this major gives a smarts-equivalent edge toward (flavor + future hiring boost). */
  field: string;
}

export const MAJORS: MajorDefinition[] = [
  { id: 'business', name: 'Business Administration', field: 'Business' },
  { id: 'compsci', name: 'Computer Science', field: 'Technology' },
  { id: 'nursing', name: 'Nursing', field: 'Medicine' },
  { id: 'engineering', name: 'Engineering', field: 'Engineering' },
  { id: 'law', name: 'Pre-Law', field: 'Law' },
  { id: 'education', name: 'Education', field: 'Education' },
  { id: 'arts', name: 'Fine Arts', field: 'Arts' },
  { id: 'psychology', name: 'Psychology', field: 'Medicine' },
  { id: 'finance', name: 'Finance', field: 'Business' },
  { id: 'biology', name: 'Biology', field: 'Science' },
];
