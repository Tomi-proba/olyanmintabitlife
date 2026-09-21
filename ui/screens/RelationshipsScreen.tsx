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
  const browseDatingApp = useAppStore((s) => s.browseDatingApp);
  const startDating = useAppStore((s) => s.startDating);
  const passOnProspect = useAppStore((s) => s.passOnProspect);
  const breakUp = useAppStore((s) => s.breakUp);
  const proposeMarriage = useAppStore((s) => s.proposeMarriage);
  const divorce = useAppStore((s) => s.divorce);
  const cheatOnPartner = useAppStore((s) => s.cheatOnPartner);
  const haveChild = useAppStore((s) => s.haveChild);

  if (!game) return null;

  const livingFamily = game.family.filter((m) => m.alive);
  const deceasedFamily = game.family.filter((m) => !m.alive);
  const livingChildren = game.children.filter((m) => m.alive);
  const deceasedChildren = game.children.filter((m) => !m.alive);

  const renderPersonCard = (member: FamilyMember, opts?: { deceased?: boolean }) => (
    <Card key={member.id} style={[styles.card, opts?.deceased && styles.deceasedCard]}>
      <Text style={[styles.name, { color: opts?.deceased ? colors.textMuted : colors.text }]}>
        {member.firstName} {member.lastName}
      </Text>
      {opts?.deceased ? (
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {roleTitle(member.role)} · Died at {member.age} · {member.deathCause}
        </Text>
      ) : (
        <>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {roleTitle(member.role)} · Age {member.age}
          </Text>
          <StatBar label="Relationship" value={member.relationship} color={colors.primary} />
          <View style={styles.actions}>
            <PrimaryButton label="Spend Time" variant="secondary" onPress={() => doFamilyAction('spendTime', member.id)} style={styles.actionButton} />
            <PrimaryButton
              label="Gift $20"
              variant="secondary"
              onPress={() => doFamilyAction('gift', member.id, 20)}
              style={styles.actionButton}
              disabled={game.player.money < 20}
            />
            <PrimaryButton label="Argue" variant="secondary" onPress={() => doFamilyAction('argue', member.id)} style={styles.actionButton} />
            <PrimaryButton label="Ask for Money" variant="secondary" onPress={() => doFamilyAction('askForMoney', member.id)} style={styles.actionButton} />
          </View>
        </>
      )}
    </Card>
  );

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>Romance</Text>
      {game.datingProspect ? (
        <Card style={styles.card}>
          <Text style={[styles.name, { color: colors.text }]}>
            {game.datingProspect.firstName} {game.datingProspect.lastName}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Age {game.datingProspect.age} · New match</Text>
          <View style={styles.actions}>
            <PrimaryButton label="Start Dating" onPress={startDating} style={styles.actionButton} />
            <PrimaryButton label="Pass" variant="secondary" onPress={passOnProspect} style={styles.actionButton} />
          </View>
        </Card>
      ) : game.partner && game.partner.alive ? (
        <Card style={styles.card}>
          <Text style={[styles.name, { color: colors.text }]}>
            {game.partner.firstName} {game.partner.lastName}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {game.flags.married ? 'Spouse' : 'Partner'} · Age {game.partner.age}
          </Text>
          <StatBar label="Relationship" value={game.partner.relationship} color={colors.primary} />
          <View style={styles.actions}>
            <PrimaryButton label="Spend Time" variant="secondary" onPress={() => doFamilyAction('spendTime', game.partner!.id)} style={styles.actionButton} />
            <PrimaryButton
              label="Gift $20"
              variant="secondary"
              onPress={() => doFamilyAction('gift', game.partner!.id, 20)}
              style={styles.actionButton}
              disabled={game.player.money < 20}
            />
            {!game.flags.married && <PrimaryButton label="Propose" onPress={proposeMarriage} style={styles.actionButton} />}
            {game.flags.married && <PrimaryButton label="Divorce" variant="danger" onPress={divorce} style={styles.actionButton} />}
            <PrimaryButton label="Have a Baby" variant="secondary" onPress={haveChild} style={styles.actionButton} />
            <PrimaryButton label="Cheat" variant="secondary" onPress={cheatOnPartner} style={styles.actionButton} />
            <PrimaryButton label="Break Up" variant="danger" onPress={breakUp} style={styles.actionButton} />
          </View>
        </Card>
      ) : (
        <Card style={styles.card}>
          <Text style={[styles.subtitle, { color: colors.textMuted, marginBottom: 12 }]}>
            {game.player.age < 16 ? "You're too young to date yet." : "You're not seeing anyone right now."}
          </Text>
          <PrimaryButton label="Browse Dating App" onPress={browseDatingApp} disabled={game.player.age < 16} style={styles.fullButton} />
        </Card>
      )}
      {livingChildren.length > 0 && (
        <>
          <Text style={[styles.title, { color: colors.text }]}>Children</Text>
          {livingChildren.map((child) => renderPersonCard(child))}
        </>
      )}

      <Text style={[styles.title, { color: colors.text }]}>Family</Text>
      {livingFamily.length === 0 && (
        <Text style={[styles.empty, { color: colors.textMuted }]}>You have no living family members.</Text>
      )}
      {livingFamily.map((member) => renderPersonCard(member))}

      {(deceasedFamily.length > 0 || deceasedChildren.length > 0 || (game.partner && !game.partner.alive)) && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>In Memory Of</Text>
          {game.partner && !game.partner.alive && renderPersonCard(game.partner, { deceased: true })}
          {deceasedFamily.map((member) => renderPersonCard(member, { deceased: true }))}
          {deceasedChildren.map((member) => renderPersonCard(member, { deceased: true }))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 16, marginTop: 8 },
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
  fullButton: {},
});
