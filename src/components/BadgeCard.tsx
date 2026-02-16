// ==========================================
// BadgeCard — 배지 카드 컴포넌트
// ==========================================
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Badge, BadgeRarity } from '../types';
import { RARITY_COLORS, RARITY_LABELS } from '../constants/badges';
import { useTheme } from '../contexts/ThemeContext';
import { BORDER_RADIUS, FONT_SIZE, SHADOWS, SPACING } from '../constants/theme';

interface BadgeCardProps {
  badge: Badge;
  compact?: boolean;
}

export const BadgeCard: React.FC<BadgeCardProps> = ({ badge, compact = false }) => {
  const { colors } = useTheme();
  const isUnlocked = !!badge.unlockedAt;
  const rarityColor = RARITY_COLORS[badge.rarity];
  const rarityLabel = RARITY_LABELS[badge.rarity];

  if (compact) {
    return (
      <View
        style={[
          styles.compactCard,
          {
            backgroundColor: colors.gray50,
            borderColor: isUnlocked ? rarityColor : colors.gray200,
            opacity: isUnlocked ? 1 : 0.55,
          },
        ]}
      >
        <Text style={styles.compactEmoji}>{badge.emoji}</Text>
        <Text
          style={[styles.compactName, { color: isUnlocked ? colors.gray900 : colors.gray400 }]}
          numberOfLines={1}
        >
          {badge.name}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.card,
        SHADOWS.sm,
        {
          backgroundColor: colors.white,
          borderColor: isUnlocked ? rarityColor : colors.gray200,
        },
      ]}
    >
      {/* 배지 이모지 + 레어리티 */}
      <View style={styles.header}>
        <View
          style={[
            styles.emojiWrap,
            {
              backgroundColor: isUnlocked ? `${rarityColor}18` : colors.gray100,
            },
          ]}
        >
          <Text style={[styles.emoji, { opacity: isUnlocked ? 1 : 0.4 }]}>{badge.emoji}</Text>
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.name, { color: isUnlocked ? colors.gray900 : colors.gray400 }]}
              numberOfLines={1}
            >
              {badge.name}
            </Text>
            <View style={[styles.rarityBadge, { backgroundColor: `${rarityColor}20` }]}>
              <Text style={[styles.rarityText, { color: rarityColor }]}>{rarityLabel}</Text>
            </View>
          </View>
          <Text
            style={[styles.desc, { color: isUnlocked ? colors.gray600 : colors.gray400 }]}
            numberOfLines={2}
          >
            {badge.description}
          </Text>
        </View>
      </View>

      {/* 진행도 바 (잠긴 배지) */}
      {!isUnlocked && (
        <View style={styles.progressSection}>
          <View style={[styles.progressBg, { backgroundColor: colors.gray100 }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: rarityColor,
                  width: `${Math.min(badge.progress, 100)}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.gray500 }]}>
            {badge.progress}%
          </Text>
        </View>
      )}

      {/* 달성 날짜 */}
      {isUnlocked && badge.unlockedAt && (
        <Text style={[styles.unlockedDate, { color: rarityColor }]}>
          ✓ {new Date(badge.unlockedAt).toLocaleDateString('ko-KR')} 달성
        </Text>
      )}

      {/* 조건 설명 */}
      <Text style={[styles.condition, { color: colors.gray400 }]}>
        {badge.condition}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  // ── Full card ──
  card: {
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  emojiWrap: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 28,
  },
  info: {
    flex: 1,
  },
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
  rarityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  rarityText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  desc: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 18,
  },

  // ── Progress ──
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  progressBg: {
    flex: 1,
    height: 6,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  progressText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    width: 36,
    textAlign: 'right',
  },

  // ── Unlocked date ──
  unlockedDate: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    marginTop: SPACING.sm,
  },

  // ── Condition ──
  condition: {
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.xs,
  },

  // ── Compact card ──
  compactCard: {
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    width: 80,
    height: 80,
    gap: SPACING.xs,
  },
  compactEmoji: {
    fontSize: 28,
  },
  compactName: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
});
