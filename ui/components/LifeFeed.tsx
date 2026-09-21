import React, { useEffect, useRef } from 'react';
import { Animated, FlatList, StyleSheet, Text, View } from 'react-native';
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

function FeedEntryRow({ entry }: { entry: FeedEntry }) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 280, useNativeDriver: true }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.entry,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity, transform: [{ translateY }] },
      ]}
    >
      <Text style={[styles.entryText, { color: colors.text }]}>{entry.text}</Text>
    </Animated.View>
  );
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
        return <FeedEntryRow entry={item.entry} />;
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
