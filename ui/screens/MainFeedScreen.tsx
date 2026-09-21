import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/useTheme';
import { PrimaryButton } from '../components/PrimaryButton';
import { StatBar } from '../components/StatBar';
import { LifeFeed } from '../components/LifeFeed';
import { EventModal } from '../components/EventModal';
import { RelationshipsScreen } from './RelationshipsScreen';
import { useAppStore } from '../../state/store';

type SheetId = 'occupation' | 'assets' | 'relationships' | 'activities';

const TABS: { id: SheetId; label: string }[] = [
  { id: 'occupation', label: 'Occupation' },
  { id: 'assets', label: 'Assets' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'activities', label: 'Activities' },
];

const SHEET_TITLES: Record<SheetId, string> = {
  occupation: 'Occupation',
  assets: 'Assets',
  relationships: 'Family',
  activities: 'Activities',
};

export function MainFeedScreen() {
  const { colors } = useTheme();
  const game = useAppStore((s) => s.game);
  const ageUpYear = useAppStore((s) => s.ageUpYear);
  const [openSheet, setOpenSheet] = useState<SheetId | null>(null);

  if (!game) return null;
  const { player } = game;
  const hasPendingEvent = !!game.pendingEvent;

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
          {TABS.slice(0, 2).map((tab) => (
            <TabButton key={tab.id} label={tab.label} onPress={() => setOpenSheet(tab.id)} />
          ))}
          <PrimaryButton
            label="Age +1"
            onPress={ageUpYear}
            style={styles.ageButton}
            disabled={hasPendingEvent}
          />
          {TABS.slice(2).map((tab) => (
            <TabButton key={tab.id} label={tab.label} onPress={() => setOpenSheet(tab.id)} />
          ))}
        </View>
      </View>

      <Modal visible={openSheet !== null} animationType="slide" onRequestClose={() => setOpenSheet(null)}>
        <SafeAreaView style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>{openSheet ? SHEET_TITLES[openSheet] : ''}</Text>
            <Pressable onPress={() => setOpenSheet(null)} hitSlop={12}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>Close</Text>
            </Pressable>
          </View>
          {openSheet === 'relationships' ? (
            <RelationshipsScreen />
          ) : (
            <View style={styles.comingSoon}>
              <Text style={[styles.comingSoonText, { color: colors.textMuted }]}>Coming in a future phase.</Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      <EventModal />
    </SafeAreaView>
  );
}

function TabButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable style={styles.tab} onPress={onPress} hitSlop={8}>
      <Text style={[styles.tabLabel, { color: colors.textMuted }]}>{label}</Text>
    </Pressable>
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
  sheet: {
    flex: 1,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  closeButton: {
    fontSize: 15,
    fontWeight: '700',
  },
  comingSoon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  comingSoonText: {
    fontSize: 15,
  },
});
