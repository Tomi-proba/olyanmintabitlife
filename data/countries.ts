export interface CountryOption {
  country: string;
  cities: string[];
}

export const COUNTRIES: CountryOption[] = [
  { country: 'United States', cities: ['Springfield', 'Riverside', 'Fairview', 'Oakland'] },
  { country: 'United Kingdom', cities: ['Manchester', 'Bristol', 'Leeds', 'Nottingham'] },
  { country: 'Canada', cities: ['Toronto', 'Vancouver', 'Calgary', 'Ottawa'] },
  { country: 'Brazil', cities: ['Sao Paulo', 'Recife', 'Curitiba', 'Belem'] },
  { country: 'Japan', cities: ['Osaka', 'Kyoto', 'Yokohama', 'Sapporo'] },
  { country: 'Germany', cities: ['Berlin', 'Munich', 'Hamburg', 'Cologne'] },
  { country: 'Nigeria', cities: ['Lagos', 'Abuja', 'Kano', 'Ibadan'] },
  { country: 'India', cities: ['Mumbai', 'Delhi', 'Bengaluru', 'Chennai'] },
  { country: 'Australia', cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth'] },
  { country: 'Mexico', cities: ['Guadalajara', 'Monterrey', 'Puebla', 'Merida'] },
];

export function randomCountry(roll: number): CountryOption {
  return COUNTRIES[Math.floor(roll * COUNTRIES.length) % COUNTRIES.length];
}

export function randomCity(country: CountryOption, roll: number): string {
  return country.cities[Math.floor(roll * country.cities.length) % country.cities.length];
}
