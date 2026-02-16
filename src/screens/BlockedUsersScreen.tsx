// ==========================================
// BlockedUsersScreen — 차단 목록 관리
// ==========================================
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet, RefreshControl,
} from 'react-native';
import { mockSafety } from '../services/mockService';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import Avatar from '../components/Avatar';
import ScreenHeader from '../components/ScreenHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { BlockedUser, BlockedUsersScreenProps } from '../types';

const keyExtractor = (item: BlockedUser) => item.userId;

const BlockedUserCard = React.memo(({ item, colors, onUnblock }: {
  item: BlockedUser;
  colors: any;
  onUnblock: (userId: string, name: string) => void;
}) => {
  const blockedDate = new Date(item.blockedAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={[styles.card, { backgroundColor: colors.white }]}>
      <Avatar name={item.displayName} size={44} />
      <View style={styles.cardInfo}>
        <Text style={[styles.cardName, { color: colors.gray900 }]}>{item.displayName}</Text>
        <Text style={[styles.cardDate, { color: colors.gray400 }]}>
          차단일: {blockedDate}
        </Text>
      </View>
      <Pressable
        style={[styles.unblockBtn, { borderColor: colors.primary }]}
        onPress={() => onUnblock(item.userId, item.displayName)}
        accessibilityRole="button"
        accessibilityLabel={`${item.displayName} 차단 해제`}
      >
        <Text style={[styles.unblockBtnText, { color: colors.primary }]}>해제</Text>
      </Pressable>
    </View>
  );
});

export default function BlockedUsersScreen({ navigation }: BlockedUsersScreenProps) {
  const { colors } = useTheme();
  const { showToast } = useToast();

  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unblockTarget, setUnblockTarget] = useState<{ userId: string; name: string } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await mockSafety.getBlockedUsers();
      setBlockedUsers(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleUnblockPress = useCallback((userId: string, name: string) => {
    setUnblockTarget({ userId, name });
  }, []);

  const confirmUnblock = useCallback(async () => {
    if (!unblockTarget) return;
    await mockSafety.unblockUser(unblockTarget.userId);
    setBlockedUsers(prev => prev.filter(u => u.userId !== unblockTarget.userId));
    showToast(`${unblockTarget.name}님의 차단을 해제했어요`, 'success', '✅');
    setUnblockTarget(null);
  }, [unblockTarget, showToast]);

  const renderItem = useCallback(({ item }: { item: BlockedUser }) => (
    <BlockedUserCard item={item} colors={colors} onUnblock={handleUnblockPress} />
  ), [colors, handleUnblockPress]);

  return (
    <View style={[styles.container, { backgroundColor: colors.gray50 }]}>
      <ScreenHeader title="차단 목록" onBack={() => navigation.goBack()} />

      {!loading && blockedUsers.length === 0 ? (
        <EmptyState
          emoji="🕊️"
          title="차단한 사용자가 없어요"
          subtitle="차단한 사용자가 여기에 표시됩니다"
        />
      ) : (
        <FlatList
          data={blockedUsers}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            blockedUsers.length > 0 ? (
              <Text style={[styles.countHint, { color: colors.gray500 }]}>
                {blockedUsers.length}명 차단됨
              </Text>
            ) : null
          }
        />
      )}

      <ConfirmDialog
        visible={!!unblockTarget}
        icon="🔓"
        title="차단 해제"
        message={`${unblockTarget?.name ?? ''}님의 차단을 해제하시겠어요?\n다시 발견 목록에 표시됩니다.`}
        confirmLabel="해제"
        onConfirm={confirmUnblock}
        onCancel={() => setUnblockTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: SPACING.xl, gap: 10 },
  countHint: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    marginBottom: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: BORDER_RADIUS.md,
    gap: 12,
    ...SHADOWS.sm,
  },
  cardInfo: { flex: 1, gap: 2 },
  cardName: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  cardDate: { fontSize: FONT_SIZE.xs },
  unblockBtn: {
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  unblockBtnText: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
});
