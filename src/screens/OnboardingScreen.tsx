import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { mockProfile } from '../services/mockService';
import { INTERESTS, INTEREST_CATEGORIES, getInterestById } from '../constants/interests';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING } from '../constants/theme';
import type { OnboardingScreenProps } from '../types';

const MAX_INTERESTS = 5;

export default function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const { refreshUser } = useAuth();
  const { colors } = useTheme();
  const [step, setStep] = useState(0); // 0: 이름, 1: 관심사
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleInterest = (id: string) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(selectedInterests.filter(x => x !== id));
    } else if (selectedInterests.length < MAX_INTERESTS) {
      setSelectedInterests([...selectedInterests, id]);
    }
  };

  const canProceed = () => {
    if (step === 0) return displayName.trim().length >= 1;
    if (step === 1) return selectedInterests.length >= 1;
    return true;
  };

  const handleFinish = async () => {
    setSaving(true);
    await mockProfile.updateProfile({
      displayName: displayName.trim(),
      bio: bio.trim() || null,
      recentInterests: selectedInterests,
      alwaysInterests: [],
      welcomeTopics: [],
    });
    await refreshUser();
    setSaving(false);
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.gray200 }]} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: ((step + 1) / 2) * 100 }}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${((step + 1) / 2) * 100}%` as any }]} />
        </View>
        <Text style={[styles.progressText, { color: colors.gray400 }]}>{step + 1} / 2</Text>
      </View>

      {/* Step 0: 이름 */}
      {step === 0 && (
        <View style={styles.stepContent}>
          <Text style={[styles.stepTitle, { color: colors.gray900 }]}>반가워요! 👋</Text>
          <Text style={[styles.stepSubtitle, { color: colors.gray500 }]}>다른 사람에게 보여질 이름을 알려주세요</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.gray700 }]}>이름 *</Text>
            <TextInput
              placeholder="이름 또는 닉네임"
              value={displayName}
              onChangeText={setDisplayName}
              style={[styles.input, { backgroundColor: colors.gray50, borderColor: colors.gray200, color: colors.gray900 }]}
              placeholderTextColor={colors.gray400}
              maxLength={20}
              autoFocus
              accessibilityLabel="이름 또는 닉네임"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.gray700 }]}>한 줄 소개 (선택)</Text>
            <TextInput
              placeholder="예: 커피 좋아하는 개발자 ☕"
              value={bio}
              onChangeText={setBio}
              style={[styles.input, { backgroundColor: colors.gray50, borderColor: colors.gray200, color: colors.gray900 }]}
              placeholderTextColor={colors.gray400}
              maxLength={50}
              accessibilityLabel="한 줄 소개"
            />
          </View>
        </View>
      )}

      {/* Step 1: 관심사 (통합 - 요즘/항상 분리 제거) */}
      {step === 1 && (
        <View style={styles.stepContent}>
          <Text style={[styles.stepTitle, { color: colors.gray900 }]}>관심사를 골라주세요 🎯</Text>
          <Text style={[styles.stepSubtitle, { color: colors.gray500 }]}>최소 1개, 최대 {MAX_INTERESTS}개 선택</Text>
          <Text style={[styles.counter, { color: colors.primary }]}>{selectedInterests.length}/{MAX_INTERESTS} 선택됨</Text>

          <ScrollView style={styles.interestScroll} showsVerticalScrollIndicator={false}>
            {INTEREST_CATEGORIES.map(cat => (
              <View key={cat} style={styles.categorySection}>
                <Text style={[styles.categoryLabel, { color: colors.gray600 }]}>{cat}</Text>
                <View style={styles.categoryGrid}>
                  {INTERESTS.filter(i => i.category === cat).map(interest => {
                    const isSelected = selectedInterests.includes(interest.id);
                    return (
                      <Pressable
                        key={interest.id}
                        style={[styles.interestChip, { backgroundColor: colors.gray100 }, isSelected && [styles.interestChipSelected, { backgroundColor: colors.primaryBg, borderColor: colors.primary }]]}
                        onPress={() => toggleInterest(interest.id)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isSelected }}
                        accessibilityLabel={interest.label}
                      >
                        <Text style={[styles.interestChipText, { color: colors.gray600 }, isSelected && [styles.interestChipTextSelected, { color: colors.primary }]]}>
                          {interest.emoji} {interest.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      )}

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        {step > 0 && (
          <Pressable style={[styles.backBtn, { borderColor: colors.gray200 }]} onPress={() => setStep(0)} accessibilityRole="button" accessibilityLabel="이전 단계">
            <Text style={[styles.backBtnText, { color: colors.gray600 }]}>이전</Text>
          </Pressable>
        )}
        <Pressable
          style={[
            styles.nextBtn,
            !canProceed() && styles.nextBtnDisabled,
            step === 0 && { flex: 1 },
          ]}
          onPress={() => {
            if (step === 0) {
              setStep(1);
            } else {
              handleFinish();
            }
          }}
          disabled={!canProceed() || saving}
          accessibilityRole="button"
          accessibilityLabel={step === 1 ? (saving ? '저장 중' : '프로필 완성') : '다음 단계'}
          accessibilityState={{ disabled: !canProceed() || saving }}
        >
          <Text style={styles.nextBtnText}>
            {step === 1
              ? (saving ? '저장 중...' : '완료! 🚀')
              : '다음'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white, paddingTop: 60 },

  progressContainer: {
    paddingHorizontal: SPACING.xl, marginBottom: 20, gap: 8, alignItems: 'center',
  },
  progressBar: { width: '100%', height: 4, backgroundColor: COLORS.gray200, borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
  progressText: { fontSize: FONT_SIZE.xs, color: COLORS.gray400 },

  stepContent: { flex: 1, paddingHorizontal: SPACING.xl },
  stepTitle: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.gray900, marginBottom: 8 },
  stepSubtitle: { fontSize: FONT_SIZE.md, color: COLORS.gray500, marginBottom: 24, lineHeight: 22 },

  inputGroup: { gap: 6, marginBottom: 16 },
  label: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.gray700 },
  input: {
    backgroundColor: COLORS.gray50, borderWidth: 1, borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: FONT_SIZE.md, color: COLORS.gray900,
  },

  counter: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: '600', marginBottom: 12 },
  interestScroll: { flex: 1 },
  categorySection: { marginBottom: 20 },
  categoryLabel: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.gray600, marginBottom: 10 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestChip: {
    backgroundColor: COLORS.gray100, borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5, borderColor: 'transparent',
  },
  interestChipSelected: { backgroundColor: COLORS.primaryBg, borderColor: COLORS.primary },
  interestChipText: { fontSize: FONT_SIZE.sm, color: COLORS.gray600 },
  interestChipTextSelected: { color: COLORS.primary, fontWeight: '600' },

  bottomButtons: { flexDirection: 'row', paddingHorizontal: SPACING.xl, paddingVertical: 16, gap: 12 },
  backBtn: {
    borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: BORDER_RADIUS.md,
    paddingVertical: 16, paddingHorizontal: 24, alignItems: 'center',
  },
  backBtnText: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.gray600 },
  nextBtn: {
    flex: 1, backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md,
    paddingVertical: 16, alignItems: 'center',
  },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnText: { color: '#fff', fontSize: FONT_SIZE.lg, fontWeight: '700' },
});
