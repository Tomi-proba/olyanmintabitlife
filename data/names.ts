import type { Gender } from '../engine/types';

export const FIRST_NAMES: Record<Gender, string[]> = {
  male: [
    'Adam', 'Alex', 'Ben', 'Carlos', 'Daniel', 'Elias', 'Felix', 'Gabriel',
    'Henry', 'Ivan', 'Jamal', 'Kenji', 'Leo', 'Marcus', 'Noah', 'Omar',
    'Pavel', 'Quentin', 'Rafael', 'Samuel', 'Theo', 'Umar', 'Victor',
    'Wei', 'Xavier', 'Yusuf', 'Zane',
  ],
  female: [
    'Ada', 'Bianca', 'Chloe', 'Diana', 'Elena', 'Fatima', 'Grace', 'Hana',
    'Ines', 'Julia', 'Kira', 'Luna', 'Maya', 'Nadia', 'Olivia', 'Priya',
    'Quinn', 'Rosa', 'Sofia', 'Talia', 'Uma', 'Valentina', 'Wendy',
    'Ximena', 'Yara', 'Zoe',
  ],
};

export const LAST_NAMES: string[] = [
  'Anderson', 'Baptiste', 'Castillo', 'Dubois', 'Eriksson', 'Fischer',
  'Gallo', 'Haddad', 'Ivanov', 'Jansen', 'Kowalski', 'Lindqvist',
  'Moreau', 'Nakamura', 'Okafor', 'Petrov', 'Quiroga', 'Reyes',
  'Santos', 'Tanaka', 'Ueda', 'Vasquez', 'Weber', 'Xu', 'Yilmaz',
  'Zimmerman',
];

export function randomFirstName(gender: Gender, roll: number): string {
  const list = FIRST_NAMES[gender];
  return list[Math.floor(roll * list.length) % list.length];
}

export function randomLastName(roll: number): string {
  return LAST_NAMES[Math.floor(roll * LAST_NAMES.length) % LAST_NAMES.length];
}
