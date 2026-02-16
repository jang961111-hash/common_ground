// ==========================================
// SearchScreen — 통합 검색 화면
// 유저, 그룹, 이벤트를 한 곳에서 검색
// ==========================================
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, FlatList,
  ActivityIndicator, Keyboard,
} from 'react-native';
import { SearchScreenProps, SearchResult, SearchResultType, TrendingSearch } from '../types';
import { mockSearch } from '../services/mockService';
import { useTheme } from '../contexts/ThemeContext';
import { useSearchHistory } from '../hooks/useSearchHistory';
import { useDebounce } from '../hooks/useDebounce';
import Avatar from '../components/Avatar';
import InterestTag from '../components/InterestTag';
import ScreenHeader from '../components/ScreenHeader';
import EmptyState from '../components/EmptyState';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';

type TabKey = 'ALL' | 'USER' | 'GROUP' | 'EVENT';
const TABS: { key: TabKey; label: string; emoji: string }[] = [
  { key: 'ALL', label: '전체', emoji: '🔍' },
  { key: 'USER', label: '사람', emoji: '👤' },
  { key: 'GROUP', label: '그룹', emoji: '👥' },
  { key: 'EVENT', label: '이벤트', emoji: '📅' },
];

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function SearchScreen({ navigation }: SearchScreenProps) {
  const { colors } = useTheme();
  const { history, addSearch, removeSearch, clearHistory } = useSearchHistory();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('ALL');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [trending, setTrending] = useState<TrendingSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  // 트렌딩 검색어 로드
  useEffect(() => {
    mockSearch.getTrendingSearches().then(setTrending);
  }, []);

  // 자동완성
  useEffect(() => {
    if (debouncedQuery.trim().length >= 1 && !hasSearched) {
      mockSearch.getSuggestions(debouncedQuery).then(s => {
        setSuggestions(s);
        setShowSuggestions(s.length > 0);
      });
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedQuery, hasSearched]);

  const executeSearch = useCallback(async (searchQuery: string, tab?: TabKey) => {
    const q = searchQuery.trim();
    if (!q) return;

    Keyboard.dismiss();
    setShowSuggestions(false);
    setLoading(true);
    setHasSearched(true);
    const currentTab = tab ?? activeTab;
    const typeFilter: SearchResultType | undefined = currentTab === 'ALL' ? undefined : currentTab;

    try {
      const res = await mockSearch.search(q, typeFilter);
      setResults(res);
      await addSearch(q);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, addSearch]);

  // 탭 변경 시 재검색
  const handleTabChange = useCallback((tab: TabKey) => {
    setActiveTab(tab);
    if (hasSearched && query.trim()) {
      executeSearch(query, tab);
    }
  }, [hasSearched, query, executeSearch]);

  const handleSuggestionPress = useCallback((text: string) => {
    setQuery(text);
    executeSearch(text);
  }, [executeSearch]);

  const handleHistoryPress = useCallback((text: string) => {
    setQuery(text);
    executeSearch(text);
  }, [executeSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, []);

  const handleResultPress = useCallback((item: SearchResult) => {
    if (item.type === 'USER') {
      navigation.navigate('UserDetail', { userId: item.id });
    } else if (item.type === 'GROUP') {
      navigation.navigate('GroupDetail', { groupId: item.id });
    } else if (item.type === 'EVENT') {
      navigation.navigate('EventDetail', { eventId: item.id });
    }
  }, [navigation]);

  // 카운트별 탭 뱃지
  const tabCounts = useMemo((): Record<TabKey, number> => {
    const counts: Record<TabKey, number> = { ALL: 0, USER: 0, GROUP: 0, EVENT: 0 };
    if (!hasSearched) return counts;
    for (const r of results) {
      if (r.type === 'USER') counts.USER++;
      else if (r.type === 'GROUP') counts.GROUP++;
      else if (r.type === 'EVENT') counts.EVENT++;
    }
    counts.ALL = results.length;
    return counts;
  }, [results, hasSearched]);

  const getTypeColor = (type: SearchResultType): string => {
    switch (type) {
      case 'USER': return COLORS.primary;
      case 'GROUP': return COLORS.accent;
      case 'EVENT': return COLORS.success;
    }
  };

  const getTypeLabel = (type: SearchResultType): string => {
    switch (type) {
      case 'USER': return '👤 사람';
      case 'GROUP': return '👥 그룹';
      case 'EVENT': return '📅 이벤트';
    }
  };

  // ── 검색 결과 아이템 렌더 ──
  const renderResultItem = useCallback(({ item }: { item: SearchResult }) => (
    <Pressable
      style={[styles.resultCard, { backgroundColor: colors.white, borderColor: colors.gray100 }]}
      onPress={() => handleResultPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`${item.title} ${getTypeLabel(item.type)}`}
    >
      <View style={styles.resultRow}>
        {/* 아바타 영역 */}
        {item.type === 'USER' ? (
          <Avatar
            name={item.title}
            emoji={item.emoji ?? undefined}
            customColor={item.avatarColor ?? undefined}
            size={48}
            showOnline={true}
            isOnline={item.isOnline}
          />
        ) : (
          <View style={[styles.resultIcon, { backgroundColor: item.avatarColor ?? getTypeColor(item.type) + '20' }]}>
            <Text style={styles.resultIconEmoji}>{item.emoji ?? (item.type === 'GROUP' ? '👥' : '📅')}</Text>
          </View>
        )}

        {/* 텍스트 */}
        <View style={styles.resultText}>
          <View style={styles.resultTitleRow}>
            <Text style={[styles.resultTitle, { color: colors.gray900 }]} numberOfLines={1}>{item.title}</Text>
            <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) + '15' }]}>
              <Text style={[styles.typeBadgeText, { color: getTypeColor(item.type) }]}>{getTypeLabel(item.type)}</Text>
            </View>
          </View>

          {item.subtitle && (
            <Text style={[styles.resultSubtitle, { color: colors.gray500 }]} numberOfLines={1}>{item.subtitle}</Text>
          )}

          <View style={styles.resultMeta}>
            <Text style={[styles.matchReason, { color: colors.primary }]}>✨ {item.matchReason}</Text>
            {item.memberCount !== undefined && (
              <Text style={[styles.metaText, { color: colors.gray400 }]}>👥 {item.memberCount}명</Text>
            )}
            {item.date && (
              <Text style={[styles.metaText, { color: colors.gray400 }]}>📅 {formatShortDate(item.date)}</Text>
            )}
          </View>

          {/* 관심사 태그 */}
          {item.interestIds.length > 0 && (
            <View style={styles.resultTags}>
              {item.interestIds.slice(0, 3).map(iid => (
                <InterestTag key={iid} interestId={iid} size="sm" />
              ))}
              {item.interestIds.length > 3 && (
                <Text style={[styles.moreTag, { color: colors.gray400 }]}>+{item.interestIds.length - 3}</Text>
              )}
            </View>
          )}
        </View>
      </View>
    </Pressable>
  ), [colors, handleResultPress]);

  // ── 검색 전 화면 (히스토리 + 트렌딩) ──
  const renderPreSearchContent = () => (
    <View style={styles.preContent}>
      {/* 최근 검색 */}
      {history.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.gray800 }]}>🕐 최근 검색</Text>
            <Pressable onPress={clearHistory} accessibilityRole="button" accessibilityLabel="전체 삭제">
              <Text style={[styles.clearBtn, { color: colors.gray400 }]}>전체 삭제</Text>
            </Pressable>
          </View>
          <View style={styles.chipWrap}>
            {history.slice(0, 10).map(h => (
              <Pressable
                key={h}
                style={[styles.historyChip, { backgroundColor: colors.gray50, borderColor: colors.gray200 }]}
                onPress={() => handleHistoryPress(h)}
                accessibilityRole="button"
              >
                <Text style={[styles.historyChipText, { color: colors.gray700 }]}>{h}</Text>
                <Pressable
                  onPress={() => removeSearch(h)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`${h} 삭제`}
                >
                  <Text style={[styles.historyChipX, { color: colors.gray400 }]}>✕</Text>
                </Pressable>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* 인기 검색어 */}
      {trending.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.gray800 }]}>🔥 인기 검색어</Text>
          <View style={styles.trendingList}>
            {trending.map((t, idx) => (
              <Pressable
                key={t.keyword}
                style={[styles.trendingItem, { borderBottomColor: colors.gray100 }]}
                onPress={() => handleSuggestionPress(t.keyword)}
                accessibilityRole="button"
              >
                <View style={styles.trendingRank}>
                  <Text style={[styles.trendingRankNum, {
                    color: idx < 3 ? COLORS.primary : colors.gray400,
                  }]}>{idx + 1}</Text>
                </View>
                <Text style={styles.trendingEmoji}>{t.emoji}</Text>
                <Text style={[styles.trendingKeyword, { color: colors.gray800 }]}>{t.keyword}</Text>
                <Text style={[styles.trendingCount, { color: colors.gray400 }]}>{t.count}회</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  // ── 자동완성 드롭다운 ──
  const renderSuggestions = () => {
    if (!showSuggestions || suggestions.length === 0) return null;
    return (
      <View style={[styles.suggestionsWrap, { backgroundColor: colors.white, borderColor: colors.gray200 }, SHADOWS.md]}>
        {suggestions.map(s => (
          <Pressable
            key={s}
            style={[styles.suggestionItem, { borderBottomColor: colors.gray100 }]}
            onPress={() => handleSuggestionPress(s)}
            accessibilityRole="button"
          >
            <Text style={[styles.suggestionIcon, { color: colors.gray400 }]}>🔍</Text>
            <Text style={[styles.suggestionText, { color: colors.gray700 }]}>{s}</Text>
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      <ScreenHeader title="검색" onBack={() => navigation.goBack()} />

      {/* 검색바 */}
      <View style={styles.searchBarWrap}>
        <View style={[styles.searchBar, { backgroundColor: colors.gray50, borderColor: colors.gray200 }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: colors.gray900 }]}
            placeholder="사람, 그룹, 이벤트 검색..."
            placeholderTextColor={colors.gray400}
            value={query}
            onChangeText={text => {
              setQuery(text);
              if (text.trim()) {
                setHasSearched(false);
              }
            }}
            onSubmitEditing={() => executeSearch(query)}
            returnKeyType="search"
            autoFocus
            autoCapitalize="none"
            accessibilityLabel="검색어 입력"
          />
          {query.length > 0 && (
            <Pressable onPress={handleClear} hitSlop={8} accessibilityRole="button" accessibilityLabel="검색어 지우기">
              <Text style={[styles.clearIcon, { color: colors.gray400 }]}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* 자동완성 */}
      {renderSuggestions()}

      {/* 탭 필터 */}
      {hasSearched && (
        <View style={[styles.tabs, { borderBottomColor: colors.gray200 }]}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const count = tabCounts[tab.key];
            return (
              <Pressable
                key={tab.key}
                style={[styles.tab, isActive && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                onPress={() => handleTabChange(tab.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                <Text style={[
                  styles.tabText,
                  { color: isActive ? colors.primary : colors.gray500 },
                  isActive && styles.tabTextActive,
                ]}>
                  {tab.emoji} {tab.label}
                  {count !== undefined && count > 0 ? ` (${count})` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* 콘텐츠 */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.gray400 }]}>검색 중...</Text>
        </View>
      ) : hasSearched ? (
        <FlatList
          data={results}
          keyExtractor={item => `${item.type}-${item.id}`}
          renderItem={renderResultItem}
          contentContainerStyle={styles.resultList}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <EmptyState
              emoji="🔍"
              title="검색 결과가 없어요"
              subtitle={`"${query}"에 대한 결과를 찾을 수 없어요`}
            />
          }
        />
      ) : (
        renderPreSearchContent()
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // 검색바
  searchBarWrap: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg, borderWidth: 1,
    paddingHorizontal: SPACING.sm, height: 48,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: FONT_SIZE.md, paddingVertical: 0 },
  clearIcon: { fontSize: 14, padding: 4 },

  // 자동완성
  suggestionsWrap: {
    position: 'absolute', top: 108, left: SPACING.md, right: SPACING.md,
    borderRadius: BORDER_RADIUS.md, borderWidth: 1, zIndex: 100, maxHeight: 280,
  },
  suggestionItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.sm,
    paddingVertical: 12, borderBottomWidth: 1,
  },
  suggestionIcon: { fontSize: 14, marginRight: 10 },
  suggestionText: { fontSize: FONT_SIZE.sm, flex: 1 },

  // 탭
  tabs: {
    flexDirection: 'row', borderBottomWidth: 1,
    paddingHorizontal: SPACING.sm,
  },
  tab: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabText: { fontSize: FONT_SIZE.xs, fontWeight: '500' },
  tabTextActive: { fontWeight: '700' },

  // 결과 리스트
  resultList: { padding: SPACING.md, paddingBottom: 40 },
  resultCard: {
    borderRadius: BORDER_RADIUS.lg, borderWidth: 1,
    padding: SPACING.md, marginBottom: SPACING.sm,
  },
  resultRow: { flexDirection: 'row', gap: 12 },
  resultIcon: {
    width: 48, height: 48, borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center', alignItems: 'center',
  },
  resultIconEmoji: { fontSize: 22 },
  resultText: { flex: 1 },
  resultTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  resultTitle: { fontSize: FONT_SIZE.md, fontWeight: '700', flex: 1 },
  typeBadge: { borderRadius: BORDER_RADIUS.sm, paddingHorizontal: 6, paddingVertical: 2 },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  resultSubtitle: { fontSize: FONT_SIZE.sm, marginBottom: 4 },
  resultMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  matchReason: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  metaText: { fontSize: FONT_SIZE.xs },
  resultTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  moreTag: { fontSize: FONT_SIZE.xs, alignSelf: 'center', marginLeft: 2 },

  // 날짜 텍스트는 metaText 활용

  // Pre-search
  preContent: { flex: 1, paddingHorizontal: SPACING.md, paddingTop: SPACING.sm },
  section: { marginBottom: SPACING.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  sectionTitle: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  clearBtn: { fontSize: FONT_SIZE.xs },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  historyChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: BORDER_RADIUS.full, borderWidth: 1,
    paddingLeft: 12, paddingRight: 8, paddingVertical: 6,
  },
  historyChipText: { fontSize: FONT_SIZE.sm },
  historyChipX: { fontSize: 11, padding: 2 },

  trendingList: {},
  trendingItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, gap: 10,
  },
  trendingRank: { width: 24, alignItems: 'center' },
  trendingRankNum: { fontSize: FONT_SIZE.md, fontWeight: '800' },
  trendingEmoji: { fontSize: 18 },
  trendingKeyword: { fontSize: FONT_SIZE.md, fontWeight: '500', flex: 1 },
  trendingCount: { fontSize: FONT_SIZE.xs },

  // 로딩
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: FONT_SIZE.sm },
});
