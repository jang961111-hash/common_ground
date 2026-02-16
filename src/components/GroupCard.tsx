// ==========================================
// GroupCard — 그룹 프리뷰 카드
// ==========================================
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GroupPreview } from '../types';
import { getInterestById } from '../constants/interests';
import InterestTag from './InterestTag';
import { useTheme } from '../contexts/ThemeContext';
import { BORDER_RADIUS, FONT_SIZE, SHADOWS, SPACING } from '../constants/theme';

interface GroupCardProps {
  group: GroupPreview;
  onPress?: () => void;
  compact?: boolean;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group, onPress, compact = false }) => {
  const { colors } = useTheme();

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactCard, { backgroundColor: colors.gray50, borderColor: `${group.color}40` }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.compactEmojiBg, { backgroundColor: `${group.color}18` }]}>
          <Text style={styles.compactEmoji}>{group.emoji}</Text>
        </View>
        <Text style={[styles.compactName, { color: colors.gray900 }]} numberOfLines={1}>
          {group.name}
        </Text>
        <Text style={[styles.compactMembers, { color: colors.gray400 }]}>
          👥 {group.memberCount}
        </Text>
      </TouchableOpacity>
    );
  }

  const timeAgo = _formatTimeAgo(group.lastActivity);

  return (
    <TouchableOpacity
      style={[styles.card, SHADOWS.sm, { backgroundColor: colors.white, borderColor: colors.gray200 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        <View style={[styles.emojiBg, { backgroundColor: `${group.color}18` }]}>
          <Text style={styles.emoji}>{group.emoji}</Text>
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.gray900 }]} numberOfLines={1}>
              {group.name}
            </Text>
            {group.isMember && (
              <View style={[styles.memberBadge, { backgroundColor: colors.primaryBg }]}>
                <Text style={[styles.memberBadgeText, { color: colors.primary }]}>가입됨</Text>
              </View>
            )}
          </View>
          <View style={styles.metaRow}>
            <Text style={[styles.meta, { color: colors.gray500 }]}>
              👥 {group.memberCount}명
            </Text>
            <Text style={[styles.meta, { color: colors.gray400 }]}>·</Text>
            <Text style={[styles.meta, { color: colors.gray400 }]}>{timeAgo}</Text>
          </View>
        </View>
      </View>
      {/* 관심사 태그 */}
      <View style={styles.tags}>
        {group.interestIds.slice(0, 3).map(id => {
          const interest = getInterestById(id);
          return interest ? (
            <View key={id} style={[styles.tag, { backgroundColor: `${group.color}12`, borderColor: `${group.color}30` }]}>
              <Text style={[styles.tagText, { color: group.color }]}>
                {interest.emoji} {interest.label}
              </Text>
            </View>
          ) : null;
        })}
        {group.interestIds.length > 3 && (
          <Text style={[styles.moreTag, { color: colors.gray400 }]}>+{group.interestIds.length - 3}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

function _formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return `${Math.floor(days / 7)}주 전`;
}

const styles = StyleSheet.create({
  // Full card
  card: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  emojiBg: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 24 },
  info: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 2,
  },
  name: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    flexShrink: 1,
  },
  memberBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  memberBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  meta: {
    fontSize: FONT_SIZE.sm,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  tag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
  tagText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  moreTag: {
    fontSize: FONT_SIZE.xs,
    alignSelf: 'center',
    marginLeft: 2,
  },

  // Compact card
  compactCard: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    width: 100,
    gap: SPACING.xs,
  },
  compactEmojiBg: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactEmoji: { fontSize: 20 },
  compactName: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
  compactMembers: {
    fontSize: 10,
  },
});
