// ==========================================
// CreateGroupScreen — 그룹 생성 화면
// ==========================================
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { CreateGroupScreenProps } from '../types';
import { mockGroups } from '../services/mockService';
import { INTERESTS, INTEREST_CATEGORIES } from '../constants/interests';
import ScreenHeader from '../components/ScreenHeader';
import InterestTag from '../components/InterestTag';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '../constants/theme';

const EMOJI_OPTIONS = ['💬', '🎮', '📚', '🎵', '🎬', '✈️', '🍽️', '💻', '⚽', '🎨', '📷', '🧠', '🌍', '🎭', '🏋️', '🎸'];

export default function CreateGroupScreen({ navigation }: CreateGroupScreenProps) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('💬');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleInterest = useCallback(
    (id: string) => {
      setSelectedInterests(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : prev.length < 5 ? [...prev, id] : prev,
      );
    },
    [],
  );

  const handleCreate = useCallback(async () => {
    if (!name.trim()) {
      showToast('그룹 이름을 입력해 주세요', 'error');
      return;
    }
    if (selectedInterests.length === 0) {
      showToast('관심사를 1개 이상 선택해 주세요', 'error');
      return;
    }
    setSaving(true);
    try {
      await mockGroups.createGroup({
        name: name.trim(),
        description: description.trim(),
        emoji: selectedEmoji,
        interestIds: selectedInterests,
      });
      showToast('그룹이 생성되었어요! 🎉', 'success');
      navigation.goBack();
    } catch {
      showToast('그룹 생성에 실패했어요', 'error');
    } finally {
      setSaving(false);
    }
  }, [name, description, selectedEmoji, selectedInterests, navigation, showToast]);

  const canCreate = name.trim().length >= 2 && selectedInterests.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      <ScreenHeader title="그룹 만들기" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* 이모지 선택 */}
        <Text style={[styles.label, { color: colors.gray700 }]}>그룹 아이콘</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiRow}>
          {EMOJI_OPTIONS.map(em => (
            <TouchableOpacity
              key={em}
              style={[
                styles.emojiBtn,
                {
                  backgroundColor: selectedEmoji === em ? colors.primaryBg : colors.gray100,
                  borderColor: selectedEmoji === em ? colors.primary : 'transparent',
                },
              ]}
              onPress={() => setSelectedEmoji(em)}
              activeOpacity={0.7}
            >
              <Text style={styles.emojiText}>{em}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 그룹 이름 */}
        <Text style={[styles.label, { color: colors.gray700 }]}>그룹 이름 *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.gray50, borderColor: colors.gray200, color: colors.gray900 }]}
          placeholder="그룹 이름을 입력하세요"
          placeholderTextColor={colors.gray400}
          value={name}
          onChangeText={setName}
          maxLength={30}
        />
        <Text style={[styles.charCount, { color: colors.gray400 }]}>{name.length}/30</Text>

        {/* 설명 */}
        <Text style={[styles.label, { color: colors.gray700 }]}>설명</Text>
        <TextInput
          style={[styles.textarea, { backgroundColor: colors.gray50, borderColor: colors.gray200, color: colors.gray900 }]}
          placeholder="그룹을 소개해 주세요"
          placeholderTextColor={colors.gray400}
          value={description}
          onChangeText={setDescription}
          maxLength={100}
          multiline
          numberOfLines={3}
        />
        <Text style={[styles.charCount, { color: colors.gray400 }]}>{description.length}/100</Text>

        {/* 관심사 선택 */}
        <Text style={[styles.label, { color: colors.gray700 }]}>관련 관심사 * (최대 5개)</Text>
        <TouchableOpacity
          style={[styles.interestBtn, { borderColor: colors.gray200 }]}
          onPress={() => setShowInterestModal(true)}
          activeOpacity={0.7}
        >
          {selectedInterests.length === 0 ? (
            <Text style={[styles.interestPlaceholder, { color: colors.gray400 }]}>
              관심사를 선택하세요
            </Text>
          ) : (
            <View style={styles.selectedTags}>
              {selectedInterests.map(id => (
                <InterestTag key={id} interestId={id} isHighlighted />
              ))}
            </View>
          )}
        </TouchableOpacity>

        {/* 생성 버튼 */}
        <TouchableOpacity
          style={[
            styles.createBtn,
            { backgroundColor: canCreate ? colors.primary : colors.gray300 },
          ]}
          onPress={handleCreate}
          disabled={!canCreate || saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.createBtnText}>그룹 만들기</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* 관심사 선택 모달 */}
      <Modal visible={showInterestModal} animationType="slide" onRequestClose={() => setShowInterestModal(false)}>
        <View style={[styles.modalContainer, { backgroundColor: colors.white }]}>
          <ScreenHeader
            title="관심사 선택"
            onBack={() => setShowInterestModal(false)}
            rightElement={
              <TouchableOpacity onPress={() => setShowInterestModal(false)}>
                <Text style={[styles.modalDone, { color: colors.primary }]}>완료 ({selectedInterests.length}/5)</Text>
              </TouchableOpacity>
            }
          />
          <ScrollView contentContainerStyle={styles.modalScroll}>
            {INTEREST_CATEGORIES.map(cat => (
              <View key={cat} style={styles.catSection}>
                <Text style={[styles.catTitle, { color: colors.gray800 }]}>
                  {cat}
                </Text>
                <View style={styles.catTags}>
                  {INTERESTS.filter(i => i.category === cat).map(interest => {
                    const isSelected = selectedInterests.includes(interest.id);
                    return (
                      <TouchableOpacity
                        key={interest.id}
                        onPress={() => toggleInterest(interest.id)}
                        activeOpacity={0.7}
                      >
                        <InterestTag interestId={interest.id} isHighlighted={isSelected} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
  },
  emojiRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  emojiBtn: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: { fontSize: 24 },
  input: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: FONT_SIZE.xs,
    textAlign: 'right',
    marginTop: 4,
  },
  interestBtn: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    minHeight: 48,
    justifyContent: 'center',
    borderStyle: 'dashed',
  },
  interestPlaceholder: {
    fontSize: FONT_SIZE.md,
  },
  selectedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  createBtn: {
    marginTop: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },

  // Modal
  modalContainer: { flex: 1 },
  modalDone: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  modalScroll: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  catSection: {
    marginBottom: SPACING.xl,
  },
  catTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  catTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
});
