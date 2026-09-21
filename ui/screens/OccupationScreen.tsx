import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { Card } from '../components/Card';
import { StatBar } from '../components/StatBar';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAppStore } from '../../state/store';
import { isEnrolled } from '../../engine/education';
import { listAvailableJobs } from '../../engine/career';
import { MAJORS, UNIVERSITY_MIN_AGE, UNIVERSITY_MAX_AGE, UNIVERSITY_MIN_GPA } from '../../data/schools';

const STAGE_LABELS: Record<string, string> = {
  preschool: 'Preschool',
  elementary: 'Elementary School',
  middle: 'Middle School',
  high: 'High School',
  university: 'University',
};

export function OccupationScreen() {
  const { colors } = useTheme();
  const game = useAppStore((s) => s.game);
  const study = useAppStore((s) => s.study);
  const skipSchool = useAppStore((s) => s.skipSchool);
  const enrollInUniversity = useAppStore((s) => s.enrollInUniversity);
  const applyForJob = useAppStore((s) => s.applyForJob);
  const workHard = useAppStore((s) => s.workHard);
  const quitJob = useAppStore((s) => s.quitJob);
  const retireFromJob = useAppStore((s) => s.retireFromJob);
  const [showMajors, setShowMajors] = useState(false);

  if (!game) return null;
  const { education, player } = game;
  const enrolled = isEnrolled(education.stage);

  const canApplyToUniversity =
    player.age >= UNIVERSITY_MIN_AGE &&
    player.age <= UNIVERSITY_MAX_AGE &&
    !!game.flags.highSchoolDiploma &&
    !game.flags.bachelorDegree &&
    education.gpa >= UNIVERSITY_MIN_GPA &&
    education.stage !== 'university';

  const availableJobs = listAvailableJobs(game);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {enrolled && (
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {STAGE_LABELS[education.stage] ?? education.stage}
          </Text>
          {education.major && <Text style={[styles.subtitle, { color: colors.textMuted }]}>Major: {education.major}</Text>}
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>GPA: {education.gpa.toFixed(2)} / 4.00</Text>
          <View style={styles.actionsRow}>
            <PrimaryButton label="Study" variant="secondary" onPress={study} style={styles.flexButton} />
            <PrimaryButton label="Skip" variant="secondary" onPress={skipSchool} style={styles.flexButton} />
          </View>
        </Card>
      )}

      {canApplyToUniversity && (
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Apply to University</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Your grades qualify you for university. Tuition is charged yearly.
          </Text>
          {!showMajors ? (
            <PrimaryButton label="Choose a Major" onPress={() => setShowMajors(true)} style={styles.fullButton} />
          ) : (
            <View style={styles.chipRow}>
              {MAJORS.map((major) => (
                <PrimaryButton
                  key={major.id}
                  label={major.name}
                  variant="secondary"
                  onPress={() => enrollInUniversity(major.id)}
                  style={styles.chipButton}
                />
              ))}
            </View>
          )}
        </Card>
      )}

      {game.job ? (
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{game.job.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {game.job.field} · Level {game.job.level} · ${game.job.salary.toLocaleString()}/yr
          </Text>
          <StatBar label="Performance" value={game.job.performance} color={colors.success} />
          <View style={styles.actionsRow}>
            <PrimaryButton label="Work Hard" onPress={workHard} style={styles.flexButton} />
            <PrimaryButton label="Quit" variant="secondary" onPress={quitJob} style={styles.flexButton} />
          </View>
          {player.age >= 55 && (
            <PrimaryButton label="Retire" variant="danger" onPress={retireFromJob} style={styles.fullButton} />
          )}
        </Card>
      ) : (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 8 }]}>Job Board</Text>
          {availableJobs.length === 0 && (
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              No jobs available yet — build up your smarts and education first.
            </Text>
          )}
          {availableJobs.map((job) => (
            <Card key={job.id} style={styles.card}>
              <Text style={[styles.jobTitle, { color: colors.text }]}>{job.titles[0]}</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                {job.field} · ${job.baseSalary.toLocaleString()}/yr{job.partTime ? ' · Part-time' : ''}
              </Text>
              <PrimaryButton label="Apply" onPress={() => applyForJob(job.id)} style={styles.fullButton} />
            </Card>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48 },
  card: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  jobTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  subtitle: { fontSize: 13, marginBottom: 10 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  flexButton: { flex: 1 },
  fullButton: { marginTop: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chipButton: { flexGrow: 1 },
});
