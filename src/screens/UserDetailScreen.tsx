import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Image, TextInput,
} from 'react-native';
import { mockProfile, mockSnapshots, mockProfileView, mockConnections, mockSafety, mockNotes } from '../services/mockService';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { getInterestById } from '../constants/interests';
import Avatar from '../components/Avatar';
import InterestTag from '../components/InterestTag';
import AnimatedPressable from '../components/AnimatedPressable';
import ConfirmDialog from '../components/ConfirmDialog';
import ReportSheet from '../components/ReportSheet';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { User, Snapshot, UserDetailScreenProps, ReportReason, UserNote } from '../types';
import { SkeletonUserDetail } from '../components/Skeleton';
import ErrorRetry from '../components/ErrorRetry';
import CompatibilityBadge from '../components/CompatibilityBadge';
import { useCompatibility } from '../hooks/useCompatibility';
import BookmarkButton from '../components/BookmarkButton';

export default function UserDetailScreen({ route, navigation }: UserDetailScreenProps) {
  const { userId } = route.params;
  const { user: me } = useAuth();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'CONNECTED'>('NONE');
  const [connectionRequestId, setConnectionRequestId] = useState<string | undefined>();
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [connectMessage, setConnectMessage] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [userNote, setUserNote] = useState<UserNote | null>(null);
  const [noteText, setNoteText] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const { score: compatScore, loading: compatLoading } = useCompatibility(userId);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [p, snaps] = await Promise.all([
        mockProfile.getUserById(userId),
        mockSnapshots.getUserSnapshots(userId),
      ]);
      setProfile(p);
      setSnapshots(snaps);
      // 열람 기록
      if (p) await mockProfileView.recordView(userId);
      // 연결 상태
      const connStatus = await mockConnections.getConnectionStatus(userId);
      setConnectionStatus(connStatus.status);
      setConnectionRequestId(connStatus.requestId);
      // 차단 상태
      const blocked = await mockSafety.isBlocked(userId);
      setIsBlocked(blocked);
      // 메모 로드
      const note = await mockNotes.getNoteForUser(userId);
      setUserNote(note);
      if (note) setNoteText(note.content);
    } catch (e: any) {
      setError(e?.message ?? '프로필을 불러올 수 없어요');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [userId]);

  if (loading) {
    return <SkeletonUserDetail />;
  }

  if (error || !profile) {
    return (
      <ErrorRetry
        message="프로필을 불러올 수 없어요"
        detail={error ?? '잠시 후 다시 시도해주세요'}
        onRetry={loadData}
        onGoBack={() => navigation.goBack()}
      />
    );
  }

  const myAllInterests = [...(me?.recentInterests ?? []), ...(me?.alwaysInterests ?? [])];
  const theirAll = [...profile.recentInterests, ...profile.alwaysInterests];
  const commonIds = theirAll.filter(id => myAllInterests.includes(id));

  const handleConnect = useCallback(async () => {
    if (showMessageInput) {
      setConnecting(true);
      const result = await mockConnections.sendRequest(userId, connectMessage.trim() || undefined);
      setConnecting(false);
      if (result.error) {
        showToast(result.error, 'error', '⚠️');
      } else {
        setConnectionStatus('PENDING_SENT');
        showToast(`${profile?.displayName}님에게 연결 요청을 보냈어요!`, 'success', '📨');
        setShowMessageInput(false);
        setConnectMessage('');
      }
    } else {
      setShowMessageInput(true);
    }
  }, [showMessageInput, userId, connectMessage, profile?.displayName, showToast]);

  const handleAcceptRequest = useCallback(async () => {
    if (!connectionRequestId) return;
    await mockConnections.acceptRequest(connectionRequestId);
    setConnectionStatus('CONNECTED');
    showToast(`${profile?.displayName}님과 연결되었어요!`, 'success', '🤝');
  }, [connectionRequestId, profile?.displayName, showToast]);

  const handleBlockUser = useCallback(async () => {
    setShowBlockDialog(false);
    const result = await mockSafety.blockUser(userId);
    if (result.success) {
      setIsBlocked(true);
      setConnectionStatus('NONE');
      showToast(`${profile?.displayName}님을 차단했어요`, 'success', '🚫');
    } else {
      showToast(result.error ?? '차단에 실패했어요', 'error', '⚠️');
    }
  }, [userId, profile?.displayName, showToast]);

  const handleUnblockUser = useCallback(async () => {
    await mockSafety.unblockUser(userId);
    setIsBlocked(false);
    showToast(`${profile?.displayName}님의 차단을 해제했어요`, 'success', '✅');
  }, [userId, profile?.displayName, showToast]);

  const handleReportSubmit = useCallback(async (reason: ReportReason, detail?: string) => {
    const result = await mockSafety.reportUser(userId, reason, detail);
    setShowReportSheet(false);
    if (result.success) {
      showToast('신고가 접수되었어요. 검토 후 조치할게요.', 'success', '📩');
    } else {
      showToast(result.error ?? '신고에 실패했어요', 'error', '⚠️');
    }
  }, [userId, showToast]);

  const formatLastSeen = (date: string | null) => {
    if (!date) return '알 수 없음';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '방금 전';
    if (mins < 60) return `${mins}분 전`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  return (
    <>
    <ScrollView style={[styles.container, { backgroundColor: colors.white }]}>
      {/* Header */}
      <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="뒤로 가기">
          <Text style={[styles.backText, { color: colors.primary }]}>← 뒤로</Text>
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <BookmarkButton targetType="USER" targetId={userId} size="sm" />
          <Pressable
            onPress={() => setShowMoreMenu(!showMoreMenu)}
            style={styles.moreBtn}
            accessibilityRole="button"
            accessibilityLabel="더보기 메뉴"
          >
            <Text style={[styles.moreBtnText, { color: colors.gray600 }]}>⋮</Text>
          </Pressable>
        </View>
      </View>

      {/* 더보기 드롭다운 메뉴 */}
      {showMoreMenu && (
        <View style={[styles.moreMenu, { backgroundColor: colors.white, borderColor: colors.gray200 }]}>
          {isBlocked ? (
            <Pressable
              style={styles.moreMenuItem}
              onPress={() => { setShowMoreMenu(false); handleUnblockUser(); }}
              accessibilityRole="button"
              accessibilityLabel="차단 해제"
            >
              <Text style={styles.moreMenuIcon}>✅</Text>
              <Text style={[styles.moreMenuText, { color: colors.gray800 }]}>차단 해제</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.moreMenuItem}
              onPress={() => { setShowMoreMenu(false); setShowBlockDialog(true); }}
              accessibilityRole="button"
              accessibilityLabel="차단하기"
            >
              <Text style={styles.moreMenuIcon}>🚫</Text>
              <Text style={[styles.moreMenuText, { color: COLORS.error }]}>차단하기</Text>
            </Pressable>
          )}
          <View style={[styles.moreMenuDivider, { backgroundColor: colors.gray100 }]} />
          <Pressable
            style={styles.moreMenuItem}
            onPress={() => { setShowMoreMenu(false); setShowNoteInput(true); }}
            accessibilityRole="button"
            accessibilityLabel="메모 작성"
          >
            <Text style={styles.moreMenuIcon}>📝</Text>
            <Text style={[styles.moreMenuText, { color: colors.gray800 }]}>{userNote ? '메모 수정' : '메모 작성'}</Text>
          </Pressable>
          <View style={[styles.moreMenuDivider, { backgroundColor: colors.gray100 }]} />
          <Pressable
            style={styles.moreMenuItem}
            onPress={() => { setShowMoreMenu(false); setShowReportSheet(true); }}
            accessibilityRole="button"
            accessibilityLabel="신고하기"
          >
            <Text style={styles.moreMenuIcon}>🚨</Text>
            <Text style={[styles.moreMenuText, { color: COLORS.error }]}>신고하기</Text>
          </Pressable>
        </View>
      )}

      {/* 차단 상태 배너 */}
      {isBlocked && (
        <View style={[styles.blockedBanner, { backgroundColor: COLORS.error + '15' }]}>
          <Text style={styles.blockedBannerIcon}>🚫</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.blockedBannerTitle, { color: COLORS.error }]}>차단된 사용자</Text>
            <Text style={[styles.blockedBannerDesc, { color: colors.gray500 }]}>
              이 사용자의 활동이 필터링됩니다
            </Text>
          </View>
          <Pressable
            onPress={handleUnblockUser}
            style={[styles.unblockBtn, { borderColor: COLORS.error }]}
            accessibilityRole="button"
            accessibilityLabel="차단 해제"
          >
            <Text style={[styles.unblockBtnText, { color: COLORS.error }]}>해제</Text>
          </Pressable>
        </View>
      )}

      {/* Profile */}
      <View style={styles.profileSection} accessible={true} accessibilityLabel={`${profile.displayName} ${profile.isOnline ? '온라인' : '오프라인'}`}>
        <Avatar name={profile.displayName} size={80} showOnline isOnline={profile.isOnline} emoji={profile.avatarEmoji} customColor={profile.avatarColor} />
        <Text style={[styles.displayName, { color: colors.gray900 }]}>{profile.displayName}</Text>

        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: profile.isOnline ? COLORS.online : COLORS.offline }]} />
          <Text style={[styles.statusText, { color: colors.gray500 }]}>
            {profile.isOnline
              ? 'Open Networking 중'
              : `마지막 접속: ${formatLastSeen(profile.lastSeen)}`}
          </Text>
        </View>

        {profile.bio && <Text style={[styles.bio, { color: colors.gray600 }]}>{profile.bio}</Text>}
      </View>

      {/* 공통 관심사 */}
      {commonIds.length > 0 && (
        <View style={[styles.commonSection, { backgroundColor: colors.primaryBg }]}>
          <View style={styles.commonHeader}>
            <Text style={[styles.commonTitle, { color: colors.primary }]}>✨ 공통 관심사 {commonIds.length}개!</Text>
          </View>
          <View style={styles.tagRow}>
            {commonIds.map(id => (
              <InterestTag key={id} interestId={id} isHighlighted />
            ))}
          </View>
        </View>
      )}

      {/* 호환도 카드 */}
      {!compatLoading && compatScore && (
        <AnimatedPressable
          style={[styles.compatCard, { backgroundColor: colors.gray50, borderColor: colors.gray200 }]}
          onPress={() => navigation.navigate('Compatibility', { userId })}
          scaleValue={0.97}
          accessibilityRole="button"
          accessibilityLabel={`호환도 ${compatScore.overall}% — 상세 보기`}
        >
          <View style={styles.compatLeft}>
            <Text style={styles.compatEmoji}>{compatScore.emoji}</Text>
            <View>
              <Text style={[styles.compatLabel, { color: colors.gray800 }]}>{compatScore.label}</Text>
              <Text style={[styles.compatDesc, { color: colors.gray500 }]}>
                관심사 {compatScore.commonInterests.length}개 · 카테고리 {compatScore.commonCategories.length}개 일치
              </Text>
            </View>
          </View>
          <View style={styles.compatRight}>
            <CompatibilityBadge score={compatScore.overall} label={compatScore.label} emoji={compatScore.emoji} variant="compact" />
            <Text style={[styles.compatArrow, { color: colors.primary }]}>→</Text>
          </View>
        </AnimatedPressable>
      )}

      {/* 요즘 관심사 */}
      {profile.recentInterests.length > 0 && (
        <View style={styles.interestSection}>
          <Text style={[styles.sectionTitle, { color: colors.gray800 }]}>🔥 요즘 관심사</Text>
          <View style={styles.tagRow}>
            {profile.recentInterests.map(id => (
              <InterestTag
                key={id}
                interestId={id}
                isHighlighted={commonIds.includes(id)}
              />
            ))}
          </View>
        </View>
      )}

      {/* 항상 관심사 */}
      {profile.alwaysInterests.length > 0 && (
        <View style={styles.interestSection}>
          <Text style={[styles.sectionTitle, { color: colors.gray800 }]}>❤️ 항상 관심사</Text>
          <View style={styles.tagRow}>
            {profile.alwaysInterests.map(id => (
              <InterestTag
                key={id}
                interestId={id}
                isHighlighted={commonIds.includes(id)}
              />
            ))}
          </View>
        </View>
      )}

      {/* 대화 환영 주제 */}
      {profile.welcomeTopics.length > 0 && (
        <View style={styles.welcomeSection}>
          <Text style={[styles.sectionTitle, { color: colors.gray800 }]}>💬 이런 주제로 말 걸어주세요</Text>
          {profile.welcomeTopics.map((topic, idx) => (
            <View key={idx} style={[styles.welcomeItem, { backgroundColor: colors.gray50 }]}>
              <Text style={styles.welcomeIcon}>💡</Text>
              <Text style={[styles.welcomeText, { color: colors.gray700 }]}>{topic}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 대화 주제 추천 버튼 */}
      <AnimatedPressable
        style={styles.chatBtn}
        onPress={() => {
          navigation.navigate('ConversationTopics', {
            displayName: profile.displayName,
            commonInterests: commonIds,
            theirInterests: theirAll,
          });
        }}
        accessibilityRole="button"
        accessibilityLabel={`${profile.displayName}님과 대화 주제 추천 보기`}
        scaleValue={0.95}
      >
        <Text style={styles.chatBtnText}>💬 대화 주제 추천 보기</Text>
      </AnimatedPressable>

      {/* 연결 버튼/상태 */}
      <View style={styles.connectionSection}>
        {connectionStatus === 'NONE' && (
          <>
            {showMessageInput && (
              <View style={[styles.messageInputBox, { backgroundColor: colors.gray50, borderColor: colors.gray200 }]}>
                <TextInput
                  style={[styles.messageInput, { color: colors.gray900 }]}
                  placeholder="연결 메시지를 남겨보세요 (선택)"
                  placeholderTextColor={colors.gray400}
                  value={connectMessage}
                  onChangeText={setConnectMessage}
                  maxLength={100}
                  multiline
                  accessibilityLabel="연결 메시지 입력"
                />
                <Text style={[styles.messageCount, { color: colors.gray400 }]}>{connectMessage.length}/100</Text>
              </View>
            )}
            <AnimatedPressable
              style={[styles.connectBtn, { backgroundColor: colors.primary }]}
              onPress={handleConnect}
              scaleValue={0.95}
              accessibilityRole="button"
              accessibilityLabel={`${profile.displayName}님에게 연결 요청`}
            >
              <Text style={styles.connectBtnText}>
                {connecting ? '보내는 중...' : showMessageInput ? '📨 연결 요청 보내기' : '🤝 연결 요청'}
              </Text>
            </AnimatedPressable>
            {showMessageInput && (
              <Pressable onPress={() => { setShowMessageInput(false); setConnectMessage(''); }} accessibilityRole="button" accessibilityLabel="취소">
                <Text style={[styles.cancelLink, { color: colors.gray400 }]}>취소</Text>
              </Pressable>
            )}
          </>
        )}

        {connectionStatus === 'PENDING_SENT' && (
          <View style={[styles.statusCard, { backgroundColor: colors.gray50, borderColor: colors.gray200 }]}>
            <Text style={styles.statusEmoji}>⏳</Text>
            <Text style={[styles.statusLabel, { color: colors.gray600 }]}>연결 요청을 보냈어요</Text>
            <Text style={[styles.statusHint, { color: colors.gray400 }]}>상대방이 수락하면 연결돼요</Text>
          </View>
        )}

        {connectionStatus === 'PENDING_RECEIVED' && (
          <View style={[styles.statusCard, { backgroundColor: colors.primaryBg, borderColor: colors.primary + '33' }]}>
            <Text style={styles.statusEmoji}>📬</Text>
            <Text style={[styles.statusLabel, { color: colors.primary }]}>연결 요청을 받았어요!</Text>
            <Pressable
              style={[styles.acceptBtnLarge, { backgroundColor: colors.primary }]}
              onPress={handleAcceptRequest}
              accessibilityRole="button"
              accessibilityLabel="연결 수락"
            >
              <Text style={styles.acceptBtnText}>🤝 수락하기</Text>
            </Pressable>
          </View>
        )}

        {connectionStatus === 'CONNECTED' && (
          <View style={[styles.statusCard, { backgroundColor: colors.primaryBg, borderColor: colors.primary + '33' }]}>
            <Text style={styles.statusEmoji}>✅</Text>
            <Text style={[styles.statusLabel, { color: colors.primary }]}>연결된 사이예요!</Text>
            <Pressable
              style={[styles.chatStartBtn, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('Chat', { userId })}
              accessibilityRole="button"
              accessibilityLabel={`${profile.displayName}에게 채팅 보내기`}
            >
              <Text style={styles.chatStartText}>💬 채팅하기</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* 메모 섹션 */}
      {(showNoteInput || userNote) && (
        <View style={[styles.noteSection, { backgroundColor: colors.gray50, borderColor: colors.gray200 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={[styles.sectionTitle, { color: colors.gray800 }]}>📝 내 메모</Text>
            {userNote && !showNoteInput && (
              <Pressable onPress={() => setShowNoteInput(true)} accessibilityRole="button" accessibilityLabel="메모 수정">
                <Text style={{ fontSize: FONT_SIZE.sm, color: colors.primary, fontWeight: '600' }}>수정</Text>
              </Pressable>
            )}
          </View>
          {showNoteInput ? (
            <View>
              <TextInput
                style={[styles.noteInput, { backgroundColor: colors.white, borderColor: colors.gray200, color: colors.gray900 }]}
                value={noteText}
                onChangeText={setNoteText}
                placeholder="이 사용자에 대해 기억할 내용을 적어주세요..."
                placeholderTextColor={colors.gray400}
                multiline
                maxLength={300}
                textAlignVertical="top"
                accessibilityLabel="메모 입력"
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <Pressable
                  onPress={() => { setShowNoteInput(false); setNoteText(userNote?.content ?? ''); }}
                  accessibilityRole="button"
                  accessibilityLabel="취소"
                >
                  <Text style={{ fontSize: FONT_SIZE.sm, color: colors.gray500 }}>취소</Text>
                </Pressable>
                <Pressable
                  onPress={async () => {
                    if (!noteText.trim()) return;
                    setSavingNote(true);
                    try {
                      const saved = await mockNotes.saveNote(userId, noteText.trim());
                      setUserNote(saved);
                      setShowNoteInput(false);
                      showToast('메모가 저장되었어요', 'success');
                    } catch { /* empty */ } finally {
                      setSavingNote(false);
                    }
                  }}
                  disabled={!noteText.trim() || savingNote}
                  accessibilityRole="button"
                  accessibilityLabel="메모 저장"
                >
                  <Text style={{ fontSize: FONT_SIZE.sm, color: noteText.trim() ? colors.primary : colors.gray300, fontWeight: '700' }}>
                    {savingNote ? '저장 중...' : '저장'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            userNote && (
              <Text style={[styles.notePreview, { color: colors.gray700 }]}>{userNote.content}</Text>
            )
          )}
        </View>
      )}

      {/* 스냅샷 */}
      {snapshots.length > 0 && (
        <View style={styles.snapshotSection}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.sectionTitle, { color: colors.gray800 }]}>📸 스냅샷</Text>
            <Pressable
              onPress={() => navigation.navigate('SnapshotGallery', { userId })}
              accessibilityRole="link"
              accessibilityLabel="스냅샷 모두 보기"
            >
              <Text style={{ fontSize: FONT_SIZE.sm, color: colors.primary, fontWeight: '600' }}>모두 보기 →</Text>
            </Pressable>
          </View>
          {snapshots.map(snap => (
            <View key={snap.id} style={[styles.snapCard, { backgroundColor: colors.gray50 }]}>
              <Image
                source={{ uri: snap.imageUrl }}
                style={[styles.snapImage, { backgroundColor: colors.gray200 }]}
                resizeMode="cover"
                accessibilityLabel={snap.caption || '스냅샷 이미지'}
              />
              {snap.caption && <Text style={[styles.snapCaption, { color: colors.gray700 }]}>{snap.caption}</Text>}
              <Text style={[styles.snapDate, { color: colors.gray400 }]}>
                {new Date(snap.createdAt).toLocaleDateString('ko-KR')}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>

    {/* 신고 시트 */}
    <ReportSheet
      visible={showReportSheet}
      targetUserName={profile.displayName}
      onSubmit={handleReportSubmit}
      onClose={() => setShowReportSheet(false)}
    />

    {/* 차단 확인 다이얼로그 */}
    <ConfirmDialog
      visible={showBlockDialog}
      icon="🚫"
      title="차단하기"
      message={`${profile.displayName}님을 차단하면: \n• 발견 목록에 표시되지 않아요\n• 연결이 자동 삭제돼요\n• 나중에 해제할 수 있어요`}
      confirmLabel="차단"
      destructive
      onConfirm={handleBlockUser}
      onCancel={() => setShowBlockDialog(false)}
    />
  </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: FONT_SIZE.md, color: COLORS.gray500 },
  header: {
    paddingTop: 60,
    paddingHorizontal: SPACING.xl,
    paddingBottom: 8,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: FONT_SIZE.md, color: COLORS.primary, fontWeight: '600' },

  // Profile
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    gap: 8,
    paddingBottom: 20,
  },
  displayName: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.gray900, marginTop: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: FONT_SIZE.sm, color: COLORS.gray500 },
  bio: { fontSize: FONT_SIZE.md, color: COLORS.gray600, textAlign: 'center', lineHeight: 22, marginTop: 4 },

  // Common
  commonSection: {
    marginHorizontal: SPACING.xl,
    backgroundColor: COLORS.primaryBg,
    borderRadius: BORDER_RADIUS.md,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  commonHeader: { flexDirection: 'row', alignItems: 'center' },
  commonTitle: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.primary },

  // Interest sections
  interestSection: {
    paddingHorizontal: SPACING.xl,
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.gray800 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  // Welcome topics
  welcomeSection: {
    paddingHorizontal: SPACING.xl,
    gap: 10,
    marginBottom: 16,
  },
  welcomeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.sm,
    padding: 12,
  },
  welcomeIcon: { fontSize: 16 },
  welcomeText: { fontSize: FONT_SIZE.md, color: COLORS.gray700 },

  // Chat button
  chatBtn: {
    marginHorizontal: SPACING.xl,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    ...SHADOWS.md,
  },
  chatBtnText: { color: '#fff', fontSize: FONT_SIZE.lg, fontWeight: '700' },

  // Connection
  connectionSection: {
    paddingHorizontal: SPACING.xl,
    gap: 10,
    marginBottom: 20,
  },
  connectBtn: {
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  connectBtnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' },
  messageInputBox: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  messageInput: { fontSize: FONT_SIZE.md, minHeight: 40, textAlignVertical: 'top' },
  messageCount: { fontSize: FONT_SIZE.xs, textAlign: 'right' },
  cancelLink: { fontSize: FONT_SIZE.sm, textAlign: 'center', paddingVertical: 8 },
  statusCard: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  statusEmoji: { fontSize: 28 },
  statusLabel: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  statusHint: { fontSize: FONT_SIZE.xs },
  chatStartBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
    marginTop: 4,
  },
  chatStartText: { color: '#fff', fontSize: FONT_SIZE.sm, fontWeight: '700' },
  acceptBtnLarge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.md,
    marginTop: 4,
  },
  acceptBtnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' },

  // Snapshots
  snapshotSection: {
    paddingHorizontal: SPACING.xl,
    gap: 12,
  },
  snapCard: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.gray50,
    ...SHADOWS.sm,
  },
  snapImage: { width: '100%', height: 200, backgroundColor: COLORS.gray200 },
  snapCaption: { fontSize: FONT_SIZE.md, color: COLORS.gray700, padding: 12, paddingBottom: 4 },
  snapDate: { fontSize: FONT_SIZE.xs, color: COLORS.gray400, paddingHorizontal: 12, paddingBottom: 12 },

  // More menu
  moreBtn: { padding: 8 },
  moreBtnText: { fontSize: 24, fontWeight: '700' },
  moreMenu: {
    position: 'absolute',
    top: 100,
    right: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingVertical: 4,
    minWidth: 160,
    zIndex: 100,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  moreMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  moreMenuIcon: { fontSize: 16 },
  moreMenuText: { fontSize: FONT_SIZE.md, fontWeight: '500' },
  moreMenuDivider: { height: 1, marginHorizontal: 12 },

  // Blocked banner
  blockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.xl,
    padding: 14,
    borderRadius: BORDER_RADIUS.md,
    gap: 12,
    marginBottom: 12,
  },
  blockedBannerIcon: { fontSize: 22 },
  blockedBannerTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  blockedBannerDesc: { fontSize: FONT_SIZE.xs, marginTop: 2 },
  unblockBtn: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  unblockBtnText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },

  // Compatibility card
  compatCard: {
    marginHorizontal: SPACING.xl,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  compatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  compatEmoji: { fontSize: 28 },
  compatLabel: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  compatDesc: { fontSize: FONT_SIZE.xs, marginTop: 2 },
  compatRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  compatArrow: { fontSize: FONT_SIZE.lg, fontWeight: '700' },

  // Note section
  noteSection: {
    marginHorizontal: SPACING.xl,
    padding: 14,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: 20,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: 12,
    fontSize: FONT_SIZE.sm,
    minHeight: 80,
    lineHeight: 22,
  },
  notePreview: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 22,
  },
});
