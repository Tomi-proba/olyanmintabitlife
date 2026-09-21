import type { Character, Gender, Stats } from './types';
import type { Rng } from './rng';
import { makeId } from './id';
import { randomFirstName, randomLastName } from '../data/names';
import { COUNTRIES, randomCountry, randomCity, type CountryOption } from '../data/countries';

const CURRENT_YEAR = 2026;

export interface CharacterCreateOptions {
  firstName?: string;
  lastName?: string;
  gender?: Gender;
  countryName?: string;
  city?: string;
}

function randomGender(rng: Rng): Gender {
  return rng.chance(0.5) ? 'male' : 'female';
}

function randomStat(rng: Rng): number {
  // Bell-ish spread around 50 by averaging two rolls, clamped to 0-100.
  const value = (rng.int(20, 80) + rng.int(20, 80)) / 2;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function randomStats(rng: Rng): Stats {
  return {
    happiness: randomStat(rng),
    health: randomStat(rng),
    smarts: randomStat(rng),
    looks: randomStat(rng),
  };
}

export function createCharacter(rng: Rng, options: CharacterCreateOptions = {}): Character {
  const gender = options.gender ?? randomGender(rng);
  const firstName = options.firstName?.trim() || randomFirstName(gender, rng.float());
  const lastName = options.lastName?.trim() || randomLastName(rng.float());

  let country: CountryOption;
  if (options.countryName) {
    country = COUNTRIES.find((c) => c.country === options.countryName) ?? randomCountry(rng.float());
  } else {
    country = randomCountry(rng.float());
  }
  const city = options.city?.trim() || randomCity(country, rng.float());

  return {
    id: makeId(rng, 'char'),
    firstName,
    lastName,
    gender,
    age: 0,
    birthYear: CURRENT_YEAR,
    country: country.country,
    city,
    stats: randomStats(rng),
    hidden: { karma: 0 },
    money: 0,
  };
}
