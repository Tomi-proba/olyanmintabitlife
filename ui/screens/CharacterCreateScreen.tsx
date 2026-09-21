import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/useTheme';
import { PrimaryButton } from '../components/PrimaryButton';
import { Card } from '../components/Card';
import { useAppStore } from '../../state/store';
import { COUNTRIES } from '../../data/countries';
import type { Gender } from '../../engine/types';

type GenderOption = Gender | 'random';

export function CharacterCreateScreen() {
  const { colors } = useTheme();
  const startNewLife = useAppStore((s) => s.startNewLife);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<GenderOption>('random');
  const [countryName, setCountryName] = useState<string | undefined>(undefined);

  const handleStart = () => {
    startNewLife({
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      gender: gender === 'random' ? undefined : gender,
      countryName,
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.text }]}>Create Your Life</Text>

        <Card style={styles.card}>
          <Text style={[styles.label, { color: colors.textMuted }]}>First name (optional)</Text>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Random"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />

          <Text style={[styles.label, { color: colors.textMuted, marginTop: 12 }]}>Last name (optional)</Text>
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder="Random"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Gender</Text>
          <View style={styles.chipRow}>
            {(['random', 'male', 'female'] as GenderOption[]).map((option) => (
              <Chip
                key={option}
                label={option === 'random' ? 'Random' : option === 'male' ? 'Male' : 'Female'}
                selected={gender === option}
                onPress={() => setGender(option)}
              />
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Country</Text>
          <View style={styles.chipRow}>
            <Chip label="Random" selected={countryName === undefined} onPress={() => setCountryName(undefined)} />
            {COUNTRIES.map((c) => (
              <Chip
                key={c.country}
                label={c.country}
                selected={countryName === c.country}
                onPress={() => setCountryName(c.country)}
              />
            ))}
          </View>
        </Card>

        <PrimaryButton label="Begin Life" onPress={handleStart} style={styles.startButton} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.surfaceAlt,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <Text style={{ color: selected ? colors.primaryText : colors.text, fontWeight: '600', fontSize: 13 }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 16 },
  card: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 6,
    fontSize: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  startButton: { marginTop: 8 },
});
