// ==========================================
// ChatScreen — 1:1 채팅 화면
// ==========================================
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, FlatList, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, Animated, LayoutAnimation,
  Modal, TouchableOpacity,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { mockChat } from '../services/mockService';
import Avatar from '../components/Avatar';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { ChatMessage, ChatScreenProps, MessageReaction } from '../types';

// ── 리액션 이모지 목록 ──
const REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🔥'];

// ── 리액션 요약 (같은 이모지 그룹핑) ──
interface ReactionGroup {
  emoji: string;
  count: number;
  includesMe: boolean;
}

function groupReactions(reactions: MessageReaction[], myUserId: string): ReactionGroup[] {
  const map = new Map<string, ReactionGroup>();
  for (const r of reactions) {
    const existing = map.get(r.emoji);
    if (existing) {
      existing.count++;
      if (r.userId === myUserId) existing.includesMe = true;
    } else {
      map.set(r.emoji, {
        emoji: r.emoji,
        count: 1,
        includesMe: r.userId === myUserId,
      });
    }
  }
  return Array.from(map.values());
}

// ── 리액션 표시 바 ──
const ReactionBar = React.memo(function ReactionBar({
  reactions, myUserId, onToggle, colors,
}: {
  reactions: MessageReaction[];
  myUserId: string;
  onToggle: (emoji: string) => void;
  colors: any;
}) {
  if (!reactions || reactions.length === 0) return null;
  const groups = groupReactions(reactions, myUserId);

  return (
    <View style={styles.reactionBar}>
      {groups.map(g => (
        <Pressable
          key={g.emoji}
          style={[
            styles.reactionChip,
            {
              backgroundColor: g.includesMe ? colors.primaryBg : colors.gray100,
              borderColor: g.includesMe ? colors.primary : colors.gray200,
            },
          ]}
          onPress={() => onToggle(g.emoji)}
          accessibilityRole="button"
          accessibilityLabel={`${g.emoji} 리액션 ${g.count}개${g.includesMe ? ', 내가 눌렀음' : ''}`}
        >
          <Text style={styles.reactionChipEmoji}>{g.emoji}</Text>
          {g.count > 1 && (
            <Text style={[styles.reactionChipCount, { color: g.includesMe ? colors.primary : colors.gray600 }]}>
              {g.count}
            </Text>
          )}
        </Pressable>
      ))}
    </View>
  );
});

// ── 메시지 버블 컴포넌트 ──
const MessageBubble = React.memo(function MessageBubble({
  message, isMine, colors, myUserId, onLongPress, onToggleReaction,
}: {
  message: ChatMessage;
  isMine: boolean;
  colors: any;
  myUserId: string;
  onLongPress: (messageId: string) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
}) {
  const time = useMemo(() => {
    const d = new Date(message.createdAt);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }, [message.createdAt]);

  return (
    <View
      style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}
      accessibilityLabel={`${isMine ? '나' : '상대방'}: ${message.text}, ${time}`}
    >
      <Pressable
        onLongPress={() => onLongPress(message.id)}
        delayLongPress={400}
        style={[
          styles.bubble,
          isMine
            ? [styles.bubbleMine, { backgroundColor: colors.primary }]
            : [styles.bubbleTheirs, { backgroundColor: colors.gray100 }],
        ]}
      >
        <Text style={[styles.bubbleText, { color: isMine ? '#fff' : colors.gray900 }]}>
          {message.text}
        </Text>
      </Pressable>
      <ReactionBar
        reactions={message.reactions ?? []}
        myUserId={myUserId}
        onToggle={(emoji) => onToggleReaction(message.id, emoji)}
        colors={colors}
      />
      <Text style={[styles.bubbleTime, { color: colors.gray400 }]}>{time}</Text>
    </View>
  );
});

// ── 날짜 구분선 ──
function DateSeparator({ date, colors }: { date: string; colors: any }) {
  return (
    <View style={styles.dateSep} accessibilityRole="text">
      <View style={[styles.dateLine, { backgroundColor: colors.gray200 }]} />
      <Text style={[styles.dateText, { color: colors.gray400, backgroundColor: colors.gray50 }]}>{date}</Text>
      <View style={[styles.dateLine, { backgroundColor: colors.gray200 }]} />
    </View>
  );
}

export default function ChatScreen({ route, navigation }: ChatScreenProps) {
  const { userId, conversationId: paramConvId } = route.params;
  const { user } = useAuth();
  const { colors } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [convId, setConvId] = useState<string | null>(paramConvId ?? null);
  const [otherName, setOtherName] = useState('');
  const [otherOnline, setOtherOnline] = useState(false);
  const [sending, setSending] = useState(false);
  const [reactionTargetId, setReactionTargetId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const prevMessageCount = useRef(0);

  // 초기 로드: 대화방 가져오기/생성
  useEffect(() => {
    (async () => {
      try {
        const conv = await mockChat.getOrCreateConversation(userId);
        setConvId(conv.id);
        const msgs = await mockChat.getMessages(conv.id);
        setMessages(msgs);
        await mockChat.markAsRead(conv.id);

        // 상대방 정보 가져오기
        const convList = await mockChat.getConversations();
        const thisConv = convList.find(c => c.id === conv.id);
        if (thisConv) {
          setOtherName(thisConv.otherUser.displayName);
          setOtherOnline(thisConv.otherUser.isOnline);
        } else {
          // 대화가 없으면 ConnectionsScreen에서 이름 가져와야 하지만, 간단하게 처리
          setOtherName('상대방');
        }
      } catch { /* empty */ }
    })();
  }, [userId, paramConvId]);

  // 2초 간격 폴링 (새 메시지 수신 시뮬레이션)
  useEffect(() => {
    if (!convId) return;
    const interval = setInterval(async () => {
      const msgs = await mockChat.getMessages(convId);
      if (msgs.length !== prevMessageCount.current) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setMessages(msgs);
        prevMessageCount.current = msgs.length;
        await mockChat.markAsRead(convId);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [convId]);

  // 메시지 수 변경 시 스크롤 to bottom
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
    prevMessageCount.current = messages.length;
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !convId || sending) return;

    setSending(true);
    setInputText('');
    try {
      const sentMsg = await mockChat.sendMessage(convId, text);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setMessages(prev => [...prev, sentMsg]);
    } catch { /* empty */ } finally {
      setSending(false);
    }
  }, [inputText, convId, sending]);

  // ── 리액션 핸들러 ──
  const handleLongPress = useCallback((messageId: string) => {
    setReactionTargetId(messageId);
  }, []);

  const handleToggleReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      const updated = await mockChat.toggleReaction(messageId, emoji);
      setMessages(prev =>
        prev.map(m => (m.id === messageId ? { ...m, reactions: updated.reactions } : m)),
      );
    } catch { /* empty */ }
    setReactionTargetId(null);
  }, []);

  const handlePickReaction = useCallback((emoji: string) => {
    if (reactionTargetId) {
      handleToggleReaction(reactionTargetId, emoji);
    }
  }, [reactionTargetId, handleToggleReaction]);

  // 날짜별 그룹핑 데이터
  const groupedData = useMemo(() => {
    const result: (ChatMessage | { type: 'date'; label: string; id: string })[] = [];
    let lastDate = '';
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

    for (const msg of messages) {
      const d = new Date(msg.createdAt);
      const dateStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (dateStr !== lastDate) {
        lastDate = dateStr;
        const label = dateStr === todayStr
          ? '오늘'
          : `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
        result.push({ type: 'date', label, id: `date-${dateStr}` });
      }
      result.push(msg);
    }
    return result;
  }, [messages]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    if (item.type === 'date') {
      return <DateSeparator date={item.label} colors={colors} />;
    }
    return (
      <MessageBubble
        message={item as ChatMessage}
        isMine={item.senderId === user?.id}
        colors={colors}
        myUserId={user?.id ?? ''}
        onLongPress={handleLongPress}
        onToggleReaction={handleToggleReaction}
      />
    );
  }, [colors, user?.id, handleLongPress, handleToggleReaction]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.gray50 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.gray200 }]}>
        <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="뒤로 가기" hitSlop={12}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>←</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Avatar name={otherName || '?'} size={36} showOnline isOnline={otherOnline} />
          <View>
            <Text style={[styles.headerName, { color: colors.gray900 }]} numberOfLines={1}>{otherName}</Text>
            <Text style={[styles.headerStatus, { color: otherOnline ? COLORS.success : colors.gray400 }]}>
              {otherOnline ? '온라인' : '오프라인'}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => navigation.navigate('UserDetail', { userId })}
          accessibilityRole="button"
          accessibilityLabel="프로필 보기"
          hitSlop={12}
        >
          <Text style={[styles.headerAction, { color: colors.primary }]}>프로필</Text>
        </Pressable>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={groupedData}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }}
      />

      {/* Input Bar */}
      <View style={[styles.inputBar, { backgroundColor: colors.white, borderTopColor: colors.gray200 }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.gray100, color: colors.gray900 }]}
          value={inputText}
          onChangeText={setInputText}
          placeholder="메시지를 입력하세요..."
          placeholderTextColor={colors.gray400}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
          accessibilityLabel="메시지 입력"
        />
        <Pressable
          style={[
            styles.sendBtn,
            { backgroundColor: inputText.trim() ? colors.primary : colors.gray300 },
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
          accessibilityRole="button"
          accessibilityLabel="메시지 전송"
        >
          <Text style={styles.sendIcon}>↑</Text>
        </Pressable>
      </View>

      {/* 리액션 선택 모달 */}
      <Modal
        visible={reactionTargetId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setReactionTargetId(null)}
      >
        <Pressable
          style={styles.reactionOverlay}
          onPress={() => setReactionTargetId(null)}
        >
          <View style={[styles.reactionPicker, { backgroundColor: colors.white, ...SHADOWS.lg }]}>
            <Text style={[styles.reactionPickerTitle, { color: colors.gray500 }]}>리액션 추가</Text>
            <View style={styles.reactionPickerRow}>
              {REACTION_EMOJIS.map(emoji => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.reactionPickerBtn}
                  onPress={() => handlePickReaction(emoji)}
                  activeOpacity={0.6}
                  accessibilityRole="button"
                  accessibilityLabel={`${emoji} 리액션`}
                >
                  <Text style={styles.reactionPickerEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
  },
  backBtn: { fontSize: 24, fontWeight: '600', paddingRight: 4 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginHorizontal: 12 },
  headerName: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  headerStatus: { fontSize: FONT_SIZE.xs },
  headerAction: { fontSize: FONT_SIZE.sm, fontWeight: '600' },

  messageList: { padding: SPACING.md, paddingBottom: 8, flexGrow: 1 },

  // Date separator
  dateSep: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  dateLine: { flex: 1, height: 1 },
  dateText: { paddingHorizontal: 12, fontSize: FONT_SIZE.xs },

  // Bubbles
  bubbleRow: { marginBottom: 6, maxWidth: '80%' },
  bubbleRowMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubbleRowTheirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: BORDER_RADIUS.lg },
  bubbleMine: { borderBottomRightRadius: 4 },
  bubbleTheirs: { borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: FONT_SIZE.md, lineHeight: 22 },
  bubbleTime: { fontSize: 10, marginTop: 2, marginHorizontal: 4 },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
    gap: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: FONT_SIZE.md,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: { color: '#fff', fontSize: 20, fontWeight: '700' },

  // Reactions
  reactionBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  reactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    gap: 2,
  },
  reactionChipEmoji: { fontSize: 14 },
  reactionChipCount: { fontSize: 11, fontWeight: '600' },

  // Reaction picker modal
  reactionOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  reactionPicker: {
    borderRadius: BORDER_RADIUS.xl,
    padding: 16,
    alignItems: 'center',
    minWidth: 280,
  },
  reactionPickerTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    marginBottom: 12,
  },
  reactionPickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  reactionPickerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionPickerEmoji: { fontSize: 28 },
});
