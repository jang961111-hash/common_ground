// ==========================================
// BookmarksScreen — 저장한 북마크 목록
// 필터: 전체 / 프로필 / 그룹 / 이벤트
// ==========================================
import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet, RefreshControl, TextInput,
  Alert,
} from 'react-native';
import { BookmarksScreenProps, BookmarkWithPreview, BookmarkType } from '../types';
import { mockBookmarks } from '../services/mockService';
import ScreenHeader from '../components/ScreenHeader';
import Avatar from '../components/Avatar';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { useApiCall } from '../hooks/useApiCall';
import EmptyState from '../components/EmptyState';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';

type FilterTab = 'ALL' | BookmarkType;
const FILTER_TABS: { value: FilterTab; label: string; emoji: string }[] = [
  { value: 'ALL', label: '전체', emoji: '📋' },
  { value: 'USER', label: '프로필', emoji: '👤' },
  { value: 'GROUP', label: '그룹', emoji: '👥' },
  { value: 'EVENT', label: '이벤트', emoji: '📅' },
];

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return `${Math.floor(days / 7)}주 전`;
}

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  return `${mm}/${dd} (${weekdays[d.getDay()]})`;
}

export default function BookmarksScreen({ navigation }: BookmarksScreenProps) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const fetchBookmarks = useCallback(
    () => mockBookmarks.getBookmarks(activeTab === 'ALL' ? undefined : activeTab),
    [activeTab],
  );
  const { data: bookmarks, loading, refresh } = useApiCall<BookmarkWithPreview[]>(fetchBookmarks, { immediate: true });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // 탭 변경 시 재조회
  React.useEffect(() => {
    refresh();
  }, [activeTab]);

  const handleRemove = useCallback(async (bookmarkId: string) => {
    Alert.alert('북마크 삭제', '이 북마크를 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제', style: 'destructive', onPress: async () => {
          await mockBookmarks.removeBookmark(bookmarkId);
          showToast('북마크가 삭제되었어요', 'success');
          refresh();
        },
      },
    ]);
  }, [showToast, refresh]);

  const handleSaveNote = useCallback(async (bookmarkId: string) => {
    await mockBookmarks.updateNote(bookmarkId, noteText.trim());
    setEditingNoteId(null);
    setNoteText('');
    showToast('메모가 저장되었어요 📝', 'success');
    refresh();
  }, [noteText, showToast, refresh]);

  const handleNavigate = useCallback((item: BookmarkWithPreview) => {
    if (item.targetType === 'USER') {
      navigation.navigate('UserDetail', { userId: item.targetId });
    } else if (item.targetType === 'GROUP') {
      navigation.navigate('GroupDetail', { groupId: item.targetId });
    } else if (item.targetType === 'EVENT') {
      navigation.navigate('EventDetail', { eventId: item.targetId });
    }
  }, [navigation]);

  const renderItem = useCallback(({ item }: { item: BookmarkWithPreview }) => {
    const isEditing = editingNoteId === item.id;

    return (
      <Pressable
        style={[styles.card, { backgroundColor: colors.white }, SHADOWS.sm]}
        onPress={() => handleNavigate(item)}
        accessibilityRole="button"
        accessibilityLabel={`북마크: ${getItemName(item)}`}
      >
        {/* 아이콘 & 타입 */}
        <View style={styles.cardTop}>
          {item.targetType === 'USER' && item.userPreview && (
            <View style={styles.previewRow}>
              <Avatar
                name={item.userPreview.displayName}
                size={44}
                emoji={item.userPreview.avatarEmoji}
                customColor={item.userPreview.avatarColor}
                showOnline
                isOnline={item.userPreview.isOnline}
              />
              <View style={styles.previewInfo}>
                <View style={styles.nameRow}>
                  <Text style={[styles.previewName, { color: colors.gray900 }]}>
                    {item.userPreview.displayName}
                  </Text>
                  <View style={[styles.typeBadge, { backgroundColor: COLORS.primaryBg }]}>
                    <Text style={[styles.typeBadgeText, { color: COLORS.primary }]}>👤 프로필</Text>
                  </View>
                </View>
                {item.userPreview.bio && (
                  <Text style={[styles.previewSub, { color: colors.gray500 }]} numberOfLines={1}>
                    {item.userPreview.bio}
                  </Text>
                )}
              </View>
            </View>
          )}

          {item.targetType === 'GROUP' && item.groupPreview && (
            <View style={styles.previewRow}>
              <View style={[styles.emojiCircle, { backgroundColor: item.groupPreview.color + '20' }]}>
                <Text style={styles.emojiCircleText}>{item.groupPreview.emoji}</Text>
              </View>
              <View style={styles.previewInfo}>
                <View style={styles.nameRow}>
                  <Text style={[styles.previewName, { color: colors.gray900 }]}>
                    {item.groupPreview.name}
                  </Text>
                  <View style={[styles.typeBadge, { backgroundColor: '#EDE9FE' }]}>
                    <Text style={[styles.typeBadgeText, { color: COLORS.accent }]}>👥 그룹</Text>
                  </View>
                </View>
                <Text style={[styles.previewSub, { color: colors.gray500 }]}>
                  멤버 {item.groupPreview.memberCount}명
                </Text>
              </View>
            </View>
          )}

          {item.targetType === 'EVENT' && item.eventPreview && (
            <View style={styles.previewRow}>
              <View style={[styles.emojiCircle, { backgroundColor: COLORS.warningLight + '60' }]}>
                <Text style={styles.emojiCircleText}>{item.eventPreview.emoji}</Text>
              </View>
              <View style={styles.previewInfo}>
                <View style={styles.nameRow}>
                  <Text style={[styles.previewName, { color: colors.gray900 }]}>
                    {item.eventPreview.title}
                  </Text>
                  <View style={[styles.typeBadge, { backgroundColor: COLORS.successBg }]}>
                    <Text style={[styles.typeBadgeText, { color: COLORS.success }]}>📅 이벤트</Text>
                  </View>
                </View>
                <Text style={[styles.previewSub, { color: colors.gray500 }]}>
                  {formatEventDate(item.eventPreview.date)} · {item.eventPreview.location}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* 메모 */}
        {isEditing ? (
          <View style={[styles.noteEdit, { borderColor: colors.gray200 }]}>
            <TextInput
              style={[styles.noteInput, { color: colors.gray900, backgroundColor: colors.gray50 }]}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="메모를 남겨보세요..."
              placeholderTextColor={colors.gray400}
              maxLength={100}
              autoFocus
            />
            <View style={styles.noteActions}>
              <Pressable onPress={() => { setEditingNoteId(null); setNoteText(''); }}>
                <Text style={[styles.noteActionText, { color: colors.gray400 }]}>취소</Text>
              </Pressable>
              <Pressable onPress={() => handleSaveNote(item.id)}>
                <Text style={[styles.noteActionText, { color: colors.primary }]}>저장</Text>
              </Pressable>
            </View>
          </View>
        ) : item.note ? (
          <Pressable
            style={[styles.noteBubble, { backgroundColor: colors.gray50 }]}
            onPress={() => { setEditingNoteId(item.id); setNoteText(item.note ?? ''); }}
          >
            <Text style={[styles.noteIcon]}>📝</Text>
            <Text style={[styles.noteText, { color: colors.gray600 }]} numberOfLines={2}>{item.note}</Text>
          </Pressable>
        ) : null}

        {/* 하단: 시간 & 액션 */}
        <View style={styles.cardBottom}>
          <Text style={[styles.timeText, { color: colors.gray400 }]}>
            {formatTimeAgo(item.createdAt)}
          </Text>
          <View style={styles.actionRow}>
            <Pressable
              onPress={() => { setEditingNoteId(item.id); setNoteText(item.note ?? ''); }}
              hitSlop={8}
              accessibilityLabel="메모 편집"
            >
              <Text style={{ fontSize: 16 }}>📝</Text>
            </Pressable>
            <Pressable
              onPress={() => handleRemove(item.id)}
              hitSlop={8}
              accessibilityLabel="북마크 삭제"
            >
              <Text style={{ fontSize: 16 }}>🗑️</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  }, [colors, editingNoteId, noteText, handleNavigate, handleRemove, handleSaveNote]);

  const list = bookmarks ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      <ScreenHeader title="북마크" onBack={() => navigation.goBack()} />

      {/* 필터 탭 */}
      <View style={[styles.tabBar, { borderBottomColor: colors.gray100 }]}>
        {FILTER_TABS.map(tab => {
          const isActive = activeTab === tab.value;
          const count = tab.value === 'ALL' ? list.length :
            list.filter(b => b.targetType === tab.value).length;
          return (
            <Pressable
              key={tab.value}
              style={[
                styles.tab,
                isActive && [styles.tabActive, { borderBottomColor: colors.primary }],
              ]}
              onPress={() => setActiveTab(tab.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[
                styles.tabText,
                { color: colors.gray400 },
                isActive && { color: colors.primary },
              ]}>
                {tab.emoji} {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 목록 */}
      <FlatList
        data={list}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              emoji="🔖"
              title="저장한 북마크가 없어요"
              subtitle="프로필, 그룹, 이벤트에서 🏷️ 버튼을 눌러 저장해보세요"
            />
          ) : null
        }
      />
    </View>
  );
}

function getItemName(item: BookmarkWithPreview): string {
  if (item.userPreview) return item.userPreview.displayName;
  if (item.groupPreview) return item.groupPreview.name;
  if (item.eventPreview) return item.eventPreview.title;
  return '알 수 없음';
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: SPACING.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {},
  tabText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  card: {
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
    marginBottom: 12,
    gap: 10,
  },
  cardTop: {},
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emojiCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiCircleText: { fontSize: 22 },
  previewInfo: { flex: 1, gap: 3 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewName: { fontSize: FONT_SIZE.md, fontWeight: '700', flex: 1 },
  previewSub: { fontSize: FONT_SIZE.xs },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },

  // Note
  noteBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
  },
  noteIcon: { fontSize: 13 },
  noteText: { fontSize: FONT_SIZE.xs, flex: 1, lineHeight: 18 },
  noteEdit: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: 8,
    gap: 8,
  },
  noteInput: {
    fontSize: FONT_SIZE.sm,
    padding: 8,
    borderRadius: BORDER_RADIUS.sm,
  },
  noteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  noteActionText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },

  // Bottom
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: { fontSize: FONT_SIZE.xs },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
});
