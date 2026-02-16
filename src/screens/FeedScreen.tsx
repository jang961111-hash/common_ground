// ==========================================
// FeedScreen — 소셜 피드 & 활동 타임라인
// ==========================================
import React, { useState, useCallback, useEffect } from 'react';
import {
  View, FlatList, RefreshControl, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import ScreenHeader from '../components/ScreenHeader';
import FeedCard from '../components/FeedCard';
import EmptyState from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { mockFeed } from '../services/mockService';
import { SPACING } from '../constants/theme';
import { FeedItem, FeedScreenProps } from '../types';

export default function FeedScreen({ navigation }: FeedScreenProps) {
  const { colors } = useTheme();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── 데이터 로드 ──
  const loadFeed = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await mockFeed.getFeed();
      setItems(data);
    } catch {
      // 에러 시 빈 상태
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // ── 유저 프로필 이동 ──
  const handlePressUser = useCallback((userId: string) => {
    navigation.navigate('UserDetail', { userId });
  }, [navigation]);

  // ── 스냅샷 상세 (→ 갤러리) ──
  const handlePressSnapshot = useCallback((snapshotId: string) => {
    // 스냅샷 갤러리로 이동
    navigation.navigate('SnapshotGallery', {});
  }, [navigation]);

  // ── 스켈레톤 로딩 ──
  const renderSkeleton = () => (
    <View style={styles.skeletonWrap}>
      {[1, 2, 3, 4].map(i => (
        <View key={i} style={[styles.skeletonCard, { backgroundColor: colors.gray100 }]}>
          <View style={styles.skeletonRow}>
            <Skeleton width={40} height={40} borderRadius={20} />
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Skeleton width={120} height={14} borderRadius={4} />
              <Skeleton width={80} height={10} borderRadius={4} style={{ marginTop: 6 }} />
            </View>
          </View>
          <Skeleton
            width="100%"
            height={60}
            borderRadius={8}
            style={{ marginTop: SPACING.md }}
          />
        </View>
      ))}
    </View>
  );

  // ── 카드 렌더 ──
  const renderItem = useCallback(({ item }: { item: FeedItem }) => (
    <FeedCard
      item={item}
      onPressUser={handlePressUser}
      onPressSnapshot={handlePressSnapshot}
    />
  ), [handlePressUser, handlePressSnapshot]);

  const keyExtractor = useCallback((item: FeedItem) => item.id, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      <ScreenHeader title="피드" onBack={() => navigation.goBack()} />

      {loading ? (
        renderSkeleton()
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadFeed(true)}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              emoji="📡"
              title="아직 피드가 없어요"
              subtitle="사람들과 연결하면 활동이 여기에 표시됩니다"
              actionLabel="사람 찾아보기"
              onAction={() => navigation.navigate('Main', { screen: 'Discover' })}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: 40,
  },
  skeletonWrap: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    gap: SPACING.md,
  },
  skeletonCard: {
    borderRadius: 16,
    padding: SPACING.lg,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
