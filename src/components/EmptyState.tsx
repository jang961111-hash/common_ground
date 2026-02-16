import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING } from '../constants/theme';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

function EmptyState({ emoji = '📭', title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container} accessible={true} accessibilityLabel={`${title}${subtitle ? `. ${subtitle}` : ''}`}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <Pressable style={styles.actionBtn} onPress={onAction} accessibilityRole="button" accessibilityLabel={actionLabel}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emoji: { fontSize: 48 },
  title: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.gray700, textAlign: 'center' },
  subtitle: { fontSize: FONT_SIZE.sm, color: COLORS.gray400, textAlign: 'center', lineHeight: 20 },
  actionBtn: {
    marginTop: 8,
    backgroundColor: COLORS.primaryBg,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  actionText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: '600' },
});

export default React.memo(EmptyState);
