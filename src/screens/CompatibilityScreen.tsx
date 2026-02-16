// ==========================================
// CompatibilityScreen — 호환도 상세 비교 화면
// ==========================================
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { mockProfile } from '../services/mockService';
import { useCompatibility } from '../hooks/useCompatibility';
import ScreenHeader from '../components/ScreenHeader';
import Avatar from '../components/Avatar';
import InterestTag from '../components/InterestTag';
import AnimatedPressable from '../components/AnimatedPressable';
import CompatibilityBadge, { CategoryBar, ScoreSummary } from '../components/CompatibilityBadge';
import { Skeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { User, CompatibilityScreenProps } from '../types';

export default function CompatibilityScreen({ route, navigation }: CompatibilityScreenProps) {
  const { userId: targetUserId } = route.params;
  const { user: me } = useAuth();
  const { colors } = useTheme();
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const { score, loading: loadingScore, refresh } = useCompatibility(targetUserId);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingUser(true);
      const u = await mockProfile.getUserById(targetUserId);
      setTargetUser(u);
      setLoadingUser(false);
    })();
  }, [targetUserId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    refresh();
    const u = await mockProfile.getUserById(targetUserId);
    setTargetUser(u);
    setRefreshing(false);
  }, [targetUserId, refresh]);

  const loading = loadingUser || loadingScore;

  // ── 스켈레톤 ──
  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.white }]}>
        <ScreenHeader title="호환도" onBack={() => navigation.goBack()} />
        <View style={styles.skeletonWrap}>
          <View style={styles.skeletonAvatars}>
            <Skeleton width={64} height={64} borderRadius={32} />
            <Skeleton width={40} height={20} borderRadius={8} />
            <Skeleton width={64} height={64} borderRadius={32} />
          </View>
          <Skeleton width={100} height={100} borderRadius={50} style={{ alignSelf: 'center', marginTop: 20 }} />
          <Skeleton width="100%" height={20} borderRadius={8} style={{ marginTop: 24 }} />
          <Skeleton width="80%" height={16} borderRadius={8} style={{ marginTop: 12 }} />
          <Skeleton width="100%" height={120} borderRadius={12} style={{ marginTop: 24 }} />
        </View>
      </View>
    );
  }

  if (!targetUser || !score) {
    return (
      <View style={[styles.container, { backgroundColor: colors.white }]}>
        <ScreenHeader title="호환도" onBack={() => navigation.goBack()} />
        <EmptyState
          emoji="😅"
          title="호환도를 계산할 수 없어요"
          subtitle="프로필 정보가 부족합니다"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      <ScreenHeader title="호환도" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* ── 두 사용자 아바타 ── */}
        <View style={styles.avatarPair}>
          <View style={styles.avatarCol}>
            <Avatar
              name={me?.displayName ?? '나'}
              emoji={me?.avatarEmoji}
              customColor={me?.avatarColor}
              size={56}
            />
            <Text style={[styles.avatarName, { color: colors.gray800 }]} numberOfLines={1}>나</Text>
          </View>
          <Text style={styles.vsText}>⚡</Text>
          <View style={styles.avatarCol}>
            <Avatar
              name={targetUser.displayName}
              emoji={targetUser.avatarEmoji}
              customColor={targetUser.avatarColor}
              size={56}
            />
            <Text style={[styles.avatarName, { color: colors.gray800 }]} numberOfLines={1}>
              {targetUser.displayName}
            </Text>
          </View>
        </View>

        {/* ── 종합 점수 원형 ── */}
        <CompatibilityBadge
          score={score.overall}
          label={score.label}
          emoji={score.emoji}
          variant="full"
        />

        {/* ── 세부 점수 ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.gray800 }]}>📊 세부 점수</Text>
          <ScoreSummary
            label="관심사 매칭"
            score={score.interestScore}
            emoji="🎯"
            description={`공통 관심사 ${score.commonInterests.length}개`}
          />
          <ScoreSummary
            label="카테고리 다양성"
            score={score.categoryScore}
            emoji="🏷️"
            description={`공통 카테고리 ${score.commonCategories.length}개`}
          />
          <ScoreSummary
            label="대화 주제 교집합"
            score={score.topicScore}
            emoji="💬"
            description={`공통 주제 ${score.commonTopics.length}개`}
          />
        </View>

        {/* ── 카테고리별 비교 ── */}
        {score.categoryBreakdown.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.gray800 }]}>🏷️ 카테고리별 비교</Text>
            <View style={[styles.chartCard, { backgroundColor: colors.gray50, borderColor: colors.gray200 }]}>
              {score.categoryBreakdown.map(cat => (
                <CategoryBar
                  key={cat.category}
                  category={cat.category}
                  score={cat.score}
                  commonCount={cat.commonCount}
                  totalPossible={cat.totalPossible}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── 공통 관심사 ── */}
        {score.commonInterests.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.gray800 }]}>
              ✨ 공통 관심사 ({score.commonInterests.length}개)
            </Text>
            <View style={styles.interestRow}>
              {score.commonInterests.map(id => (
                <InterestTag key={id} interestId={id} isHighlighted />
              ))}
            </View>
          </View>
        )}

        {/* ── 공통 대화 주제 ── */}
        {score.commonTopics.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.gray800 }]}>💬 공통 대화 주제</Text>
            {score.commonTopics.map((topic, idx) => (
              <View key={idx} style={[styles.topicCard, { backgroundColor: colors.primaryBg }]}>
                <Text style={styles.topicEmoji}>💡</Text>
                <Text style={[styles.topicText, { color: colors.primary }]}>{topic}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── 대화 시작 CTA ── */}
        <AnimatedPressable
          style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            const myAll = [...(me?.recentInterests ?? []), ...(me?.alwaysInterests ?? [])];
            const theirAll = [...targetUser.recentInterests, ...targetUser.alwaysInterests];
            navigation.navigate('ConversationTopics', {
              displayName: targetUser.displayName,
              commonInterests: score.commonInterests,
              theirInterests: theirAll,
            });
          }}
          scaleValue={0.95}
          accessibilityRole="button"
          accessibilityLabel="대화 추천 보기"
        >
          <Text style={styles.ctaBtnText}>💬 대화 주제 추천 받기</Text>
        </AnimatedPressable>

        <AnimatedPressable
          style={[styles.secondaryBtn, { borderColor: colors.primary }]}
          onPress={() => navigation.navigate('UserDetail', { userId: targetUserId })}
          scaleValue={0.95}
          accessibilityRole="button"
          accessibilityLabel="프로필 보기"
        >
          <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>👤 프로필 보기</Text>
        </AnimatedPressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    gap: SPACING.lg,
  },
  // Avatar pair
  avatarPair: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xl,
  },
  avatarCol: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  avatarName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    maxWidth: 80,
    textAlign: 'center',
  },
  vsText: {
    fontSize: 28,
    marginHorizontal: SPACING.sm,
  },
  // Sections
  section: {
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  // Chart
  chartCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
  },
  // Interest row
  interestRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  // Topic card
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  topicEmoji: {
    fontSize: 20,
  },
  topicText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    flex: 1,
  },
  // CTA
  ctaBtn: {
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  ctaBtnText: {
    color: '#fff',
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  // Skeleton
  skeletonWrap: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
  },
  skeletonAvatars: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xl,
  },
});
