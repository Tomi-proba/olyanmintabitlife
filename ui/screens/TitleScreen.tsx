import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/useTheme';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAppStore } from '../../state/store';

export function TitleScreen() {
  const { colors } = useTheme();
  const hasSave = useAppStore((s) => s.hasSave);
  const game = useAppStore((s) => s.game);
  const continueGame = useAppStore((s) => s.continueGame);
  const goToCreate = useAppStore((s) => s.goToCreate);

  const canContinue = hasSave && !!game;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.hero}>
        <Text style={[styles.title, { color: colors.text }]}>Second Chance</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Live an entire life, one year at a time.
        </Text>
      </View>
      <View style={styles.actions}>
        {canContinue && (
          <PrimaryButton label={`Continue as ${game!.player.firstName}`} onPress={continueGame} style={styles.button} />
        )}
        <PrimaryButton
          label="New Life"
          onPress={goToCreate}
          variant={canContinue ? 'secondary' : 'primary'}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  hero: {
    marginTop: '30%',
    alignItems: 'center',
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  actions: {
    gap: 12,
  },
  button: {
    width: '100%',
  },
});
