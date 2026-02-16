// ==========================================
// SnapshotViewer — 스냅샷 전체화면 뷰어 (모달)
// ==========================================
import React, { useState } from 'react';
import {
  View, Text, Image, Pressable, StyleSheet, Modal,
  Dimensions, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import AnimatedPressable from './AnimatedPressable';
import ConfirmDialog from './ConfirmDialog';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING } from '../constants/theme';
import { Snapshot } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SnapshotViewerProps {
  visible: boolean;
  snapshot: Snapshot | null;
  isOwner: boolean;
  onClose: () => void;
  onDelete?: (snapId: string) => void;
  onUpdateCaption?: (snapId: string, caption: string | null) => void;
}

export default function SnapshotViewer({
  visible,
  snapshot,
  isOwner,
  onClose,
  onDelete,
  onUpdateCaption,
}: SnapshotViewerProps) {
  const { colors } = useTheme();
  const [editingCaption, setEditingCaption] = useState(false);
  const [captionText, setCaptionText] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (!snapshot) return null;

  const handleStartEdit = () => {
    setCaptionText(snapshot.caption || '');
    setEditingCaption(true);
  };

  const handleSaveCaption = () => {
    onUpdateCaption?.(snapshot.id, captionText.trim() || null);
    setEditingCaption(false);
  };

  const handleDelete = () => {
    setShowDeleteDialog(false);
    onDelete?.(snapshot.id);
    onClose();
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 상단 바 */}
        <View style={styles.topBar}>
          <Pressable
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="닫기"
          >
            <Text style={styles.closeText}>✕</Text>
          </Pressable>

          <Text style={styles.dateText}>{formatDate(snapshot.createdAt)}</Text>

          {isOwner && (
            <View style={styles.topActions}>
              <Pressable
                onPress={handleStartEdit}
                style={styles.actionBtn}
                accessibilityRole="button"
                accessibilityLabel="캡션 편집"
              >
                <Text style={styles.actionIcon}>✏️</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowDeleteDialog(true)}
                style={styles.actionBtn}
                accessibilityRole="button"
                accessibilityLabel="삭제"
              >
                <Text style={styles.actionIcon}>🗑️</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* 이미지 */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: snapshot.imageUrl }}
            style={styles.image}
            resizeMode="contain"
            accessibilityLabel={snapshot.caption || '스냅샷 이미지'}
          />
        </View>

        {/* 하단 캡션 영역 */}
        <View style={styles.bottomBar}>
          {editingCaption ? (
            <View style={styles.editRow}>
              <TextInput
                style={[styles.captionInput, { color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }]}
                placeholder="캡션을 입력하세요..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={captionText}
                onChangeText={setCaptionText}
                maxLength={100}
                autoFocus
                accessibilityLabel="캡션 입력"
              />
              <View style={styles.editActions}>
                <Pressable
                  onPress={() => setEditingCaption(false)}
                  style={styles.editCancel}
                  accessibilityRole="button"
                  accessibilityLabel="취소"
                >
                  <Text style={styles.editCancelText}>취소</Text>
                </Pressable>
                <AnimatedPressable
                  onPress={handleSaveCaption}
                  style={styles.editSave}
                  accessibilityRole="button"
                  accessibilityLabel="저장"
                >
                  <Text style={styles.editSaveText}>저장</Text>
                </AnimatedPressable>
              </View>
            </View>
          ) : (
            snapshot.caption ? (
              <Pressable onPress={isOwner ? handleStartEdit : undefined}>
                <Text style={styles.captionText}>{snapshot.caption}</Text>
              </Pressable>
            ) : isOwner ? (
              <Pressable onPress={handleStartEdit}>
                <Text style={styles.captionPlaceholder}>캡션 추가...</Text>
              </Pressable>
            ) : null
          )}
        </View>

        {/* 삭제 확인 다이얼로그 */}
        <ConfirmDialog
          visible={showDeleteDialog}
          icon="🗑️"
          title="스냅샷 삭제"
          message="이 스냅샷을 삭제할까요? 되돌릴 수 없어요."
          confirmLabel="삭제"
          destructive
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteDialog(false)}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  closeBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  closeText: { color: '#fff', fontSize: 20, fontWeight: '600' },
  dateText: { color: 'rgba(255,255,255,0.7)', fontSize: FONT_SIZE.xs },
  topActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  actionIcon: { fontSize: 18 },

  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.75,
  },

  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
  },
  captionText: {
    color: '#fff',
    fontSize: FONT_SIZE.md,
    lineHeight: 24,
  },
  captionPlaceholder: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: FONT_SIZE.md,
    fontStyle: 'italic',
  },

  editRow: { gap: 10 },
  captionInput: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: FONT_SIZE.md,
  },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  editCancel: { paddingVertical: 8, paddingHorizontal: 16 },
  editCancelText: { color: 'rgba(255,255,255,0.6)', fontSize: FONT_SIZE.sm, fontWeight: '600' },
  editSave: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: BORDER_RADIUS.sm,
  },
  editSaveText: { color: '#fff', fontSize: FONT_SIZE.sm, fontWeight: '700' },
});
