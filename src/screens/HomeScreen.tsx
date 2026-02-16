import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, RefreshControl, Image, Animated,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { mockProfile, mockSnapshots, mockDiscover, mockConnections, mockStats, mockInterestTrends, mockFeed, mockCompatibility, mockBadges, mockGroups, mockEvents } from '../services/mockService';
import { getInterestById } from '../constants/interests';
import { RARITY_COLORS } from '../constants/badges';
import Avatar from '../components/Avatar';
import InterestTag from '../components/InterestTag';
import AnimatedPressable from '../components/AnimatedPressable';
import { TrendingCard } from '../components/InterestRecommendCard';
import ProfileCompletionGuide, { getCompletionPct, ProfileSection } from '../components/ProfileCompletionGuide';
import { useFadeIn, useAnimatedToggle } from '../hooks/useAnimations';
import { useCache } from '../hooks/useCache';
import { useTopMatches } from '../hooks/useCompatibility';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { Snapshot, DiscoverItem, ConnectedUser, ActivityStats, TrendingInterest, FeedItem, HomeScreenProps, UserBadgeSummary, GroupPreview, EventPreview } from '../types';
import FeedCard from '../components/FeedCard';
import CompatibilityBadge from '../components/CompatibilityBadge';
import { GroupCard } from '../components/GroupCard';
import { EventCard } from '../components/EventCard';

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { user, refreshUser, unreadCount } = useAuth();
  const { showToast } = useToast();
  const { colors } = useTheme();
  const [isOnline, setIsOnline] = useState(user?.isOnline ?? true);
  const [refreshing, setRefreshing] = useState(false);

  // 캐시 기반 데이터 로딩 (stale-while-revalidate)
  const fetchSnapshots = useCallback(() => mockSnapshots.getMySnapshots(), []);
  const fetchSuggested = useCallback(
    () => mockDiscover.getOnlineUsers().then(u => u.slice(0, 3)),
    [],
  );

  const snapshotsCache = useCache<Snapshot[]>('home_snapshots', fetchSnapshots, { ttl: 2 * 60 * 1000 });
  const suggestedCache = useCache<DiscoverItem[]>('home_suggested', fetchSuggested, { ttl: 2 * 60 * 1000 });

  const fetchConnections = useCallback(() => mockConnections.getConnections(), []);
  const connectionsCache = useCache<ConnectedUser[]>('home_connections', fetchConnections, { ttl: 2 * 60 * 1000 });
  const [pendingCount, setPendingCount] = useState(0);

  const fetchStats = useCallback(() => mockStats.getStats(), []);
  const statsCache = useCache<ActivityStats>('home_stats', fetchStats, { ttl: 3 * 60 * 1000 });
  const activityStats = statsCache.data;

  const fetchTrending = useCallback(() => mockInterestTrends.getTrending(), []);
  const trendingCache = useCache<TrendingInterest[]>('home_trending', fetchTrending, { ttl: 5 * 60 * 1000 });
  const trendingInterests = trendingCache.data ?? [];

  const fetchFeed = useCallback(() => mockFeed.getFeed().then(items => items.slice(0, 3)), []);
  const feedCache = useCache<FeedItem[]>('home_feed', fetchFeed, { ttl: 2 * 60 * 1000 });
  const feedItems = feedCache.data ?? [];

  const { matches: topMatches, loading: matchesLoading, refresh: refreshMatches } = useTopMatches(3);

  const fetchBadges = useCallback(() => mockBadges.getBadges(), []);
  const badgesCache = useCache<UserBadgeSummary>('home_badges', fetchBadges, { ttl: 3 * 60 * 1000 });
  const badgeSummary = badgesCache.data;

  const fetchMyGroups = useCallback(() => mockGroups.getMyGroups(), []);
  const groupsCache = useCache<GroupPreview[]>('home_groups', fetchMyGroups, { ttl: 3 * 60 * 1000 });
  const myGroups = groupsCache.data ?? [];

  const fetchMyEvents = useCallback(() => mockEvents.getMyEvents(), []);
  const eventsCache = useCache<EventPreview[]>('home_events', fetchMyEvents, { ttl: 3 * 60 * 1000 });
  const myEvents = (eventsCache.data ?? []).filter(e => e.status === 'UPCOMING');

  const mySnapshots = snapshotsCache.data ?? [];
  const suggestedUsers = suggestedCache.data ?? [];
  const connectedUsers = connectionsCache.data ?? [];

  // 애니메이션 훅
  const heroFade = useFadeIn(0);
  const sectionFade1 = useFadeIn(100);
  const sectionFade2 = useFadeIn(200);
  const sectionFade3 = useFadeIn(300);
  const toggleAnim = useAnimatedToggle(isOnline);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshUser(), snapshotsCache.refresh(), suggestedCache.refresh(), connectionsCache.refresh(), statsCache.refresh(), trendingCache.refresh(), feedCache.refresh(), badgesCache.refresh(), groupsCache.refresh(), eventsCache.refresh()]);
    refreshMatches();
    const pc = await mockConnections.getPendingCount();
    setPendingCount(pc);
    setRefreshing(false);
  }, [refreshUser, snapshotsCache, suggestedCache, connectionsCache]);

  const toggleOnline = useCallback(async () => {
    const next = !isOnline;
    setIsOnline(next);
    await mockProfile.toggleOnlineStatus(next);
    showToast(
      next ? '다른 사람들이 나를 발견할 수 있어요!' : '비공개 상태로 전환했어요',
      'success',
      next ? '🟢' : '⚪',
    );
  }, [isOnline, showToast]);

  const pct = useMemo(() => {
    if (!user) return 0;
    return getCompletionPct(user);
  }, [user]);

  const handleNavigateToSection = useCallback((section: ProfileSection) => {
    navigation.navigate('Profile', { scrollTo: section });
  }, [navigation]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return '좋은 아침이에요';
    if (h < 18) return '안녕하세요';
    return '좋은 저녁이에요';
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.white }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <Animated.View style={[styles.header, heroFade]}>
        <View accessible={true} accessibilityLabel={`${greeting} ${user?.displayName || '사용자'}`}>
          <Text style={[styles.greeting, { color: colors.gray500 }]}>{greeting} 👋</Text>
          <Text style={[styles.userName, { color: colors.gray900 }]}>{user?.displayName || '사용자'}</Text>
        </View>
        <Pressable
          style={styles.notifBtn}
          onPress={() => navigation.navigate('Notifications')}
          accessibilityRole="button"
          accessibilityLabel={unreadCount > 0 ? `알림 ${unreadCount}개 읽지 않음` : '알림'}
        >
          <Text style={styles.notifIcon}>🔔</Text>
          {unreadCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </Pressable>
      </Animated.View>

      {/* Search Bar — 통합 검색 진입 */}
      <Pressable
        style={[styles.searchBar, { backgroundColor: colors.gray50, borderColor: colors.gray200 }]}
        onPress={() => navigation.navigate('Search')}
        accessibilityRole="search"
        accessibilityLabel="통합 검색"
      >
        <Text style={styles.searchBarIcon}>🔍</Text>
        <Text style={[styles.searchBarPlaceholder, { color: colors.gray400 }]}>사람, 그룹, 이벤트 검색...</Text>
      </Pressable>

      {/* Open Networking Toggle */}
      <Animated.View style={sectionFade1}>
      <Pressable
        style={[styles.networkingCard, isOnline && styles.networkingOn, { backgroundColor: colors.gray50, borderColor: colors.gray200 }]}
        onPress={toggleOnline}
        accessibilityRole="switch"
        accessibilityLabel="Open Networking"
        accessibilityState={{ checked: !!isOnline }}
      >
        <View style={styles.networkingLeft}>
          <Text style={styles.networkingIcon}>{isOnline ? '🟢' : '⚪'}</Text>
          <View>
            <Text style={styles.networkingTitle}>Open Networking</Text>
            <Text style={styles.networkingDesc}>
              {isOnline ? '다른 사람들이 나를 발견할 수 있어요' : '비공개 상태예요'}
            </Text>
          </View>
        </View>
        <View style={[styles.toggleTrack, isOnline && styles.toggleTrackOn]}>
          <Animated.View style={[styles.toggleThumb, toggleAnim.thumbStyle]} />
        </View>
      </Pressable>
      </Animated.View>

      {/* Profile Completion Guide */}
      {pct < 100 && user && (
        <ProfileCompletionGuide
          user={user}
          onNavigateToSection={handleNavigateToSection}
        />
      )}

      {/* Activity Stats Widget */}
      {activityStats && (
        <AnimatedPressable
          style={[styles.statsWidget, { backgroundColor: colors.white }]}
          onPress={() => navigation.navigate('Stats')}
          accessibilityRole="button"
          accessibilityLabel="활동 통계 보기"
        >
          <View style={styles.statsWidgetHeader}>
            <Text style={[styles.statsWidgetTitle, { color: colors.gray900 }]}>📊 활동 요약</Text>
            <Text style={[styles.statsWidgetLink, { color: colors.primary }]}>자세히 →</Text>
          </View>
          <View style={styles.statsWidgetRow}>
            <View style={styles.statsWidgetItem}>
              <Text style={[styles.statsWidgetValue, { color: colors.gray800 }]}>{activityStats.profileViews}</Text>
              <Text style={[styles.statsWidgetLabel, { color: colors.gray400 }]}>프로필 조회</Text>
            </View>
            <View style={[styles.statsWidgetDivider, { backgroundColor: colors.gray200 }]} />
            <View style={styles.statsWidgetItem}>
              <Text style={[styles.statsWidgetValue, { color: colors.gray800 }]}>{activityStats.totalConnections}</Text>
              <Text style={[styles.statsWidgetLabel, { color: colors.gray400 }]}>연결</Text>
            </View>
            <View style={[styles.statsWidgetDivider, { backgroundColor: colors.gray200 }]} />
            <View style={styles.statsWidgetItem}>
              <Text style={[styles.statsWidgetValue, { color: colors.gray800 }]}>{activityStats.messagesSent + activityStats.messagesReceived}</Text>
              <Text style={[styles.statsWidgetLabel, { color: colors.gray400 }]}>메시지</Text>
            </View>
          </View>
        </AnimatedPressable>
      )}

      {/* 배지 위젯 */}
      {badgeSummary && (
        <AnimatedPressable
          style={[styles.badgeWidget, SHADOWS.sm, { backgroundColor: colors.gray50 }]}
          onPress={() => navigation.navigate('Badges')}
          accessibilityRole="button"
          accessibilityLabel={`배지 ${badgeSummary.unlockedCount}개 달성`}
        >
          <View style={styles.badgeWidgetRow}>
            <Text style={styles.badgeWidgetEmoji}>🏆</Text>
            <View style={styles.badgeWidgetInfo}>
              <Text style={[styles.badgeWidgetTitle, { color: colors.gray900 }]}>
                배지 {badgeSummary.unlockedCount}/{badgeSummary.totalBadges}
              </Text>
              {badgeSummary.recentBadge && (
                <Text style={[styles.badgeWidgetRecent, { color: colors.gray500 }]}>
                  최근: {badgeSummary.recentBadge.emoji} {badgeSummary.recentBadge.name}
                </Text>
              )}
            </View>
            {/* 진행률 원형 */}
            <View style={[styles.badgeWidgetPct, { borderColor: colors.primary }]}>
              <Text style={[styles.badgeWidgetPctText, { color: colors.primary }]}>
                {badgeSummary.totalBadges > 0 ? Math.round((badgeSummary.unlockedCount / badgeSummary.totalBadges) * 100) : 0}%
              </Text>
            </View>
          </View>
          {/* 최근 달성 배지 미리보기 */}
          {badgeSummary.unlockedCount > 0 && (
            <View style={styles.badgeWidgetPreview}>
              {badgeSummary.badges
                .filter(b => b.unlockedAt)
                .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
                .slice(0, 4)
                .map(b => (
                  <View key={b.id} style={[styles.badgeWidgetItem, { borderColor: RARITY_COLORS[b.rarity] }]}>
                    <Text style={styles.badgeWidgetItemEmoji}>{b.emoji}</Text>
                  </View>
                ))}
            </View>
          )}
        </AnimatedPressable>
      )}

      {/* Best Match 위젯 */}
      {topMatches.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.gray800 }]}>💫 Best Match</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.userCards}>
            {topMatches.map(m => (
              <AnimatedPressable
                key={m.userId}
                style={[styles.matchCard, { backgroundColor: colors.gray50, borderColor: colors.gray200 }]}
                onPress={() => navigation.navigate('Compatibility', { userId: m.userId })}
                accessibilityRole="button"
                accessibilityLabel={`${m.displayName} 호환도 ${m.score}%`}
              >
                <Avatar name={m.displayName} emoji={m.avatarEmoji} customColor={m.avatarColor} size={44} />
                <Text style={[styles.matchName, { color: colors.gray900 }]} numberOfLines={1}>{m.displayName}</Text>
                <CompatibilityBadge score={m.score} label={m.label} emoji={m.emoji} variant="compact" />
                <Text style={[styles.matchLabel, { color: colors.gray500 }]}>{m.label}</Text>
              </AnimatedPressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 내 그룹 위젯 */}
      {myGroups.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.gray800 }]}>👥 내 그룹</Text>
            <Pressable onPress={() => navigation.navigate('Groups')} accessibilityRole="link" accessibilityLabel="그룹 전체 보기">
              <Text style={[styles.sectionLink, { color: colors.primary }]}>전체 보기</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupScroll}>
            {myGroups.slice(0, 4).map(group => (
              <GroupCard
                key={group.id}
                group={group}
                compact
                onPress={() => navigation.navigate('GroupDetail', { groupId: group.id })}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* 다가오는 이벤트 위젯 */}
      {myEvents.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.gray800 }]}>📅 다가오는 이벤트</Text>
            <Pressable onPress={() => navigation.navigate('CreateEvent')} accessibilityRole="link" accessibilityLabel="이벤트 만들기">
              <Text style={[styles.sectionLink, { color: colors.primary }]}>+ 만들기</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupScroll}>
            {myEvents.slice(0, 4).map(event => (
              <EventCard
                key={event.id}
                event={event}
                compact
                onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Connections & Pending Requests */}
      {(connectedUsers.length > 0 || pendingCount > 0) && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.gray800 }]}>🤝 연결</Text>
            <Pressable onPress={() => navigation.navigate('Connections')} accessibilityRole="link" accessibilityLabel="연결 목록 보기">
              <Text style={[styles.sectionLink, { color: colors.primary }]}>모두 보기</Text>
            </Pressable>
          </View>
          {pendingCount > 0 && (
            <AnimatedPressable
              style={[styles.pendingBanner, { backgroundColor: colors.primaryBg }]}
              onPress={() => navigation.navigate('Connections')}
              accessibilityRole="button"
              accessibilityLabel={`대기 중인 연결 요청 ${pendingCount}개`}
            >
              <Text style={styles.pendingIcon}>📬</Text>
              <Text style={[styles.pendingText, { color: colors.primary }]}>
                대기 중인 연결 요청 {pendingCount}개
              </Text>
              <Text style={[styles.pendingArrow, { color: colors.primary }]}>→</Text>
            </AnimatedPressable>
          )}
          {connectedUsers.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.userCards}>
              {connectedUsers.slice(0, 5).map(u => (
                <AnimatedPressable
                  key={u.userId}
                  style={[styles.connUserCard, { backgroundColor: colors.gray50 }]}
                  onPress={() => navigation.navigate('UserDetail', { userId: u.userId })}
                  accessibilityRole="button"
                  accessibilityLabel={`${u.displayName} 프로필 보기`}
                >
                  <Avatar name={u.displayName} size={44} showOnline isOnline={u.isOnline} />
                  <Text style={[styles.connUserName, { color: colors.gray900 }]} numberOfLines={1}>{u.displayName}</Text>
                </AnimatedPressable>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* My Interests Quick View */}
      {(user?.recentInterests?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.gray800 }]}>🔥 요즘 관심사</Text>
            <Pressable onPress={() => navigation.navigate('EditInterests', { type: 'RECENT' })} accessibilityRole="link" accessibilityLabel="요즘 관심사 편집">
              <Text style={[styles.sectionLink, { color: colors.primary }]}>편집</Text>
            </Pressable>
          </View>
          <View style={styles.interestRow}>
            {user!.recentInterests.map(id => (
              <InterestTag key={id} interestId={id} size="sm" />
            ))}
          </View>
        </View>
      )}

      {/* Trending Interests Widget */}
      {trendingInterests.length > 0 && (
        <TrendingCard
          items={trendingInterests}
          onExplore={() => navigation.navigate('EditInterests', { type: 'RECENT' })}
        />
      )}

      {/* Suggested Users */}
      {suggestedUsers.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.gray800 }]}>👀 지금 온라인</Text>
            <Pressable onPress={() => {
              // 탭 네비게이터의 Discover로 이동
              navigation.getParent()?.navigate('Discover');
            }} accessibilityRole="link" accessibilityLabel="온라인 사용자 더보기">
              <Text style={styles.sectionLink}>더보기</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.userCards}>
            {suggestedUsers.map((item, index) => (
              <AnimatedPressable
                key={item.userId}
                style={[styles.userCard, { backgroundColor: colors.gray50 }]}
                onPress={() => navigation.navigate('UserDetail', { userId: item.userId })}
                accessibilityRole="button"
                accessibilityLabel={`${item.displayName} 프로필 보기`}
              >
                <Avatar name={item.displayName} size={48} showOnline isOnline={item.isOnline} />
                <Text style={[styles.userCardName, { color: colors.gray900 }]} numberOfLines={1}>{item.displayName}</Text>
                {item.commonInterestCount > 0 && (
                  <View style={styles.matchBadge}>
                    <Text style={styles.matchBadgeText}>
                      공통 {item.commonInterestCount}개
                    </Text>
                  </View>
                )}
                {item.bio && (
                  <Text style={styles.userCardBio} numberOfLines={2}>{item.bio}</Text>
                )}
              </AnimatedPressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Feed Preview */}
      {feedItems.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.gray800 }]}>📡 피드</Text>
            <Pressable onPress={() => navigation.navigate('Feed')} accessibilityRole="link" accessibilityLabel="피드 더보기">
              <Text style={[styles.sectionLink, { color: colors.primary }]}>더보기</Text>
            </Pressable>
          </View>
          {feedItems.map(item => (
            <FeedCard
              key={item.id}
              item={item}
              onPressUser={(userId) => navigation.navigate('UserDetail', { userId })}
            />
          ))}
        </View>
      )}

      {/* My Snapshots */}
      <Animated.View style={[styles.section, sectionFade3]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📸 내 스냅샷</Text>
          <Pressable onPress={() => navigation.navigate('SnapshotGallery', {})} accessibilityRole="link" accessibilityLabel="스냅샷 갤러리">
            <Text style={[styles.sectionLink, { color: colors.primary }]}>갤러리</Text>
          </Pressable>
        </View>
        {mySnapshots.length === 0 ? (
          <View style={styles.emptySnap}>
            <Text style={styles.emptySnapText}>아직 스냅샷이 없어요</Text>
            <Text style={styles.emptySnapHint}>일상을 공유해보세요!</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {mySnapshots.slice(0, 5).map(snap => (
              <View key={snap.id} style={styles.snapThumb}>
                <Image
                  source={{ uri: snap.imageUrl }}
                  style={styles.snapImage}
                  resizeMode="cover"
                  accessibilityLabel={snap.caption || '스냅샷 이미지'}
                />
                {snap.caption && (
                  <Text style={styles.snapCaption} numberOfLines={1}>{snap.caption}</Text>
                )}
              </View>
            ))}
          </ScrollView>
        )}
      </Animated.View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <AnimatedPressable style={[styles.quickAction, { backgroundColor: colors.gray50 }]} onPress={() => navigation.navigate('Conversations')} accessibilityRole="button" accessibilityLabel="채팅">
          <Text style={styles.quickActionIcon}>💬</Text>
          <Text style={styles.quickActionText}>채팅</Text>
        </AnimatedPressable>
        <AnimatedPressable style={[styles.quickAction, { backgroundColor: colors.gray50 }]} onPress={() => navigation.navigate('Stats')} accessibilityRole="button" accessibilityLabel="통계">
          <Text style={styles.quickActionIcon}>📊</Text>
          <Text style={styles.quickActionText}>통계</Text>
        </AnimatedPressable>
        <AnimatedPressable style={[styles.quickAction, { backgroundColor: colors.gray50 }]} onPress={() => navigation.navigate('ShareProfile')} accessibilityRole="button" accessibilityLabel="공유">
          <Text style={styles.quickActionIcon}>🔗</Text>
          <Text style={styles.quickActionText}>공유</Text>
        </AnimatedPressable>
        <AnimatedPressable style={[styles.quickAction, { backgroundColor: colors.gray50 }]} onPress={() => navigation.navigate('Bookmarks')} accessibilityRole="button" accessibilityLabel="북마크">
          <Text style={styles.quickActionIcon}>🔖</Text>
          <Text style={styles.quickActionText}>저장됨</Text>
        </AnimatedPressable>
        <AnimatedPressable style={[styles.quickAction, { backgroundColor: colors.gray50 }]} onPress={() => navigation.navigate('ActivityTimeline')} accessibilityRole="button" accessibilityLabel="활동 타임라인">
          <Text style={styles.quickActionIcon}>📜</Text>
          <Text style={styles.quickActionText}>타임라인</Text>
        </AnimatedPressable>
        <AnimatedPressable style={[styles.quickAction, { backgroundColor: colors.gray50 }]} onPress={() => navigation.navigate('Settings')} accessibilityRole="button" accessibilityLabel="설정">
          <Text style={styles.quickActionIcon}>⚙️</Text>
          <Text style={styles.quickActionText}>설정</Text>
        </AnimatedPressable>
        <AnimatedPressable style={[styles.quickAction, { backgroundColor: colors.gray50 }]} onPress={() => navigation.navigate('UserNotes')} accessibilityRole="button" accessibilityLabel="내 메모">
          <Text style={styles.quickActionIcon}>📝</Text>
          <Text style={styles.quickActionText}>메모</Text>
        </AnimatedPressable>
        <AnimatedPressable style={[styles.quickAction, { backgroundColor: colors.gray50 }]} onPress={() => navigation.navigate('Tutorial')} accessibilityRole="button" accessibilityLabel="앱 가이드">
          <Text style={styles.quickActionIcon}>📖</Text>
          <Text style={styles.quickActionText}>가이드</Text>
        </AnimatedPressable>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: SPACING.xl, paddingTop: 60, gap: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: { fontSize: FONT_SIZE.sm, color: COLORS.gray500 },
  userName: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.gray900, marginTop: 2 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1, paddingHorizontal: SPACING.sm, height: 44,
  },
  searchBarIcon: { fontSize: 16, marginRight: 8 },
  searchBarPlaceholder: { fontSize: FONT_SIZE.sm },
  notifBtn: { position: 'relative', padding: 8 },
  notifIcon: { fontSize: 24 },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notifBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  // Networking
  networkingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  networkingOn: {
    backgroundColor: COLORS.successBg,
    borderColor: COLORS.successLight,
  },
  networkingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  networkingIcon: { fontSize: 20 },
  networkingTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.gray800 },
  networkingDesc: { fontSize: FONT_SIZE.xs, color: COLORS.gray500, marginTop: 2 },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.gray300,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleTrackOn: { backgroundColor: COLORS.success },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },

  // Sections
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.gray800 },
  sectionLink: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: '600' },
  interestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  // User cards
  userCards: { marginHorizontal: -4 },
  userCard: {
    width: 140,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    padding: 14,
    marginRight: 10,
    alignItems: 'center',
    gap: 8,
    ...SHADOWS.sm,
  },
  userCardName: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.gray800 },
  matchBadge: {
    backgroundColor: COLORS.primaryBg,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  matchBadgeText: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: '600' },
  userCardBio: { fontSize: FONT_SIZE.xs, color: COLORS.gray500, textAlign: 'center' },

  // Snapshots
  emptySnap: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
  },
  emptySnapText: { fontSize: FONT_SIZE.sm, color: COLORS.gray500 },
  emptySnapHint: { fontSize: FONT_SIZE.xs, color: COLORS.gray400, marginTop: 4 },
  snapThumb: {
    width: 120,
    marginRight: 10,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    backgroundColor: COLORS.gray100,
  },
  snapImage: { width: 120, height: 120 },
  snapCaption: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray600,
    padding: 6,
  },

  // Quick actions
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  quickActionIcon: { fontSize: 18 },
  quickActionText: { fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.gray700 },

  // Connections
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BORDER_RADIUS.md,
    gap: 8,
    marginBottom: 8,
  },
  pendingIcon: { fontSize: 18 },
  pendingText: { flex: 1, fontSize: FONT_SIZE.sm, fontWeight: '600' },
  pendingArrow: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  connUserCard: {
    alignItems: 'center',
    padding: 12,
    borderRadius: BORDER_RADIUS.md,
    width: 90,
    marginRight: 10,
  },
  connUserName: { fontSize: FONT_SIZE.xs, fontWeight: '600', marginTop: 6, textAlign: 'center' },

  // Stats widget
  statsWidget: {
    padding: 14,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  statsWidgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsWidgetTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  statsWidgetLink: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  statsWidgetRow: { flexDirection: 'row', alignItems: 'center' },
  statsWidgetItem: { flex: 1, alignItems: 'center', gap: 2 },
  statsWidgetValue: { fontSize: FONT_SIZE.xl, fontWeight: '800' },
  statsWidgetLabel: { fontSize: FONT_SIZE.xs },
  statsWidgetDivider: { width: 1, height: 28 },

  // Best Match
  matchCard: {
    alignItems: 'center',
    padding: 12,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    width: 110,
    marginRight: 10,
    gap: 4,
  },
  matchName: { fontSize: FONT_SIZE.xs, fontWeight: '600', textAlign: 'center', maxWidth: 90 },
  matchLabel: { fontSize: 10, textAlign: 'center' },

  // Badge widget
  badgeWidget: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  badgeWidgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  badgeWidgetEmoji: {
    fontSize: 28,
  },
  badgeWidgetInfo: {
    flex: 1,
  },
  badgeWidgetTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  badgeWidgetRecent: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  badgeWidgetPct: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWidgetPctText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  badgeWidgetPreview: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  badgeWidgetItem: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  badgeWidgetItemEmoji: {
    fontSize: 20,
  },

  // Groups widget
  groupScroll: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
});
