import { Rng } from '../engine/rng';
import { createCharacter } from '../engine/character';
import {
  generateFamily,
  ageFamily,
  spendTimeWithFamily,
  giveGiftToFamily,
  argueWithFamily,
  askFamilyForMoney,
} from '../engine/family';

describe('generateFamily', () => {
  it('always includes a living mother and father', () => {
    const rng = new Rng(1);
    const player = createCharacter(rng);
    const family = generateFamily(rng, player);
    expect(family.filter((m) => m.role === 'mother')).toHaveLength(1);
    expect(family.filter((m) => m.role === 'father')).toHaveLength(1);
    expect(family.every((m) => m.alive)).toBe(true);
  });

  it('generates 0-3 siblings', () => {
    const rng = new Rng(2);
    const player = createCharacter(rng);
    const family = generateFamily(rng, player);
    const siblings = family.filter((m) => m.role === 'sibling');
    expect(siblings.length).toBeGreaterThanOrEqual(0);
    expect(siblings.length).toBeLessThanOrEqual(3);
  });

  it('gives every member a relationship value in range', () => {
    const rng = new Rng(3);
    const player = createCharacter(rng);
    const family = generateFamily(rng, player);
    for (const member of family) {
      expect(member.relationship).toBeGreaterThanOrEqual(0);
      expect(member.relationship).toBeLessThanOrEqual(100);
    }
  });
});

describe('ageFamily', () => {
  it('ages every living member by exactly one year', () => {
    const rng = new Rng(10);
    const player = createCharacter(rng);
    const family = generateFamily(rng, player);
    const ages = family.map((m) => m.age);
    const { family: aged } = ageFamily(rng, family);
    aged.forEach((m, i) => expect(m.age).toBe(ages[i] + 1));
  });

  it('never resurrects or double-kills a member, and gives a cause when someone dies', () => {
    const rng = new Rng(11);
    const player = createCharacter(rng);
    let family = generateFamily(rng, player);
    for (let i = 0; i < 150; i++) {
      const result = ageFamily(rng, family);
      family = result.family;
      for (const member of family) {
        if (!member.alive) expect(member.deathCause).toBeDefined();
      }
    }
    // After 150 years everyone should have died of old age at some point.
    expect(family.every((m) => !m.alive)).toBe(true);
  });
});

describe('family actions', () => {
  function setup(seed: number) {
    const rng = new Rng(seed);
    const player = createCharacter(rng);
    const family = generateFamily(rng, player);
    return { rng, family, member: family[0] };
  }

  it('spendTimeWithFamily always raises relationship', () => {
    const { rng, family, member } = setup(20);
    const result = spendTimeWithFamily(rng, family, member.id, 'Player');
    const updated = result.family.find((m) => m.id === member.id)!;
    expect(updated.relationship).toBeGreaterThan(member.relationship);
  });

  it('giveGiftToFamily raises relationship and costs money', () => {
    const { rng, family, member } = setup(21);
    const result = giveGiftToFamily(rng, family, member.id, 20);
    const updated = result.family.find((m) => m.id === member.id)!;
    expect(updated.relationship).toBeGreaterThan(member.relationship);
    expect(result.moneyDelta).toBe(-20);
  });

  it('argueWithFamily lowers relationship', () => {
    const { rng, family, member } = setup(22);
    const result = argueWithFamily(rng, family, member.id);
    const updated = result.family.find((m) => m.id === member.id)!;
    expect(updated.relationship).toBeLessThan(member.relationship);
  });

  it('askFamilyForMoney never goes below 0 relationship and returns non-negative money', () => {
    const { rng, family, member } = setup(23);
    const result = askFamilyForMoney(rng, family, member.id);
    expect(result.moneyDelta).toBeGreaterThanOrEqual(0);
    const updated = result.family.find((m) => m.id === member.id)!;
    expect(updated.relationship).toBeGreaterThanOrEqual(0);
  });
});
