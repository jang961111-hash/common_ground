// ==========================================
// EditInterestsScreen — 관심사 편집 & 추천
// ==========================================
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView,
  Animated, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { mockProfile, mockInterestTrends } from '../services/mockService';
import {
  INTERESTS, INTEREST_CATEGORIES, getInterestById, getInterestsByCategory,
  Interest, InterestCategory,
} from '../constants/interests';
import ScreenHeader from '../components/ScreenHeader';
import InterestTag from '../components/InterestTag';
import AnimatedPressable from '../components/AnimatedPressable';
import { useFadeIn } from '../hooks/useAnimations';
import { useDebounce } from '../hooks/useDebounce';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';
import {
  EditInterestsScreenProps, InterestType, TrendingInterest, InterestRecommendation,
} from '../types';

const MAX_INTERESTS = 5;

export default function EditInterestsScreen({ navigation, route }: EditInterestsScreenProps) {
  const interestType: InterestType = route.params.type;
  const isRecent = interestType === 'RECENT';

  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const { colors } = useTheme();

  // 선택된 관심사
  const [selected, setSelected] = useState<string[]>([]);
  const [otherList, setOtherList] = useState<string[]>([]);

  // 검색
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);

  // 트렌드 & 추천
  const [trending, setTrending] = useState<TrendingInterest[]>([]);
  const [recommended, setRecommended] = useState<InterestRecommendation[]>([]);

  // UI
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<InterestCategory | 'all' | 'trending' | 'recommended'>('all');
  const [hasChanges, setHasChanges] = useState(false);

  const fadeIn = useFadeIn(0);

  // 초기화
  useEffect(() => {
    if (user) {
      const initial = isRecent ? [...user.recentInterests] : [...user.alwaysInterests];
      setSelected(initial);
      setOtherList(isRecent ? user.alwaysInterests : user.recentInterests);
    }
  }, [user, isRecent]);

  // 트렌드 & 추천 로딩
  useEffect(() => {
    mockInterestTrends.getTrending().then(setTrending);
    mockInterestTrends.getRecommendedForMe().then(setRecommended);
  }, []);

  // 변경 감지
  useEffect(() => {
    if (!user) return;
    const orig = isRecent ? user.recentInterests : user.alwaysInterests;
    const changed = selected.length !== orig.length ||
      selected.some((id, i) => orig[i] !== id);
    setHasChanges(changed);
  }, [selected, user, isRecent]);

  // 토글 관심사
  const toggleInterest = useCallback((id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      }
      if (prev.length >= MAX_INTERESTS) {
        showToast(`최대 ${MAX_INTERESTS}개까지 선택할 수 있어요`, 'error', '⚠️');
        return prev;
      }
      return [...prev, id];
    });
  }, [showToast]);

  // 저장
  const handleSave = useCallback(async () => {
    setSaving(true);
    const update = isRecent
      ? { recentInterests: selected }
      : { alwaysInterests: selected };
    await mockProfile.updateProfile(update);
    await refreshUser();
    setSaving(false);
    showToast('관심사가 저장되었어요!', 'success', '✅');
    navigation.goBack();
  }, [selected, isRecent, refreshUser, showToast, navigation]);

  // 트렌딩 맵
  const trendingMap = useMemo(() => {
    const map: Record<string, TrendingInterest> = {};
    trending.forEach(t => { map[t.interestId] = t; });
    return map;
  }, [trending]);

  // 검색 결과
  const filteredInterests = useMemo(() => {
    let list: Interest[] = [];

    if (activeCategory === 'all') {
      list = INTERESTS;
    } else if (activeCategory === 'trending') {
      list = trending
        .map(t => getInterestById(t.interestId))
        .filter((i): i is Interest => !!i);
    } else if (activeCategory === 'recommended') {
      list = recommended
        .map(r => getInterestById(r.interestId))
        .filter((i): i is Interest => !!i);
    } else {
      list = getInterestsByCategory(activeCategory);
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(i =>
        i.label.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q),
      );
    }

    return list;
  }, [activeCategory, debouncedSearch, trending, recommended]);

  // 추천 맵
  const recommendMap = useMemo(() => {
    const map: Record<string, InterestRecommendation> = {};
    recommended.forEach(r => { map[r.interestId] = r; });
    return map;
  }, [recommended]);

  // 카테고리 탭
  const tabs: { key: typeof activeCategory; label: string; emoji: string }[] = [
    { key: 'all', label: '전체', emoji: '📋' },
    { key: 'trending', label: '트렌딩', emoji: '🔥' },
    { key: 'recommended', label: '추천', emoji: '✨' },
    ...INTEREST_CATEGORIES.map(cat => ({
      key: cat as typeof activeCategory,
      label: cat,
      emoji: cat === '취미' ? '🎯' : cat === '음악' ? '🎵' : cat === '스포츠' ? '⚽'
        : cat === '음식' ? '🍽️' : cat === '여행' ? '✈️' : cat === '기술' ? '💻'
        : cat === '문화' ? '🎬' : '🌿',
    })),
  ];

  const trendBadge = (trend: TrendingInterest['trend']) => {
    if (trend === 'hot') return { text: 'HOT', color: '#FF4444' };
    if (trend === 'rising') return { text: '↑', color: '#FF9500' };
    return { text: '•', color: '#4CAF50' };
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.gray50 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader
        title={isRecent ? '🔥 요즘 관심사' : '❤️ 항상 관심사'}
        onBack={() => navigation.goBack()}
        rightElement={
          <Pressable
            onPress={handleSave}
            disabled={saving || !hasChanges}
            accessibilityRole="button"
            accessibilityLabel="저장"
          >
            <Text style={[
              styles.headerSave,
              { color: hasChanges ? colors.primary : colors.gray400 },
            ]}>
              {saving ? '저장 중...' : '저장'}
            </Text>
          </Pressable>
        }
      />

      <Animated.View style={[{ flex: 1 }, fadeIn]}>
        {/* 선택된 관심사 요약 */}
        <View style={[styles.selectedSection, { backgroundColor: colors.white, borderBottomColor: colors.gray200 }]}>
          <View style={styles.selectedHeader}>
            <Text style={[styles.selectedTitle, { color: colors.gray800 }]}>
              선택한 관심사
            </Text>
            <Text style={[styles.selectedCount, { color: selected.length >= MAX_INTERESTS ? colors.error : colors.primary }]}>
              {selected.length}/{MAX_INTERESTS}
            </Text>
          </View>
          {selected.length === 0 ? (
            <Text style={[styles.selectedEmpty, { color: colors.gray400 }]}>
              아래에서 관심사를 선택해주세요
            </Text>
          ) : (
            <View style={styles.selectedTags}>
              {selected.map(id => (
                <InterestTag
                  key={id}
                  interestId={id}
                  onRemove={() => toggleInterest(id)}
                />
              ))}
            </View>
          )}
        </View>

        {/* 검색 */}
        <View style={[styles.searchSection, { backgroundColor: colors.white }]}>
          <View style={[styles.searchBox, { backgroundColor: colors.gray100, borderColor: colors.gray200 }]}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={[styles.searchInput, { color: colors.gray900 }]}
              placeholder="관심사 검색..."
              placeholderTextColor={colors.gray400}
              value={search}
              onChangeText={setSearch}
              accessibilityLabel="관심사 검색"
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} accessibilityRole="button" accessibilityLabel="검색어 지우기">
                <Text style={[styles.searchClear, { color: colors.gray400 }]}>✕</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* 카테고리 탭 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.tabBar, { backgroundColor: colors.white, borderBottomColor: colors.gray200 }]}
          contentContainerStyle={styles.tabBarContent}
        >
          {tabs.map(tab => {
            const isActive = activeCategory === tab.key;
            return (
              <Pressable
                key={tab.key}
                style={[
                  styles.tab,
                  isActive && [styles.tabActive, { borderBottomColor: colors.primary }],
                ]}
                onPress={() => setActiveCategory(tab.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={tab.label}
              >
                <Text style={styles.tabEmoji}>{tab.emoji}</Text>
                <Text style={[
                  styles.tabText,
                  { color: isActive ? colors.primary : colors.gray500 },
                  isActive && styles.tabTextActive,
                ]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* 관심사 목록 */}
        <ScrollView
          style={styles.listSection}
          contentContainerStyle={styles.listContent}
        >
          {/* 추천 섹션 (추천 탭일 때) */}
          {activeCategory === 'recommended' && recommended.length > 0 && (
            <View style={styles.recommendBanner}>
              <Text style={[styles.recommendBannerText, { color: colors.gray600 }]}>
                💡 연결된 친구들의 관심사를 기반으로 추천해요
              </Text>
            </View>
          )}

          {/* 트렌딩 섹션 (트렌딩 탭일 때) */}
          {activeCategory === 'trending' && trending.length > 0 && (
            <View style={styles.recommendBanner}>
              <Text style={[styles.recommendBannerText, { color: colors.gray600 }]}>
                📈 Common Ground에서 인기 있는 관심사예요
              </Text>
            </View>
          )}

          {filteredInterests.length === 0 ? (
            <View style={styles.emptyResult}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={[styles.emptyText, { color: colors.gray500 }]}>
                {debouncedSearch ? `"${debouncedSearch}" 검색 결과가 없어요` : '관심사가 없어요'}
              </Text>
            </View>
          ) : (
            <View style={styles.interestGrid}>
              {filteredInterests.map(interest => {
                const isSelected = selected.includes(interest.id);
                const isInOther = otherList.includes(interest.id);
                const trendInfo = trendingMap[interest.id];
                const recommendInfo = recommendMap[interest.id];
                const isFull = selected.length >= MAX_INTERESTS && !isSelected;

                return (
                  <AnimatedPressable
                    key={interest.id}
                    style={[
                      styles.interestChip,
                      { backgroundColor: colors.gray100, borderColor: 'transparent' },
                      isSelected && [styles.interestChipSelected, { backgroundColor: colors.primaryBg, borderColor: colors.primary }],
                      isInOther && styles.interestChipDisabled,
                      isFull && !isInOther && styles.interestChipFull,
                    ]}
                    onPress={() => !isInOther && toggleInterest(interest.id)}
                    disabled={isInOther}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected, disabled: isInOther }}
                    accessibilityLabel={`${interest.label}${isInOther ? ' (다른 목록에 있음)' : ''}`}
                  >
                    <View style={styles.chipContent}>
                      <Text style={[
                        styles.chipLabel,
                        { color: colors.gray700 },
                        isSelected && { color: colors.primary, fontWeight: '700' },
                        isInOther && { color: colors.gray400 },
                      ]}>
                        {interest.emoji} {interest.label}
                      </Text>

                      {/* 트렌딩 배지 */}
                      {trendInfo && !isInOther && (
                        <View style={[styles.trendBadge, { backgroundColor: trendBadge(trendInfo.trend).color + '20' }]}>
                          <Text style={[styles.trendBadgeText, { color: trendBadge(trendInfo.trend).color }]}>
                            {trendBadge(trendInfo.trend).text}
                          </Text>
                        </View>
                      )}

                      {/* 선택됨 체크 */}
                      {isSelected && (
                        <Text style={styles.chipCheck}>✓</Text>
                      )}
                    </View>

                    {/* 추천 이유 */}
                    {recommendInfo && !isSelected && !isInOther && (
                      <Text style={[styles.chipRecommendReason, { color: colors.gray500 }]} numberOfLines={1}>
                        {recommendInfo.reason}
                      </Text>
                    )}

                    {/* 다른 목록 안내 */}
                    {isInOther && (
                      <Text style={[styles.chipOtherNote, { color: colors.gray400 }]}>
                        {isRecent ? '항상 관심사에 있음' : '요즘 관심사에 있음'}
                      </Text>
                    )}
                  </AnimatedPressable>
                );
              })}
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSave: { fontSize: FONT_SIZE.md, fontWeight: '700' },

  // Selected section
  selectedSection: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedTitle: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  selectedCount: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  selectedEmpty: { fontSize: FONT_SIZE.sm, paddingVertical: 8 },
  selectedTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  // Search
  searchSection: { padding: SPACING.md, paddingBottom: 0 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: FONT_SIZE.md },
  searchClear: { fontSize: 16, padding: 4 },

  // Tab bar
  tabBar: {
    maxHeight: 48,
    borderBottomWidth: 1,
  },
  tabBarContent: {
    paddingHorizontal: SPACING.md,
    gap: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {},
  tabEmoji: { fontSize: 14 },
  tabText: { fontSize: FONT_SIZE.sm },
  tabTextActive: { fontWeight: '700' },

  // List
  listSection: { flex: 1 },
  listContent: { padding: SPACING.md },

  recommendBanner: {
    padding: 12,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: 12,
  },
  recommendBannerText: { fontSize: FONT_SIZE.sm },

  emptyResult: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontSize: FONT_SIZE.md },

  // Interest grid
  interestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  interestChip: {
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    minWidth: 90,
  },
  interestChipSelected: {},
  interestChipDisabled: { opacity: 0.45 },
  interestChipFull: { opacity: 0.5 },

  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipLabel: { fontSize: FONT_SIZE.sm },
  chipCheck: { fontSize: 12, color: COLORS.primary, fontWeight: '800', marginLeft: 2 },

  trendBadge: {
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  trendBadgeText: { fontSize: 10, fontWeight: '800' },

  chipRecommendReason: { fontSize: FONT_SIZE.xs, marginTop: 3 },
  chipOtherNote: { fontSize: FONT_SIZE.xs, marginTop: 2, fontStyle: 'italic' },
});
