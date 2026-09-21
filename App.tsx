import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAppStore } from './state/store';
import { useTheme } from './ui/theme/useTheme';
import { TitleScreen } from './ui/screens/TitleScreen';
import { CharacterCreateScreen } from './ui/screens/CharacterCreateScreen';
import { MainFeedScreen } from './ui/screens/MainFeedScreen';
import { LifeSummaryScreen } from './ui/screens/LifeSummaryScreen';
import { AchievementsScreen } from './ui/screens/AchievementsScreen';
import { SettingsScreen } from './ui/screens/SettingsScreen';

function Router() {
  const screen = useAppStore((s) => s.screen);
  const hydrate = useAppStore((s) => s.hydrate);
  const { colors, isDark } = useTheme();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (screen === 'loading') {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {screen === 'title' && <TitleScreen />}
      {screen === 'create' && <CharacterCreateScreen />}
      {screen === 'playing' && <MainFeedScreen />}
      {screen === 'summary' && <LifeSummaryScreen />}
      {screen === 'achievements' && <AchievementsScreen />}
      {screen === 'settings' && <SettingsScreen />}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Router />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
