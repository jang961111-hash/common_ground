// ==========================================
// InsightsScreen — 프로필 인사이트 대시보드
// 조회수 추이, 방문자, 관심사 인기도 분석
// ==========================================
import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native';
import { InsightsScreenProps, ProfileInsightsData, ProfileVisitor, InterestEngagement } from '../types';
import { mockInsights } from '../services/mockService';
import { useTheme } from '../contexts/ThemeContext';
import { useApiCall } from '../hooks/useApiCall';
import { getInterestById } from '../constants/interests';
import ScreenHeader from '../components/ScreenHeader';
import Avatar from '../components/Avatar';
import MiniBarChart from '../components/MiniBarChart';
import InterestTag from '../components/InterestTag';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';

type TabKey = 'overview' | 'visitors' | 'interests';

const TABS: { key: TabKey; label: string; emoji: string }[] = [
  { key: 'overview', label: '개요', emoji: '📊' },
  { key: 'visitors', label: '방문자', emoji: '👀' },
  { key: 'interests', label: '관심사', emoji: '💡' },
];

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

// ── 시간대 차트 (24h heatmap-like bar) ──
function HourlyChart({ data, colors: themeColors }: { data: number[]; colors: any }) {
  const max = Math.max(...data, 1);
  return (
    <View style={hStyles.container}>
      <View style={hStyles.bars}>
        {data.map((v, i) => {
          const h = (v / max) * 60;
          const opacity = v / max * 0.7 + 0.3;
          return (
            <View key={i} style={hStyles.col}>
              <View style={[hStyles.bar, { height: Math.max(h, 2), backgroundColor: COLORS.accent, opacity }]} />
            </View>
          );
        })}
      </View>
      <View style={hStyles.labels}>
        <Text style={[hStyles.label, { color: themeColors.gray400 }]}>0시</Text>
        <Text style={[hStyles.label, { color: themeColors.gray400 }]}>6시</Text>
        <Text style={[hStyles.label, { color: themeColors.gray400 }]}>12시</Text>
        <Text style={[hStyles.label, { color: themeColors.gray400 }]}>18시</Text>
        <Text style={[hStyles.label, { color: themeColors.gray400 }]}>24시</Text>
      </View>
    </View>
  );
}

const hStyles = StyleSheet.create({
  container: {},
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: 68, gap: 2 },
  col: { flex: 1, justifyContent: 'flex-end' },
  bar: { borderRadius: 2 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  label: { fontSize: 10 },
});

// ── 인기도 바 ──
function EngagementBar({ engagement, colors: themeColors }: { engagement: InterestEngagement; colors: any }) {
  const info = getInterestById(engagement.interestId);
  return (
    <View style={eStyles.row}>
      <View style={eStyles.labelWrap}>
        <InterestTag interestId={engagement.interestId} size="sm" />
      </View>
      <View style={eStyles.barArea}>
        <View style={[eStyles.barTrack, { backgroundColor: themeColors.gray100 }]}>
          <View style={[eStyles.barFill, { width: `${engagement.score}%`, backgroundColor: COLORS.accent }]} />
        </View>
        <Text style={[eStyles.score, { color: themeColors.gray600 }]}>{engagement.score}</Text>
      </View>
      <View style={eStyles.stats}>
        <Text style={[eStyles.statText, { color: themeColors.gray500 }]}>👁 {engagement.views}</Text>
        <Text style={[eStyles.statText, { color: themeColors.gray500 }]}>🤝 {engagement.connections}</Text>
      </View>
    </View>
  );
}

const eStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 8 },
  labelWrap: { width: 90 },
  barArea: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  barTrack: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  score: { fontSize: FONT_SIZE.xs, fontWeight: '700', width: 28, textAlign: 'right' },
  stats: { flexDirection: 'row', gap: 8 },
  statText: { fontSize: FONT_SIZE.xs },
});

export default function InsightsScreen({ navigation }: InsightsScreenProps) {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = useCallback(() => mockInsights.getInsights(), []);
  const { data: insights, loading, refresh } = useApiCall<ProfileInsightsData>(
    fetchInsights,
    { immediate: true },
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  if (loading && !insights) {
    return (
      <View style={[styles.container, { backgroundColor: colors.white }]}>
        <ScreenHeader title="프로필 인사이트" onBack={() => navigation.goBack()} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.gray400 }]}>분석 데이터를 불러오는 중...</Text>
        </View>
      </View>
    );
  }

  if (!insights) return null;

  const { daily, hourly, visitors, summary } = insights;

  // ── 탭: 개요 ──
  const renderOverview = () => (
    <View style={styles.tabContent}>
      {/* 핵심 지표 카드 */}
      <View style={styles.metricsGrid}>
        <View style={[styles.metricCard, { backgroundColor: COLORS.primaryBg }]}>
          <Text style={styles.metricEmoji}>👁</Text>
          <Text style={[styles.metricValue, { color: colors.gray900 }]}>{summary.totalViews}</Text>
          <Text style={[styles.metricLabel, { color: colors.gray500 }]}>총 조회수</Text>
          <View style={[styles.trendBadge, {
            backgroundColor: summary.viewsTrend >= 0 ? COLORS.successBg : COLORS.errorLight,
          }]}>
            <Text style={[styles.trendText, {
              color: summary.viewsTrend >= 0 ? COLORS.success : COLORS.error,
            }]}>
              {summary.viewsTrend >= 0 ? '↑' : '↓'} {Math.abs(summary.viewsTrend)}%
            </Text>
          </View>
        </View>

        <View style={[styles.metricCard, { backgroundColor: COLORS.successBg }]}>
          <Text style={styles.metricEmoji}>👤</Text>
          <Text style={[styles.metricValue, { color: colors.gray900 }]}>{summary.uniqueVisitors}</Text>
          <Text style={[styles.metricLabel, { color: colors.gray500 }]}>방문자</Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: '#FFF7ED' }]}>
          <Text style={styles.metricEmoji}>🤝</Text>
          <Text style={[styles.metricValue, { color: colors.gray900 }]}>{summary.newConnections}</Text>
          <Text style={[styles.metricLabel, { color: colors.gray500 }]}>새 연결</Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: '#FAF5FF' }]}>
          <Text style={styles.metricEmoji}>⏰</Text>
          <Text style={[styles.metricValue, { color: colors.gray900 }]}>{summary.peakHour}시</Text>
          <Text style={[styles.metricLabel, { color: colors.gray500 }]}>피크 시간</Text>
        </View>
      </View>

      {/* 7일 조회수 차트 */}
      <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.gray100 }]}>
        <Text style={[styles.cardTitle, { color: colors.gray900 }]}>📈 주간 조회수 추이</Text>
        <Text style={[styles.cardSubtitle, { color: colors.gray500 }]}>최근 7일간 프로필 조회수</Text>
        <View style={styles.chartWrap}>
          <MiniBarChart data={daily} height={100} barColor={COLORS.primary} />
        </View>
      </View>

      {/* 시간대별 분포 */}
      <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.gray100 }]}>
        <Text style={[styles.cardTitle, { color: colors.gray900 }]}>🕐 시간대별 조회 패턴</Text>
        <Text style={[styles.cardSubtitle, { color: colors.gray500 }]}>
          {summary.peakDay}요일 {summary.peakHour}시에 가장 많이 방문해요
        </Text>
        <View style={{ marginTop: 12 }}>
          <HourlyChart data={hourly} colors={colors} />
        </View>
      </View>

      {/* 인기 방문자 미리보기 */}
      {summary.topVisitor && (
        <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.gray100 }]}>
          <Text style={[styles.cardTitle, { color: colors.gray900 }]}>⭐ 가장 많이 본 사람</Text>
          <Pressable
            style={styles.topVisitorRow}
            onPress={() => navigation.navigate('UserDetail', { userId: summary.topVisitor!.userId })}
            accessibilityRole="button"
          >
            <Avatar
              name={summary.topVisitor.displayName}
              emoji={summary.topVisitor.avatarEmoji ?? undefined}
              customColor={summary.topVisitor.avatarColor ?? undefined}
              size={44}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.topVisitorName, { color: colors.gray900 }]}>{summary.topVisitor.displayName}</Text>
              <Text style={[styles.topVisitorMeta, { color: colors.gray500 }]}>
                {summary.topVisitor.viewCount}회 방문 · 공통 관심사 {summary.topVisitor.commonInterestCount}개
              </Text>
            </View>
            <Text style={{ fontSize: 18 }}>→</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  // ── 탭: 방문자 ──
  const renderVisitors = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionDesc, { color: colors.gray500 }]}>
        최근 프로필을 방문한 사람들이에요
      </Text>
      {visitors.map(v => (
        <Pressable
          key={v.userId}
          style={[styles.visitorCard, { backgroundColor: colors.white, borderColor: colors.gray100 }]}
          onPress={() => navigation.navigate('UserDetail', { userId: v.userId })}
          accessibilityRole="button"
          accessibilityLabel={`${v.displayName} 프로필 보기`}
        >
          <Avatar
            name={v.displayName}
            emoji={v.avatarEmoji ?? undefined}
            customColor={v.avatarColor ?? undefined}
            size={48}
          />
          <View style={styles.visitorInfo}>
            <Text style={[styles.visitorName, { color: colors.gray900 }]}>{v.displayName}</Text>
            <View style={styles.visitorMeta}>
              <Text style={[styles.visitorMetaText, { color: colors.gray500 }]}>
                {formatTimeAgo(v.visitedAt)}
              </Text>
              <Text style={[styles.visitorDot, { color: colors.gray300 }]}>·</Text>
              <Text style={[styles.visitorMetaText, { color: colors.primary }]}>
                공통 {v.commonInterestCount}개
              </Text>
            </View>
          </View>
          <View style={[styles.viewCountBadge, { backgroundColor: colors.primaryBg }]}>
            <Text style={[styles.viewCountText, { color: colors.primary }]}>{v.viewCount}회</Text>
          </View>
        </Pressable>
      ))}

      {visitors.length === 0 && (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>👀</Text>
          <Text style={[styles.emptyText, { color: colors.gray500 }]}>아직 방문자가 없어요</Text>
          <Text style={[styles.emptyHint, { color: colors.gray400 }]}>
            프로필을 더 풍성하게 채우면 방문자가 늘어나요!
          </Text>
        </View>
      )}
    </View>
  );

  // ── 탭: 관심사 인기도 ──
  const renderInterests = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionDesc, { color: colors.gray500 }]}>
        내 관심사별 인기도와 참여도를 확인해요
      </Text>

      <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.gray100 }]}>
        <View style={styles.engagementHeader}>
          <Text style={[styles.engagementColLabel, { color: colors.gray400, flex: 0, width: 90 }]}>관심사</Text>
          <Text style={[styles.engagementColLabel, { color: colors.gray400, flex: 1 }]}>인기도</Text>
          <Text style={[styles.engagementColLabel, { color: colors.gray400, flex: 0 }]}>조회/연결</Text>
        </View>
        {summary.interestEngagement.map((eng, idx) => (
          <React.Fragment key={eng.interestId}>
            {idx > 0 && <View style={[styles.divider, { backgroundColor: colors.gray100 }]} />}
            <EngagementBar engagement={eng} colors={colors} />
          </React.Fragment>
        ))}
      </View>

      {/* 인사이트 팁 */}
      <View style={[styles.tipCard, { backgroundColor: COLORS.primaryBg }]}>
        <Text style={styles.tipEmoji}>💡</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.tipTitle, { color: colors.gray800 }]}>인사이트 팁</Text>
          <Text style={[styles.tipText, { color: colors.gray600 }]}>
            인기도가 높은 관심사를 프로필 상단에 배치하면 더 많은 연결을 받을 수 있어요!
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.gray50 }]}>
      <ScreenHeader title="프로필 인사이트" onBack={() => navigation.goBack()} />

      {/* 탭 */}
      <View style={[styles.tabs, { backgroundColor: colors.white, borderBottomColor: colors.gray200 }]}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={[styles.tab, isActive && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab(tab.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[
                styles.tabText,
                { color: isActive ? colors.primary : colors.gray500 },
                isActive && styles.tabTextActive,
              ]}>
                {tab.emoji} {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'visitors' && renderVisitors()}
        {activeTab === 'interests' && renderInterests()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  tabContent: { padding: SPACING.md, gap: SPACING.md },

  // 로딩
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: FONT_SIZE.sm },

  // 탭
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabText: { fontSize: FONT_SIZE.sm, fontWeight: '500' },
  tabTextActive: { fontWeight: '700' },

  // 지표 그리드
  metricsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm,
  },
  metricCard: {
    width: '48%', flexGrow: 1,
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.md,
    alignItems: 'center', gap: 4,
  },
  metricEmoji: { fontSize: 24 },
  metricValue: { fontSize: FONT_SIZE.xxl, fontWeight: '800' },
  metricLabel: { fontSize: FONT_SIZE.xs },
  trendBadge: {
    borderRadius: BORDER_RADIUS.full, paddingHorizontal: 8, paddingVertical: 2,
    marginTop: 4,
  },
  trendText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },

  // 카드
  card: {
    borderRadius: BORDER_RADIUS.lg, borderWidth: 1,
    padding: SPACING.md,
  },
  cardTitle: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  cardSubtitle: { fontSize: FONT_SIZE.xs, marginTop: 2 },
  chartWrap: { marginTop: 16 },

  // 상위 방문자
  topVisitorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  topVisitorName: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  topVisitorMeta: { fontSize: FONT_SIZE.xs, marginTop: 2 },

  // 방문자 카드
  visitorCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: BORDER_RADIUS.lg, borderWidth: 1,
    padding: SPACING.md,
  },
  visitorInfo: { flex: 1 },
  visitorName: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  visitorMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  visitorMetaText: { fontSize: FONT_SIZE.xs },
  visitorDot: { fontSize: FONT_SIZE.xs },
  viewCountBadge: {
    borderRadius: BORDER_RADIUS.full, paddingHorizontal: 10, paddingVertical: 4,
  },
  viewCountText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },

  // 관심사 인기도
  engagementHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.gray100,
  },
  engagementColLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

  divider: { height: 1 },

  // 팁 카드
  tipCard: {
    flexDirection: 'row', borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md, gap: 12, alignItems: 'flex-start',
  },
  tipEmoji: { fontSize: 24, marginTop: 2 },
  tipTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  tipText: { fontSize: FONT_SIZE.xs, marginTop: 4, lineHeight: 18 },

  // 빈 상태
  emptyWrap: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  emptyHint: { fontSize: FONT_SIZE.sm, textAlign: 'center' },

  // 섹션 설명
  sectionDesc: { fontSize: FONT_SIZE.sm, marginBottom: 4 },
});
