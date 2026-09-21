import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { Card } from '../components/Card';
import { StatBar } from '../components/StatBar';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAppStore } from '../../state/store';
import { roleLabel } from '../../engine/family';
import type { FamilyMember } from '../../engine/types';

function roleTitle(role: FamilyMember['role']): string {
  const label = roleLabel(role);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function RelationshipsScreen() {
  const { colors } = useTheme();
  const game = useAppStore((s) => s.game);
  const doFamilyAction = useAppStore((s) => s.doFamilyAction);

  if (!game) return null;

  const living = game.family.filter((m) => m.alive);
  const deceased = game.family.filter((m) => !m.alive);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>Family</Text>

      {living.length === 0 && (
        <Text style={[styles.empty, { color: colors.textMuted }]}>You have no living family members.</Text>
      )}

      {living.map((member) => (
        <Card key={member.id} style={styles.card}>
          <Text style={[styles.name, { color: colors.text }]}>
            {member.firstName} {member.lastName}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {roleTitle(member.role)} · Age {member.age}
          </Text>
          <StatBar label="Relationship" value={member.relationship} color={colors.primary} />
          <View style={styles.actions}>
            <PrimaryButton
              label="Spend Time"
              variant="secondary"
              onPress={() => doFamilyAction('spendTime', member.id)}
              style={styles.actionButton}
            />
            <PrimaryButton
              label="Gift $20"
              variant="secondary"
              onPress={() => doFamilyAction('gift', member.id, 20)}
              style={styles.actionButton}
              disabled={game.player.money < 20}
            />
            <PrimaryButton
              label="Argue"
              variant="secondary"
              onPress={() => doFamilyAction('argue', member.id)}
              style={styles.actionButton}
            />
            <PrimaryButton
              label="Ask for Money"
              variant="secondary"
              onPress={() => doFamilyAction('askForMoney', member.id)}
              style={styles.actionButton}
            />
          </View>
        </Card>
      ))}

      {deceased.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>In Memory Of</Text>
          {deceased.map((member) => (
            <Card key={member.id} style={[styles.card, styles.deceasedCard]}>
              <Text style={[styles.name, { color: colors.textMuted }]}>
                {member.firstName} {member.lastName}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                {roleTitle(member.role)} · Died at {member.age} · {member.deathCause}
              </Text>
            </Card>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: 8, marginBottom: 12 },
  empty: { fontSize: 14 },
  card: { marginBottom: 14 },
  deceasedCard: { opacity: 0.7 },
  name: { fontSize: 17, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 2, marginBottom: 12 },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flexGrow: 1,
    paddingHorizontal: 10,
  },
});
