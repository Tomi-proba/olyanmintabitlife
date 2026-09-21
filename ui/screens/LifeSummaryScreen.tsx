import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/useTheme';
import type { Palette } from '../theme/colors';
import { PrimaryButton } from '../components/PrimaryButton';
import { Card } from '../components/Card';
import { useAppStore } from '../../state/store';
import { buildLifeSummary } from '../../engine/lifeSummary';

export function LifeSummaryScreen() {
  const { colors } = useTheme();
  const game = useAppStore((s) => s.game);
  const goToCreate = useAppStore((s) => s.goToCreate);

  if (!game) return null;
  const summary = buildLifeSummary(game);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.eyebrow, { color: colors.textMuted }]}>OBITUARY</Text>
        <Text style={[styles.title, { color: colors.text }]}>
          {summary.firstName} {summary.lastName}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Lived to age {summary.ageAtDeath} · {summary.causeOfDeath}
        </Text>

        <Card style={styles.card}>
          <Row label="Net Worth" value={`$${summary.netWorth.toLocaleString()}`} colors={colors} />
          <Row label="Career" value={summary.career} colors={colors} />
          <Row label="Children" value={String(summary.kids)} colors={colors} />
          <Row label="Achievements" value={String(summary.achievements.length)} colors={colors} />
        </Card>

        <PrimaryButton label="Start New Life" onPress={goToCreate} style={styles.button} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, colors }: { label: string; value: string; colors: Palette }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 48 },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  title: { fontSize: 30, fontWeight: '800', marginTop: 8 },
  subtitle: { fontSize: 15, marginTop: 4, marginBottom: 24 },
  card: { marginBottom: 24 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  rowLabel: { fontSize: 14, fontWeight: '600' },
  rowValue: { fontSize: 14, fontWeight: '700' },
  button: {},
});
