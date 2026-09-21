import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/useTheme';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAppStore } from '../../state/store';
import { ACHIEVEMENTS } from '../../data/achievements';

export function AchievementsScreen() {
  const { colors } = useTheme();
  const unlockedAchievements = useAppStore((s) => s.unlockedAchievements);
  const backToTitle = useAppStore((s) => s.backToTitle);

  const unlockedCount = ACHIEVEMENTS.filter((a) => unlockedAchievements.includes(a.id)).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Achievements</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {unlockedCount} / {ACHIEVEMENTS.length} unlocked across all your lives
        </Text>

        {ACHIEVEMENTS.map((achievement) => {
          const unlocked = unlockedAchievements.includes(achievement.id);
          return (
            <Card key={achievement.id} style={[styles.card, !unlocked && styles.lockedCard]}>
              <View style={styles.row}>
                <View style={[styles.badge, { backgroundColor: unlocked ? colors.primary : colors.barTrack }]}>
                  <Text style={[styles.badgeText, { color: unlocked ? colors.primaryText : colors.textMuted }]}>
                    {unlocked ? '✓' : '?'}
                  </Text>
                </View>
                <View style={styles.textColumn}>
                  <Text style={[styles.name, { color: unlocked ? colors.text : colors.textMuted }]}>{achievement.name}</Text>
                  <Text style={[styles.description, { color: colors.textMuted }]}>{achievement.description}</Text>
                </View>
              </View>
            </Card>
          );
        })}

        <PrimaryButton label="Back" variant="secondary" onPress={backToTitle} style={styles.backButton} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 4, marginBottom: 20 },
  card: { marginBottom: 10 },
  lockedCard: { opacity: 0.6 },
  row: { flexDirection: 'row', alignItems: 'center' },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  badgeText: { fontSize: 16, fontWeight: '800' },
  textColumn: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700' },
  description: { fontSize: 12, marginTop: 2 },
  backButton: { marginTop: 12 },
});
