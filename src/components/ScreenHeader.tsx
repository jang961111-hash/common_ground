import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, FONT_SIZE, SPACING } from '../constants/theme';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export default function ScreenHeader({ title, onBack, rightElement }: ScreenHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: colors.white }]} accessibilityRole="header">
      <View style={styles.left}>
        {onBack && (
          <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8} accessibilityRole="button" accessibilityLabel="뒤로 가기">
            <Text style={[styles.backText, { color: colors.primary }]}>←</Text>
          </Pressable>
        )}
        <Text style={[styles.title, { color: colors.gray900 }]}>{title}</Text>
      </View>
      {rightElement && <View style={styles.right}>{rightElement}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingHorizontal: SPACING.xl,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  backText: { fontSize: 20, color: COLORS.primary, fontWeight: '600' },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.gray900 },
  right: {},
});
