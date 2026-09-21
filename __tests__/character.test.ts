import { Rng } from '../engine/rng';
import { createCharacter, randomStats } from '../engine/character';

describe('createCharacter', () => {
  it('respects explicit options', () => {
    const rng = new Rng(1);
    const character = createCharacter(rng, {
      firstName: 'Astra',
      lastName: 'Vale',
      gender: 'female',
      countryName: 'Japan',
    });
    expect(character.firstName).toBe('Astra');
    expect(character.lastName).toBe('Vale');
    expect(character.gender).toBe('female');
    expect(character.country).toBe('Japan');
    expect(character.age).toBe(0);
    expect(character.money).toBe(0);
  });

  it('is deterministic for a given seed with no options', () => {
    const c1 = createCharacter(new Rng(555));
    const c2 = createCharacter(new Rng(555));
    expect(c1).toEqual(c2);
  });

  it('produces different results for different seeds', () => {
    const c1 = createCharacter(new Rng(1));
    const c2 = createCharacter(new Rng(2));
    expect(c1.id).not.toBe(c2.id);
  });
});

describe('randomStats', () => {
  it('keeps every stat within 0-100', () => {
    const rng = new Rng(321);
    for (let i = 0; i < 50; i++) {
      const stats = randomStats(rng);
      for (const value of Object.values(stats)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    }
  });
});
