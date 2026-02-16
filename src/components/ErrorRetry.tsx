import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';

// ==========================================
// ErrorRetry — 에러 발생 시 재시도 UI
// ==========================================

interface ErrorRetryProps {
  /** 에러 메시지 (기본: '문제가 발생했어요') */
  message?: string;
  /** 상세 설명 */
  detail?: string;
  /** 재시도 콜백 */
  onRetry?: () => void;
  /** 뒤로가기 콜백 */
  onGoBack?: () => void;
  /** 전체 화면 모드 (기본 true) */
  fullScreen?: boolean;
}

export default function ErrorRetry({
  message = '문제가 발생했어요',
  detail = '네트워크 연결을 확인하고 다시 시도해주세요',
  onRetry,
  onGoBack,
  fullScreen = true,
}: ErrorRetryProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]} accessibilityRole="alert">
      <Text style={styles.emoji}>😵</Text>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.detail}>{detail}</Text>
      <View style={styles.actions}>
        {onRetry && (
          <Pressable style={styles.retryBtn} onPress={onRetry} accessibilityRole="button" accessibilityLabel="다시 시도">
            <Text style={styles.retryText}>🔄 다시 시도</Text>
          </Pressable>
        )}
        {onGoBack && (
          <Pressable style={styles.backBtn} onPress={onGoBack} accessibilityRole="button" accessibilityLabel="돌아가기">
            <Text style={styles.backText}>← 돌아가기</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ==========================================
// InlineError — 인라인 에러 배너
// ==========================================

interface InlineErrorProps {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}

export function InlineError({ message, onDismiss, onRetry }: InlineErrorProps) {
  return (
    <View style={styles.inlineBanner} accessibilityRole="alert">
      <Text style={styles.inlineIcon}>⚠️</Text>
      <Text style={styles.inlineText}>{message}</Text>
      <View style={styles.inlineActions}>
        {onRetry && (
          <Pressable onPress={onRetry} accessibilityRole="button" accessibilityLabel="재시도">
            <Text style={styles.inlineRetry}>재시도</Text>
          </Pressable>
        )}
        {onDismiss && (
          <Pressable onPress={onDismiss} accessibilityRole="button" accessibilityLabel="에러 메시지 닫기">
            <Text style={styles.inlineDismiss}>✕</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Full screen error
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: 10,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  emoji: { fontSize: 56 },
  message: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.gray800,
    textAlign: 'center',
  },
  detail: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray500,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 24,
    paddingVertical: 12,
    ...SHADOWS.sm,
  },
  retryText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  backBtn: {
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backText: {
    color: COLORS.gray600,
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },

  // Inline error banner
  inlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: SPACING.xl,
    marginBottom: 12,
    gap: 8,
  },
  inlineIcon: { fontSize: 16 },
  inlineText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.error,
  },
  inlineActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  inlineRetry: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.error,
    fontWeight: '600',
  },
  inlineDismiss: {
    fontSize: 16,
    color: COLORS.error,
    fontWeight: '600',
  },
});
