// ==========================================
// PasswordStrength — 비밀번호 강도 시각화
// ==========================================
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getPasswordStrength, PasswordLevel } from '../hooks/useFormValidation';
import { useTheme } from '../contexts/ThemeContext';
import { FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

interface PasswordStrengthProps {
  password: string;
}

function PasswordStrength({ password }: PasswordStrengthProps) {
  const { colors } = useTheme();
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  if (!password) return null;

  const barCount = 4;
  const filledBars = strength.score;

  return (
    <View style={styles.container} accessibilityLabel={`비밀번호 강도: ${strength.label}`}>
      <View style={styles.bars}>
        {Array.from({ length: barCount }, (_, i) => (
          <View
            key={i}
            style={[
              styles.bar,
              {
                backgroundColor: i < filledBars ? strength.color : colors.gray200,
              },
            ]}
          />
        ))}
      </View>
      {strength.label ? (
        <Text style={[styles.label, { color: strength.color }]}>{strength.label}</Text>
      ) : null}
    </View>
  );
}

export default React.memo(PasswordStrength);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  bars: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  bar: {
    height: 4,
    flex: 1,
    borderRadius: BORDER_RADIUS.sm,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'right',
  },
});
