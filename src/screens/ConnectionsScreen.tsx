// ==========================================
// ConnectionsScreen — 연결(친구) 관리
// ==========================================
import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet, RefreshControl,
} from 'react-native';
import { mockConnections } from '../services/mockService';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { useCache } from '../hooks/useCache';
import ScreenHeader from '../components/ScreenHeader';
import Avatar from '../components/Avatar';
import AnimatedPressable from '../components/AnimatedPressable';
import ConfirmDialog from '../components/ConfirmDialog';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { ConnectedUser, ConnectionRequest, ConnectionsScreenProps } from '../types';
import EmptyState from '../components/EmptyState';

type TabType = 'connected' | 'received' | 'sent';

export default function ConnectionsScreen({ navigation }: ConnectionsScreenProps) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { refreshUnreadCount } = useAuth();
  const [tab, setTab] = useState<TabType>('connected');
  const [refreshing, setRefreshing] = useState(false);
  const [disconnectTarget, setDisconnectTarget] = useState<ConnectedUser | null>(null);

  // 데이터 로딩
  const fetchConnections = useCallback(() => mockConnections.getConnections(), []);
  const fetchPending = useCallback(() => mockConnections.getPendingRequests(), []);
  const fetchSent = useCallback(() => mockConnections.getSentRequests(), []);

  const connCache = useCache<ConnectedUser[]>('connections', fetchConnections, { ttl: 2 * 60 * 1000 });
  const pendingCache = useCache<ConnectionRequest[]>('connections_pending', fetchPending, { ttl: 2 * 60 * 1000 });
  const sentCache = useCache<ConnectionRequest[]>('connections_sent', fetchSent, { ttl: 2 * 60 * 1000 });

  const connected = connCache.data ?? [];
  const pending = pendingCache.data ?? [];
  const sent = sentCache.data ?? [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([connCache.refresh(), pendingCache.refresh(), sentCache.refresh()]);
    setRefreshing(false);
  }, [connCache, pendingCache, sentCache]);

  const handleAccept = useCallback(async (req: ConnectionRequest) => {
    await mockConnections.acceptRequest(req.id);
    showToast(`${req.fromUserName}님과 연결되었어요!`, 'success', '🤝');
    await Promise.all([connCache.refresh(), pendingCache.refresh()]);
    await refreshUnreadCount();
  }, [connCache, pendingCache, showToast, refreshUnreadCount]);

  const handleReject = useCallback(async (req: ConnectionRequest) => {
    await mockConnections.rejectRequest(req.id);
    showToast('요청을 거절했어요', 'info', '✋');
    await pendingCache.refresh();
  }, [pendingCache, showToast]);

  const handleDisconnect = useCallback(async () => {
    if (!disconnectTarget) return;
    await mockConnections.disconnect(disconnectTarget.userId);
    showToast('연결이 해제되었어요', 'info', '👋');
    setDisconnectTarget(null);
    await connCache.refresh();
  }, [disconnectTarget, connCache, showToast]);

  const handleNavigateToUser = useCallback((userId: string) => {
    navigation.navigate('UserDetail', { userId });
  }, [navigation]);

  const formatDate = useCallback((date: string) => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }, []);

  // 연결된 사용자 카드
  const renderConnectedItem = useCallback(({ item }: { item: ConnectedUser }) => (
    <AnimatedPressable
      style={[styles.card, { backgroundColor: colors.white, borderColor: colors.gray200 }]}
      onPress={() => handleNavigateToUser(item.userId)}
      accessibilityRole="button"
      accessibilityLabel={`${item.displayName} 프로필 보기`}
    >
      <Avatar name={item.displayName} size={48} showOnline isOnline={item.isOnline} />
      <View style={styles.cardInfo}>
        <Text style={[styles.cardName, { color: colors.gray900 }]}>{item.displayName}</Text>
        {item.bio && <Text style={[styles.cardBio, { color: colors.gray500 }]} numberOfLines={1}>{item.bio}</Text>}
        <View style={styles.cardMeta}>
          {item.commonInterestCount > 0 && (
            <Text style={[styles.commonBadge, { color: colors.primary, backgroundColor: colors.primaryBg }]}>
              공통 {item.commonInterestCount}
            </Text>
          )}
          <Text style={[styles.dateText, { color: colors.gray400 }]}>
            {formatDate(item.connectedAt)} 연결
          </Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <Pressable
          style={[styles.chatBtn, { backgroundColor: colors.primaryBg }]}
          onPress={() => navigation.navigate('Chat', { userId: item.userId })}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel={`${item.displayName}에게 채팅`}
        >
          <Text style={[styles.chatBtnText, { color: colors.primary }]}>💬</Text>
        </Pressable>
        <Pressable
          style={[styles.moreBtn, { backgroundColor: colors.gray100 }]}
          onPress={() => setDisconnectTarget(item)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${item.displayName} 연결 관리`}
        >
          <Text style={[styles.moreIcon, { color: colors.gray500 }]}>⋯</Text>
        </Pressable>
      </View>
    </AnimatedPressable>
  ), [colors, handleNavigateToUser, formatDate]);

  // 받은 요청 카드
  const renderPendingItem = useCallback(({ item }: { item: ConnectionRequest }) => (
    <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.gray200 }]}>
      <Pressable onPress={() => handleNavigateToUser(item.fromUserId)} accessibilityRole="button" accessibilityLabel={`${item.fromUserName} 프로필`}>
        <Avatar name={item.fromUserName} size={48} />
      </Pressable>
      <View style={styles.cardInfo}>
        <Text style={[styles.cardName, { color: colors.gray900 }]}>{item.fromUserName}</Text>
        {item.message && (
          <Text style={[styles.cardBio, { color: colors.gray600 }]} numberOfLines={2}>
            "{item.message}"
          </Text>
        )}
        <Text style={[styles.dateText, { color: colors.gray400 }]}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
      <View style={styles.actionBtns}>
        <Pressable
          style={[styles.acceptBtn, { backgroundColor: colors.primary }]}
          onPress={() => handleAccept(item)}
          accessibilityRole="button"
          accessibilityLabel={`${item.fromUserName} 연결 수락`}
        >
          <Text style={styles.acceptText}>수락</Text>
        </Pressable>
        <Pressable
          style={[styles.rejectBtn, { borderColor: colors.gray300 }]}
          onPress={() => handleReject(item)}
          accessibilityRole="button"
          accessibilityLabel={`${item.fromUserName} 연결 거절`}
        >
          <Text style={[styles.rejectText, { color: colors.gray500 }]}>거절</Text>
        </Pressable>
      </View>
    </View>
  ), [colors, handleNavigateToUser, handleAccept, handleReject, formatDate]);

  // 보낸 요청 카드
  const renderSentItem = useCallback(({ item }: { item: ConnectionRequest }) => (
    <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.gray200 }]}>
      <Pressable onPress={() => handleNavigateToUser(item.toUserId)} accessibilityRole="button" accessibilityLabel={`${item.toUserName} 프로필`}>
        <Avatar name={item.toUserName} size={48} />
      </Pressable>
      <View style={styles.cardInfo}>
        <Text style={[styles.cardName, { color: colors.gray900 }]}>{item.toUserName}</Text>
        {item.message && (
          <Text style={[styles.cardBio, { color: colors.gray600 }]} numberOfLines={1}>
            "{item.message}"
          </Text>
        )}
        <Text style={[styles.dateText, { color: colors.gray400 }]}>
          {formatDate(item.createdAt)} · 대기 중
        </Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: colors.gray100 }]}>
        <Text style={[styles.statusText, { color: colors.gray500 }]}>대기 중</Text>
      </View>
    </View>
  ), [colors, handleNavigateToUser, formatDate]);

  const getListData = () => {
    if (tab === 'connected') return connected;
    if (tab === 'received') return pending;
    return sent;
  };

  const getRenderItem = () => {
    if (tab === 'connected') return renderConnectedItem as any;
    if (tab === 'received') return renderPendingItem as any;
    return renderSentItem as any;
  };

  const getEmptyState = () => {
    if (tab === 'connected') return { emoji: '🤝', title: '아직 연결된 사람이 없어요', subtitle: '발견 탭에서 관심사가 통하는 사람을 찾아보세요' };
    if (tab === 'received') return { emoji: '📬', title: '받은 요청이 없어요', subtitle: '새로운 연결 요청이 오면 여기에 표시돼요' };
    return { emoji: '📤', title: '보낸 요청이 없어요', subtitle: '프로필을 방문해서 연결을 요청해보세요' };
  };

  const keyExtractor = useCallback((item: any) => item.id ?? item.userId, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.gray50 }]}>
      <ScreenHeader
        title="연결"
        onBack={() => navigation.goBack()}
        rightElement={
          <Text style={[styles.countLabel, { color: colors.gray500 }]}>
            {connected.length}명 연결
          </Text>
        }
      />

      {/* 탭 */}
      <View style={[styles.tabs, { backgroundColor: colors.white, borderBottomColor: colors.gray200 }]}>
        <Pressable
          style={[styles.tab, tab === 'connected' && styles.tabActive]}
          onPress={() => setTab('connected')}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'connected' }}
        >
          <Text style={[styles.tabText, { color: colors.gray500 }, tab === 'connected' && { color: colors.primary }]}>
            연결됨 {connected.length > 0 ? connected.length : ''}
          </Text>
          {tab === 'connected' && <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />}
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'received' && styles.tabActive]}
          onPress={() => setTab('received')}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'received' }}
        >
          <Text style={[styles.tabText, { color: colors.gray500 }, tab === 'received' && { color: colors.primary }]}>
            받은 요청 {pending.length > 0 ? pending.length : ''}
          </Text>
          {pending.length > 0 && tab !== 'received' && (
            <View style={[styles.tabBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.tabBadgeText}>{pending.length}</Text>
            </View>
          )}
          {tab === 'received' && <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />}
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'sent' && styles.tabActive]}
          onPress={() => setTab('sent')}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'sent' }}
        >
          <Text style={[styles.tabText, { color: colors.gray500 }, tab === 'sent' && { color: colors.primary }]}>
            보낸 요청 {sent.length > 0 ? sent.length : ''}
          </Text>
          {tab === 'sent' && <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />}
        </Pressable>
      </View>

      {/* 리스트 */}
      <FlatList
        data={getListData()}
        keyExtractor={keyExtractor}
        renderItem={getRenderItem()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          (() => {
            const empty = getEmptyState();
            return <EmptyState emoji={empty.emoji} title={empty.title} subtitle={empty.subtitle} />;
          })()
        }
        ListFooterComponent={<View style={{ height: 20 }} />}
        showsVerticalScrollIndicator={false}
      />

      {/* 연결 해제 다이얼로그 */}
      <ConfirmDialog
        visible={!!disconnectTarget}
        icon="👋"
        title="연결 해제"
        message={`${disconnectTarget?.displayName ?? ''}님과의 연결을 해제할까요?`}
        confirmLabel="해제"
        destructive
        onConfirm={handleDisconnect}
        onCancel={() => setDisconnectTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  countLabel: { fontSize: FONT_SIZE.sm, fontWeight: '600' },

  // Tabs
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    position: 'relative',
  },
  tabActive: {},
  tabText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 3,
    borderRadius: 2,
  },
  tabBadge: {
    position: 'absolute',
    top: 8,
    right: '20%',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },

  // List
  listContent: { padding: SPACING.xl, gap: 10 },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  cardInfo: { flex: 1, gap: 3 },
  cardName: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  cardBio: { fontSize: FONT_SIZE.xs },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  commonBadge: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  dateText: { fontSize: FONT_SIZE.xs },
  moreBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreIcon: { fontSize: 18 },

  // Action buttons
  actionBtns: { gap: 6 },
  acceptBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  acceptText: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: '#fff' },
  rejectBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  rejectText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },

  // Card actions (chat + more)
  cardActions: { flexDirection: 'column', gap: 6, alignItems: 'center' },
  chatBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBtnText: { fontSize: 16 },

  // Status badge
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
  },
  statusText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
});
