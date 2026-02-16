import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, SectionList, Pressable, StyleSheet, RefreshControl,
} from 'react-native';
import { mockNotifications } from '../services/mockService';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useCache } from '../hooks/useCache';
import ScreenHeader from '../components/ScreenHeader';
import NotificationItem from '../components/NotificationItem';
import ConfirmDialog from '../components/ConfirmDialog';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING } from '../constants/theme';
import { AppNotification, NotificationType, NotificationsScreenProps } from '../types';
import { SkeletonNotifications } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { InlineError } from '../components/ErrorRetry';

type FilterType = 'all' | 'unread' | NotificationType;

const FILTER_TABS: { value: FilterType; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'unread', label: '읽지않음' },
  { value: 'NEW_MATCH', label: '매칭' },
  { value: 'PROFILE_VIEW', label: '열람' },
  { value: 'SYSTEM', label: '시스템' },
];

// ── 날짜 그룹 유틸 ──
function getDateGroup(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // 같은 날인지 확인 (날짜 기준)
  const isToday = now.toDateString() === date.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = yesterday.toDateString() === date.toDateString();

  if (isToday) return '오늘';
  if (isYesterday) return '어제';
  if (diffDays < 7) return '이번 주';
  return '이전';
}

function groupByDate(items: AppNotification[]): { title: string; data: AppNotification[] }[] {
  const groups: Record<string, AppNotification[]> = {};
  const order = ['오늘', '어제', '이번 주', '이전'];

  items.forEach(item => {
    const group = getDateGroup(item.createdAt);
    if (!groups[group]) groups[group] = [];
    groups[group].push(item);
  });

  return order
    .filter(key => groups[key]?.length > 0)
    .map(key => ({ title: key, data: groups[key] }));
}

export default function NotificationsScreen({ navigation }: NotificationsScreenProps) {
  const { refreshUnreadCount } = useAuth();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showDeleteReadDialog, setShowDeleteReadDialog] = useState(false);

  const fetchNotifications = useCallback(() => mockNotifications.getNotifications(), []);
  const { data: notifications, loading, error, refresh } = useCache<AppNotification[]>(
    'notifications',
    fetchNotifications,
    { ttl: 2 * 60 * 1000 },
  );

  const notifList = notifications ?? [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleMarkAllRead = useCallback(async () => {
    await mockNotifications.markAllAsRead();
    await refresh();
    await refreshUnreadCount();
  }, [refresh, refreshUnreadCount]);

  const handleDeleteNotification = useCallback(async (notifId: string) => {
    await mockNotifications.deleteNotification(notifId);
    await refresh();
    await refreshUnreadCount();
  }, [refresh, refreshUnreadCount]);

  const handleDeleteAllRead = useCallback(async () => {
    setShowDeleteReadDialog(false);
    await mockNotifications.deleteAllRead();
    await refresh();
    await refreshUnreadCount();
  }, [refresh, refreshUnreadCount]);

  const handleTapNotification = useCallback(async (notif: AppNotification) => {
    if (!notif.isRead) {
      await mockNotifications.markAsRead(notif.id);
      await refresh();
      await refreshUnreadCount();
    }
    if (notif.type === 'PROFILE_VIEW' && notif.fromUserId) {
      navigation.navigate('UserDetail', { userId: notif.fromUserId });
    }
    if (notif.type === 'NEW_MATCH' && notif.fromUserId) {
      navigation.navigate('UserDetail', { userId: notif.fromUserId });
    }
  }, [refresh, refreshUnreadCount, navigation]);

  const unreadCount = useMemo(
    () => notifList.filter(n => !n.isRead).length,
    [notifList],
  );

  const readCount = useMemo(
    () => notifList.filter(n => n.isRead).length,
    [notifList],
  );

  // 필터 적용
  const filtered = useMemo(() => {
    if (filter === 'all') return notifList;
    if (filter === 'unread') return notifList.filter(n => !n.isRead);
    return notifList.filter(n => n.type === filter);
  }, [notifList, filter]);

  // 날짜별 그룹
  const sections = useMemo(() => groupByDate(filtered), [filtered]);

  const renderSectionHeader = useCallback(({ section }: { section: { title: string } }) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.gray50 }]}>
      <Text style={[styles.sectionTitle, { color: colors.gray500 }]}>{section.title}</Text>
    </View>
  ), [colors]);

  const renderItem = useCallback(({ item }: { item: AppNotification }) => (
    <NotificationItem
      notification={item}
      onPress={handleTapNotification}
      onDelete={handleDeleteNotification}
    />
  ), [handleTapNotification, handleDeleteNotification]);

  const sectionKeyExtractor = useCallback((item: AppNotification) => item.id, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      <ScreenHeader
        title="알림"
        onBack={() => navigation.goBack()}
        rightElement={
          unreadCount > 0 ? (
            <Pressable onPress={handleMarkAllRead} accessibilityRole="button" accessibilityLabel="모든 알림 읽음 처리">
              <Text style={[styles.markAllText, { color: colors.primary }]}>모두 읽음</Text>
            </Pressable>
          ) : readCount > 0 ? (
            <Pressable onPress={() => setShowDeleteReadDialog(true)} accessibilityRole="button" accessibilityLabel="읽은 알림 전체 삭제">
              <Text style={[styles.markAllText, { color: colors.gray400 }]}>읽은 알림 삭제</Text>
            </Pressable>
          ) : undefined
        }
      />

      {/* 통계 배너 */}
      {unreadCount > 0 && (
        <View style={[styles.unreadBanner, { backgroundColor: colors.primaryBg }]} accessibilityRole="alert">
          <Text style={[styles.unreadText, { color: colors.primary }]}>
            📬 읽지 않은 알림 {unreadCount}개
          </Text>
        </View>
      )}

      {/* 필터 탭 */}
      <View style={styles.filterRow}>
        {FILTER_TABS.map(tab => (
          <Pressable
            key={tab.value}
            style={[
              styles.filterTab,
              { backgroundColor: colors.gray100 },
              filter === tab.value && [styles.filterTabActive, { backgroundColor: colors.primary }],
            ]}
            onPress={() => setFilter(tab.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === tab.value }}
            accessibilityLabel={`${tab.label} 필터`}
          >
            <Text style={[
              styles.filterTabText,
              { color: colors.gray500 },
              filter === tab.value && styles.filterTabTextActive,
            ]}>
              {tab.label}
              {tab.value === 'unread' && unreadCount > 0 ? ` ${unreadCount}` : ''}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* 스와이프 힌트 */}
      {notifList.length > 0 && (
        <Text style={[styles.swipeHint, { color: colors.gray400 }]}>
          ← 밀어서 삭제
        </Text>
      )}

      {error && !loading && (
        <InlineError message={error} onRetry={refresh} />
      )}

      {loading ? (
        <View style={styles.listContent}>
          <SkeletonNotifications />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={sectionKeyExtractor}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState
              emoji={filter === 'unread' ? '✅' : '🔔'}
              title={filter === 'unread' ? '읽지 않은 알림이 없어요' : '알림이 없어요'}
              subtitle={filter === 'all' ? '새 소식이 오면 여기에 표시됩니다' : '해당 유형의 알림이 없습니다'}
            />
          }
          ListFooterComponent={<View style={{ height: 20 }} />}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* 읽은 알림 삭제 확인 */}
      <ConfirmDialog
        visible={showDeleteReadDialog}
        icon="🗑️"
        title="읽은 알림 삭제"
        message={`읽은 알림 ${readCount}개를 모두 삭제할까요?`}
        confirmLabel="삭제"
        destructive
        onConfirm={handleDeleteAllRead}
        onCancel={() => setShowDeleteReadDialog(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  markAllText: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: '600' },

  unreadBanner: {
    backgroundColor: COLORS.primaryBg,
    paddingVertical: 8,
    paddingHorizontal: SPACING.xl,
  },
  unreadText: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: '600' },

  // Filter Tabs
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    paddingVertical: 12,
    gap: 6,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#fff',
  },

  // Swipe hint
  swipeHint: {
    fontSize: FONT_SIZE.xs,
    textAlign: 'right',
    paddingHorizontal: SPACING.xl,
    marginBottom: 4,
  },

  // Section
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  listContent: { paddingHorizontal: SPACING.xl, paddingTop: 4 },
});

