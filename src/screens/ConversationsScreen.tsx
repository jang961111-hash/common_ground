// ==========================================
// ConversationsScreen — 대화 목록
// ==========================================
import React, { useCallback, useState, useEffect } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { mockChat, mockSafety } from '../services/mockService';
import Avatar from '../components/Avatar';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { Conversation, ConversationsScreenProps } from '../types';

type ConvItem = Conversation & {
  otherUser: { id: string; displayName: string; avatarUrl: string | null; isOnline: boolean };
};

export default function ConversationsScreen({ navigation }: ConversationsScreenProps) {
  const { colors } = useTheme();
  const [conversations, setConversations] = useState<ConvItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [data, blockedIds] = await Promise.all([
        mockChat.getConversations(),
        mockSafety.getBlockedUserIds(),
      ]);
      setConversations(
        blockedIds.length > 0
          ? data.filter(c => !blockedIds.includes(c.otherUser.id))
          : data,
      );
    } catch { /* empty */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // 5초 간격 폴링 (실시간 시뮬레이션)
  useEffect(() => {
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return '방금';
    if (diffMin < 60) return `${diffMin}분 전`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}시간 전`;
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const renderItem = useCallback(({ item }: { item: ConvItem }) => (
    <Pressable
      style={[styles.item, { backgroundColor: colors.white }]}
      onPress={() => navigation.navigate('Chat', { userId: item.otherUser.id, conversationId: item.id })}
      accessibilityRole="button"
      accessibilityLabel={`${item.otherUser.displayName}과의 대화${item.unreadCount > 0 ? `, 안 읽은 메시지 ${item.unreadCount}개` : ''}`}
    >
      <Avatar name={item.otherUser.displayName} size={52} showOnline isOnline={item.otherUser.isOnline} />
      <View style={styles.itemContent}>
        <View style={styles.itemTop}>
          <Text style={[styles.itemName, { color: colors.gray900 }]} numberOfLines={1}>
            {item.otherUser.displayName}
          </Text>
          {item.lastMessage && (
            <Text style={[styles.itemTime, { color: colors.gray400 }]}>
              {formatTime(item.lastMessage.createdAt)}
            </Text>
          )}
        </View>
        <View style={styles.itemBottom}>
          <Text
            style={[
              styles.itemPreview,
              { color: item.unreadCount > 0 ? colors.gray800 : colors.gray500 },
              item.unreadCount > 0 && styles.itemPreviewBold,
            ]}
            numberOfLines={1}
          >
            {item.lastMessage?.text ?? ''}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  ), [colors, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.gray50 }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.gray200 }]}>
        <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="뒤로 가기" hitSlop={12}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← 뒤로</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.gray900 }]}>채팅</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.gray400 }]}>불러오는 중...</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={[styles.emptyTitle, { color: colors.gray700 }]}>아직 대화가 없어요</Text>
          <Text style={[styles.emptyDesc, { color: colors.gray400 }]}>
            연결된 사용자와 대화를 시작해보세요!
          </Text>
          <Pressable
            style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('Connections')}
            accessibilityRole="button"
          >
            <Text style={styles.emptyBtnText}>연결 목록 보기</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 14,
    paddingHorizontal: SPACING.xl,
    borderBottomWidth: 1,
  },
  backBtn: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  headerTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700' },
  list: { paddingVertical: 4 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingHorizontal: SPACING.xl,
    gap: 12,
  },
  itemContent: { flex: 1, gap: 4 },
  itemTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemName: { fontSize: FONT_SIZE.md, fontWeight: '600', flex: 1, marginRight: 8 },
  itemTime: { fontSize: FONT_SIZE.xs },
  itemBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemPreview: { fontSize: FONT_SIZE.sm, flex: 1, marginRight: 8 },
  itemPreviewBold: { fontWeight: '600' },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', marginBottom: 6 },
  emptyDesc: { fontSize: FONT_SIZE.sm, textAlign: 'center', lineHeight: 20 },
  emptyText: { fontSize: FONT_SIZE.sm },
  emptyBtn: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: BORDER_RADIUS.md,
  },
  emptyBtnText: { color: '#fff', fontSize: FONT_SIZE.sm, fontWeight: '600' },
});
