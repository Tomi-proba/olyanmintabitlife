import React, { useRef } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { FeedEntry } from '../../engine/types';
import { useTheme } from '../theme/useTheme';

interface LifeFeedProps {
  entries: FeedEntry[];
}

type Row = { kind: 'header'; age: number; key: string } | { kind: 'entry'; entry: FeedEntry; key: string };

function toRows(entries: FeedEntry[]): Row[] {
  const rows: Row[] = [];
  let lastAge: number | null = null;
  for (const entry of entries) {
    if (entry.age !== lastAge) {
      rows.push({ kind: 'header', age: entry.age, key: `header-${entry.age}` });
      lastAge = entry.age;
    }
    rows.push({ kind: 'entry', entry, key: entry.id });
  }
  return rows;
}

export function LifeFeed({ entries }: LifeFeedProps) {
  const { colors } = useTheme();
  const listRef = useRef<FlatList<Row>>(null);
  const rows = toRows(entries);

  return (
    <FlatList
      ref={listRef}
      data={rows}
      keyExtractor={(row) => row.key}
      contentContainerStyle={styles.content}
      onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      renderItem={({ item }) => {
        if (item.kind === 'header') {
          return (
            <View style={styles.headerRow}>
              <View style={[styles.headerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.headerText, { color: colors.textMuted }]}>Age {item.age}</Text>
              <View style={[styles.headerLine, { backgroundColor: colors.border }]} />
            </View>
          );
        }
        return (
          <View style={[styles.entry, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.entryText, { color: colors.text }]}>{item.entry.text}</Text>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  headerLine: {
    flex: 1,
    height: 1,
  },
  headerText: {
    marginHorizontal: 10,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  entry: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  entryText: {
    fontSize: 15,
    lineHeight: 21,
  },
});
