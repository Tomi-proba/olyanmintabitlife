import type { Character, FamilyMember, Gender, RelationshipRole } from './types';
import type { Rng } from './rng';
import { makeId } from './id';
import { randomStats } from './character';
import { randomFirstName, randomLastName } from '../data/names';
import { rollDeath } from './death';

function makeFamilyMember(
  rng: Rng,
  role: RelationshipRole,
  gender: Gender,
  age: number,
  lastName: string,
): FamilyMember {
  return {
    id: makeId(rng, 'fam'),
    firstName: randomFirstName(gender, rng.float()),
    lastName,
    gender,
    age,
    alive: true,
    role,
    stats: randomStats(rng),
    relationship: rng.int(45, 80),
  };
}

/** Generates a starting mother, father, and 0-3 siblings for a newborn player. */
export function generateFamily(rng: Rng, player: Character): FamilyMember[] {
  const family: FamilyMember[] = [];

  const motherAge = rng.int(20, 40);
  const fatherAge = rng.int(20, 42);
  family.push(makeFamilyMember(rng, 'mother', 'female', motherAge, player.lastName));
  family.push(makeFamilyMember(rng, 'father', 'male', fatherAge, player.lastName));

  const siblingCount = rng.weightedPick([0, 1, 2, 3], (n) => [30, 40, 20, 10][n]);
  for (let i = 0; i < siblingCount; i++) {
    const gender: Gender = rng.chance(0.5) ? 'male' : 'female';
    // Siblings are anywhere from 10 years older to 10 years younger than the player.
    const age = Math.max(0, player.age + rng.int(-10, 10));
    family.push(makeFamilyMember(rng, 'sibling', gender, age, player.lastName));
  }

  return family;
}

export interface FamilyAgingResult {
  family: FamilyMember[];
  deathFeedTexts: string[];
}

/** Ages every living family member by one year and rolls for natural death. */
export function ageFamily(rng: Rng, family: FamilyMember[]): FamilyAgingResult {
  const deathFeedTexts: string[] = [];

  const nextFamily = family.map((member) => {
    if (!member.alive) return member;

    const nextAge = member.age + 1;
    const roll = rollDeath(rng, nextAge, member.stats.health);
    const relationshipDrift = rng.int(-2, 3);
    const nextRelationship = Math.max(0, Math.min(100, member.relationship + relationshipDrift));

    if (roll.died) {
      deathFeedTexts.push(
        `${member.firstName} ${member.lastName}, your ${roleLabel(member.role)}, died at age ${nextAge}. Cause of death: ${roll.cause}.`,
      );
      return { ...member, age: nextAge, alive: false, deathCause: roll.cause, relationship: nextRelationship };
    }

    return { ...member, age: nextAge, relationship: nextRelationship };
  });

  return { family: nextFamily, deathFeedTexts };
}

export function roleLabel(role: RelationshipRole): string {
  switch (role) {
    case 'mother':
      return 'mother';
    case 'father':
      return 'father';
    case 'sibling':
      return 'sibling';
    case 'partner':
      return 'partner';
    case 'child':
      return 'child';
    case 'friend':
      return 'friend';
    default:
      return 'relative';
  }
}

function clampRelationship(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function applyRelationshipDelta(member: FamilyMember, delta: number): FamilyMember {
  return { ...member, relationship: clampRelationship(member.relationship + delta) };
}

export interface FamilyActionResult {
  family: FamilyMember[];
  feedText: string;
  happinessDelta: number;
  moneyDelta: number;
}

const SPEND_TIME_LINES = [
  'You spent some quality time with {subject}.',
  'You hung out with {subject} today.',
];

export function spendTimeWithFamily(rng: Rng, family: FamilyMember[], memberId: string, playerName: string): FamilyActionResult {
  const member = family.find((m) => m.id === memberId);
  const relationshipGain = rng.int(4, 9);
  const happinessDelta = rng.int(1, 4);
  const nextFamily = family.map((m) => (m.id === memberId ? applyRelationshipDelta(m, relationshipGain) : m));
  const text = member
    ? rng.pick(SPEND_TIME_LINES).replace('{subject}', `your ${roleLabel(member.role)} ${member.firstName}`)
    : `${playerName} spent time with family.`;
  return { family: nextFamily, feedText: text, happinessDelta, moneyDelta: 0 };
}

export function giveGiftToFamily(rng: Rng, family: FamilyMember[], memberId: string, amount: number): FamilyActionResult {
  const member = family.find((m) => m.id === memberId);
  const relationshipGain = Math.round(amount / 10) + rng.int(2, 6);
  const nextFamily = family.map((m) => (m.id === memberId ? applyRelationshipDelta(m, relationshipGain) : m));
  const text = member
    ? `You gave ${member.firstName} a $${amount} gift. They loved it!`
    : `You gave a family member a $${amount} gift.`;
  return { family: nextFamily, feedText: text, happinessDelta: rng.int(1, 3), moneyDelta: -amount };
}

export function argueWithFamily(rng: Rng, family: FamilyMember[], memberId: string): FamilyActionResult {
  const member = family.find((m) => m.id === memberId);
  const relationshipLoss = -rng.int(5, 15);
  const nextFamily = family.map((m) => (m.id === memberId ? applyRelationshipDelta(m, relationshipLoss) : m));
  const text = member
    ? `You got into an argument with your ${roleLabel(member.role)} ${member.firstName}.`
    : 'You got into a family argument.';
  return { family: nextFamily, feedText: text, happinessDelta: -rng.int(2, 6), moneyDelta: 0 };
}

export function askFamilyForMoney(rng: Rng, family: FamilyMember[], memberId: string): FamilyActionResult {
  const member = family.find((m) => m.id === memberId);
  if (!member) {
    return { family, feedText: 'There was no one to ask.', happinessDelta: 0, moneyDelta: 0 };
  }

  const successChance = 0.2 + member.relationship / 150;
  if (rng.chance(successChance)) {
    const amount = rng.int(10, 100);
    const nextFamily = family.map((m) => (m.id === memberId ? applyRelationshipDelta(m, -2) : m));
    return {
      family: nextFamily,
      feedText: `You asked your ${roleLabel(member.role)} ${member.firstName} for money. They gave you $${amount}.`,
      happinessDelta: 2,
      moneyDelta: amount,
    };
  }

  const nextFamily = family.map((m) => (m.id === memberId ? applyRelationshipDelta(m, -4) : m));
  return {
    family: nextFamily,
    feedText: `You asked your ${roleLabel(member.role)} ${member.firstName} for money, but they said no.`,
    happinessDelta: -2,
    moneyDelta: 0,
  };
}
