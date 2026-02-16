import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet, RefreshControl, TextInput,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { mockDiscover, mockSafety } from '../services/mockService';
import { getInterestById } from '../constants/interests';
import Avatar from '../components/Avatar';
import InterestTag from '../components/InterestTag';
import AnimatedPressable from '../components/AnimatedPressable';
import FilterSheet, { SortOption } from '../components/FilterSheet';
import { useTheme } from '../contexts/ThemeContext';
import { useDebounce } from '../hooks/useDebounce';
import { useCache } from '../hooks/useCache';
import { useSearchHistory } from '../hooks/useSearchHistory';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { DiscoverItem, DiscoverScreenProps } from '../types';
import { SkeletonDiscoverList } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { InlineError } from '../components/ErrorRetry';

type TabType = 'online' | 'all';

// ── 키 추출기 (FlatList 최적화) ──
const keyExtractor = (item: DiscoverItem) => item.userId;

// ── 유저 카드 컴포넌트 (React.memo로 불필요한 재렌더링 방지) ──
const UserCard = React.memo(({ item, myAllInterests, colors, navigation }: {
  item: DiscoverItem;
  myAllInterests: string[];
  colors: any;
  navigation: DiscoverScreenProps['navigation'];
}) => {
  const theirAll = useMemo(
    () => [...item.recentInterests, ...item.alwaysInterests],
    [item.recentInterests, item.alwaysInterests],
  );
  const commonIds = useMemo(
    () => theirAll.filter(id => myAllInterests.includes(id)),
    [theirAll, myAllInterests],
  );

  const handlePress = useCallback(
    () => navigation.navigate('UserDetail', { userId: item.userId }),
    [navigation, item.userId],
  );

  return (
    <AnimatedPressable
      style={[styles.userCard, { backgroundColor: colors.white }]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${item.displayName} 프로필 보기`}
    >
      <View style={styles.cardTop}>
        <Avatar name={item.displayName} size={52} showOnline isOnline={item.isOnline} />
        <View style={styles.cardInfo}>
          <Text style={[styles.cardName, { color: colors.gray900 }]}>{item.displayName}</Text>
          {item.bio && <Text style={styles.cardBio} numberOfLines={1}>{item.bio}</Text>}
        </View>
        {commonIds.length > 0 && (
          <View style={styles.commonBadge}>
            <Text style={styles.commonBadgeText}>공통 {commonIds.length}</Text>
          </View>
        )}
      </View>

      {theirAll.length > 0 && (
        <View style={styles.cardInterests}>
          {theirAll.slice(0, 6).map(id => (
            <InterestTag key={id} interestId={id} size="sm" isHighlighted={commonIds.includes(id)} />
          ))}
          {theirAll.length > 6 && (
            <View style={styles.moreTag}>
              <Text style={styles.moreTagText}>+{theirAll.length - 6}</Text>
            </View>
          )}
        </View>
      )}

      {item.latestSnapshot && (
        <View style={styles.snapPreview}>
          <Text style={styles.snapPreviewIcon}>📸</Text>
          <Text style={styles.snapPreviewText} numberOfLines={1}>
            {item.latestSnapshot.caption || '최근 스냅샷'}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
});

export default function DiscoverScreen({ navigation }: DiscoverScreenProps) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [tab, setTab] = useState<TabType>('online');
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('common');
  const debouncedSearch = useDebounce(search, 250);
  const { history, addSearch, removeSearch, clearHistory } = useSearchHistory();
  const searchRef = useRef<TextInput>(null);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);

  // 차단 목록 로드
  useEffect(() => {
    mockSafety.getBlockedUserIds().then(setBlockedIds);
  }, []);

  const fetchOnline = useCallback(() => mockDiscover.getOnlineUsers(), []);
  const fetchAll = useCallback(() => mockDiscover.getAllUsers(), []);

  const onlineCache = useCache<DiscoverItem[]>('discover_online', fetchOnline, { ttl: 3 * 60 * 1000 });
  const allCache = useCache<DiscoverItem[]>('discover_all', fetchAll, { ttl: 3 * 60 * 1000 });

  const activeCache = tab === 'online' ? onlineCache : allCache;
  const items = activeCache.data ?? [];
  const loading = activeCache.loading;
  const error = activeCache.error;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await activeCache.refresh();
    const ids = await mockSafety.getBlockedUserIds();
    setBlockedIds(ids);
    setRefreshing(false);
  }, [activeCache]);

  const handleSearchSubmit = useCallback(() => {
    const q = search.trim();
    if (q) addSearch(q);
  }, [search, addSearch]);

  const handleHistorySelect = useCallback((query: string) => {
    setSearch(query);
    setSearchFocused(false);
    searchRef.current?.blur();
    addSearch(query);
  }, [addSearch]);

  const handleFilterApply = useCallback((interests: string[], sort: SortOption) => {
    setSelectedInterests(interests);
    setSortBy(sort);
  }, []);

  const activeFilterCount = selectedInterests.length + (sortBy !== 'common' ? 1 : 0);

  const myAllInterests = useMemo(
    () => [...(user?.recentInterests ?? []), ...(user?.alwaysInterests ?? [])],
    [user?.recentInterests, user?.alwaysInterests],
  );

  const filtered = useMemo(() => {
    let result = items;

    // 차단된 사용자 필터링
    if (blockedIds.length > 0) {
      result = result.filter(item => !blockedIds.includes(item.userId));
    }

    // 텍스트 검색
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(item =>
        item.displayName.toLowerCase().includes(q) ||
        (item.bio || '').toLowerCase().includes(q)
      );
    }

    // 관심사 필터
    if (selectedInterests.length > 0) {
      result = result.filter(item => {
        const allInterests = [...item.recentInterests, ...item.alwaysInterests];
        return selectedInterests.some(id => allInterests.includes(id));
      });
    }

    // 정렬
    if (sortBy === 'name') {
      result = [...result].sort((a, b) => a.displayName.localeCompare(b.displayName));
    } else if (sortBy === 'common') {
      result = [...result].sort((a, b) => {
        const aCommon = [...a.recentInterests, ...a.alwaysInterests].filter(id => myAllInterests.includes(id)).length;
        const bCommon = [...b.recentInterests, ...b.alwaysInterests].filter(id => myAllInterests.includes(id)).length;
        return bCommon - aCommon;
      });
    }
    // 'recent' → 기본 순서 유지 (서버 응답 순)

    return result;
  }, [items, debouncedSearch, selectedInterests, sortBy, myAllInterests, blockedIds]);

  return (
    <View style={[styles.container, { backgroundColor: colors.gray50 }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.white }]}>
        <Text style={[styles.title, { color: colors.gray900 }]}>발견 🔍</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[styles.subtitle, { color: colors.gray500 }]}>관심사가 통하는 사람을 찾아보세요</Text>
          <Pressable
            onPress={() => navigation.navigate('Search')}
            accessibilityRole="button"
            accessibilityLabel="통합 검색"
            style={{ paddingVertical: 4, paddingHorizontal: 8 }}
          >
            <Text style={{ fontSize: FONT_SIZE.xs, color: colors.primary, fontWeight: '600' }}>🔍 통합 검색</Text>
          </Pressable>
        </View>
        {activeCache.isRevalidating && (
          <Text style={[styles.revalidatingHint, { color: colors.gray400 }]}>업데이트 중…</Text>
        )}
      </View>

      {/* Search + Filter */}
      <View style={styles.searchRow}>
        <View style={[styles.searchContainer, { backgroundColor: colors.gray100, flex: 1 }]}>
          <Text style={styles.searchIcon}>🔎</Text>
          <TextInput
            ref={searchRef}
            placeholder="이름 또는 관심사 검색"
            value={search}
            onChangeText={setSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            style={[styles.searchInput, { color: colors.gray900 }]}
            placeholderTextColor={colors.gray400}
            accessibilityLabel="이름 또는 관심사 검색"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} accessibilityRole="button" accessibilityLabel="검색어 지우기">
              <Text style={styles.searchClear}>✕</Text>
            </Pressable>
          )}
        </View>
        <Pressable
          style={[
            styles.filterBtn,
            { backgroundColor: colors.gray100 },
            activeFilterCount > 0 && { backgroundColor: colors.primaryBg },
          ]}
          onPress={() => setFilterVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={`필터 ${activeFilterCount > 0 ? `${activeFilterCount}개 적용됨` : '열기'}`}
        >
          <Text style={styles.filterBtnIcon}>⚙️</Text>
          {activeFilterCount > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Search History Dropdown */}
      {searchFocused && !search && history.length > 0 && (
        <View style={[styles.historyDropdown, { backgroundColor: colors.white, borderColor: colors.gray200 }]}>
          <View style={styles.historyHeader}>
            <Text style={[styles.historyTitle, { color: colors.gray500 }]}>최근 검색</Text>
            <Pressable onPress={clearHistory} accessibilityRole="button" accessibilityLabel="검색 기록 전체 삭제">
              <Text style={[styles.historyClear, { color: colors.gray400 }]}>전체 삭제</Text>
            </Pressable>
          </View>
          {history.map((query) => (
            <Pressable
              key={query}
              style={styles.historyItem}
              onPress={() => handleHistorySelect(query)}
              accessibilityRole="button"
              accessibilityLabel={`최근 검색어: ${query}`}
            >
              <Text style={styles.historyIcon}>🕐</Text>
              <Text style={[styles.historyText, { color: colors.gray700 }]} numberOfLines={1}>{query}</Text>
              <Pressable
                onPress={() => removeSearch(query)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`${query} 검색 기록 삭제`}
              >
                <Text style={[styles.historyRemove, { color: colors.gray400 }]}>✕</Text>
              </Pressable>
            </Pressable>
          ))}
        </View>
      )}

      {/* Active Filters Badge */}
      {activeFilterCount > 0 && (
        <View style={styles.activeFilters}>
          <Text style={[styles.activeFiltersText, { color: colors.gray500 }]}>
            📋 필터 {activeFilterCount}개 적용됨
          </Text>
          <Pressable onPress={() => { setSelectedInterests([]); setSortBy('common'); }} accessibilityRole="button" accessibilityLabel="모든 필터 초기화">
            <Text style={[styles.activeFiltersClear, { color: colors.primary }]}>초기화</Text>
          </Pressable>
        </View>
      )}

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.gray100 }]} accessibilityRole="tablist">
        <Pressable
          style={[styles.tab, tab === 'online' && [styles.tabActive, { backgroundColor: colors.white }]]}
          onPress={() => setTab('online')}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'online' }}
          accessibilityLabel="온라인 사용자"
        >
          <Text style={[styles.tabText, tab === 'online' && [styles.tabTextActive, { color: colors.gray900 }]]}>
            🟢 온라인
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'all' && [styles.tabActive, { backgroundColor: colors.white }]]}
          onPress={() => setTab('all')}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'all' }}
          accessibilityLabel="전체 사용자"
        >
          <Text style={[styles.tabText, tab === 'all' && [styles.tabTextActive, { color: colors.gray900 }]]}>
            👥 전체
          </Text>
        </Pressable>
      </View>

      {/* List */}
      {error && !loading && (
        <InlineError
          message={error}
          onRetry={activeCache.refresh}
        />
      )}

      {loading ? (
        <View style={styles.listContent}>
          <SkeletonDiscoverList />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={keyExtractor}
          renderItem={({ item }) => <UserCard item={item} myAllInterests={myAllInterests} colors={colors} navigation={navigation} />}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState
              emoji="🌤️"
              title={search ? '검색 결과가 없어요' : '아직 발견된 사용자가 없어요'}
              subtitle={tab === 'online'
                ? 'Open Networking을 켠 사용자가 나타나면 여기에 표시돼요'
                : '새로운 사용자를 기다려보세요'}
              actionLabel="새로고침"
              onAction={activeCache.refresh}
            />
          }
          ListFooterComponent={<View style={{ height: 20 }} />}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          maxToRenderPerBatch={8}
          windowSize={5}
        />
      )}

      {/* Filter Bottom Sheet */}
      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        selectedInterests={selectedInterests}
        sortBy={sortBy}
        onApply={handleFilterApply}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 60,
    gap: 4,
  },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.gray900 },
  subtitle: { fontSize: FONT_SIZE.sm, color: COLORS.gray500 },
  revalidatingHint: { fontSize: FONT_SIZE.xs, marginTop: 2 },

  // Search
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    marginTop: 16,
    gap: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 14,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    paddingVertical: 12,
    color: COLORS.gray900,
  },
  searchClear: { fontSize: 16, color: COLORS.gray400, padding: 4 },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnIcon: { fontSize: 18 },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },

  // Search History
  historyDropdown: {
    marginHorizontal: SPACING.xl,
    marginTop: 4,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  historyTitle: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
  historyClear: { fontSize: FONT_SIZE.xs },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  historyIcon: { fontSize: 14 },
  historyText: { flex: 1, fontSize: FONT_SIZE.sm },
  historyRemove: { fontSize: 12, padding: 4 },

  // Active Filters
  activeFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.xl,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.gray50,
  },
  activeFiltersText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  activeFiltersClear: { fontSize: FONT_SIZE.xs, fontWeight: '600' },

  // Tabs
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    marginTop: 16,
    gap: 8,
    marginBottom: 4,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.gray100,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.gray600,
  },
  tabTextActive: {
    color: '#fff',
  },

  // List
  listContent: {
    padding: SPACING.xl,
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.gray700 },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.gray500 },
  emptyHint: { fontSize: FONT_SIZE.sm, color: COLORS.gray400, textAlign: 'center' },

  // User Card
  userCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...SHADOWS.sm,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardInfo: { flex: 1, gap: 2 },
  cardName: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.gray900 },
  cardBio: { fontSize: FONT_SIZE.sm, color: COLORS.gray500 },
  commonBadge: {
    backgroundColor: COLORS.primaryBg,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  commonBadgeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: '700',
  },
  cardInterests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  moreTag: {
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  moreTagText: { fontSize: FONT_SIZE.xs, color: COLORS.gray500 },
  snapPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.sm,
    padding: 8,
  },
  snapPreviewIcon: { fontSize: 14 },
  snapPreviewText: { fontSize: FONT_SIZE.xs, color: COLORS.gray600, flex: 1 },
});
