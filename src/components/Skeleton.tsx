import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING } from '../constants/theme';

// ==========================================
// Skeleton 로딩 UI
// ==========================================

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

// 단일 Skeleton 블록 (펄스 애니메이션)
export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius, backgroundColor: COLORS.gray200, opacity },
        style,
      ]}
    />
  );
}

// ── 프리셋: 프로필 카드 스켈레톤 ──
export function SkeletonProfileCard() {
  return (
    <View style={presets.profileCard}>
      {/* 아바타 */}
      <Skeleton width={56} height={56} borderRadius={28} />
      <View style={presets.profileInfo}>
        <Skeleton width={100} height={18} />
        <Skeleton width={180} height={14} style={{ marginTop: 6 }} />
        <View style={presets.tagRow}>
          <Skeleton width={60} height={24} borderRadius={12} />
          <Skeleton width={50} height={24} borderRadius={12} />
          <Skeleton width={70} height={24} borderRadius={12} />
        </View>
      </View>
    </View>
  );
}

// ── 프리셋: 유저 디테일 스켈레톤 ──
export function SkeletonUserDetail() {
  return (
    <View style={presets.detail}>
      {/* 뒤로가기 */}
      <Skeleton width={60} height={20} style={{ marginBottom: 20 }} />
      {/* 아바타 + 이름 */}
      <View style={presets.detailHeader}>
        <Skeleton width={80} height={80} borderRadius={40} />
        <Skeleton width={120} height={22} style={{ marginTop: 12 }} />
        <Skeleton width={200} height={14} style={{ marginTop: 6 }} />
      </View>
      {/* 관심사 */}
      <View style={presets.detailSection}>
        <Skeleton width={100} height={18} />
        <View style={presets.tagRow}>
          <Skeleton width={70} height={28} borderRadius={14} />
          <Skeleton width={55} height={28} borderRadius={14} />
          <Skeleton width={80} height={28} borderRadius={14} />
          <Skeleton width={60} height={28} borderRadius={14} />
        </View>
      </View>
      {/* 스냅샷 */}
      <View style={presets.detailSection}>
        <Skeleton width={80} height={18} />
        <View style={presets.snapshotRow}>
          <Skeleton width={140} height={100} borderRadius={BORDER_RADIUS.md} />
          <Skeleton width={140} height={100} borderRadius={BORDER_RADIUS.md} />
        </View>
      </View>
    </View>
  );
}

// ── 프리셋: 리스트 아이템 스켈레톤 ──
export function SkeletonListItem() {
  return (
    <View style={presets.listItem}>
      <Skeleton width={44} height={44} borderRadius={22} />
      <View style={presets.listContent}>
        <Skeleton width={140} height={16} />
        <Skeleton width={220} height={13} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

// ── 프리셋: 홈 대시보드 스켈레톤 ──
export function SkeletonHome() {
  return (
    <View style={presets.home}>
      {/* 인사 */}
      <Skeleton width={160} height={24} />
      <Skeleton width={220} height={16} style={{ marginTop: 6 }} />
      {/* 프로필 완성도 */}
      <Skeleton width="100%" height={60} borderRadius={BORDER_RADIUS.md} style={{ marginTop: 20 }} />
      {/* 추천 유저 */}
      <Skeleton width={120} height={18} style={{ marginTop: 24 }} />
      <View style={presets.tagRow}>
        <SkeletonProfileCard />
      </View>
      <Skeleton width={120} height={18} style={{ marginTop: 24 }} />
      <View style={presets.snapshotRow}>
        <Skeleton width={140} height={100} borderRadius={BORDER_RADIUS.md} />
        <Skeleton width={140} height={100} borderRadius={BORDER_RADIUS.md} />
      </View>
    </View>
  );
}

// ── 프리셋: Discover 카드 리스트 스켈레톤 ──
export function SkeletonDiscoverList() {
  return (
    <View style={presets.discoverList}>
      <SkeletonProfileCard />
      <SkeletonProfileCard />
      <SkeletonProfileCard />
    </View>
  );
}

// ── 프리셋: 알림 리스트 스켈레톤 ──
export function SkeletonNotifications() {
  return (
    <View style={presets.notifList}>
      <SkeletonListItem />
      <SkeletonListItem />
      <SkeletonListItem />
      <SkeletonListItem />
    </View>
  );
}

const presets = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: 12,
    gap: 14,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  detail: {
    padding: SPACING.xl,
    paddingTop: 60,
  },
  detailHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  detailSection: {
    marginBottom: 20,
    gap: 10,
  },
  snapshotRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  listContent: {
    flex: 1,
  },
  home: {
    padding: SPACING.xl,
    paddingTop: 60,
  },
  discoverList: {
    padding: SPACING.xl,
    gap: 4,
  },
  notifList: {
    gap: 0,
  },
});
