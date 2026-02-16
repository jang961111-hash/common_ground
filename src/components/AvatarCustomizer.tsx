// ==========================================
// AvatarCustomizer — 아바타 이모지 & 색상 선택
// ==========================================
import React, { useState, useCallback } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, Modal,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import Avatar from './Avatar';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING } from '../constants/theme';

const AVATAR_EMOJIS = [
  // 표정
  '😊', '😎', '🤓', '🥳', '😍', '🤗', '🧐', '😄',
  // 활동
  '🎵', '🎨', '📸', '🎮', '⚽', '🏀', '🎸', '🎹',
  // 동물
  '🐱', '🐶', '🦊', '🐻', '🐼', '🦁', '🐸', '🐧',
  // 자연/음식
  '🌸', '🌊', '☕', '🍕', '🌈', '⭐', '🔥', '🌙',
  // 직업/역할
  '💻', '🚀', '📚', '✈️', '🎯', '💡', '🎭', '🏔️',
];

const AVATAR_COLORS = [
  '#FF6B6B', '#FF8A65', '#FFB74D', '#FFD54F',
  '#AED581', '#4ECDC4', '#4DD0E1', '#45B7D1',
  '#64B5F6', '#7986CB', '#9575CD', '#BB8FCE',
  '#F06292', '#DDA0DD', '#A1887F', '#90A4AE',
];

interface AvatarCustomizerProps {
  visible: boolean;
  currentEmoji: string | null;
  currentColor: string | null;
  displayName: string;
  onSave: (emoji: string | null, color: string | null) => void;
  onClose: () => void;
}

export default function AvatarCustomizer({
  visible,
  currentEmoji,
  currentColor,
  displayName,
  onSave,
  onClose,
}: AvatarCustomizerProps) {
  const { colors } = useTheme();
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(currentEmoji);
  const [selectedColor, setSelectedColor] = useState<string | null>(currentColor);
  const [tab, setTab] = useState<'emoji' | 'color'>('emoji');

  // Sync with props when shown
  React.useEffect(() => {
    if (visible) {
      setSelectedEmoji(currentEmoji);
      setSelectedColor(currentColor);
      setTab('emoji');
    }
  }, [visible, currentEmoji, currentColor]);

  const handleSave = useCallback(() => {
    onSave(selectedEmoji, selectedColor);
  }, [selectedEmoji, selectedColor, onSave]);

  const handleReset = useCallback(() => {
    setSelectedEmoji(null);
    setSelectedColor(null);
  }, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.white }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.gray300 }]} />

          {/* Preview */}
          <View style={styles.preview}>
            <Avatar
              name={displayName}
              size={96}
              emoji={selectedEmoji}
              customColor={selectedColor}
            />
            <Text style={[styles.previewName, { color: colors.gray900 }]}>{displayName}</Text>
            <Text style={[styles.previewHint, { color: colors.gray400 }]}>
              이모지와 색상을 선택해 나만의 아바타를 만들어보세요
            </Text>
          </View>

          {/* Tabs */}
          <View style={[styles.tabs, { borderBottomColor: colors.gray200 }]}>
            <Pressable
              style={[styles.tab, tab === 'emoji' && [styles.tabActive, { borderBottomColor: colors.primary }]]}
              onPress={() => setTab('emoji')}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === 'emoji' }}
            >
              <Text style={[
                styles.tabText,
                { color: tab === 'emoji' ? colors.primary : colors.gray500 },
              ]}>😊 이모지</Text>
            </Pressable>
            <Pressable
              style={[styles.tab, tab === 'color' && [styles.tabActive, { borderBottomColor: colors.primary }]]}
              onPress={() => setTab('color')}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === 'color' }}
            >
              <Text style={[
                styles.tabText,
                { color: tab === 'color' ? colors.primary : colors.gray500 },
              ]}>🎨 색상</Text>
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView style={styles.contentScroll} contentContainerStyle={styles.content}>
            {tab === 'emoji' ? (
              <View style={styles.grid}>
                {AVATAR_EMOJIS.map((emoji) => (
                  <Pressable
                    key={emoji}
                    style={[
                      styles.emojiItem,
                      { backgroundColor: colors.gray50 },
                      selectedEmoji === emoji && [styles.emojiSelected, { borderColor: colors.primary, backgroundColor: colors.primaryBg }],
                    ]}
                    onPress={() => setSelectedEmoji(selectedEmoji === emoji ? null : emoji)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: selectedEmoji === emoji }}
                    accessibilityLabel={`이모지 ${emoji}`}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={styles.grid}>
                {AVATAR_COLORS.map((color) => (
                  <Pressable
                    key={color}
                    style={[
                      styles.colorItem,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorSelected,
                    ]}
                    onPress={() => setSelectedColor(selectedColor === color ? null : color)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: selectedColor === color }}
                    accessibilityLabel={`색상 ${color}`}
                  >
                    {selectedColor === color && (
                      <Text style={styles.colorCheck}>✓</Text>
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.resetBtn, { borderColor: colors.gray200 }]}
              onPress={handleReset}
              accessibilityRole="button"
              accessibilityLabel="기본값으로 초기화"
            >
              <Text style={[styles.resetText, { color: colors.gray600 }]}>초기화</Text>
            </Pressable>
            <Pressable
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              accessibilityRole="button"
              accessibilityLabel="아바타 저장"
            >
              <Text style={styles.saveText}>적용하기</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  preview: {
    alignItems: 'center',
    gap: 8,
    paddingBottom: 16,
  },
  previewName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginTop: 4,
  },
  previewHint: {
    fontSize: FONT_SIZE.xs,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginHorizontal: SPACING.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {},
  tabText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  contentScroll: {
    maxHeight: 280,
  },
  content: {
    padding: SPACING.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  emojiItem: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiSelected: {},
  emojiText: {
    fontSize: 26,
  },
  colorItem: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorSelected: {
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  colorCheck: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: SPACING.xl,
    paddingTop: 16,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  resetText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});
