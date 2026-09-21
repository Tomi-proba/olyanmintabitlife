export interface Palette {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryText: string;
  danger: string;
  success: string;
  statHappiness: string;
  statHealth: string;
  statSmarts: string;
  statLooks: string;
  barTrack: string;
}

export const lightPalette: Palette = {
  background: '#F4F1FA',
  surface: '#FFFFFF',
  surfaceAlt: '#ECE7F7',
  text: '#221B36',
  textMuted: '#6B6480',
  border: '#DED8EE',
  primary: '#6C4CE0',
  primaryText: '#FFFFFF',
  danger: '#E0554C',
  success: '#3FAE6B',
  statHappiness: '#F2B33D',
  statHealth: '#E0554C',
  statSmarts: '#4C8CE0',
  statLooks: '#D14CC9',
  barTrack: '#E4DFF2',
};

export const darkPalette: Palette = {
  background: '#15111F',
  surface: '#1F1930',
  surfaceAlt: '#291F42',
  text: '#F1EEFA',
  textMuted: '#A79CC4',
  border: '#332A4D',
  primary: '#8C6CF0',
  primaryText: '#15111F',
  danger: '#F0776E',
  success: '#5FCB8B',
  statHappiness: '#F2C463',
  statHealth: '#F0776E',
  statSmarts: '#6EA6F0',
  statLooks: '#E070D8',
  barTrack: '#2C2444',
};
