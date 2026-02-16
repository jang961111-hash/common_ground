// ==========================================
// BadgesScreen — 배지 & 업적 화면
// ==========================================
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { BadgesScreenProps, Badge, BadgeCategory, UserBadgeSummary } from '../types';
import { BADGE_CATEGORIES, RARITY_COLORS, RARITY_LABELS } from '../constants/badges';
import { mockBadges } from '../services/mockService';
import { BadgeCard } from '../components/BadgeCard';
import { BadgeUnlockModal } from '../components/BadgeUnlockModal';
import ScreenHeader from '../components/ScreenHeader';
import EmptyState from '../components/EmptyState';
import { useTheme } from '../contexts/ThemeContext';
import { useApiCall } from '../hooks/useApiCall';
import { BORDER_RADIUS, FONT_SIZE, SHADOWS, SPACING } from '../constants/theme';

export default function BadgesScreen({ navigation }: BadgesScreenProps) {
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'ALL'>('ALL');
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [showModal, setShowModal] = useState(false);

  const {
    data: summary,
    loading,
    refresh,
  } = useApiCall<UserBadgeSummary>(() => mockBadges.getBadges());

  const filteredBadges = useMemo(() => {
    if (!summary) return [];
    const badges = summary.badges;
    const filtered =
      selectedCategory === 'ALL'
        ? badges
        : badges.filter(b => b.category === selectedCategory);

    // 달성된 배지 먼저, 그 안에서 최근 달성 순
    return [...filtered].sort((a, b) => {
      if (a.unlockedAt && !b.unlockedAt) return -1;
      if (!a.unlockedAt && b.unlockedAt) return 1;
      if (a.unlockedAt && b.unlockedAt) {
        return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
      }
      return b.progress - a.progress;
    });
  }, [summary, selectedCategory]);

  const unlockedInCategory = useMemo(
    () => filteredBadges.filter(b => b.unlockedAt).length,
    [filteredBadges],
  );

  const handleBadgePress = useCallback((badge: Badge) => {
    if (badge.unlockedAt) {
      setSelectedBadge(badge);
      setShowModal(true);
    }
  }, []);

  if (loading && !summary) {
    return (
      <View style={[styles.container, { backgroundColor: colors.white }]}>
        <ScreenHeader title="배지 & 업적" onBack={() => navigation.goBack()} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      <ScreenHeader title="배지 & 업적" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
      >
        {/* 요약 카드 */}
        {summary && (
          <View style={[styles.summaryCard, SHADOWS.sm, { backgroundColor: colors.gray50 }]}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: colors.primary }]}>
                  {summary.unlockedCount}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.gray500 }]}>달성</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.gray200 }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: colors.gray400 }]}>
                  {summary.totalBadges - summary.unlockedCount}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.gray500 }]}>남은 배지</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.gray200 }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: colors.accent }]}>
                  {summary.totalBadges > 0
                    ? Math.round((summary.unlockedCount / summary.totalBadges) * 100)
                    : 0}
                  %
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.gray500 }]}>달성률</Text>
              </View>
            </View>

            {/* 최근 달성 배지 */}
            {summary.recentBadge && (
              <View style={[styles.recentBadge, { borderTopColor: colors.gray200 }]}>
                <Text style={[styles.recentLabel, { color: colors.gray500 }]}>
                  최근 달성
                </Text>
                <Text style={styles.recentEmoji}>{summary.recentBadge.emoji}</Text>
                <Text style={[styles.recentName, { color: colors.gray900 }]}>
                  {summary.recentBadge.name}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* 카테고리 필터 탭 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabs}
        >
          {BADGE_CATEGORIES.map(cat => {
            const active = selectedCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryTab,
                  {
                    backgroundColor: active ? colors.primary : colors.gray100,
                  },
                ]}
                onPress={() => setSelectedCategory(cat.key)}
                activeOpacity={0.7}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text
                  style={[
                    styles.categoryLabel,
                    { color: active ? '#FFFFFF' : colors.gray600 },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 달성 / 전체 표시 */}
        <Text style={[styles.sectionLabel, { color: colors.gray500 }]}>
          {selectedCategory === 'ALL' ? '전체' : BADGE_CATEGORIES.find(c => c.key === selectedCategory)?.label}{' '}
          배지 — {unlockedInCategory}/{filteredBadges.length}
        </Text>

        {/* 배지 리스트 */}
        {filteredBadges.length === 0 ? (
          <EmptyState
            emoji="🏅"
            title="배지가 없어요"
            subtitle="이 카테고리에 해당하는 배지가 없습니다"
          />
        ) : (
          filteredBadges.map(badge => (
            <TouchableOpacity
              key={badge.id}
              onPress={() => handleBadgePress(badge)}
              activeOpacity={0.7}
              disabled={!badge.unlockedAt}
            >
              <BadgeCard badge={badge} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* 배지 상세 모달 */}
      <BadgeUnlockModal
        badge={selectedBadge}
        visible={showModal}
        onClose={() => setShowModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },

  // ── Summary card ──
  summaryCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
  },
  summaryLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 32,
  },
  recentBadge: {
    borderTopWidth: 1,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  recentLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  recentEmoji: {
    fontSize: 20,
  },
  recentName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },

  // ── Category tabs ──
  categoryTabs: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  categoryEmoji: {
    fontSize: 14,
  },
  categoryLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },

  // ── Section label ──
  sectionLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
});
