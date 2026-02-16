import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Platform,
} from 'react-native';
import { getInterestById } from '../constants/interests';
import { QuestionDepth, DEPTH_LABELS, SITUATION_LABELS, SituationCategory } from '../constants/questions';
import { generateQuestions, GeneratedQuestion } from '../services/questionEngine';
import QuestionCard from '../components/QuestionCard';
import ScreenHeader from '../components/ScreenHeader';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { ConversationTopicsScreenProps } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';

const copyToClipboard = async (text: string) => {
  if (Platform.OS === 'web') {
    try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
  }
  return false;
};

type MainTab = 'recommend' | 'situation' | 'bookmark';

export default function ConversationTopicsScreen({ route, navigation }: ConversationTopicsScreenProps) {
  const { displayName, commonInterests = [], theirInterests = [] } = route.params;
  const { user } = useAuth();
  const { showToast } = useToast();
  const { colors } = useTheme();

  const myInterests = useMemo(() => [
    ...(user?.recentInterests ?? []),
    ...(user?.alwaysInterests ?? []),
  ], [user]);

  const [activeTab, setActiveTab] = useState<MainTab>('recommend');
  const [depthFilter, setDepthFilter] = useState<QuestionDepth | null>(null);
  const [situationFilter, setSituationFilter] = useState<SituationCategory | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);

  // 질문 생성
  const recommendation = useMemo(() => {
    return generateQuestions({
      myInterests,
      theirInterests,
      depthFilter: depthFilter ?? undefined,
      situationFilter: situationFilter ?? undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myInterests, theirInterests, depthFilter, situationFilter, refreshKey]);

  const handleCopy = async (question: string, key: string) => {
    const ok = await copyToClipboard(question);
    if (ok) {
      setCopiedKey(key);
      showToast('질문이 복사되었어요!', 'success', '📋');
      setTimeout(() => setCopiedKey(null), 1500);
    }
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRefresh = () => setRefreshKey(k => k + 1);

  // 북마크된 질문 목록
  const allQuestions = useMemo(() => [
    ...recommendation.commonQuestions,
    ...recommendation.theirQuestions,
    ...recommendation.crossQuestions,
    ...recommendation.situationQuestions,
  ], [recommendation]);

  const bookmarkedQuestions = useMemo(
    () => allQuestions.filter(q => bookmarkedIds.has(q.id)),
    [allQuestions, bookmarkedIds],
  );

  const renderQuestionCard = (q: GeneratedQuestion) => {
    const interest = q.interestId ? getInterestById(q.interestId) : undefined;
    const crossLabel = q.crossInterests
      ? q.crossInterests.map(id => getInterestById(id)?.label).filter(Boolean).join(' × ')
      : undefined;
    const crossEmoji = q.crossInterests
      ? q.crossInterests.map(id => getInterestById(id)?.emoji).filter(Boolean).join('')
      : undefined;

    return (
      <QuestionCard
        key={q.id}
        question={q.text}
        label={crossLabel ?? interest?.label ?? (q.situation ? SITUATION_LABELS[q.situation].label : undefined)}
        emoji={crossEmoji ?? interest?.emoji ?? (q.situation ? SITUATION_LABELS[q.situation].emoji : undefined)}
        depth={q.depth}
        followUps={q.followUps}
        isBookmarked={bookmarkedIds.has(q.id)}
        onToggleBookmark={() => toggleBookmark(q.id)}
        onCopy={() => handleCopy(q.text, q.id)}
        isCopied={copiedKey === q.id}
      />
    );
  };

  // ── 탭 컨텐츠 ──
  const renderRecommendTab = () => (
    <>
      {/* 깊이 필터 */}
      <View style={styles.filterRow} accessibilityRole="radiogroup" accessibilityLabel="대화 깊이 필터">
        <Pressable
          style={[styles.filterChip, !depthFilter && styles.filterChipActive]}
          onPress={() => setDepthFilter(null)}
          accessibilityRole="radio"
          accessibilityLabel="전체"
          accessibilityState={{ selected: !depthFilter }}
        >
          <Text style={[styles.filterText, !depthFilter && styles.filterTextActive]}>전체</Text>
        </Pressable>
        {(Object.keys(DEPTH_LABELS) as QuestionDepth[]).map(d => (
          <Pressable
            key={d}
            style={[styles.filterChip, depthFilter === d && styles.filterChipActive]}
            onPress={() => setDepthFilter(depthFilter === d ? null : d)}
            accessibilityRole="radio"
            accessibilityLabel={`${DEPTH_LABELS[d].label} 깊이`}
            accessibilityState={{ selected: depthFilter === d }}
          >
            <Text style={[styles.filterText, depthFilter === d && styles.filterTextActive]}>
              {DEPTH_LABELS[d].emoji} {DEPTH_LABELS[d].label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* 공통 관심사 */}
      {recommendation.commonQuestions.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>✨ 공통 관심사 기반</Text>
            <Text style={styles.sectionCount}>{recommendation.commonQuestions.length}개</Text>
          </View>
          <Text style={styles.sectionDesc}>둘 다 관심 있으니 대화가 잘 통해요!</Text>
          {recommendation.commonQuestions.map(renderQuestionCard)}
        </View>
      )}

      {/* 크로스 관심사 */}
      {recommendation.crossQuestions.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔗 관심사 연결 질문</Text>
            <Text style={styles.sectionCount}>{recommendation.crossQuestions.length}개</Text>
          </View>
          <Text style={styles.sectionDesc}>두 관심사를 연결한 독특한 질문이에요!</Text>
          {recommendation.crossQuestions.map(renderQuestionCard)}
        </View>
      )}

      {/* 상대방 관심사 */}
      {recommendation.theirQuestions.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎯 {displayName}님 관심사</Text>
            <Text style={styles.sectionCount}>{recommendation.theirQuestions.length}개</Text>
          </View>
          <Text style={styles.sectionDesc}>관심을 보여주면 대화가 잘 풀려요!</Text>
          {recommendation.theirQuestions.map(renderQuestionCard)}
        </View>
      )}

      {/* 질문이 하나도 없을 때 */}
      {recommendation.totalCount === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🤔</Text>
          <Text style={styles.emptyTitle}>필터와 맞는 질문이 없어요</Text>
          <Text style={styles.emptyDesc}>다른 깊이를 선택하거나 새로고침 해보세요</Text>
        </View>
      )}
    </>
  );

  const renderSituationTab = () => (
    <>
      {/* 상황 필터 */}
      <View style={styles.filterRow} accessibilityRole="radiogroup" accessibilityLabel="상황 필터">
        <Pressable
          style={[styles.filterChip, !situationFilter && styles.filterChipActive]}
          onPress={() => setSituationFilter(null)}
          accessibilityRole="radio"
          accessibilityLabel="전체 상황"
          accessibilityState={{ selected: !situationFilter }}
        >
          <Text style={[styles.filterText, !situationFilter && styles.filterTextActive]}>전체</Text>
        </Pressable>
        {(Object.keys(SITUATION_LABELS) as SituationCategory[]).map(s => (
          <Pressable
            key={s}
            style={[styles.filterChip, situationFilter === s && styles.filterChipActive]}
            onPress={() => setSituationFilter(situationFilter === s ? null : s)}
            accessibilityRole="radio"
            accessibilityLabel={`${SITUATION_LABELS[s].label} 상황`}
            accessibilityState={{ selected: situationFilter === s }}
          >
            <Text style={[styles.filterText, situationFilter === s && styles.filterTextActive]}>
              {SITUATION_LABELS[s].emoji} {SITUATION_LABELS[s].label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* 상황별 질문 */}
      {recommendation.situationQuestions.length > 0 ? (
        <View style={styles.section}>
          {recommendation.situationQuestions.map(renderQuestionCard)}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyTitle}>상황을 선택해보세요</Text>
        </View>
      )}
    </>
  );

  const renderBookmarkTab = () => (
    <View style={styles.section}>
      {bookmarkedQuestions.length > 0 ? (
        bookmarkedQuestions.map(renderQuestionCard)
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>⭐</Text>
          <Text style={styles.emptyTitle}>저장한 질문이 없어요</Text>
          <Text style={styles.emptyDesc}>마음에 드는 질문에 ⭐를 눌러 저장하세요</Text>
        </View>
      )}
    </View>
  );

  const TABS: { key: MainTab; label: string; emoji: string }[] = [
    { key: 'recommend', label: '추천', emoji: '✨' },
    { key: 'situation', label: '상황별', emoji: '🎭' },
    { key: 'bookmark', label: '저장됨', emoji: '⭐' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      <ScreenHeader
        title={`${displayName}님과 대화`}
        onBack={() => navigation.goBack()}
        rightElement={
          <Pressable onPress={handleRefresh} style={[styles.refreshBtn, { backgroundColor: colors.primaryBg }]} accessibilityRole="button" accessibilityLabel="새로운 질문 생성">
            <Text style={[styles.refreshText, { color: colors.primary }]}>🔄 새로운 질문</Text>
          </Pressable>
        }
      />

      {/* 요약 배너 */}
      <View style={[styles.summaryBanner, { backgroundColor: colors.primaryBg }]} accessible={true} accessibilityLabel={`공통 관심사 ${commonInterests.length}개, 추천 질문 ${recommendation.totalCount}개, 저장됨 ${bookmarkedIds.size}개`}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: colors.primary }]}>{commonInterests.length}</Text>
          <Text style={[styles.summaryLabel, { color: colors.gray500 }]}>공통 관심사</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.gray200 }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: colors.primary }]}>{recommendation.totalCount}</Text>
          <Text style={[styles.summaryLabel, { color: colors.gray500 }]}>추천 질문</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.gray200 }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: colors.primary }]}>{bookmarkedIds.size}</Text>
          <Text style={[styles.summaryLabel, { color: colors.gray500 }]}>저장됨</Text>
        </View>
      </View>

      {/* 탭 바 */}
      <View style={[styles.tabBar, { backgroundColor: colors.gray100 }]} accessibilityRole="tablist">
        {TABS.map(tab => (
          <Pressable
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && [styles.tabActive, { backgroundColor: colors.white }]]}
            onPress={() => setActiveTab(tab.key)}
            accessibilityRole="tab"
            accessibilityLabel={`${tab.label} 탭`}
            accessibilityState={{ selected: activeTab === tab.key }}
          >
            <Text style={[styles.tabText, { color: colors.gray500 }, activeTab === tab.key && [styles.tabTextActive, { color: colors.primary }]]}>
              {tab.emoji} {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'recommend' && renderRecommendTab()}
        {activeTab === 'situation' && renderSituationTab()}
        {activeTab === 'bookmark' && renderBookmarkTab()}

        {/* 팁 */}
        {activeTab !== 'bookmark' && (
          <View style={[styles.tipBox, { backgroundColor: colors.primaryBg }]}>
            <Text style={[styles.tipTitle, { color: colors.primary }]}>💡 대화 팁</Text>
            <Text style={[styles.tipText, { color: colors.gray600 }]}>
              • 🧊 아이스브레이커로 시작 → ☕ 편한 대화로 이어가기{'\n'}
              • 후속 질문을 활용하면 대화가 자연스럽게 이어져요{'\n'}
              • 열린 질문(왜, 어떻게)이 대화를 더 풍성하게 해요{'\n'}
              • ⭐ 마음에 드는 질문은 저장해뒀다 실전에서 활용!
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { flex: 1 },
  
  // 요약 배너
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryBg,
    marginHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 14,
    marginBottom: 12,
  },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryNumber: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.primary },
  summaryLabel: { fontSize: FONT_SIZE.xs, color: COLORS.gray500, marginTop: 2 },
  summaryDivider: { width: 1, height: 30, backgroundColor: COLORS.gray200 },

  // 새로고침
  refreshBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.primaryBg,
  },
  refreshText: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: '600' },

  // 탭
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: SPACING.xl,
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.md,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
  },
  tabActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  tabText: { fontSize: FONT_SIZE.sm, color: COLORS.gray500, fontWeight: '500' },
  tabTextActive: { color: COLORS.primary, fontWeight: '600' },

  // 필터 칩
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary + '12',
    borderColor: COLORS.primary,
  },
  filterText: { fontSize: FONT_SIZE.xs, color: COLORS.gray600 },
  filterTextActive: { color: COLORS.primary, fontWeight: '600' },

  // 섹션
  section: {
    paddingHorizontal: SPACING.xl,
    marginBottom: 24,
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.gray800 },
  sectionCount: { fontSize: FONT_SIZE.sm, color: COLORS.gray400 },
  sectionDesc: { fontSize: FONT_SIZE.sm, color: COLORS.gray500, marginBottom: 4 },

  // 빈 상태
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.gray700 },
  emptyDesc: { fontSize: FONT_SIZE.sm, color: COLORS.gray500 },

  // 팁
  tipBox: {
    marginHorizontal: SPACING.xl,
    backgroundColor: COLORS.primaryBg,
    borderRadius: BORDER_RADIUS.md,
    padding: 16,
    gap: 8,
  },
  tipTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.primary },
  tipText: { fontSize: FONT_SIZE.sm, color: COLORS.gray600, lineHeight: 22 },
});
