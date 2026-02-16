// ==========================================
// ValidatedInput — 실시간 검증 피드백 인풋
// ==========================================
import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { useFadeIn } from '../hooks/useAnimations';

interface ValidatedInputProps extends Omit<TextInputProps, 'onChangeText' | 'onBlur' | 'value'> {
  label: string;
  value: string;
  error: string | null;
  touched: boolean;
  onChangeText: (text: string) => void;
  onBlur: () => void;
  /** 유효할 때 성공 표시 */
  showSuccess?: boolean;
  /** 힌트 텍스트 */
  hint?: string;
  /** 추가 렌더링 (비밀번호 강도 바 등) */
  bottomElement?: React.ReactNode;
}

function ValidatedInput({
  label,
  value,
  error,
  touched,
  onChangeText,
  onBlur,
  showSuccess = false,
  hint,
  bottomElement,
  ...inputProps
}: ValidatedInputProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const hasError = touched && !!error;
  const isSuccess = showSuccess && touched && !error && value.trim().length > 0;

  const borderColor = hasError
    ? COLORS.error
    : isSuccess
      ? '#10B981'
      : focused
        ? colors.primary
        : colors.gray200;

  const handleFocus = () => setFocused(true);
  const handleBlur = () => {
    setFocused(false);
    onBlur();
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.gray700 }]}>{label}</Text>
        {isSuccess && <Text style={styles.successIcon}>✓</Text>}
      </View>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={[
          styles.input,
          {
            backgroundColor: colors.gray50,
            borderColor,
            color: colors.gray900,
            borderWidth: focused || hasError || isSuccess ? 2 : 1,
          },
        ]}
        placeholderTextColor={colors.gray400}
        accessibilityLabel={label}
        accessibilityState={{ disabled: inputProps.editable === false }}
        {...inputProps}
      />

      {bottomElement}

      {hasError && (
        <View style={styles.feedbackRow}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={[styles.errorText, { color: COLORS.error }]}>{error}</Text>
        </View>
      )}

      {!hasError && hint && !isSuccess && (
        <Text style={[styles.hintText, { color: colors.gray400 }]}>{hint}</Text>
      )}
    </View>
  );
}

export default React.memo(ValidatedInput);

const styles = StyleSheet.create({
  container: { gap: 6 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.gray700,
  },
  successIcon: {
    fontSize: FONT_SIZE.sm,
    color: '#10B981',
    fontWeight: '700',
  },
  input: {
    backgroundColor: COLORS.gray50,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: FONT_SIZE.md,
    color: COLORS.gray900,
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  errorIcon: { fontSize: 12 },
  errorText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.error,
    flex: 1,
  },
  hintText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray400,
  },
});
