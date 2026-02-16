import React, { useState, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  TextInput, Alert, RefreshControl, Modal, TouchableOpacity,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { mockNotes } from '../services/mockService';
import ScreenHeader from '../components/ScreenHeader';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { UserNotesScreenProps, UserNote } from '../types';
import { useApiCall } from '../hooks/useApiCall';

// ── 시간 포맷 ──
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = Date.now();
  const diff = now - d.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}시간 전`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}일 전`;
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

// ── 태그 색상 ──
const TAG_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#22C55E', '#F59E0B', '#06B6D4'];

export default function UserNotesScreen({ navigation }: UserNotesScreenProps) {
  const { colors } = useTheme();
  const { showToast } = useToast();

  const { data: notes, loading, refresh } = useApiCall(
    () => mockNotes.getNotes(),
    { immediate: true },
  );

  // 편집 모달
  const [editModal, setEditModal] = useState(false);
  const [editNote, setEditNote] = useState<UserNote | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [saving, setSaving] = useState(false);

  const handleOpenEdit = useCallback((note: UserNote) => {
    setEditNote(note);
    setEditContent(note.content);
    setEditTags(note.tags.join(', '));
    setEditModal(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!editNote || !editContent.trim()) return;
    setSaving(true);
    try {
      const tags = editTags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
      await mockNotes.saveNote(editNote.targetUserId, editContent.trim(), tags);
      setEditModal(false);
      showToast('메모가 저장되었어요', 'success');
      refresh();
    } catch {
      showToast('저장에 실패했어요', 'error');
    } finally {
      setSaving(false);
    }
  }, [editNote, editContent, editTags, refresh, showToast]);

  const handleDelete = useCallback((noteId: string) => {
    Alert.alert(
      '메모 삭제',
      '이 메모를 삭제할까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            await mockNotes.deleteNote(noteId);
            showToast('메모가 삭제되었어요', 'success');
            refresh();
          },
        },
      ],
    );
  }, [refresh, showToast]);

  const handleTogglePin = useCallback(async (noteId: string) => {
    await mockNotes.togglePin(noteId);
    refresh();
  }, [refresh]);

  const handlePressUser = useCallback((userId: string) => {
    navigation.navigate('UserDetail', { userId });
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      <ScreenHeader title="내 메모" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />
        }
      >
        {/* 안내 배너 */}
        <View style={[styles.infoBanner, { backgroundColor: colors.primaryBg, borderColor: colors.primaryLight }]}>
          <Text style={styles.infoEmoji}>📝</Text>
          <Text style={[styles.infoText, { color: colors.gray700 }]}>
            다른 사용자에 대한 비공개 메모입니다.{'\n'}본인만 볼 수 있어요.
          </Text>
        </View>

        {/* 통계 */}
        {notes && notes.length > 0 && (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.gray50 }]}>
              <Text style={styles.statValue}>{notes.length}</Text>
              <Text style={[styles.statLabel, { color: colors.gray500 }]}>전체 메모</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.gray50 }]}>
              <Text style={styles.statValue}>{notes.filter(n => n.isPinned).length}</Text>
              <Text style={[styles.statLabel, { color: colors.gray500 }]}>고정됨</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.gray50 }]}>
              <Text style={styles.statValue}>
                {new Set(notes.flatMap(n => n.tags)).size}
              </Text>
              <Text style={[styles.statLabel, { color: colors.gray500 }]}>태그</Text>
            </View>
          </View>
        )}

        {/* 빈 상태 */}
        {!loading && (!notes || notes.length === 0) && (
          <EmptyState
            emoji="📒"
            title="메모가 없어요"
            subtitle="다른 사용자의 프로필에서 메모를 작성해 보세요"
          />
        )}

        {/* 메모 카드 리스트 */}
        {notes?.map(note => (
          <NoteCard
            key={note.id}
            note={note}
            colors={colors}
            onEdit={() => handleOpenEdit(note)}
            onDelete={() => handleDelete(note.id)}
            onTogglePin={() => handleTogglePin(note.id)}
            onPressUser={() => handlePressUser(note.targetUserId)}
          />
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 편집 모달 */}
      <Modal visible={editModal} animationType="slide" transparent onRequestClose={() => setEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.white, ...SHADOWS.lg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.gray900 }]}>메모 수정</Text>
              <Pressable onPress={() => setEditModal(false)} accessibilityRole="button" accessibilityLabel="닫기">
                <Text style={{ fontSize: 22, color: colors.gray500 }}>✕</Text>
              </Pressable>
            </View>

            {editNote && (
              <View style={styles.modalUser}>
                <Avatar
                  name={editNote.targetUserName}
                  emoji={editNote.targetUserEmoji}
                  customColor={editNote.targetUserColor}
                  size={32}
                />
                <Text style={[styles.modalUserName, { color: colors.gray800 }]}>
                  {editNote.targetUserName}
                </Text>
              </View>
            )}

            <Text style={[styles.fieldLabel, { color: colors.gray600 }]}>메모 내용</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.gray50, color: colors.gray900, borderColor: colors.gray200 }]}
              value={editContent}
              onChangeText={setEditContent}
              placeholder="이 사용자에 대해 기억할 내용을 적어주세요..."
              placeholderTextColor={colors.gray400}
              multiline
              maxLength={500}
              textAlignVertical="top"
              accessibilityLabel="메모 내용 입력"
            />
            <Text style={[styles.charCount, { color: colors.gray400 }]}>{editContent.length}/500</Text>

            <Text style={[styles.fieldLabel, { color: colors.gray600 }]}>태그 (쉼표로 구분)</Text>
            <TextInput
              style={[styles.tagInput, { backgroundColor: colors.gray50, color: colors.gray900, borderColor: colors.gray200 }]}
              value={editTags}
              onChangeText={setEditTags}
              placeholder="예: 친절함, 영화 팬, 개발자"
              placeholderTextColor={colors.gray400}
              maxLength={100}
              accessibilityLabel="태그 입력"
            />

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: editContent.trim() ? colors.primary : colors.gray300 }]}
              onPress={handleSave}
              disabled={!editContent.trim() || saving}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="메모 저장"
            >
              <Text style={styles.saveBtnText}>{saving ? '저장 중...' : '저장'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── 메모 카드 ──
interface NoteCardProps {
  note: UserNote;
  colors: Record<string, string>;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onPressUser: () => void;
}

function NoteCard({ note, colors, onEdit, onDelete, onTogglePin, onPressUser }: NoteCardProps) {
  return (
    <View style={[styles.noteCard, { backgroundColor: colors.white, borderColor: note.isPinned ? colors.primary : colors.gray200, ...SHADOWS.sm }]}>
      {/* 고정 표시 */}
      {note.isPinned && (
        <View style={[styles.pinnedBadge, { backgroundColor: colors.primaryBg }]}>
          <Text style={[styles.pinnedText, { color: colors.primary }]}>📌 고정됨</Text>
        </View>
      )}

      {/* 사용자 정보 */}
      <Pressable style={styles.noteUser} onPress={onPressUser} accessibilityRole="button" accessibilityLabel={`${note.targetUserName} 프로필 보기`}>
        <Avatar
          name={note.targetUserName}
          emoji={note.targetUserEmoji}
          customColor={note.targetUserColor}
          size={40}
        />
        <View style={styles.noteUserInfo}>
          <Text style={[styles.noteUserName, { color: colors.gray800 }]}>{note.targetUserName}</Text>
          <Text style={[styles.noteDate, { color: colors.gray400 }]}>{formatDate(note.updatedAt)}</Text>
        </View>
      </Pressable>

      {/* 메모 내용 */}
      <Text style={[styles.noteContent, { color: colors.gray700 }]}>{note.content}</Text>

      {/* 태그 */}
      {note.tags.length > 0 && (
        <View style={styles.tagRow}>
          {note.tags.map((tag, idx) => (
            <View
              key={tag}
              style={[styles.tag, { backgroundColor: TAG_COLORS[idx % TAG_COLORS.length] + '18' }]}
            >
              <Text style={[styles.tagText, { color: TAG_COLORS[idx % TAG_COLORS.length] }]}>
                #{tag}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* 액션 버튼 */}
      <View style={[styles.noteActions, { borderTopColor: colors.gray100 }]}>
        <Pressable style={styles.noteAction} onPress={onTogglePin} accessibilityRole="button" accessibilityLabel={note.isPinned ? '고정 해제' : '고정'}>
          <Text style={[styles.noteActionText, { color: note.isPinned ? colors.primary : colors.gray500 }]}>
            {note.isPinned ? '📌 고정 해제' : '📌 고정'}
          </Text>
        </Pressable>
        <Pressable style={styles.noteAction} onPress={onEdit} accessibilityRole="button" accessibilityLabel="수정">
          <Text style={[styles.noteActionText, { color: colors.gray500 }]}>✏️ 수정</Text>
        </Pressable>
        <Pressable style={styles.noteAction} onPress={onDelete} accessibilityRole="button" accessibilityLabel="삭제">
          <Text style={[styles.noteActionText, { color: COLORS.error }]}>🗑 삭제</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── 스타일 ──
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  // 안내 배너
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: 16,
    gap: 10,
  },
  infoEmoji: { fontSize: 22 },
  infoText: { fontSize: FONT_SIZE.xs, lineHeight: 18, flex: 1 },
  // 통계
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.md,
  },
  statValue: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.gray900 },
  statLabel: { fontSize: FONT_SIZE.xs, marginTop: 2 },
  // 메모 카드
  noteCard: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  pinnedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: 8,
  },
  pinnedText: { fontSize: 11, fontWeight: '600' },
  noteUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  noteUserInfo: { flex: 1 },
  noteUserName: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  noteDate: { fontSize: 11, marginTop: 1 },
  noteContent: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 22,
    marginBottom: 10,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  tagText: { fontSize: 11, fontWeight: '600' },
  noteActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 4,
  },
  noteAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  noteActionText: { fontSize: FONT_SIZE.xs, fontWeight: '500' },
  // 모달
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700' },
  modalUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingBottom: 12,
  },
  modalUserName: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  fieldLabel: { fontSize: FONT_SIZE.xs, fontWeight: '600', marginBottom: 6 },
  textArea: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: 12,
    fontSize: FONT_SIZE.sm,
    minHeight: 100,
    lineHeight: 22,
  },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: 4, marginBottom: 12 },
  tagInput: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: 12,
    fontSize: FONT_SIZE.sm,
    marginBottom: 20,
  },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' },
});
