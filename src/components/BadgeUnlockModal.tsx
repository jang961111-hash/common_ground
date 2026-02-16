// ==========================================
// BadgeUnlockModal — 배지 달성 축하 모달
// ==========================================
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Badge } from '../types';
import { RARITY_COLORS, RARITY_LABELS } from '../constants/badges';
import { useTheme } from '../contexts/ThemeContext';
import { BORDER_RADIUS, FONT_SIZE, SHADOWS, SPACING } from '../constants/theme';

interface BadgeUnlockModalProps {
  badge: Badge | null;
  visible: boolean;
  onClose: () => void;
}

export const BadgeUnlockModal: React.FC<BadgeUnlockModalProps> = ({
  badge,
  visible,
  onClose,
}) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      sparkleAnim.setValue(0);

      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, sparkleAnim]);

  if (!badge) return null;

  const rarityColor = RARITY_COLORS[badge.rarity];
  const rarityLabel = RARITY_LABELS[badge.rarity];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            SHADOWS.lg,
            {
              backgroundColor: colors.white,
              borderColor: rarityColor,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* 스파클 이펙트 */}
          <Animated.Text
            style={[
              styles.sparkle,
              {
                opacity: sparkleAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 1, 0.7],
                }),
              },
            ]}
          >
            ✨🎉✨
          </Animated.Text>

          {/* 타이틀 */}
          <Text style={[styles.title, { color: rarityColor }]}>배지 달성!</Text>

          {/* 배지 이모지 */}
          <View
            style={[
              styles.emojiWrap,
              { backgroundColor: `${rarityColor}18`, borderColor: rarityColor },
            ]}
          >
            <Text style={styles.emoji}>{badge.emoji}</Text>
          </View>

          {/* 배지 이름 + 레어리티 */}
          <Text style={[styles.badgeName, { color: colors.gray900 }]}>{badge.name}</Text>
          <View style={[styles.rarityBadge, { backgroundColor: `${rarityColor}20` }]}>
            <Text style={[styles.rarityText, { color: rarityColor }]}>{rarityLabel}</Text>
          </View>

          {/* 설명 */}
          <Text style={[styles.description, { color: colors.gray600 }]}>
            {badge.description}
          </Text>

          {/* 닫기 버튼 */}
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: rarityColor }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>확인</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 2,
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xxl,
    alignItems: 'center',
  },
  sparkle: {
    fontSize: 28,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    marginBottom: SPACING.lg,
  },
  emojiWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emoji: {
    fontSize: 44,
  },
  badgeName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  rarityBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
  },
  rarityText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  description: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xxl,
  },
  btn: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxxl,
    borderRadius: BORDER_RADIUS.md,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});
