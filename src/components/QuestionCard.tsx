import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { COLORS, BORDER_RADIUS, FONT_SIZE, SHADOWS, SPACING } from '../constants/theme';
import { QuestionDepth, DEPTH_LABELS } from '../constants/questions';

interface QuestionCardProps {
  question: string;
  label?: string;
  emoji?: string;
  /** 질문 깊이 배지 */
  depth?: QuestionDepth;
  /** 후속 질문 목록 */
  followUps?: string[];
  /** 북마크 여부 */
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  onCopy?: () => void;
  isCopied?: boolean;
}

const copyToClipboard = async (text: string) => {
  if (Platform.OS === 'web') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch { return false; }
  }
  return false;
};

function QuestionCard({
  question, label, emoji, depth, followUps,
  isBookmarked, onToggleBookmark, onCopy, isCopied,
}: QuestionCardProps) {
  const [showFollowUps, setShowFollowUps] = useState(false);
  const depthInfo = depth ? DEPTH_LABELS[depth] : null;

  return (
    <View style={styles.card}>
      {/* 상단: 라벨 + 깊이 배지 */}
      <View style={styles.topRow}>
        <View style={styles.labels}>
          {label && (
            <Text style={styles.label}>{emoji} {label}</Text>
          )}
          {depthInfo && (
            <View style={[styles.depthBadge, { backgroundColor: depthInfo.color + '18' }]}>
              <Text style={[styles.depthText, { color: depthInfo.color }]}>
                {depthInfo.emoji} {depthInfo.label}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.actions}>
          {onToggleBookmark && (
            <Pressable style={styles.actionBtn} onPress={onToggleBookmark} accessibilityRole="button" accessibilityLabel={isBookmarked ? '북마크 해제' : '북마크 추가'} accessibilityState={{ checked: !!isBookmarked }}>
              <Text style={{ fontSize: 16 }}>{isBookmarked ? '⭐' : '☆'}</Text>
            </Pressable>
          )}
          {onCopy && (
            <Pressable style={styles.actionBtn} onPress={onCopy} accessibilityRole="button" accessibilityLabel={isCopied ? '질문 복사됨' : '질문 복사'}>
              <Text style={{ fontSize: 16 }}>{isCopied ? '✓' : '📋'}</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* 질문 본문 */}
      <Text style={styles.question}>"{question}"</Text>

      {/* 후속 질문 */}
      {followUps && followUps.length > 0 && (
        <View style={styles.followUpArea}>
          <Pressable
            style={styles.followUpToggle}
            onPress={() => setShowFollowUps(!showFollowUps)}
            accessibilityRole="button"
            accessibilityLabel={`이어서 물어보기 ${followUps.length}개 ${showFollowUps ? '접기' : '펼치기'}`}
            accessibilityState={{ expanded: showFollowUps }}
          >
            <Text style={styles.followUpToggleText}>
              {showFollowUps ? '▲' : '▼'} 이어서 물어보기 ({followUps.length})
            </Text>
          </Pressable>
          {showFollowUps && (
            <View style={styles.followUpList}>
              {followUps.map((fu, idx) => (
                <View key={idx} style={styles.followUpItem}>
                  <Text style={styles.followUpArrow}>↳</Text>
                  <Text style={styles.followUpText}>"{fu}"</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    padding: 14,
    marginBottom: 10,
    ...SHADOWS.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labels: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  depthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  depthText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionBtn: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  question: {
    fontSize: FONT_SIZE.md,
    color: COLORS.gray800,
    lineHeight: 22,
  },
  followUpArea: {
    marginTop: 10,
  },
  followUpToggle: {
    paddingVertical: 4,
  },
  followUpToggleText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  followUpList: {
    marginTop: 6,
    paddingLeft: 4,
    gap: 6,
  },
  followUpItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  followUpArrow: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray400,
    marginTop: 1,
  },
  followUpText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray600,
    flex: 1,
    lineHeight: 20,
  },
});

export default React.memo(QuestionCard);
