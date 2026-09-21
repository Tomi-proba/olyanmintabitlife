import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { PrimaryButton } from './PrimaryButton';
import { useAppStore } from '../../state/store';

export function EventModal() {
  const { colors } = useTheme();
  const game = useAppStore((s) => s.game);
  const chooseEventOption = useAppStore((s) => s.chooseEventOption);

  const event = game?.pendingEvent;
  const visible = !!event;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {event && (
            <>
              <Text style={[styles.text, { color: colors.text }]}>{event.text}</Text>
              <View style={styles.choices}>
                {event.choices.map((choice) => (
                  <PrimaryButton
                    key={choice.id}
                    label={choice.label}
                    variant="secondary"
                    onPress={() => chooseEventOption(choice.id)}
                    style={styles.choiceButton}
                  />
                ))}
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
  },
  text: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
    marginBottom: 20,
  },
  choices: {
    gap: 10,
  },
  choiceButton: {
    width: '100%',
  },
});
