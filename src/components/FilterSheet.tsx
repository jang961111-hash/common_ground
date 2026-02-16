// ==========================================
// FilterSheet — 필터 & 정렬 바텀시트
// ==========================================
import React, { useState, useMemo } from 'react';
import {
  View, Text, Pressable, StyleSheet, Modal, ScrollView,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { INTERESTS, INTEREST_CATEGORIES, InterestCategory } from '../constants/interests';
import InterestTag from './InterestTag';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING } from '../constants/theme';

export type SortOption = 'common' | 'recent' | 'name';

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  /** 현재 선택된 관심사 필터 ID 목록 */
  selectedInterests: string[];
  /** 현재 정렬 옵션 */
  sortBy: SortOption;
  /** 필터 변경 콜백 */
  onApply: (interests: string[], sortBy: SortOption) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string; emoji: string }[] = [
  { value: 'common', label: '공통 관심사순', emoji: '💫' },
  { value: 'recent', label: '최근 활동순', emoji: '🕐' },
  { value: 'name', label: '이름순', emoji: '🔤' },
];

export default function FilterSheet({
  visible,
  onClose,
  selectedInterests,
  sortBy,
  onApply,
}: FilterSheetProps) {
  const { colors } = useTheme();
  const [localInterests, setLocalInterests] = useState<string[]>(selectedInterests);
  const [localSort, setLocalSort] = useState<SortOption>(sortBy);
  const [expandedCategory, setExpandedCategory] = useState<InterestCategory | null>(null);

  // 시트가 열릴 때 로컬 상태 리셋
  React.useEffect(() => {
    if (visible) {
      setLocalInterests(selectedInterests);
      setLocalSort(sortBy);
      setExpandedCategory(null);
    }
  }, [visible, selectedInterests, sortBy]);

  const toggleInterest = (id: string) => {
    setLocalInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id],
    );
  };

  const handleApply = () => {
    onApply(localInterests, localSort);
    onClose();
  };

  const handleReset = () => {
    setLocalInterests([]);
    setLocalSort('common');
  };

  const activeFilterCount = localInterests.length + (localSort !== 'common' ? 1 : 0);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.white }]}>
          {/* 핸들 */}
          <View style={[styles.handle, { backgroundColor: colors.gray300 }]} />

          {/* 헤더 */}
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.gray900 }]}>필터 & 정렬</Text>
            {activeFilterCount > 0 && (
              <Pressable onPress={handleReset} accessibilityRole="button" accessibilityLabel="필터 초기화">
                <Text style={[styles.resetText, { color: colors.primary }]}>초기화</Text>
              </Pressable>
            )}
          </View>

          <ScrollView
            style={styles.sheetBody}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* 정렬 */}
            <Text style={[styles.sectionLabel, { color: colors.gray500 }]}>정렬</Text>
            <View style={styles.sortOptions}>
              {SORT_OPTIONS.map(opt => (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.sortChip,
                    { borderColor: colors.gray200 },
                    localSort === opt.value && [styles.sortChipActive, { borderColor: colors.primary, backgroundColor: colors.primaryBg }],
                  ]}
                  onPress={() => setLocalSort(opt.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: localSort === opt.value }}
                  accessibilityLabel={opt.label}
                >
                  <Text style={styles.sortEmoji}>{opt.emoji}</Text>
                  <Text style={[
                    styles.sortLabel,
                    { color: colors.gray600 },
                    localSort === opt.value && { color: colors.primary, fontWeight: '700' },
                  ]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* 관심사 필터 */}
            <Text style={[styles.sectionLabel, { color: colors.gray500, marginTop: 20 }]}>
              관심사 필터 {localInterests.length > 0 && `(${localInterests.length})`}
            </Text>
            <Text style={[styles.filterHint, { color: colors.gray400 }]}>
              선택한 관심사를 가진 사용자만 표시해요
            </Text>

            {INTEREST_CATEGORIES.map(category => {
              const categoryInterests = INTERESTS.filter(i => i.category === category);
              const selectedInCategory = categoryInterests.filter(i => localInterests.includes(i.id)).length;
              const isExpanded = expandedCategory === category;

              return (
                <View key={category} style={styles.categorySection}>
                  <Pressable
                    style={styles.categoryHeader}
                    onPress={() => setExpandedCategory(isExpanded ? null : category)}
                    accessibilityRole="button"
                    accessibilityLabel={`${category} 카테고리 ${isExpanded ? '접기' : '펼치기'}`}
                  >
                    <Text style={[styles.categoryTitle, { color: colors.gray700 }]}>
                      {category}
                      {selectedInCategory > 0 && (
                        <Text style={{ color: colors.primary }}> ({selectedInCategory})</Text>
                      )}
                    </Text>
                    <Text style={[styles.chevron, { color: colors.gray400 }]}>
                      {isExpanded ? '▲' : '▼'}
                    </Text>
                  </Pressable>

                  {isExpanded && (
                    <View style={styles.interestGrid}>
                      {categoryInterests.map(interest => {
                        const isSelected = localInterests.includes(interest.id);
                        return (
                          <Pressable
                            key={interest.id}
                            style={[
                              styles.interestChip,
                              { backgroundColor: colors.gray100 },
                              isSelected && { backgroundColor: colors.primaryBg, borderColor: colors.primary, borderWidth: 1 },
                            ]}
                            onPress={() => toggleInterest(interest.id)}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: isSelected }}
                            accessibilityLabel={interest.label}
                          >
                            <Text style={styles.interestEmoji}>{interest.emoji}</Text>
                            <Text style={[
                              styles.interestLabel,
                              { color: colors.gray700 },
                              isSelected && { color: colors.primary, fontWeight: '600' },
                            ]}>
                              {interest.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* 적용 버튼 */}
          <View style={[styles.sheetFooter, { borderTopColor: colors.gray100 }]}>
            <Pressable
              style={[styles.applyBtn, { backgroundColor: colors.primary }]}
              onPress={handleApply}
              accessibilityRole="button"
              accessibilityLabel="필터 적용"
            >
              <Text style={styles.applyText}>
                적용{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: 16,
  },
  sheetTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
  resetText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  sheetBody: {
    paddingHorizontal: SPACING.xl,
  },
  sectionLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  filterHint: {
    fontSize: FONT_SIZE.xs,
    marginBottom: 12,
    marginTop: -6,
  },

  // Sort
  sortOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  sortChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  sortChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryBg,
  },
  sortEmoji: { fontSize: 14 },
  sortLabel: { fontSize: FONT_SIZE.xs, fontWeight: '600' },

  // Category
  categorySection: {
    marginBottom: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  categoryTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 10,
  },

  // Interest chips
  interestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  interestEmoji: { fontSize: 14 },
  interestLabel: { fontSize: FONT_SIZE.sm },

  // Footer
  sheetFooter: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  applyBtn: {
    paddingVertical: 16,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  applyText: {
    color: '#fff',
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
});
