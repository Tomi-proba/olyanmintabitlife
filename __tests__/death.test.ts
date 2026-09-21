import { Rng } from '../engine/rng';
import { deathProbability, rollDeath } from '../engine/death';

describe('deathProbability', () => {
  it('increases with age', () => {
    expect(deathProbability(80, 80)).toBeGreaterThan(deathProbability(30, 80));
    expect(deathProbability(100, 80)).toBeGreaterThan(deathProbability(80, 80));
  });

  it('increases as health drops', () => {
    expect(deathProbability(40, 5)).toBeGreaterThan(deathProbability(40, 80));
  });

  it('never exceeds 1', () => {
    expect(deathProbability(150, 0)).toBeLessThanOrEqual(1);
  });

  it('is never negative', () => {
    expect(deathProbability(0, 100)).toBeGreaterThanOrEqual(0);
  });
});

describe('rollDeath', () => {
  it('almost always kills a 200-year-old with 0 health', () => {
    const rng = new Rng(10);
    let deaths = 0;
    for (let i = 0; i < 20; i++) {
      if (rollDeath(rng, 200, 0).died) deaths++;
    }
    expect(deaths).toBeGreaterThan(15);
  });

  it('rarely kills a healthy young adult in a single roll', () => {
    const rng = new Rng(11);
    let deaths = 0;
    for (let i = 0; i < 50; i++) {
      if (rollDeath(rng, 22, 90).died) deaths++;
    }
    expect(deaths).toBeLessThan(5);
  });

  it('attaches a cause of death whenever died is true', () => {
    const rng = new Rng(12);
    for (let i = 0; i < 30; i++) {
      const result = rollDeath(rng, 90, 10);
      if (result.died) {
        expect(typeof result.cause).toBe('string');
        expect(result.cause!.length).toBeGreaterThan(0);
      }
    }
  });
});
