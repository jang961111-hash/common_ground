// ==========================================
// EditProfileScreen — 프로필 편집 전용 화면
// ==========================================
import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { mockProfile } from '../services/mockService';
import Avatar from '../components/Avatar';
import AvatarCustomizer from '../components/AvatarCustomizer';
import ScreenHeader from '../components/ScreenHeader';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { EditProfileScreenProps } from '../types';

export default function EditProfileScreen({ navigation }: EditProfileScreenProps) {
  const { user, refreshUser } = useAuth();
  const { colors } = useTheme();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState<string | null>(null);
  const [avatarColor, setAvatarColor] = useState<string | null>(null);
  const [welcomeTopics, setWelcomeTopics] = useState<string[]>(['']);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // 초기값 로드
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
      setAvatarEmoji(user.avatarEmoji);
      setAvatarColor(user.avatarColor);
      setWelcomeTopics(
        user.welcomeTopics.length > 0 ? [...user.welcomeTopics] : [''],
      );
    }
  }, [user]);

  // 변경 감지
  useEffect(() => {
    if (!user) return;
    const changed =
      displayName !== (user.displayName || '') ||
      bio !== (user.bio || '') ||
      avatarEmoji !== user.avatarEmoji ||
      avatarColor !== user.avatarColor ||
      JSON.stringify(welcomeTopics.filter(t => t.trim())) !==
        JSON.stringify(user.welcomeTopics);
    setHasChanges(changed);
  }, [displayName, bio, avatarEmoji, avatarColor, welcomeTopics, user]);

  const handleAvatarSave = useCallback((emoji: string | null, color: string | null) => {
    setAvatarEmoji(emoji);
    setAvatarColor(color);
    setShowAvatarPicker(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!displayName.trim()) {
      showToast('이름을 입력해주세요', 'error', '⚠️');
      return;
    }
    setSaving(true);
    const filteredTopics = welcomeTopics.filter(t => t.trim());
    await mockProfile.updateProfile({
      displayName: displayName.trim(),
      bio: bio.trim() || null,
      avatarEmoji,
      avatarColor,
      welcomeTopics: filteredTopics,
    });
    await refreshUser();
    setSaving(false);
    showToast('프로필이 저장되었어요!', 'success', '✅');
    navigation.goBack();
  }, [displayName, bio, avatarEmoji, avatarColor, welcomeTopics, refreshUser, showToast, navigation]);

  const addWelcomeTopic = useCallback(() => {
    if (welcomeTopics.length < 5) {
      setWelcomeTopics([...welcomeTopics, '']);
    }
  }, [welcomeTopics]);

  const updateTopic = useCallback((index: number, text: string) => {
    setWelcomeTopics(prev => {
      const updated = [...prev];
      updated[index] = text;
      return updated;
    });
  }, []);

  const removeTopic = useCallback((index: number) => {
    setWelcomeTopics(prev => prev.filter((_, i) => i !== index));
  }, []);

  const nameValidation = displayName.trim().length > 0 && displayName.trim().length <= 20;
  const filledTopicsCount = welcomeTopics.filter(t => t.trim()).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.gray50 }]}>
      <ScreenHeader
        title="프로필 편집"
        onBack={() => navigation.goBack()}
        rightElement={
          <Pressable
            onPress={handleSave}
            disabled={saving || !hasChanges || !nameValidation}
            accessibilityRole="button"
            accessibilityLabel="저장"
          >
            <Text style={[
              styles.headerSave,
              { color: (hasChanges && nameValidation) ? colors.primary : colors.gray400 },
            ]}>
              {saving ? '저장 중...' : '저장'}
            </Text>
          </Pressable>
        }
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* 아바타 섹션 */}
          <View style={styles.avatarSection}>
            <Pressable
              onPress={() => setShowAvatarPicker(true)}
              style={styles.avatarWrapper}
              accessibilityRole="button"
              accessibilityLabel="아바타 변경"
            >
              <Avatar
                name={displayName || '?'}
                size={96}
                emoji={avatarEmoji}
                customColor={avatarColor}
              />
              <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.editBadgeText}>✏️</Text>
              </View>
            </Pressable>
            <Text style={[styles.avatarHint, { color: colors.gray500 }]}>
              탭하여 아바타 변경
            </Text>
          </View>

          {/* 이름 */}
          <View style={[styles.card, { backgroundColor: colors.white }]}>
            <Text style={[styles.fieldLabel, { color: colors.gray500 }]}>이름</Text>
            <TextInput
              style={[styles.fieldInput, { color: colors.gray900, borderBottomColor: colors.gray200 }]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="이름 또는 닉네임"
              placeholderTextColor={colors.gray400}
              maxLength={20}
              accessibilityLabel="이름 입력"
            />
            <View style={styles.fieldFooter}>
              {!nameValidation && displayName.length > 0 && (
                <Text style={[styles.fieldError, { color: COLORS.error }]}>이름을 입력해주세요</Text>
              )}
              <Text style={[styles.fieldCount, { color: colors.gray400 }]}>{displayName.length}/20</Text>
            </View>
          </View>

          {/* 자기소개 */}
          <View style={[styles.card, { backgroundColor: colors.white }]}>
            <Text style={[styles.fieldLabel, { color: colors.gray500 }]}>자기소개</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldTextArea, { color: colors.gray900, borderBottomColor: colors.gray200 }]}
              value={bio}
              onChangeText={setBio}
              placeholder="간단한 자기소개를 작성해보세요"
              placeholderTextColor={colors.gray400}
              multiline
              maxLength={100}
              accessibilityLabel="자기소개 입력"
            />
            <View style={styles.fieldFooter}>
              <View />
              <Text style={[styles.fieldCount, { color: colors.gray400 }]}>{bio.length}/100</Text>
            </View>
          </View>

          {/* 대화 환영 주제 */}
          <View style={[styles.card, { backgroundColor: colors.white }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.fieldLabel, { color: colors.gray500 }]}>💬 대화 환영 주제</Text>
              <Text style={[styles.fieldCount, { color: colors.primary }]}>{filledTopicsCount}/5</Text>
            </View>
            <Text style={[styles.cardHint, { color: colors.gray400 }]}>
              상대방이 이 주제로 대화를 시작할 수 있어요
            </Text>

            {welcomeTopics.map((topic, idx) => (
              <View key={idx} style={styles.topicRow}>
                <Text style={[styles.topicNumber, { color: colors.gray400 }]}>{idx + 1}</Text>
                <TextInput
                  style={[styles.topicInput, { backgroundColor: colors.gray50, borderColor: colors.gray200, color: colors.gray900 }]}
                  value={topic}
                  onChangeText={(text) => updateTopic(idx, text)}
                  placeholder={['요즘 듣는 음악', '맛집 추천', '추천 여행지', '좋아하는 영화', '개발 이야기'][idx] || '대화 주제'}
                  placeholderTextColor={colors.gray400}
                  maxLength={30}
                  accessibilityLabel={`대화 주제 ${idx + 1}`}
                />
                {welcomeTopics.length > 1 && (
                  <Pressable
                    onPress={() => removeTopic(idx)}
                    style={styles.topicRemove}
                    accessibilityRole="button"
                    accessibilityLabel={`주제 ${idx + 1} 삭제`}
                  >
                    <Text style={[styles.topicRemoveText, { color: colors.gray400 }]}>✕</Text>
                  </Pressable>
                )}
              </View>
            ))}

            {welcomeTopics.length < 5 && (
              <Pressable
                style={[styles.addTopicBtn, { borderColor: colors.gray300 }]}
                onPress={addWelcomeTopic}
                accessibilityRole="button"
                accessibilityLabel="대화 주제 추가"
              >
                <Text style={[styles.addTopicText, { color: colors.gray500 }]}>+ 주제 추가</Text>
              </Pressable>
            )}
          </View>

          {/* 프로필 미리보기 */}
          <View style={[styles.card, { backgroundColor: colors.white }]}>
            <Text style={[styles.fieldLabel, { color: colors.gray500 }]}>미리보기</Text>
            <View style={styles.previewCard}>
              <Avatar
                name={displayName || '?'}
                size={56}
                emoji={avatarEmoji}
                customColor={avatarColor}
              />
              <View style={styles.previewInfo}>
                <Text style={[styles.previewName, { color: colors.gray900 }]}>
                  {displayName || '이름을 입력하세요'}
                </Text>
                {bio.trim() ? (
                  <Text style={[styles.previewBio, { color: colors.gray500 }]} numberOfLines={2}>
                    {bio}
                  </Text>
                ) : (
                  <Text style={[styles.previewBio, { color: colors.gray400, fontStyle: 'italic' }]}>
                    자기소개 없음
                  </Text>
                )}
              </View>
            </View>
            {filledTopicsCount > 0 && (
              <View style={styles.previewTopics}>
                {welcomeTopics.filter(t => t.trim()).map((topic, idx) => (
                  <View key={idx} style={[styles.previewTopicItem, { backgroundColor: colors.gray50 }]}>
                    <Text style={styles.previewTopicIcon}>💬</Text>
                    <Text style={[styles.previewTopicText, { color: colors.gray700 }]}>{topic}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 아바타 커스터마이저 */}
      <AvatarCustomizer
        visible={showAvatarPicker}
        currentEmoji={avatarEmoji}
        currentColor={avatarColor}
        displayName={displayName || '?'}
        onSave={handleAvatarSave}
        onClose={() => setShowAvatarPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSave: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  content: {
    padding: SPACING.xl,
    gap: 16,
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  avatarWrapper: {
    position: 'relative',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  editBadgeText: { fontSize: 14 },
  avatarHint: {
    fontSize: FONT_SIZE.xs,
  },

  // Card
  card: {
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
    gap: 10,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHint: {
    fontSize: FONT_SIZE.xs,
    marginTop: -4,
  },

  // Fields
  fieldLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldInput: {
    fontSize: FONT_SIZE.lg,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  fieldTextArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  fieldFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldCount: {
    fontSize: FONT_SIZE.xs,
    marginLeft: 'auto',
  },
  fieldError: {
    fontSize: FONT_SIZE.xs,
  },

  // Topics
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topicNumber: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    width: 18,
    textAlign: 'center',
  },
  topicInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: FONT_SIZE.md,
  },
  topicRemove: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicRemoveText: { fontSize: 16, fontWeight: '600' },
  addTopicBtn: {
    paddingVertical: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  addTopicText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },

  // Preview
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 4,
  },
  previewInfo: { flex: 1, gap: 4 },
  previewName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  previewBio: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
  previewTopics: {
    gap: 6,
    marginTop: 4,
  },
  previewTopicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.sm,
  },
  previewTopicIcon: { fontSize: 14 },
  previewTopicText: {
    fontSize: FONT_SIZE.sm,
    flex: 1,
  },
});
