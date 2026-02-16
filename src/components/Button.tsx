import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, FONT_SIZE } from '../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  fullWidth?: boolean;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = true,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const containerStyles: ViewStyle[] = [
    styles.base,
    styles[`container_${variant}`],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
  ].filter(Boolean) as ViewStyle[];

  const textStyles: TextStyle[] = [
    styles.text,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
    isDisabled && styles.textDisabled,
  ].filter(Boolean) as TextStyle[];

  return (
    <Pressable
      style={({ pressed }) => [
        ...containerStyles,
        pressed && !isDisabled && styles.pressed,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={loading ? `${title} 로딩 중` : title}
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : COLORS.primary} size="small" />
      ) : (
        <>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    gap: 8,
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },

  // Variants
  container_primary: {
    backgroundColor: COLORS.primary,
  },
  container_secondary: {
    backgroundColor: COLORS.gray100,
  },
  container_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  container_ghost: {
    backgroundColor: 'transparent',
  },
  container_danger: {
    backgroundColor: COLORS.error,
  },

  // Sizes
  size_sm: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  size_md: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  size_lg: {
    paddingVertical: 18,
    paddingHorizontal: 24,
  },

  // Text
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  text_primary: {
    color: '#fff',
  },
  text_secondary: {
    color: COLORS.gray700,
  },
  text_outline: {
    color: COLORS.primary,
  },
  text_ghost: {
    color: COLORS.primary,
  },
  text_danger: {
    color: '#fff',
  },
  textSize_sm: {
    fontSize: FONT_SIZE.sm,
  },
  textSize_md: {
    fontSize: FONT_SIZE.lg,
  },
  textSize_lg: {
    fontSize: FONT_SIZE.xl,
  },
  textDisabled: {
    opacity: 0.7,
  },
  icon: {
    fontSize: 18,
  },
});
