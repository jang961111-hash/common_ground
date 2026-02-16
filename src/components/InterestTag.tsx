import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { getInterestById } from '../constants/interests';
import { COLORS, BORDER_RADIUS, FONT_SIZE } from '../constants/theme';

interface InterestTagProps {
  interestId: string;
  isHighlighted?: boolean;
  size?: 'sm' | 'md';
  onRemove?: () => void;
}

function InterestTag({ interestId, isHighlighted = false, size = 'md', onRemove }: InterestTagProps) {
  const interest = getInterestById(interestId);
  if (!interest) return null;

  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.tag,
        isSm && styles.tagSm,
        isHighlighted && styles.tagHighlighted,
      ]}
      accessible={!onRemove}
      accessibilityLabel={`관심사: ${interest.label}`}
    >
      <Text
        style={[
          styles.text,
          isSm && styles.textSm,
          isHighlighted && styles.textHighlighted,
        ]}
      >
        {interest.emoji} {interest.label}
      </Text>
      {onRemove && (
        <Pressable onPress={onRemove} style={styles.removeBtn} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${interest.label} 삭제`}>
          <Text style={styles.removeText}>×</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  tagSm: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagHighlighted: {
    backgroundColor: COLORS.primaryBg,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  text: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray700,
  },
  textSm: {
    fontSize: FONT_SIZE.xs,
  },
  textHighlighted: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  removeBtn: {
    marginLeft: 2,
  },
  removeText: {
    fontSize: 16,
    color: COLORS.gray400,
    fontWeight: '600',
  },
});

export default React.memo(InterestTag);
