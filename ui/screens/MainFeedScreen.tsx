import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/useTheme';
import { PrimaryButton } from '../components/PrimaryButton';
import { StatBar } from '../components/StatBar';
import { LifeFeed } from '../components/LifeFeed';
import { useAppStore } from '../../state/store';

const TAB_LABELS = ['Occupation', 'Assets', 'Relationships', 'Activities'];

export function MainFeedScreen() {
  const { colors } = useTheme();
  const game = useAppStore((s) => s.game);
  const ageUpYear = useAppStore((s) => s.ageUpYear);

  if (!game) return null;
  const { player } = game;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.name, { color: colors.text }]}>
            {player.firstName} {player.lastName}
          </Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            Age {player.age} · {player.city}, {player.country} · ${player.money.toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.stats}>
        <StatBar label="Happiness" value={player.stats.happiness} color={colors.statHappiness} />
        <StatBar label="Health" value={player.stats.health} color={colors.statHealth} />
        <StatBar label="Smarts" value={player.stats.smarts} color={colors.statSmarts} />
        <StatBar label="Looks" value={player.stats.looks} color={colors.statLooks} />
      </View>

      <View style={styles.feedWrapper}>
        <LifeFeed entries={game.feed} />
      </View>

      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
        <View style={styles.tabRow}>
          {TAB_LABELS.slice(0, 2).map((label) => (
            <PlaceholderTab key={label} label={label} />
          ))}
          <PrimaryButton label="Age +1" onPress={ageUpYear} style={styles.ageButton} />
          {TAB_LABELS.slice(2).map((label) => (
            <PlaceholderTab key={label} label={label} />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

function PlaceholderTab({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.tab}>
      <Text style={[styles.tabLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  name: { fontSize: 22, fontWeight: '800' },
  meta: { fontSize: 13, marginTop: 2 },
  stats: { paddingHorizontal: 20, paddingBottom: 4 },
  feedWrapper: { flex: 1 },
  footer: {
    borderTopWidth: 1,
    paddingTop: 10,
    paddingBottom: 14,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  ageButton: {
    marginHorizontal: 8,
  },
});
