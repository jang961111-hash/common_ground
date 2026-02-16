// ==========================================
// InterestRecommendCard — 트렌딩/추천 관심사 카드
// ==========================================
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { getInterestById } from '../constants/interests';
import { useTheme } from '../contexts/ThemeContext';
import AnimatedPressable from './AnimatedPressable';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { TrendingInterest, InterestRecommendation } from '../types';

interface TrendingCardProps {
  items: TrendingInterest[];
  onExplore: () => void;
  onInterestPress?: (interestId: string) => void;
}

export function TrendingCard({ items, onExplore, onInterestPress }: TrendingCardProps) {
  const { colors } = useTheme();

  if (items.length === 0) return null;

  const trendIcon = (trend: TrendingInterest['trend']) => {
    if (trend === 'hot') return '🔥';
    if (trend === 'rising') return '📈';
    return '✨';
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.white }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.gray900 }]}>🔥 트렌딩 관심사</Text>
        <Pressable
          onPress={onExplore}
          accessibilityRole="link"
          accessibilityLabel="관심사 더보기"
        >
          <Text style={[styles.link, { color: colors.primary }]}>더보기 →</Text>
        </Pressable>
      </View>

      <View style={styles.chipRow}>
        {items.slice(0, 5).map(item => {
          const interest = getInterestById(item.interestId);
          if (!interest) return null;

          return (
            <AnimatedPressable
              key={item.interestId}
              style={[styles.trendChip, { backgroundColor: colors.gray50, borderColor: colors.gray200 }]}
              onPress={() => onInterestPress?.(item.interestId)}
              accessibilityRole="button"
              accessibilityLabel={`${interest.label} - ${item.userCount}명 관심`}
            >
              <Text style={styles.chipEmoji}>{interest.emoji}</Text>
              <Text style={[styles.chipName, { color: colors.gray800 }]} numberOfLines={1}>
                {interest.label}
              </Text>
              <View style={styles.trendMeta}>
                <Text style={styles.trendIcon}>{trendIcon(item.trend)}</Text>
                <Text style={[styles.trendCount, { color: colors.gray500 }]}>
                  {item.userCount}명
                </Text>
              </View>
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}

interface RecommendCardProps {
  items: InterestRecommendation[];
  onAddInterest: (interestId: string) => void;
}

export function RecommendCard({ items, onAddInterest }: RecommendCardProps) {
  const { colors } = useTheme();

  if (items.length === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.white }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.gray900 }]}>✨ 추천 관심사</Text>
      </View>
      <Text style={[styles.subtitle, { color: colors.gray500 }]}>
        주변 사람들이 관심 있는 주제예요
      </Text>

      <View style={styles.recommendList}>
        {items.slice(0, 4).map(item => {
          const interest = getInterestById(item.interestId);
          if (!interest) return null;

          return (
            <View
              key={item.interestId}
              style={[styles.recommendItem, { borderBottomColor: colors.gray100 }]}
            >
              <View style={styles.recommendInfo}>
                <Text style={styles.recommendEmoji}>{interest.emoji}</Text>
                <View style={styles.recommendText}>
                  <Text style={[styles.recommendName, { color: colors.gray800 }]}>
                    {interest.label}
                  </Text>
                  <Text style={[styles.recommendReason, { color: colors.gray500 }]} numberOfLines={1}>
                    {item.reason}
                  </Text>
                </View>
              </View>
              <AnimatedPressable
                style={[styles.addBtn, { backgroundColor: colors.primaryBg }]}
                onPress={() => onAddInterest(item.interestId)}
                accessibilityRole="button"
                accessibilityLabel={`${interest.label} 추가`}
              >
                <Text style={[styles.addBtnText, { color: colors.primary }]}>+ 추가</Text>
              </AnimatedPressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.lg,
    padding: 14,
    ...SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  link: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  subtitle: { fontSize: FONT_SIZE.xs, marginTop: 4, marginBottom: 8 },

  // Trending chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  trendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  chipEmoji: { fontSize: 16 },
  chipName: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  trendMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  trendIcon: { fontSize: 12 },
  trendCount: { fontSize: FONT_SIZE.xs },

  // Recommend list
  recommendList: { marginTop: 8, gap: 2 },
  recommendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  recommendInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  recommendEmoji: { fontSize: 24 },
  recommendText: { flex: 1, gap: 2 },
  recommendName: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  recommendReason: { fontSize: FONT_SIZE.xs },
  addBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
  },
  addBtnText: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
});
