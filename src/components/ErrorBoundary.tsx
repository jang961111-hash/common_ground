import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';

// ==========================================
// ErrorBoundary — React 에러 경계
// ==========================================

interface ErrorBoundaryProps {
  children: ReactNode;
  /** 에러 시 대체 UI (기본: 내장 폴백) */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 향후 에러 리포팅 서비스 연동 가능
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>🐛</Text>
          <Text style={styles.title}>앗, 오류가 발생했어요</Text>
          <Text style={styles.message}>
            앱에서 예상하지 못한 문제가 생겼어요.{'\n'}
            다시 시도하면 해결될 수 있어요.
          </Text>
          {__DEV__ && this.state.error && (
            <View style={styles.debugBox}>
              <Text style={styles.debugTitle}>Debug Info</Text>
              <Text style={styles.debugText} numberOfLines={5}>
                {this.state.error.message}
              </Text>
            </View>
          )}
          <Pressable style={styles.retryBtn} onPress={this.handleReset}>
            <Text style={styles.retryText}>🔄 다시 시도</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    gap: 12,
  },
  emoji: { fontSize: 64 },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.gray800,
  },
  message: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray500,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  debugBox: {
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    padding: 12,
    width: '100%',
    marginVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  debugTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.error,
    marginBottom: 4,
  },
  debugText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray600,
    fontFamily: 'monospace',
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 28,
    paddingVertical: 14,
    ...SHADOWS.sm,
  },
  retryText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.white,
    fontWeight: '600',
  },
});
