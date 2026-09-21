import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GameState } from '../engine/types';

const SAVE_KEY = 'second-chance:save-v1';
const ACHIEVEMENTS_KEY = 'second-chance:achievements-v1';
const THEME_KEY = 'second-chance:theme-v1';

export type ThemePreference = 'system' | 'light' | 'dark';

export async function saveGame(state: GameState): Promise<void> {
  try {
    await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save game', error);
  }
}

export async function loadGame(): Promise<GameState | null> {
  try {
    const raw = await AsyncStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch (error) {
    console.warn('Failed to load game', error);
    return null;
  }
}

export async function clearSave(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SAVE_KEY);
  } catch (error) {
    console.warn('Failed to clear save', error);
  }
}

/** Achievement ids unlocked across all lives ever played, kept separately from the current save. */
export async function loadUnlockedAchievements(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch (error) {
    console.warn('Failed to load achievements', error);
    return [];
  }
}

export async function saveUnlockedAchievements(ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(ids));
  } catch (error) {
    console.warn('Failed to save achievements', error);
  }
}

export async function loadThemePreference(): Promise<ThemePreference> {
  try {
    const raw = await AsyncStorage.getItem(THEME_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
    return 'system';
  } catch (error) {
    console.warn('Failed to load theme preference', error);
    return 'system';
  }
}

export async function saveThemePreference(preference: ThemePreference): Promise<void> {
  try {
    await AsyncStorage.setItem(THEME_KEY, preference);
  } catch (error) {
    console.warn('Failed to save theme preference', error);
  }
}
