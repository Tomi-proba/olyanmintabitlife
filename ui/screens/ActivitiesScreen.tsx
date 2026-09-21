import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAppStore } from '../../state/store';

interface ActivityDef {
  id: string;
  label: string;
  description: string;
  variant?: 'primary' | 'secondary' | 'danger';
  onPress: () => void;
}

function ActivityRow({ activity, used }: { activity: ActivityDef; used: boolean }) {
  const { colors } = useTheme();
  return (
    <Card style={styles.card}>
      <Text style={[styles.activityLabel, { color: colors.text }]}>{activity.label}</Text>
      <Text style={[styles.activityDescription, { color: colors.textMuted }]}>{activity.description}</Text>
      <PrimaryButton
        label={used ? 'Already Done This Year' : activity.label}
        variant={activity.variant ?? 'secondary'}
        onPress={activity.onPress}
        disabled={used}
        style={styles.fullButton}
      />
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );
}

export function ActivitiesScreen() {
  const { colors } = useTheme();
  const game = useAppStore((s) => s.game);
  const visitDoctor = useAppStore((s) => s.visitDoctor);
  const goToGym = useAppStore((s) => s.goToGym);
  const followDietPlan = useAppStore((s) => s.followDietPlan);
  const meditate = useAppStore((s) => s.meditate);
  const goOnVacation = useAppStore((s) => s.goOnVacation);
  const volunteer = useAppStore((s) => s.volunteer);
  const goShopping = useAppStore((s) => s.goShopping);
  const pettyTheft = useAppStore((s) => s.pettyTheft);
  const robbery = useAppStore((s) => s.robbery);
  const dealDrugs = useAppStore((s) => s.dealDrugs);
  const gamble = useAppStore((s) => s.gamble);
  const study = useAppStore((s) => s.study);
  const browseDatingApp = useAppStore((s) => s.browseDatingApp);
  const attemptPrisonEscape = useAppStore((s) => s.attemptPrisonEscape);
  const [betAmount, setBetAmount] = useState('50');

  if (!game) return null;

  const used = (id: string) => game.activitiesUsedThisYear.includes(id);
  const inPrison = !!game.prisonYearsLeft && game.prisonYearsLeft > 0;

  if (inPrison) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Text style={[styles.activityLabel, { color: colors.text }]}>Behind Bars</Text>
          <Text style={[styles.activityDescription, { color: colors.textMuted }]}>
            {game.player.firstName} is serving a prison sentence and can't do much right now.
            {' '}
            {game.prisonYearsLeft} year{game.prisonYearsLeft === 1 ? '' : 's'} left.
          </Text>
          <PrimaryButton
            label={used('prisonEscape') ? 'Already Tried This Year' : 'Attempt Escape'}
            variant="danger"
            onPress={attemptPrisonEscape}
            disabled={used('prisonEscape')}
            style={styles.fullButton}
          />
        </Card>
      </ScrollView>
    );
  }

  const health: ActivityDef[] = [
    { id: 'doctor', label: 'Doctor', description: `Checkup for $80. May diagnose or improve conditions.`, onPress: visitDoctor },
    { id: 'gym', label: 'Gym', description: 'Free workout for health, looks, and mood.', onPress: goToGym },
    { id: 'diet', label: 'Diet Plan', description: 'Eat healthy for a health and looks boost.', onPress: followDietPlan },
    { id: 'meditate', label: 'Meditate', description: 'Free happiness and a little health.', onPress: meditate },
  ];

  const lifestyle: ActivityDef[] = [
    { id: 'vacation', label: 'Vacation', description: 'A relaxing trip for $500. Big happiness boost.', onPress: goOnVacation },
    { id: 'volunteer', label: 'Volunteer', description: 'Free. Happiness and Karma boost.', onPress: volunteer },
    { id: 'shopping', label: 'Shopping', description: 'Treat yourself for $150. Looks and happiness.', onPress: goShopping },
  ];

  const crime: ActivityDef[] = [
    { id: 'pettyTheft', label: 'Petty Theft', description: 'Low risk, low reward. Might get fined or jailed.', variant: 'danger', onPress: pettyTheft },
    { id: 'robbery', label: 'Robbery', description: 'High risk, high reward. Serious jail time if caught.', variant: 'danger', onPress: robbery },
    { id: 'dealDrugs', label: 'Deal Drugs', description: 'Big money, big risk — to your freedom and health.', variant: 'danger', onPress: dealDrugs },
  ];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Section title="Health">
        {health.map((a) => (
          <ActivityRow key={a.id} activity={a} used={used(a.id)} />
        ))}
      </Section>

      <Section title="Lifestyle">
        {lifestyle.map((a) => (
          <ActivityRow key={a.id} activity={a} used={used(a.id)} />
        ))}
      </Section>

      <Section title="Casino">
        <Card style={styles.card}>
          <Text style={[styles.activityLabel, { color: colors.text }]}>Gamble</Text>
          <Text style={[styles.activityDescription, { color: colors.textMuted }]}>
            45% chance to double your bet, 55% chance to lose it.
          </Text>
          <TextInput
            value={betAmount}
            onChangeText={setBetAmount}
            keyboardType="number-pad"
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="Bet amount"
            placeholderTextColor={colors.textMuted}
          />
          <PrimaryButton
            label="Place Bet"
            variant="danger"
            onPress={() => gamble(Math.max(0, parseInt(betAmount, 10) || 0))}
            disabled={used('gamble')}
            style={styles.fullButton}
          />
        </Card>
      </Section>

      <Section title="Crime">
        {crime.map((a) => (
          <ActivityRow key={a.id} activity={a} used={used(a.id)} />
        ))}
      </Section>

      <Section title="More">
        <Text style={[styles.activityDescription, { color: colors.textMuted, marginBottom: 8 }]}>
          Study and Dating are also available here as quick shortcuts — full detail lives under Occupation and
          Relationships.
        </Text>
        <View style={styles.actions}>
          <PrimaryButton label="Study" variant="secondary" onPress={study} style={styles.actionButton} />
          <PrimaryButton label="Browse Dating App" variant="secondary" onPress={browseDatingApp} style={styles.actionButton} />
        </View>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  card: { marginBottom: 12 },
  activityLabel: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  activityDescription: { fontSize: 13, marginBottom: 10 },
  fullButton: {},
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionButton: { flexGrow: 1 },
});
