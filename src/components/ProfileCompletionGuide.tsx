import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { User } from '../types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type ProfileSection = 'name' | 'bio' | 'recent' | 'always' | 'topics';

interface CompletionItem {
  key: ProfileSection;
  label: string;
  emoji: string;
  hint: string;
  weight: number;
  completed: boolean;
}

interface Props {
  user: User;
  onNavigateToSection: (section: ProfileSection) => void;
}

function getItems(user: User): CompletionItem[] {
  return [
    {
      key: 'name',
      label: '이름',
      emoji: '👤',
      hint: '이름 또는 닉네임을 입력하세요',
      weight: 20,
      completed: !!user.displayName,
    },
    {
      key: 'bio',
      label: '자기소개',
      emoji: '📝',
      hint: '나를 한 줄로 표현해보세요',
      weight: 20,
      completed: !!user.bio,
    },
    {
      key: 'recent',
      label: '요즘 관심사',
      emoji: '🔥',
      hint: '요즘 빠져있는 관심사를 추가하세요',
      weight: 25,
      completed: user.recentInterests.length > 0,
    },
    {
      key: 'always',
      label: '항상 관심사',
      emoji: '❤️',
      hint: '오래 좋아하던 관심사를 추가하세요',
      weight: 20,
      completed: user.alwaysInterests.length > 0,
    },
    {
      key: 'topics',
      label: '대화 환영 주제',
      emoji: '💬',
      hint: '대화하고 싶은 주제를 적어보세요',
      weight: 15,
      completed: user.welcomeTopics.length > 0,
    },
  ];
}

export function getCompletionPct(user: User): number {
  return getItems(user).reduce((sum, item) => sum + (item.completed ? item.weight : 0), 0);
}

export default function ProfileCompletionGuide({ user, onNavigateToSection }: Props) {
  const [expanded, setExpanded] = useState(false);
  const items = getItems(user);
  const pct = items.reduce((sum, item) => sum + (item.completed ? item.weight : 0), 0);
  const completedCount = items.filter(i => i.completed).length;
  const nextIncomplete = items.find(i => !i.completed);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => !prev);
  };

  if (pct >= 100) return null;

  return (
    <View style={styles.container}>
      {/* Header - always visible */}
      <Pressable style={styles.header} onPress={toggle} accessibilityRole="button" accessibilityLabel={`프로필 완성도 ${pct}%, ${expanded ? '접기' : '펼치기'}`} accessibilityState={{ expanded }}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>프로필 완성도</Text>
          <Text style={styles.counter}>
            {completedCount}/{items.length} 완료
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.pctText}>{pct}%</Text>
          <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </Pressable>

      {/* Progress bar */}
      <View style={styles.progressBar} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: pct }}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>

      {/* Collapsed: show next hint */}
      {!expanded && nextIncomplete && (
        <Pressable
          style={styles.nextHint}
          onPress={() => onNavigateToSection(nextIncomplete.key)}
          accessibilityRole="button"
          accessibilityLabel={`${nextIncomplete.label} 작성하기: ${nextIncomplete.hint}`}
        >
          <Text style={styles.nextHintEmoji}>{nextIncomplete.emoji}</Text>
          <Text style={styles.nextHintText}>{nextIncomplete.hint}</Text>
          <Text style={styles.nextHintArrow}>→</Text>
        </Pressable>
      )}

      {/* Expanded: checklist */}
      {expanded && (
        <View style={styles.checklist}>
          {items.map((item) => (
            <Pressable
              key={item.key}
              style={[styles.checkItem, item.completed && styles.checkItemDone]}
              onPress={() => {
                if (!item.completed) {
                  onNavigateToSection(item.key);
                }
              }}
              disabled={item.completed}
              accessibilityRole="button"
              accessibilityLabel={`${item.label} ${item.completed ? '완료' : '미완료, 탭하여 작성'}`}
              accessibilityState={{ disabled: item.completed }}
            >
              <Text style={styles.checkIcon}>
                {item.completed ? '✅' : '⬜'}
              </Text>
              <View style={styles.checkContent}>
                <Text style={[
                  styles.checkLabel,
                  item.completed && styles.checkLabelDone,
                ]}>
                  {item.emoji} {item.label}
                </Text>
                {!item.completed && (
                  <Text style={styles.checkHint}>{item.hint}</Text>
                )}
              </View>
              <View style={styles.checkWeight}>
                <Text style={[
                  styles.checkWeightText,
                  item.completed && styles.checkWeightDone,
                ]}>
                  +{item.weight}%
                </Text>
              </View>
              {!item.completed && (
                <Text style={styles.checkArrow}>→</Text>
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primaryBg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.primary,
  },
  counter: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray500,
  },
  pctText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: COLORS.primary,
  },
  chevron: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
  },

  // Progress bar
  progressBar: {
    height: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },

  // Collapsed hint
  nextHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  nextHintEmoji: {
    fontSize: 16,
  },
  nextHintText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray600,
  },
  nextHintArrow: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Checklist
  checklist: {
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  checkItemDone: {
    opacity: 0.6,
  },
  checkIcon: {
    fontSize: 18,
  },
  checkContent: {
    flex: 1,
    gap: 2,
  },
  checkLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.gray800,
  },
  checkLabelDone: {
    textDecorationLine: 'line-through',
    color: COLORS.gray500,
  },
  checkHint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray500,
  },
  checkWeight: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primaryLight,
  },
  checkWeightText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.primary,
  },
  checkWeightDone: {
    color: COLORS.gray400,
  },
  checkArrow: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
