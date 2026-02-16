// ==========================================
// GroupsScreen — 관심사 기반 그룹 탭 화면
// ==========================================
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { GroupsScreenProps, GroupPreview } from '../types';
import { mockGroups } from '../services/mockService';
import { GroupCard } from '../components/GroupCard';
import EmptyState from '../components/EmptyState';
import { useTheme } from '../contexts/ThemeContext';
import { useApiCall } from '../hooks/useApiCall';
import { useDebounce } from '../hooks/useDebounce';
import { BORDER_RADIUS, FONT_SIZE, SHADOWS, SPACING } from '../constants/theme';

type TabKey = 'my' | 'discover';

export default function GroupsScreen({ navigation }: GroupsScreenProps) {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>('my');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);

  const {
    data: myGroups,
    loading: myLoading,
    refresh: refreshMy,
  } = useApiCall<GroupPreview[]>(() => mockGroups.getMyGroups());

  const {
    data: recommended,
    loading: recLoading,
    refresh: refreshRec,
  } = useApiCall<GroupPreview[]>(() => mockGroups.getRecommendedGroups());

  const {
    data: searchResults,
    loading: searchLoading,
  } = useApiCall<GroupPreview[]>(
    useCallback(() => (debouncedQuery.length >= 2 ? mockGroups.searchGroups(debouncedQuery) : Promise.resolve([])), [debouncedQuery]),
  );

  const loading = activeTab === 'my' ? myLoading : recLoading;

  const onRefresh = useCallback(async () => {
    await Promise.all([refreshMy(), refreshRec()]);
  }, [refreshMy, refreshRec]);

  const displayedGroups = useMemo(() => {
    if (debouncedQuery.length >= 2) return searchResults ?? [];
    return activeTab === 'my' ? (myGroups ?? []) : (recommended ?? []);
  }, [activeTab, myGroups, recommended, searchResults, debouncedQuery]);

  const navigateToGroup = useCallback(
    (groupId: string) => navigation.navigate('GroupDetail', { groupId }),
    [navigation],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: colors.white }]}>
        <Text style={[styles.title, { color: colors.gray900 }]}>👥 그룹</Text>
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('CreateGroup')}
          activeOpacity={0.8}
        >
          <Text style={styles.createBtnText}>+ 만들기</Text>
        </TouchableOpacity>
      </View>

      {/* 검색 */}
      <View style={styles.searchWrap}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.gray100, color: colors.gray900 }]}
          placeholder="그룹 검색..."
          placeholderTextColor={colors.gray400}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* 탭 */}
      {!debouncedQuery && (
        <View style={styles.tabs}>
          {([
            { key: 'my' as TabKey, label: '내 그룹', count: myGroups?.length ?? 0 },
            { key: 'discover' as TabKey, label: '추천', count: recommended?.length ?? 0 },
          ]).map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                {
                  borderBottomColor: activeTab === tab.key ? colors.primary : 'transparent',
                },
              ]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === tab.key ? colors.primary : colors.gray400 },
                ]}
              >
                {tab.label} ({tab.count})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 그룹 리스트 */}
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
      >
        {(loading || searchLoading) && displayedGroups.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : displayedGroups.length === 0 ? (
          <EmptyState
            emoji={debouncedQuery ? '🔍' : activeTab === 'my' ? '👥' : '🧭'}
            title={debouncedQuery ? '검색 결과 없음' : activeTab === 'my' ? '아직 가입한 그룹이 없어요' : '추천 그룹이 없어요'}
            subtitle={
              debouncedQuery
                ? '다른 키워드로 검색해 보세요'
                : activeTab === 'my'
                ? '관심사가 비슷한 사람들과 그룹을 만들어 보세요'
                : '관심사를 더 추가하면 추천이 늘어나요'
            }
          />
        ) : (
          displayedGroups.map(group => (
            <GroupCard
              key={group.id}
              group={group}
              onPress={() => navigateToGroup(group.id)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: 56,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
  },
  createBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  searchWrap: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  searchInput: {
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  list: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  loadingWrap: {
    paddingTop: 60,
    alignItems: 'center',
  },
});
