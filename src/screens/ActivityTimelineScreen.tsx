import React, { useState, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { mockTimeline } from '../services/mockService';
import ScreenHeader from '../components/ScreenHeader';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { ActivityTimelineScreenProps, ActivityType, ActivityTimelineItem } from '../types';
import { useApiCall } from '../hooks/useApiCall';

// ── 필터 탭 정의 ──
type FilterKey = 'ALL' | ActivityType;

interface FilterTab {
  key: FilterKey;
  label: string;
  emoji: string;
}

const FILTER_TABS: FilterTab[] = [
  { key: 'ALL', label: '전체', emoji: '📋' },
  { key: 'PROFILE_VIEW_RECEIVED', label: '열람', emoji: '👁️' },
  { key: 'CONNECTION_MADE', label: '연결', emoji: '🤝' },
  { key: 'BADGE_EARNED', label: '배지', emoji: '🏅' },
  { key: 'GROUP_JOINED', label: '그룹', emoji: '👥' },
  { key: 'EVENT_JOINED', label: '이벤트', emoji: '📅' },
];

// ── Activity 카드 색상 매핑 ──
const ACTIVITY_COLORS: Record<ActivityType, string> = {
  PROFILE_VIEW_RECEIVED: '#3B82F6',
  CONNECTION_MADE: '#22C55E',
  CONNECTION_REQUEST: '#8B5CF6',
  BADGE_EARNED: '#F59E0B',
  GROUP_JOINED: '#EC4899',
  EVENT_JOINED: '#06B6D4',
  INTEREST_UPDATED: '#10B981',
  PROFILE_UPDATED: '#6366F1',
  SNAPSHOT_ADDED: '#F97316',
  BOOKMARK_ADDED: '#EF4444',
};

// ── 시간 포맷 ──
function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}시간 전`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

// ── 날짜 그룹 레이블 ──
function getDateGroupLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (24 * 3600_000));

  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return '이번 주';
  return '지난 주';
}

// ── 메인 컴포넌트 ──
export default function ActivityTimelineScreen({ navigation }: ActivityTimelineScreenProps) {
  const { colors } = useTheme();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('ALL');

  const { data: items, loading, refresh } = useApiCall(
    () => mockTimeline.getTimeline(activeFilter),
    { immediate: true },
  );

  // 필터 변경 시 재조회
  const handleFilterChange = useCallback((key: FilterKey) => {
    setActiveFilter(key);
  }, []);

  // 필터가 변경되면 재 fetch
  React.useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  // 날짜별 그룹핑
  const grouped = React.useMemo(() => {
    if (!items) return [];
    const groups: { label: string; items: ActivityTimelineItem[] }[] = [];
    let currentLabel = '';

    for (const item of items) {
      const label = getDateGroupLabel(item.createdAt);
      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, items: [item] });
      } else {
        groups[groups.length - 1].items.push(item);
      }
    }
    return groups;
  }, [items]);

  const handleItemPress = useCallback((item: ActivityTimelineItem) => {
    if (item.relatedUserId) {
      navigation.navigate('UserDetail', { userId: item.relatedUserId });
    } else if (item.type === 'BADGE_EARNED') {
      navigation.navigate('Badges');
    } else if (item.type === 'GROUP_JOINED') {
      navigation.navigate('Groups');
    }
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      <ScreenHeader title="활동 타임라인" onBack={() => navigation.goBack()} />

      {/* 필터 탭 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={[styles.filterScroll, { borderBottomColor: colors.gray100 }]}
      >
        {FILTER_TABS.map(tab => {
          const isActive = activeFilter === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={[
                styles.filterTab,
                {
                  backgroundColor: isActive ? colors.primary : colors.gray100,
                  borderColor: isActive ? colors.primary : colors.gray200,
                },
              ]}
              onPress={() => handleFilterChange(tab.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
            >
              <Text style={styles.filterEmoji}>{tab.emoji}</Text>
              <Text style={[styles.filterLabel, { color: isActive ? colors.white : colors.gray700 }]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 타임라인 */}
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />
        }
      >
        {!loading && (!items || items.length === 0) && (
          <EmptyState
            emoji="📭"
            title="아직 활동이 없어요"
            subtitle="프로필을 공유하고 사람들과 연결해 보세요!"
          />
        )}

        {grouped.map((group, gi) => (
          <View key={group.label + gi}>
            {/* 날짜 그룹 헤더 */}
            <View style={styles.dateHeader}>
              <View style={[styles.dateLine, { backgroundColor: colors.gray200 }]} />
              <Text style={[styles.dateLabel, { color: colors.gray500, backgroundColor: colors.white }]}>
                {group.label}
              </Text>
              <View style={[styles.dateLine, { backgroundColor: colors.gray200 }]} />
            </View>

            {group.items.map((item, idx) => (
              <TimelineCard
                key={item.id}
                item={item}
                isLast={gi === grouped.length - 1 && idx === group.items.length - 1}
                onPress={() => handleItemPress(item)}
                colors={colors}
              />
            ))}
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ── 타임라인 카드 ──
interface TimelineCardProps {
  item: ActivityTimelineItem;
  isLast: boolean;
  onPress: () => void;
  colors: Record<string, string>;
}

function TimelineCard({ item, isLast, onPress, colors }: TimelineCardProps) {
  const accentColor = ACTIVITY_COLORS[item.type] || colors.primary;
  const isClickable = !!item.relatedUserId || item.type === 'BADGE_EARNED' || item.type === 'GROUP_JOINED';

  return (
    <Pressable
      style={styles.cardRow}
      onPress={isClickable ? onPress : undefined}
      accessibilityRole={isClickable ? 'button' : 'text'}
      accessibilityLabel={item.title}
    >
      {/* 타임라인 라인 + 노드 */}
      <View style={styles.timelineTrack}>
        <View style={[styles.timelineNode, { backgroundColor: accentColor }]}>
          <Text style={styles.nodeEmoji}>{item.emoji}</Text>
        </View>
        {!isLast && <View style={[styles.timelineLine, { backgroundColor: colors.gray200 }]} />}
      </View>

      {/* 카드 본체 */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.white,
            borderColor: colors.gray200,
            ...SHADOWS.sm,
          },
        ]}
      >
        <View style={styles.cardContent}>
          {/* 사용자 아바타 (관련 사용자 있으면) */}
          {item.relatedUserId && item.relatedUserName && (
            <View style={styles.cardAvatar}>
              <Avatar
                name={item.relatedUserName}
                emoji={item.relatedUserEmoji}
                customColor={item.relatedUserColor}
                size={36}
              />
            </View>
          )}
          <View style={styles.cardText}>
            <Text style={[styles.cardTitle, { color: colors.gray800 }]} numberOfLines={2}>
              {item.title}
            </Text>
            {item.subtitle && (
              <Text style={[styles.cardSubtitle, { color: colors.gray500 }]} numberOfLines={1}>
                {item.subtitle}
              </Text>
            )}
            <Text style={[styles.cardTime, { color: colors.gray400 }]}>
              {formatTimeAgo(item.createdAt)}
            </Text>
          </View>
          {isClickable && (
            <Text style={[styles.chevron, { color: colors.gray400 }]}>›</Text>
          )}
        </View>

        {/* 활동 타입 뱃지 */}
        <View style={[styles.typeBadge, { backgroundColor: accentColor + '18' }]}>
          <Text style={[styles.typeBadgeText, { color: accentColor }]}>
            {getActivityLabel(item.type)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function getActivityLabel(type: ActivityType): string {
  switch (type) {
    case 'PROFILE_VIEW_RECEIVED': return '프로필 열람';
    case 'CONNECTION_MADE': return '연결 성사';
    case 'CONNECTION_REQUEST': return '연결 요청';
    case 'BADGE_EARNED': return '배지 획득';
    case 'GROUP_JOINED': return '그룹 가입';
    case 'EVENT_JOINED': return '이벤트 참여';
    case 'INTEREST_UPDATED': return '관심사 변경';
    case 'PROFILE_UPDATED': return '프로필 수정';
    case 'SNAPSHOT_ADDED': return '스냅샷';
    case 'BOOKMARK_ADDED': return '북마크';
    default: return '';
  }
}

// ── 스타일 ──
const styles = StyleSheet.create({
  container: { flex: 1 },
  filterScroll: {
    maxHeight: 52,
    borderBottomWidth: 1,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  filterEmoji: { fontSize: 14 },
  filterLabel: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  // ── 날짜 그룹 ──
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dateLine: { flex: 1, height: 1 },
  dateLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    paddingHorizontal: 12,
  },
  // ── 타임라인 트랙 ──
  cardRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timelineTrack: {
    width: 40,
    alignItems: 'center',
  },
  timelineNode: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeEmoji: { fontSize: 14 },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 2,
    minHeight: 20,
  },
  // ── 카드 ──
  card: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
    marginLeft: 8,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardAvatar: {
    marginRight: 10,
  },
  cardText: { flex: 1 },
  cardTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    lineHeight: 20,
  },
  cardSubtitle: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  cardTime: {
    fontSize: 11,
    marginTop: 4,
  },
  chevron: {
    fontSize: 22,
    fontWeight: '300',
    marginLeft: 4,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    marginTop: 8,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
