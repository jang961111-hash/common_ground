// ==========================================
// FeedCard — 소셜 피드 아이템 카드
// ==========================================
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import AnimatedPressable from './AnimatedPressable';
import Avatar from './Avatar';
import InterestTag from './InterestTag';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { FeedItem, FeedItemType } from '../types';

// ── 타입별 메타 ──
const TYPE_META: Record<FeedItemType, { emoji: string; label: string; color: string }> = {
  SNAPSHOT_POSTED: { emoji: '📸', label: '스냅샷', color: COLORS.primary },
  CONNECTION_MADE: { emoji: '🤝', label: '연결', color: COLORS.success },
  INTEREST_UPDATED: { emoji: '✨', label: '관심사 변경', color: COLORS.accent },
  USER_JOINED: { emoji: '👋', label: '새 멤버', color: COLORS.warning },
};

// ── 시간 포맷 ──
function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return new Date(timestamp).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

interface FeedCardProps {
  item: FeedItem;
  onPressUser: (userId: string) => void;
  onPressSnapshot?: (snapshotId: string) => void;
}

export default function FeedCard({ item, onPressUser, onPressSnapshot }: FeedCardProps) {
  const { colors } = useTheme();
  const meta = TYPE_META[item.type];

  // ── 콘텐츠 렌더 (타입별) ──
  const renderContent = () => {
    switch (item.type) {
      case 'SNAPSHOT_POSTED':
        return (
          <View>
            <Text style={[styles.body, { color: colors.gray700 }]}>
              새 스냅샷을 공유했어요
            </Text>
            {item.snapshot && (
              <AnimatedPressable
                onPress={() => onPressSnapshot?.(item.snapshot!.id)}
                style={[styles.snapshotPreview, { backgroundColor: colors.gray100 }]}
                accessibilityLabel="스냅샷 보기"
              >
                <Image
                  source={{ uri: item.snapshot.imageUrl }}
                  style={styles.snapshotImage}
                  resizeMode="cover"
                />
                {item.snapshot.caption && (
                  <Text
                    style={[styles.snapshotCaption, { color: colors.gray600 }]}
                    numberOfLines={2}
                  >
                    {item.snapshot.caption}
                  </Text>
                )}
              </AnimatedPressable>
            )}
          </View>
        );

      case 'CONNECTION_MADE':
        return (
          <Text style={[styles.body, { color: colors.gray700 }]}>
            <Text style={[styles.highlight, { color: colors.primary }]}>
              {item.connectedUserName}
            </Text>
            님과 연결되었어요 🎉
          </Text>
        );

      case 'INTEREST_UPDATED':
        return (
          <View>
            <Text style={[styles.body, { color: colors.gray700 }]}>
              관심사를 업데이트했어요
            </Text>
            {item.updatedInterests && item.updatedInterests.length > 0 && (
              <View style={styles.interestRow}>
                {item.updatedInterests.map(id => (
                  <InterestTag key={id} interestId={id} size="sm" />
                ))}
              </View>
            )}
          </View>
        );

      case 'USER_JOINED':
        return (
          <Text style={[styles.body, { color: colors.gray700 }]}>
            Common Ground에 새로 참여했어요! 환영해 주세요 🎊
          </Text>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatedPressable
      onPress={() => onPressUser(item.userId)}
      style={[
        styles.card,
        {
          backgroundColor: colors.white,
          borderColor: colors.gray200,
        },
        SHADOWS.sm,
      ]}
      accessibilityLabel={`${item.userName}의 ${meta.label} 활동`}
      accessibilityHint="프로필을 보려면 탭하세요"
    >
      {/* ── 헤더: 아바타 + 이름 + 타입 배지 + 시간 ── */}
      <View style={styles.header}>
        <Avatar
          name={item.userName}
          emoji={item.avatarEmoji}
          customColor={item.avatarColor}
          size={40}
        />
        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.gray900 }]} numberOfLines={1}>
              {item.userName}
            </Text>
            <View style={[styles.typeBadge, { backgroundColor: meta.color + '18' }]}>
              <Text style={[styles.typeBadgeText, { color: meta.color }]}>
                {meta.emoji} {meta.label}
              </Text>
            </View>
          </View>
          <Text style={[styles.time, { color: colors.gray400 }]}>
            {formatTimeAgo(item.timestamp)}
          </Text>
        </View>
      </View>

      {/* ── 콘텐츠 ── */}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  name: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    flexShrink: 1,
  },
  typeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  typeBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  time: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  content: {
    marginTop: SPACING.md,
    marginLeft: 40 + SPACING.md, // avatar 너비 + gap
  },
  body: {
    fontSize: FONT_SIZE.sm,
    lineHeight: FONT_SIZE.sm * 1.5,
  },
  highlight: {
    fontWeight: '700',
  },
  snapshotPreview: {
    marginTop: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  snapshotImage: {
    width: '100%',
    height: 160,
    borderRadius: BORDER_RADIUS.md,
  },
  snapshotCaption: {
    fontSize: FONT_SIZE.xs,
    padding: SPACING.sm,
  },
  interestRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
});
