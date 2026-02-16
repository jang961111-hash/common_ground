// ==========================================
// StatsScreen — 활동 통계 대시보드
// ==========================================
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, RefreshControl, Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { mockStats } from '../services/mockService';
import { getInterestById } from '../constants/interests';
import MiniBarChart from '../components/MiniBarChart';
import { useTheme } from '../contexts/ThemeContext';
import { useFadeIn } from '../hooks/useAnimations';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { ActivityStats, StatsScreenProps } from '../types';

// ── 통계 카드 ──
function StatCard({
  icon, label, value, sub, colors,
}: {
  icon: string; label: string; value: string | number; sub?: string; colors: any;
}) {
  return (
    <View
      style={[styles.statCard, { backgroundColor: colors.white }]}
      accessibilityLabel={`${label} ${value}${sub ? `, ${sub}` : ''}`}
    >
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color: colors.gray900 }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.gray500 }]}>{label}</Text>
      {sub && <Text style={[styles.statSub, { color: sub.includes('+') || sub.includes('↑') ? COLORS.success : sub.includes('-') || sub.includes('↓') ? COLORS.error : colors.gray400 }]}>{sub}</Text>}
    </View>
  );
}

export default function StatsScreen({ navigation }: StatsScreenProps) {
  const { colors } = useTheme();
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fade0 = useFadeIn(0);
  const fade1 = useFadeIn(100);
  const fade2 = useFadeIn(200);
  const fade3 = useFadeIn(300);

  const load = useCallback(async () => {
    try {
      const data = await mockStats.getStats();
      setStats(data);
    } catch { /* empty */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const trendText = stats
    ? stats.profileViewsTrend > 0
      ? `↑ ${stats.profileViewsTrend}%`
      : stats.profileViewsTrend < 0
        ? `↓ ${Math.abs(stats.profileViewsTrend)}%`
        : '변동 없음'
    : '';

  if (loading || !stats) {
    return (
      <View style={[styles.container, { backgroundColor: colors.gray50 }]}>
        <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.gray200 }]}>
          <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="뒤로 가기" hitSlop={12}>
            <Text style={[styles.backBtn, { color: colors.primary }]}>← 뒤로</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.gray900 }]}>활동 통계</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.loadingWrap}>
          <Text style={[styles.loadingText, { color: colors.gray400 }]}>통계 불러오는 중...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.gray50 }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.gray200 }]}>
        <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="뒤로 가기" hitSlop={12}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← 뒤로</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.gray900 }]}>활동 통계</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Summary Cards */}
        <Animated.View style={[styles.summaryRow, fade0]}>
          <StatCard
            icon="👁️"
            label="프로필 조회"
            value={stats.profileViews}
            sub={trendText}
            colors={colors}
          />
          <StatCard
            icon="🤝"
            label="연결"
            value={stats.totalConnections}
            sub={stats.newConnectionsThisWeek > 0 ? `+${stats.newConnectionsThisWeek} 이번 주` : undefined}
            colors={colors}
          />
        </Animated.View>

        <Animated.View style={[styles.summaryRow, fade0]}>
          <StatCard
            icon="💬"
            label="대화"
            value={stats.totalConversations}
            colors={colors}
          />
          <StatCard
            icon="📨"
            label="주고받은 메시지"
            value={stats.messagesSent + stats.messagesReceived}
            sub={`보낸 ${stats.messagesSent} · 받은 ${stats.messagesReceived}`}
            colors={colors}
          />
        </Animated.View>

        {/* Profile Views Chart */}
        <Animated.View style={[styles.section, { backgroundColor: colors.white }, fade1]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.gray900 }]}>📊 프로필 조회 추이</Text>
            <Text style={[styles.sectionSub, { color: colors.gray400 }]}>최근 7일</Text>
          </View>
          <MiniBarChart
            data={stats.profileViewsDaily}
            height={80}
            barColor={colors.primary}
            labelColor={colors.gray400}
          />
          <View style={[styles.trendBadge, { backgroundColor: stats.profileViewsTrend >= 0 ? COLORS.successBg : '#FEF2F2' }]}>
            <Text style={[styles.trendText, { color: stats.profileViewsTrend >= 0 ? COLORS.success : COLORS.error }]}>
              전주 대비 {trendText}
            </Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('Insights')}
            style={{ alignSelf: 'flex-end', marginTop: 8 }}
            accessibilityRole="link"
            accessibilityLabel="상세 인사이트 보기"
          >
            <Text style={{ fontSize: FONT_SIZE.xs, color: colors.primary, fontWeight: '600' }}>상세 인사이트 보기 →</Text>
          </Pressable>
        </Animated.View>

        {/* Top Interests */}
        {stats.topInterests.length > 0 && (
          <Animated.View style={[styles.section, { backgroundColor: colors.white }, fade2]}>
            <Text style={[styles.sectionTitle, { color: colors.gray900 }]}>🔥 인기 관심사</Text>
            <Text style={[styles.sectionDesc, { color: colors.gray400 }]}>
              내 관심사 중 다른 사용자에게 가장 많이 노출된 키워드
            </Text>
            {stats.topInterests.map((item, index) => {
              const interest = getInterestById(item.interestId);
              if (!interest) return null;
              const maxViews = stats.topInterests[0].viewCount;
              const barPct = (item.viewCount / maxViews) * 100;
              return (
                <View key={item.interestId} style={styles.interestRow} accessibilityLabel={`${interest.label} ${item.viewCount}회 노출`}>
                  <Text style={[styles.interestRank, { color: colors.gray400 }]}>{index + 1}</Text>
                  <View style={styles.interestInfo}>
                    <View style={styles.interestLabelRow}>
                      <Text style={[styles.interestName, { color: colors.gray800 }]}>
                        {interest.emoji} {interest.label}
                      </Text>
                      <Text style={[styles.interestCount, { color: colors.gray500 }]}>
                        {item.viewCount}회
                      </Text>
                    </View>
                    <View style={[styles.interestBarBg, { backgroundColor: colors.gray100 }]}>
                      <View
                        style={[styles.interestBar, { width: `${barPct}%`, backgroundColor: colors.primary }]}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </Animated.View>
        )}

        {/* Account Info */}
        <Animated.View style={[styles.section, { backgroundColor: colors.white }, fade3]}>
          <Text style={[styles.sectionTitle, { color: colors.gray900 }]}>📅 계정 정보</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.gray500 }]}>가입 후</Text>
            <Text style={[styles.infoValue, { color: colors.gray800 }]}>
              {stats.joinedDaysAgo}일째
            </Text>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: colors.gray100 }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.gray500 }]}>일 평균 조회</Text>
            <Text style={[styles.infoValue, { color: colors.gray800 }]}>
              {stats.profileViewsDaily.length > 0
                ? Math.round(stats.profileViews / stats.profileViewsDaily.length)
                : 0}회
            </Text>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: colors.gray100 }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.gray500 }]}>메시지 활동</Text>
            <Text style={[styles.infoValue, { color: colors.gray800 }]}>
              {stats.messagesSent + stats.messagesReceived > 0
                ? `보낸 ${stats.messagesSent} · 받은 ${stats.messagesReceived}`
                : '아직 없음'}
            </Text>
          </View>
        </Animated.View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 14,
    paddingHorizontal: SPACING.xl,
    borderBottomWidth: 1,
  },
  backBtn: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  headerTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700' },
  content: { padding: SPACING.lg, gap: 12 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: FONT_SIZE.sm },

  // Summary cards
  summaryRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: BORDER_RADIUS.lg,
    gap: 4,
    ...SHADOWS.sm,
  },
  statIcon: { fontSize: 24, marginBottom: 2 },
  statValue: { fontSize: FONT_SIZE.xxl, fontWeight: '800' },
  statLabel: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  statSub: { fontSize: 10, fontWeight: '600', marginTop: 2 },

  // Section
  section: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    gap: 12,
    ...SHADOWS.sm,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  sectionSub: { fontSize: FONT_SIZE.xs },
  sectionDesc: { fontSize: FONT_SIZE.xs, marginTop: -4 },

  // Trend badge
  trendBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  trendText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },

  // Interest ranking
  interestRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  interestRank: { fontSize: FONT_SIZE.sm, fontWeight: '700', width: 18, textAlign: 'center' },
  interestInfo: { flex: 1, gap: 4 },
  interestLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  interestName: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  interestCount: { fontSize: FONT_SIZE.xs },
  interestBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  interestBar: { height: 6, borderRadius: 3 },

  // Account info
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  infoLabel: { fontSize: FONT_SIZE.sm },
  infoValue: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  infoDivider: { height: 1 },
});
