// ==========================================
// SnapshotGalleryScreen — 스냅샷 갤러리 & 관리
// ==========================================
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Image, Pressable, StyleSheet, FlatList, RefreshControl,
  Dimensions, TextInput, Modal,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { mockSnapshots, mockProfile } from '../services/mockService';
import ScreenHeader from '../components/ScreenHeader';
import AnimatedPressable from '../components/AnimatedPressable';
import EmptyState from '../components/EmptyState';
import SnapshotViewer from '../components/SnapshotViewer';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { Snapshot, SnapshotGalleryScreenProps, User } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 3;
const COLS = 3;
const TILE_SIZE = (SCREEN_WIDTH - GRID_GAP * (COLS - 1)) / COLS;

export default function SnapshotGalleryScreen({ navigation, route }: SnapshotGalleryScreenProps) {
  const targetUserId = route.params?.userId;
  const { user: me } = useAuth();
  const { showToast } = useToast();
  const { colors } = useTheme();

  const isOwner = !targetUserId || targetUserId === me?.id;

  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [targetUser, setTargetUser] = useState<User | null>(null);

  // 뷰어
  const [viewerSnap, setViewerSnap] = useState<Snapshot | null>(null);
  const [showViewer, setShowViewer] = useState(false);

  // 새 스냅샷 추가 모달
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [adding, setAdding] = useState(false);

  const loadData = useCallback(async () => {
    try {
      if (isOwner) {
        const snaps = await mockSnapshots.getMySnapshots();
        setSnapshots(snaps);
      } else {
        const [snaps, user] = await Promise.all([
          mockSnapshots.getUserSnapshots(targetUserId!),
          mockProfile.getUserById(targetUserId!),
        ]);
        setSnapshots(snaps);
        setTargetUser(user);
      }
    } catch {
      showToast('스냅샷을 불러올 수 없어요', 'error', '⚠️');
    } finally {
      setLoading(false);
    }
  }, [isOwner, targetUserId, showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // 스냅샷 추가
  const handleAdd = useCallback(async () => {
    setAdding(true);
    const snap = await mockSnapshots.addSnapshot(newCaption.trim() || null);
    setSnapshots(prev => [snap, ...prev]);
    setAdding(false);
    setShowAddModal(false);
    setNewCaption('');
    showToast('스냅샷이 추가되었어요! 📸', 'success', '✅');
  }, [newCaption, showToast]);

  // 스냅샷 삭제
  const handleDelete = useCallback(async (snapId: string) => {
    await mockSnapshots.deleteSnapshot(snapId);
    setSnapshots(prev => prev.filter(s => s.id !== snapId));
    showToast('스냅샷이 삭제되었어요', 'success', '🗑️');
  }, [showToast]);

  // 캡션 수정
  const handleUpdateCaption = useCallback(async (snapId: string, caption: string | null) => {
    const updated = await mockSnapshots.updateCaption(snapId, caption);
    if (updated) {
      setSnapshots(prev => prev.map(s => s.id === snapId ? updated : s));
      // 뷰어에도 반영
      setViewerSnap(prev => prev?.id === snapId ? updated : prev);
      showToast('캡션이 수정되었어요', 'success', '✏️');
    }
  }, [showToast]);

  const openViewer = (snap: Snapshot) => {
    setViewerSnap(snap);
    setShowViewer(true);
  };

  const screenTitle = isOwner ? '📸 내 스냅샷' : `📸 ${targetUser?.displayName || '사용자'}의 스냅샷`;

  const renderItem = ({ item }: { item: Snapshot }) => (
    <Pressable
      onPress={() => openViewer(item)}
      style={styles.gridTile}
      accessibilityRole="button"
      accessibilityLabel={item.caption || '스냅샷'}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.gridImage}
        resizeMode="cover"
      />
      {item.caption && (
        <View style={styles.tileCaptionOverlay}>
          <Text style={styles.tileCaptionText} numberOfLines={1}>{item.caption}</Text>
        </View>
      )}
    </Pressable>
  );

  const ListHeader = () => (
    <View style={[styles.statsBar, { backgroundColor: colors.gray50, borderBottomColor: colors.gray200 }]}>
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: colors.gray900 }]}>{snapshots.length}</Text>
        <Text style={[styles.statLabel, { color: colors.gray500 }]}>스냅샷</Text>
      </View>
      {isOwner && (
        <AnimatedPressable
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddModal(true)}
          accessibilityRole="button"
          accessibilityLabel="새 스냅샷 추가"
        >
          <Text style={styles.addBtnText}>+ 새 스냅샷</Text>
        </AnimatedPressable>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      <ScreenHeader
        title={screenTitle}
        onBack={() => navigation.goBack()}
      />

      {loading ? (
        <View style={styles.loadingGrid}>
          {Array.from({ length: 9 }).map((_, i) => (
            <View key={i} style={[styles.gridTile, { backgroundColor: colors.gray100 }]} />
          ))}
        </View>
      ) : snapshots.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            emoji="📸"
            title="스냅샷이 없어요"
            subtitle={isOwner ? '일상의 순간을 스냅샷으로 공유해보세요!' : '아직 공유한 스냅샷이 없어요'}
          />
          {isOwner && (
            <AnimatedPressable
              style={[styles.emptyAddBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowAddModal(true)}
              accessibilityRole="button"
              accessibilityLabel="첫 스냅샷 추가"
            >
              <Text style={styles.emptyAddText}>📸 첫 스냅샷 추가하기</Text>
            </AnimatedPressable>
          )}
        </View>
      ) : (
        <FlatList
          data={snapshots}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          numColumns={COLS}
          columnWrapperStyle={styles.gridRow}
          ListHeaderComponent={<ListHeader />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* 스냅샷 뷰어 */}
      <SnapshotViewer
        visible={showViewer}
        snapshot={viewerSnap}
        isOwner={isOwner}
        onClose={() => setShowViewer(false)}
        onDelete={handleDelete}
        onUpdateCaption={handleUpdateCaption}
      />

      {/* 새 스냅샷 추가 모달 */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.addModal, { backgroundColor: colors.white }]}>
          <View style={[styles.addModalHeader, { borderBottomColor: colors.gray200 }]}>
            <Pressable
              onPress={() => { setShowAddModal(false); setNewCaption(''); }}
              accessibilityRole="button"
              accessibilityLabel="취소"
            >
              <Text style={[styles.addModalCancel, { color: colors.gray500 }]}>취소</Text>
            </Pressable>
            <Text style={[styles.addModalTitle, { color: colors.gray900 }]}>새 스냅샷</Text>
            <Pressable
              onPress={handleAdd}
              disabled={adding}
              accessibilityRole="button"
              accessibilityLabel="추가"
            >
              <Text style={[styles.addModalDone, { color: adding ? colors.gray400 : colors.primary }]}>
                {adding ? '추가 중...' : '추가'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.addModalBody}>
            {/* 미리보기 (mock 이미지) */}
            <View style={[styles.previewBox, { backgroundColor: colors.gray100 }]}>
              <Text style={styles.previewEmoji}>📷</Text>
              <Text style={[styles.previewText, { color: colors.gray500 }]}>
                랜덤 이미지가 자동 생성됩니다
              </Text>
              <Text style={[styles.previewHint, { color: colors.gray400 }]}>
                (실제 앱에서는 카메라/갤러리 사용)
              </Text>
            </View>

            {/* 캡션 */}
            <View style={styles.captionSection}>
              <Text style={[styles.captionLabel, { color: colors.gray700 }]}>캡션 (선택)</Text>
              <TextInput
                style={[styles.captionInput, { backgroundColor: colors.gray50, borderColor: colors.gray200, color: colors.gray900 }]}
                placeholder="이 순간을 설명해주세요..."
                placeholderTextColor={colors.gray400}
                value={newCaption}
                onChangeText={setNewCaption}
                maxLength={100}
                multiline
                accessibilityLabel="캡션 입력"
              />
              <Text style={[styles.captionCount, { color: colors.gray400 }]}>{newCaption.length}/100</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Stats bar
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statValue: { fontSize: FONT_SIZE.lg, fontWeight: '800' },
  statLabel: { fontSize: FONT_SIZE.sm },

  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
  },
  addBtnText: { color: '#fff', fontSize: FONT_SIZE.sm, fontWeight: '700' },

  // Grid
  listContent: { paddingBottom: 40 },
  gridRow: { gap: GRID_GAP },
  gridTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    marginBottom: GRID_GAP,
  },
  gridImage: { width: '100%', height: '100%' },
  tileCaptionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  tileCaptionText: { color: '#fff', fontSize: 10, fontWeight: '500' },

  // Loading grid
  loadingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },

  // Empty
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyAddBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
  },
  emptyAddText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' },

  // Add modal
  addModal: { flex: 1 },
  addModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  addModalCancel: { fontSize: FONT_SIZE.md },
  addModalTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700' },
  addModalDone: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  addModalBody: { padding: SPACING.xl, gap: 24 },

  previewBox: {
    borderRadius: BORDER_RADIUS.lg,
    padding: 40,
    alignItems: 'center',
    gap: 8,
  },
  previewEmoji: { fontSize: 48 },
  previewText: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  previewHint: { fontSize: FONT_SIZE.xs },

  captionSection: { gap: 8 },
  captionLabel: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  captionInput: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: FONT_SIZE.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  captionCount: { fontSize: FONT_SIZE.xs, textAlign: 'right' },
});
