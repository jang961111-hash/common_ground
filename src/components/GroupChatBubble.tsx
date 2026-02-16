// ==========================================
// GroupChatBubble — 그룹 채팅 메시지 버블
// ==========================================
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GroupMessage } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '../constants/theme';

interface GroupChatBubbleProps {
  message: GroupMessage;
  isMe: boolean;
}

export const GroupChatBubble: React.FC<GroupChatBubbleProps> = ({ message, isMe }) => {
  const { colors } = useTheme();

  const timeStr = new Date(message.createdAt).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  if (isMe) {
    return (
      <View style={styles.myRow}>
        <Text style={[styles.time, { color: colors.gray400 }]}>{timeStr}</Text>
        <View style={[styles.myBubble, { backgroundColor: colors.primary }]}>
          <Text style={styles.myText}>{message.text}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.otherRow}>
      {/* 발신자 아바타 */}
      <View style={[styles.senderAvatar, { backgroundColor: colors.gray200 }]}>
        <Text style={styles.senderEmoji}>{message.senderEmoji || '👤'}</Text>
      </View>
      <View style={styles.otherContent}>
        <Text style={[styles.senderName, { color: colors.gray500 }]}>{message.senderName}</Text>
        <View style={[styles.otherBubble, { backgroundColor: colors.gray100 }]}>
          <Text style={[styles.otherText, { color: colors.gray900 }]}>{message.text}</Text>
        </View>
      </View>
      <Text style={[styles.time, { color: colors.gray400 }]}>{timeStr}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  // My message
  myRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  myBubble: {
    maxWidth: '70%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius: SPACING.xs,
  },
  myText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    lineHeight: 22,
  },

  // Other message
  otherRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  senderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: 18, // offset for sender name
  },
  senderEmoji: {
    fontSize: 16,
  },
  otherContent: {
    maxWidth: '65%',
  },
  senderName: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    marginBottom: 2,
    marginLeft: 4,
  },
  otherBubble: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    borderBottomLeftRadius: SPACING.xs,
  },
  otherText: {
    fontSize: FONT_SIZE.md,
    lineHeight: 22,
  },

  // Common
  time: {
    fontSize: 10,
    marginBottom: 2,
  },
});
