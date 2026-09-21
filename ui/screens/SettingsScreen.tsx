import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/useTheme';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAppStore } from '../../state/store';
import type { ThemePreference } from '../../state/persistence';

const OPTIONS: { id: ThemePreference; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

export function SettingsScreen() {
  const { colors } = useTheme();
  const themePreference = useAppStore((s) => s.themePreference);
  const setThemePreference = useAppStore((s) => s.setThemePreference);
  const backToTitle = useAppStore((s) => s.backToTitle);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

        <Card style={styles.card}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Appearance</Text>
          <View style={styles.chipRow}>
            {OPTIONS.map((option) => {
              const selected = themePreference === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => setThemePreference(option.id)}
                  style={[
                    styles.chip,
                    { backgroundColor: selected ? colors.primary : colors.surfaceAlt, borderColor: selected ? colors.primary : colors.border },
                  ]}
                >
                  <Text style={{ color: selected ? colors.primaryText : colors.text, fontWeight: '600' }}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <PrimaryButton label="Back" variant="secondary" onPress={backToTitle} style={styles.backButton} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 20 },
  card: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  backButton: { marginTop: 8 },
});
