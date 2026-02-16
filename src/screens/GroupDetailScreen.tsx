// ==========================================
// GroupDetailScreen — 그룹 상세 + 채팅
// ==========================================
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { GroupDetailScreenProps, InterestGroup, GroupMember, GroupMessage, GroupPreview } from '../types';
import { mockGroups } from '../services/mockService';
import ScreenHeader from '../components/ScreenHeader';
import { GroupMemberItem } from '../components/GroupMemberItem';
import { GroupChatBubble } from '../components/GroupChatBubble';
import Avatar from '../components/Avatar';
import InterestTag from '../components/InterestTag';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { useApiCall } from '../hooks/useApiCall';
import { BORDER_RADIUS, FONT_SIZE, SHADOWS, SPACING } from '../constants/theme';
import BookmarkButton from '../components/BookmarkButton';

type Tab = 'chat' | 'members' | 'info';

export default function GroupDetailScreen({ navigation, route }: GroupDetailScreenProps) {
  const { groupId } = route.params;
  const { user } = useAuth();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [joining, setJoining] = useState(false);
  const scrollRef = useRef<FlatList<GroupMessage>>(null);

  const { data: group, loading: groupLoading, refresh: refreshGroup } = useApiCall<InterestGroup | null>(
    useCallback(() => mockGroups.getGroupDetail(groupId), [groupId]),
  );
  const { data: members, refresh: refreshMembers } = useApiCall<GroupMember[]>(
    useCallback(() => mockGroups.getGroupMembers(groupId), [groupId]),
  );
  const { data: messages, refresh: refreshMessages } = useApiCall<GroupMessage[]>(
    useCallback(() => mockGroups.getGroupMessages(groupId), [groupId]),
  );

  const isMember = (members ?? []).some(m => m.userId === user?.id);
  const myRole = (members ?? []).find(m => m.userId === user?.id)?.role;

  // 새 메시지 시 자동 스크롤
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages?.length]);

  const handleJoin = useCallback(async () => {
    setJoining(true);
    try {
      await mockGroups.joinGroup(groupId);
      showToast('그룹에 가입했어요! 🎉', 'success');
      await Promise.all([refreshGroup(), refreshMembers()]);
    } catch {
      showToast('가입에 실패했어요', 'error');
    } finally {
      setJoining(false);
    }
  }, [groupId, showToast, refreshGroup, refreshMembers]);

  const handleLeave = useCallback(async () => {
    try {
      await mockGroups.leaveGroup(groupId);
      showToast('그룹에서 탈퇴했어요', 'info');
      navigation.goBack();
    } catch {
      showToast('탈퇴에 실패했어요', 'error');
    }
  }, [groupId, showToast, navigation]);

  const handleSend = useCallback(async () => {
    const text = messageText.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await mockGroups.sendGroupMessage(groupId, text);
      setMessageText('');
      await refreshMessages();
    } catch {
      showToast('전송 실패', 'error');
    } finally {
      setSending(false);
    }
  }, [messageText, sending, groupId, refreshMessages, showToast]);

  if (groupLoading || !group) {
    return (
      <View style={[styles.container, { backgroundColor: colors.white }]}>
        <ScreenHeader title="그룹" onBack={() => navigation.goBack()} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.white }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <ScreenHeader
        title={`${group.emoji} ${group.name}`}
        onBack={() => navigation.goBack()}
        rightElement={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <BookmarkButton targetType="GROUP" targetId={groupId} size="sm" />
            {isMember && myRole !== 'OWNER' && (
              <TouchableOpacity onPress={handleLeave}>
                <Text style={[styles.leaveBtn, { color: colors.error }]}>탈퇴</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* 탭 바 */}
      <View style={[styles.tabBar, { borderBottomColor: colors.gray200 }]}>
        {([
          { key: 'chat' as Tab, label: '💬 채팅' },
          { key: 'members' as Tab, label: `👥 ${(members ?? []).length}` },
          { key: 'info' as Tab, label: 'ℹ️ 정보' },
        ]).map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabItem,
              { borderBottomColor: activeTab === tab.key ? colors.primary : 'transparent' },
            ]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab.key ? colors.primary : colors.gray400 },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 탭 콘텐츠 */}
      {activeTab === 'chat' && (
        <>
          <FlatList
            ref={scrollRef}
            data={messages ?? []}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <GroupChatBubble message={item} isMe={item.senderId === user?.id} />
            )}
            contentContainerStyle={styles.chatList}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatEmoji}>💬</Text>
                <Text style={[styles.emptyChatText, { color: colors.gray400 }]}>
                  아직 대화가 없어요. 첫 메시지를 보내 보세요!
                </Text>
              </View>
            }
          />
          {isMember ? (
            <View style={[styles.inputBar, { backgroundColor: colors.gray50, borderTopColor: colors.gray200 }]}>
              <TextInput
                style={[styles.msgInput, { backgroundColor: colors.white, borderColor: colors.gray200, color: colors.gray900 }]}
                placeholder="메시지를 입력하세요"
                placeholderTextColor={colors.gray400}
                value={messageText}
                onChangeText={setMessageText}
                onSubmitEditing={handleSend}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  { backgroundColor: messageText.trim() ? colors.primary : colors.gray300 },
                ]}
                onPress={handleSend}
                disabled={!messageText.trim() || sending}
                activeOpacity={0.8}
              >
                <Text style={styles.sendBtnText}>전송</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.joinBar, { backgroundColor: colors.primaryBg }]}>
              <Text style={[styles.joinHint, { color: colors.gray600 }]}>
                그룹에 가입하면 채팅에 참여할 수 있어요
              </Text>
              <TouchableOpacity
                style={[styles.joinBtn, { backgroundColor: colors.primary }]}
                onPress={handleJoin}
                disabled={joining}
                activeOpacity={0.8}
              >
                {joining ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.joinBtnText}>가입하기</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {activeTab === 'members' && (
        <ScrollView contentContainerStyle={styles.membersContent}>
          {(members ?? [])
            .sort((a, b) => {
              const order = { OWNER: 0, ADMIN: 1, MEMBER: 2 };
              return order[a.role] - order[b.role];
            })
            .map(member => (
              <GroupMemberItem
                key={member.userId}
                member={member}
                onPress={
                  member.userId !== user?.id
                    ? () => navigation.navigate('UserDetail', { userId: member.userId })
                    : undefined
                }
              />
            ))}
        </ScrollView>
      )}

      {activeTab === 'info' && (
        <ScrollView contentContainerStyle={styles.infoContent}>
          {/* 그룹 아이콘 & 이름 */}
          <View style={styles.infoHeader}>
            <View style={[styles.infoEmoji, { backgroundColor: `${group.color}18` }]}>
              <Text style={styles.infoEmojiText}>{group.emoji}</Text>
            </View>
            <Text style={[styles.infoName, { color: colors.gray900 }]}>{group.name}</Text>
            <Text style={[styles.infoDesc, { color: colors.gray600 }]}>{group.description}</Text>
          </View>

          {/* 메타 정보 */}
          <View style={[styles.infoCard, { backgroundColor: colors.gray50 }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.gray500 }]}>멤버</Text>
              <Text style={[styles.infoValue, { color: colors.gray900 }]}>
                {group.memberCount}/{group.maxMembers}명
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.gray500 }]}>공개 여부</Text>
              <Text style={[styles.infoValue, { color: colors.gray900 }]}>
                {group.isPublic ? '🌐 공개' : '🔒 비공개'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.gray500 }]}>개설일</Text>
              <Text style={[styles.infoValue, { color: colors.gray900 }]}>
                {new Date(group.createdAt).toLocaleDateString('ko-KR')}
              </Text>
            </View>
          </View>

          {/* 관련 관심사 */}
          <Text style={[styles.infoSectionTitle, { color: colors.gray800 }]}>관련 관심사</Text>
          <View style={styles.infoTags}>
            {group.interestIds.map(id => (
              <InterestTag key={id} interestId={id} isHighlighted />
            ))}
          </View>

          {/* 가입/탈퇴 버튼 */}
          {!isMember ? (
            <TouchableOpacity
              style={[styles.bigJoinBtn, { backgroundColor: colors.primary }]}
              onPress={handleJoin}
              disabled={joining}
              activeOpacity={0.8}
            >
              {joining ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.bigJoinBtnText}>이 그룹에 가입하기</Text>
              )}
            </TouchableOpacity>
          ) : myRole !== 'OWNER' ? (
            <TouchableOpacity
              style={[styles.bigJoinBtn, { backgroundColor: colors.error }]}
              onPress={handleLeave}
              activeOpacity={0.8}
            >
              <Text style={styles.bigJoinBtnText}>그룹 탈퇴</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  leaveBtn: { fontSize: FONT_SIZE.sm, fontWeight: '600' },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },

  // Chat
  chatList: {
    paddingVertical: SPACING.md,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  emptyChat: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyChatEmoji: { fontSize: 40, marginBottom: SPACING.md },
  emptyChatText: { fontSize: FONT_SIZE.md, textAlign: 'center' },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    gap: SPACING.sm,
    borderTopWidth: 1,
  },
  msgInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
  },
  sendBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },

  // Join bar
  joinBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  joinHint: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
  },
  joinBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  joinBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },

  // Members
  membersContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },

  // Info
  infoContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  infoHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  infoEmoji: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  infoEmojiText: { fontSize: 36 },
  infoName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  infoDesc: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  infoCard: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: { fontSize: FONT_SIZE.sm },
  infoValue: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  infoSectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  infoTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.xl,
  },
  bigJoinBtn: {
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
  },
  bigJoinBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
});
