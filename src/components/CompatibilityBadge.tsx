// ==========================================
// CompatibilityBadge — 호환도 점수 표시 배지
// ==========================================
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import AnimatedPressable from './AnimatedPressable';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';

// ── 점수별 색상 ──
function getScoreColor(score: number): string {
  if (score >= 80) return COLORS.success;
  if (score >= 60) return COLORS.primary;
  if (score >= 40) return COLORS.warning;
  return COLORS.gray400;
}

// ── 원형 프로그레스 (텍스트 기반 간이 표현) ──
interface CompatibilityBadgeProps {
  score: number;
  label: string;
  emoji: string;
  /** 'compact' = 작은 인라인 배지, 'full' = 큰 원형 */
  variant?: 'compact' | 'full';
  onPress?: () => void;
}

export default function CompatibilityBadge({
  score,
  label,
  emoji,
  variant = 'compact',
  onPress,
}: CompatibilityBadgeProps) {
  const { colors } = useTheme();
  const color = getScoreColor(score);

  if (variant === 'compact') {
    const content = (
      <View style={[styles.compactBadge, { backgroundColor: color + '18' }]}>
        <Text style={[styles.compactScore, { color }]}>{score}%</Text>
      </View>
    );

    if (onPress) {
      return (
        <AnimatedPressable onPress={onPress} accessibilityLabel={`호환도 ${score}% — ${label}`} accessibilityHint="상세 보기">
          {content}
        </AnimatedPressable>
      );
    }
    return content;
  }

  // ── full 변형 ──
  return (
    <AnimatedPressable
      onPress={onPress}
      style={[styles.fullContainer, { borderColor: color + '33' }]}
      accessibilityLabel={`호환도 ${score}% — ${label}`}
      accessibilityHint={onPress ? '상세 보기' : undefined}
      disabled={!onPress}
    >
      {/* 원형 점수 */}
      <View style={[styles.circle, { borderColor: color }]}>
        <Text style={[styles.circleEmoji]}>{emoji}</Text>
        <Text style={[styles.circleScore, { color }]}>{score}%</Text>
      </View>
      <Text style={[styles.fullLabel, { color: colors.gray800 }]}>{label}</Text>
    </AnimatedPressable>
  );
}

// ── 카테고리 바 차트 행 ──
interface CategoryBarProps {
  category: string;
  score: number;
  commonCount: number;
  totalPossible: number;
}

export function CategoryBar({ category, score, commonCount, totalPossible }: CategoryBarProps) {
  const { colors } = useTheme();
  const barColor = getScoreColor(score);

  return (
    <View style={styles.catRow} accessibilityLabel={`${category}: ${score}%, 공통 ${commonCount}/${totalPossible}`}>
      <Text style={[styles.catLabel, { color: colors.gray600 }]}>{category}</Text>
      <View style={[styles.catBarBg, { backgroundColor: colors.gray200 }]}>
        <View style={[styles.catBarFill, { width: `${score}%`, backgroundColor: barColor }]} />
      </View>
      <Text style={[styles.catScore, { color: barColor }]}>{score}%</Text>
    </View>
  );
}

// ── 점수 요약 카드 ──
interface ScoreSummaryProps {
  label: string;
  score: number;
  emoji: string;
  description: string;
}

export function ScoreSummary({ label, score, emoji, description }: ScoreSummaryProps) {
  const { colors } = useTheme();
  const color = getScoreColor(score);

  return (
    <View style={[styles.summaryCard, { backgroundColor: colors.gray50, borderColor: colors.gray200 }]}>
      <Text style={styles.summaryEmoji}>{emoji}</Text>
      <View style={styles.summaryContent}>
        <View style={styles.summaryHeader}>
          <Text style={[styles.summaryLabel, { color: colors.gray800 }]}>{label}</Text>
          <Text style={[styles.summaryScore, { color }]}>{score}%</Text>
        </View>
        <Text style={[styles.summaryDesc, { color: colors.gray500 }]}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // compact
  compactBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  compactScore: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  // full
  fullContainer: {
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 2,
    gap: SPACING.sm,
  },
  circle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleEmoji: {
    fontSize: 24,
  },
  circleScore: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    marginTop: 2,
  },
  fullLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  // category bar
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  catLabel: {
    fontSize: FONT_SIZE.sm,
    width: 56,
  },
  catBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  catBarFill: {
    height: 8,
    borderRadius: 4,
  },
  catScore: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    width: 36,
    textAlign: 'right',
  },
  // summary
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  summaryEmoji: {
    fontSize: 28,
  },
  summaryContent: {
    flex: 1,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  summaryScore: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  summaryDesc: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
});
