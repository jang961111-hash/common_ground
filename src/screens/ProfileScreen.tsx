import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView, Modal, TouchableOpacity,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { mockProfile, mockBadges } from '../services/mockService';
import { INTERESTS, INTEREST_CATEGORIES, getInterestById } from '../constants/interests';
import { RARITY_COLORS } from '../constants/badges';
import Avatar from '../components/Avatar';
import InterestTag from '../components/InterestTag';
import { BadgeCard } from '../components/BadgeCard';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { ProfileScreenProps, Badge, UserBadgeSummary } from '../types';
import { useApiCall } from '../hooks/useApiCall';

type ModalType = 'recent' | 'always' | null;

type SectionKey = 'name' | 'bio' | 'recent' | 'always' | 'topics';

export default function ProfileScreen({ navigation, route }: ProfileScreenProps) {
  const { user, refreshUser, signOut } = useAuth();
  const { showToast } = useToast();
  const { colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const sectionPositions = useRef<Record<string, number>>({});
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [recentInterests, setRecentInterests] = useState<string[]>([]);
  const [alwaysInterests, setAlwaysInterests] = useState<string[]>([]);
  const [welcomeTopics, setWelcomeTopics] = useState<string[]>([]);
  const [privacyLevel, setPrivacyLevel] = useState<string>('PUBLIC');
  const [saving, setSaving] = useState(false);
  const [interestModal, setInterestModal] = useState<ModalType>(null);

  const { data: badgeSummary } = useApiCall<UserBadgeSummary>(() => mockBadges.getBadges());

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
      setRecentInterests(user.recentInterests || []);
      setAlwaysInterests(user.alwaysInterests || []);
      setWelcomeTopics(user.welcomeTopics.length > 0 ? user.welcomeTopics : ['']);
      setPrivacyLevel(user.privacyLevel || 'PUBLIC');
    }
  }, [user]);

  // scrollTo 파라미터 처리 — 홈 완성도 가이드에서 넘어올 때
  useEffect(() => {
    const scrollTo = route.params?.scrollTo as SectionKey | undefined;
    if (scrollTo && sectionPositions.current[scrollTo] !== undefined) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: sectionPositions.current[scrollTo] - 20,
          animated: true,
        });
      }, 300);
    }
  }, [route.params?.scrollTo]);

  const onSectionLayout = (key: SectionKey) => (event: any) => {
    sectionPositions.current[key] = event.nativeEvent.layout.y;
  };

  const handleSave = async () => {
    setSaving(true);
    const filteredTopics = welcomeTopics.filter(t => t.trim());
    await mockProfile.updateProfile({
      displayName: displayName.trim(),
      bio: bio.trim() || null,
      recentInterests,
      alwaysInterests,
      welcomeTopics: filteredTopics,
      privacyLevel: privacyLevel as any,
    });
    await refreshUser();
    setSaving(false);
    showToast('프로필이 저장되었어요!', 'success', '✅');
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const toggleInterest = (id: string) => {
    const isRecent = interestModal === 'recent';
    const list = isRecent ? recentInterests : alwaysInterests;
    const setList = isRecent ? setRecentInterests : setAlwaysInterests;
    const max = 5;

    if (list.includes(id)) {
      setList(list.filter(x => x !== id));
    } else if (list.length < max) {
      setList([...list, id]);
    }
  };

  const addWelcomeTopic = () => {
    if (welcomeTopics.length < 5) {
      setWelcomeTopics([...welcomeTopics, '']);
    }
  };

  const currentList = interestModal === 'recent' ? recentInterests : alwaysInterests;

  const PRIVACY_OPTIONS = [
    { value: 'PUBLIC', label: '🌐 전체 공개', desc: '누구나 프로필을 볼 수 있어요' },
    { value: 'LINK', label: '🔗 링크 공유만', desc: '링크를 가진 사람만 볼 수 있어요' },
    { value: 'FRIENDS', label: '👥 친구만', desc: '친구로 등록된 사람만 볼 수 있어요' },
    { value: 'PRIVATE', label: '🔒 비공개', desc: '아무도 볼 수 없어요' },
  ];

  return (
    <ScrollView ref={scrollViewRef} contentContainerStyle={[styles.container, { backgroundColor: colors.white }]}>
      {/* Header */}
      <Text style={[styles.title, { color: colors.gray900 }]}>내 프로필</Text>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <Pressable
          onPress={() => navigation.navigate('EditProfile')}
          style={styles.avatarPressable}
          accessibilityRole="button"
          accessibilityLabel="프로필 편집"
        >
          <Avatar name={displayName || '?'} size={80} emoji={user?.avatarEmoji} customColor={user?.avatarColor} />
          <View style={[styles.avatarEditBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarEditIcon}>✏️</Text>
          </View>
        </Pressable>
        <View style={styles.avatarInfo}>
          <Text style={[styles.avatarName, { color: colors.gray900 }]}>{displayName || '이름을 입력하세요'}</Text>
          <Text style={[styles.shareLink, { color: colors.primary }]}>🔗 cg.link/{user?.shareLink || '...'}</Text>
        </View>
      </View>

      {/* 내 배지 */}
      {badgeSummary && badgeSummary.unlockedCount > 0 && (
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.white, borderColor: colors.gray200 }]}
          onPress={() => navigation.navigate('Badges')}
          activeOpacity={0.7}
        >
          <View style={styles.badgeHeader}>
            <Text style={[styles.cardTitle, { color: colors.gray800 }]}>🏆 내 배지</Text>
            <Text style={[styles.badgeCount, { color: colors.primary }]}>
              {badgeSummary.unlockedCount}/{badgeSummary.totalBadges}
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeRow}>
            {badgeSummary.badges
              .filter(b => b.unlockedAt)
              .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
              .slice(0, 5)
              .map(badge => (
                <BadgeCard key={badge.id} badge={badge} compact />
              ))}
          </ScrollView>
          <Text style={[styles.badgeSeeAll, { color: colors.primary }]}>전체 보기 →</Text>
        </TouchableOpacity>
      )}

      {/* 프로필 인사이트 */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.white, borderColor: colors.gray200 }]}
        onPress={() => navigation.navigate('Insights')}
        activeOpacity={0.7}
      >
        <View style={styles.badgeHeader}>
          <Text style={[styles.cardTitle, { color: colors.gray800 }]}>📊 프로필 인사이트</Text>
          <Text style={{ color: colors.primary, fontSize: 14 }}>→</Text>
        </View>
        <Text style={{ fontSize: 13, color: colors.gray500, marginTop: 4 }}>
          누가 내 프로필을 봤는지, 어떤 관심사가 인기 있는지 확인해보세요
        </Text>
      </TouchableOpacity>

      {/* 활동 타임라인 */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.white, borderColor: colors.gray200 }]}
        onPress={() => navigation.navigate('ActivityTimeline')}
        activeOpacity={0.7}
      >
        <View style={styles.badgeHeader}>
          <Text style={[styles.cardTitle, { color: colors.gray800 }]}>📜 활동 타임라인</Text>
          <Text style={{ color: colors.primary, fontSize: 14 }}>→</Text>
        </View>
        <Text style={{ fontSize: 13, color: colors.gray500, marginTop: 4 }}>
          내 활동 내역을 시간순으로 확인해보세요
        </Text>
      </TouchableOpacity>

      {/* 내 메모 */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.white, borderColor: colors.gray200 }]}
        onPress={() => navigation.navigate('UserNotes')}
        activeOpacity={0.7}
      >
        <View style={styles.badgeHeader}>
          <Text style={[styles.cardTitle, { color: colors.gray800 }]}>📝 내 메모</Text>
          <Text style={{ color: colors.primary, fontSize: 14 }}>→</Text>
        </View>
        <Text style={{ fontSize: 13, color: colors.gray500, marginTop: 4 }}>
          다른 사용자에 대한 비공개 메모를 관리해보세요
        </Text>
      </TouchableOpacity>

      {/* 기본 정보 */}
      <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.gray200 }]} onLayout={onSectionLayout('name')}>
        <Text style={[styles.cardTitle, { color: colors.gray800 }]}>기본 정보</Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.gray700 }]}>이름</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.gray50, borderColor: colors.gray200, color: colors.gray900 }]}
            placeholder="이름 또는 닉네임"
            value={displayName}
            onChangeText={setDisplayName}
            placeholderTextColor={colors.gray400}
            maxLength={20}
            accessibilityLabel="이름"
          />
        </View>

        <View style={styles.inputGroup} onLayout={onSectionLayout('bio')}>
          <Text style={[styles.label, { color: colors.gray700 }]}>자기소개</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.gray50, borderColor: colors.gray200, color: colors.gray900 }]}
            placeholder="간단한 자기소개"
            value={bio}
            onChangeText={setBio}
            multiline
            placeholderTextColor={colors.gray400}
            maxLength={100}
            accessibilityLabel="자기소개"
          />
          <Text style={[styles.charCount, { color: colors.gray400 }]}>{bio.length}/100</Text>
        </View>
      </View>

      {/* 요즘 관심사 */}
      <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.gray200 }]} onLayout={onSectionLayout('recent')}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.gray800 }]}>🔥 요즘 관심사</Text>
          <Text style={[styles.cardCount, { color: colors.primary }]}>{recentInterests.length}/5</Text>
        </View>
        <Text style={[styles.cardDesc, { color: colors.gray500 }]}>최근에 빠져있는 것들</Text>

        <View style={styles.tagList}>
          {recentInterests.map(id => (
            <InterestTag
              key={id}
              interestId={id}
              onRemove={() => setRecentInterests(recentInterests.filter(x => x !== id))}
            />
          ))}
          <Pressable style={styles.addTagBtn} onPress={() => navigation.navigate('EditInterests', { type: 'RECENT' })} accessibilityRole="button" accessibilityLabel="요즘 관심사 편집">
            <Text style={styles.addTagText}>+ 추가 / 편집</Text>
          </Pressable>
        </View>
      </View>

      {/* 항상 관심사 */}
      <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.gray200 }]} onLayout={onSectionLayout('always')}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.gray800 }]}>❤️ 항상 관심사</Text>
          <Text style={[styles.cardCount, { color: colors.primary }]}>{alwaysInterests.length}/5</Text>
        </View>
        <Text style={[styles.cardDesc, { color: colors.gray500 }]}>오래전부터 꾸준히 좋아하는 것들</Text>

        <View style={styles.tagList}>
          {alwaysInterests.map(id => (
            <InterestTag
              key={id}
              interestId={id}
              onRemove={() => setAlwaysInterests(alwaysInterests.filter(x => x !== id))}
            />
          ))}
          <Pressable style={styles.addTagBtn} onPress={() => navigation.navigate('EditInterests', { type: 'ALWAYS' })} accessibilityRole="button" accessibilityLabel="항상 관심사 편집">
            <Text style={styles.addTagText}>+ 추가 / 편집</Text>
          </Pressable>
        </View>
      </View>

      {/* 대화 환영 주제 */}
      <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.gray200 }]} onLayout={onSectionLayout('topics')}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.gray800 }]}>💬 대화 환영 주제</Text>
          <Text style={[styles.cardCount, { color: colors.primary }]}>{welcomeTopics.filter(t => t.trim()).length}/5</Text>
        </View>
        <Text style={[styles.cardDesc, { color: colors.gray500 }]}>이런 주제로 말 걸어주세요!</Text>

        {welcomeTopics.map((topic, idx) => (
          <View key={idx} style={styles.topicRow}>
            <TextInput
              style={[styles.topicInput, { backgroundColor: colors.gray50, borderColor: colors.gray200, color: colors.gray900 }]}
              placeholder={`예: ${['요즘 듣는 음악', '맛집 추천', '추천 여행지', '좋아하는 영화', '개발 이야기'][idx] || '대화 주제'}`}
              value={topic}
              onChangeText={(text) => {
                const updated = [...welcomeTopics];
                updated[idx] = text;
                setWelcomeTopics(updated);
              }}
              placeholderTextColor={colors.gray400}
              maxLength={30}
              accessibilityLabel={`대화 환영 주제 ${idx + 1}`}
            />
            {welcomeTopics.length > 1 && (
              <Pressable
                onPress={() => setWelcomeTopics(welcomeTopics.filter((_, i) => i !== idx))}
                style={styles.topicRemoveBtn}
                accessibilityRole="button"
                accessibilityLabel={`대화 주제 ${idx + 1} 삭제`}
              >
                <Text style={styles.topicRemoveText}>×</Text>
              </Pressable>
            )}
          </View>
        ))}
        {welcomeTopics.length < 5 && (
          <Pressable style={styles.addTopicBtn} onPress={addWelcomeTopic} accessibilityRole="button" accessibilityLabel="대화 주제 추가">
            <Text style={styles.addTopicText}>+ 주제 추가</Text>
          </Pressable>
        )}
      </View>

      {/* 공개 범위 */}
      <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.gray200 }]}>
        <Text style={[styles.cardTitle, { color: colors.gray800 }]}>🔐 공개 범위</Text>
        {PRIVACY_OPTIONS.map(opt => (
          <Pressable
            key={opt.value}
            style={[styles.privacyOption, privacyLevel === opt.value && styles.privacyOptionSelected]}
            onPress={() => setPrivacyLevel(opt.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: privacyLevel === opt.value }}
            accessibilityLabel={`${opt.label} ${opt.desc}`}
          >
            <View style={styles.privacyRadio}>
              <View style={[styles.radioOuter, privacyLevel === opt.value && styles.radioOuterSelected]}>
                {privacyLevel === opt.value && <View style={styles.radioInner} />}
              </View>
            </View>
            <View style={styles.privacyText}>
              <Text style={[styles.privacyLabel, privacyLevel === opt.value && styles.privacyLabelSelected]}>
                {opt.label}
              </Text>
              <Text style={styles.privacyDesc}>{opt.desc}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* 저장 버튼 */}
      <Pressable
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
        accessibilityRole="button"
        accessibilityLabel={saving ? '저장 중' : '프로필 저장'}
        accessibilityState={{ disabled: saving }}
      >
        <Text style={styles.saveBtnText}>{saving ? '저장 중...' : '저장하기'}</Text>
      </Pressable>

      {/* 하단 링크 */}
      <View style={styles.bottomActions}>
        <Pressable style={[styles.bottomAction, { backgroundColor: colors.gray50, borderColor: colors.gray200 }]} onPress={() => navigation.navigate('ShareProfile')} accessibilityRole="button" accessibilityLabel="프로필 공유">
          <Text style={[styles.bottomActionText, { color: colors.gray700 }]}>🔗 프로필 공유</Text>
        </Pressable>
        <Pressable style={[styles.bottomAction, { backgroundColor: colors.gray50, borderColor: colors.gray200 }]} onPress={() => navigation.navigate('Settings')} accessibilityRole="button" accessibilityLabel="설정">
          <Text style={[styles.bottomActionText, { color: colors.gray700 }]}>⚙️ 설정</Text>
        </Pressable>
      </View>

      <Pressable style={styles.signOutBtn} onPress={handleSignOut} accessibilityRole="button" accessibilityLabel="로그아웃">
        <Text style={styles.signOutText}>로그아웃</Text>
      </Pressable>

      <View style={{ height: 40 }} />

      {/* Interest Selection Modal */}
      <Modal visible={interestModal !== null} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.white }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.gray200 }]}>
            <Text style={[styles.modalTitle, { color: colors.gray900 }]}>
              {interestModal === 'recent' ? '🔥 요즘 관심사' : '❤️ 항상 관심사'} ({currentList.length}/5)
            </Text>
            <Pressable onPress={() => setInterestModal(null)} accessibilityRole="button" accessibilityLabel="관심사 선택 완료">
              <Text style={styles.modalDone}>완료</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.modalContent}>
            {INTEREST_CATEGORIES.map(cat => (
              <View key={cat} style={styles.catSection}>
                <Text style={styles.catLabel}>{cat}</Text>
                <View style={styles.catGrid}>
                  {INTERESTS.filter(i => i.category === cat).map(interest => {
                    const isSelected = currentList.includes(interest.id);
                    const isInOther = interestModal === 'recent'
                      ? alwaysInterests.includes(interest.id)
                      : recentInterests.includes(interest.id);
                    return (
                      <Pressable
                        key={interest.id}
                        style={[
                          styles.chipOption,
                          isSelected && styles.chipSelected,
                          isInOther && styles.chipDisabled,
                        ]}
                        onPress={() => !isInOther && toggleInterest(interest.id)}
                        disabled={isInOther}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isSelected, disabled: isInOther }}
                        accessibilityLabel={interest.label}
                      >
                        <Text style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                          isInOther && styles.chipTextDisabled,
                        ]}>
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
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.xl,
    paddingTop: 60,
    gap: 16,
  },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.gray900 },

  // Avatar
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  avatarPressable: {
    position: 'relative',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarEditIcon: { fontSize: 11 },
  avatarInfo: { flex: 1, gap: 4 },
  avatarName: { fontSize: FONT_SIZE.xl, fontWeight: '600', color: COLORS.gray900 },
  shareLink: { fontSize: FONT_SIZE.sm, color: COLORS.primary },

  // Badge section
  badgeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeCount: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  badgeSeeAll: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    textAlign: 'right',
  },

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.gray800 },
  cardCount: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: '600' },
  cardDesc: { fontSize: FONT_SIZE.sm, color: COLORS.gray500, marginTop: -4 },

  // Input
  inputGroup: { gap: 6 },
  label: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.gray700 },
  input: {
    backgroundColor: COLORS.gray50,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: FONT_SIZE.md,
    color: COLORS.gray900,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  charCount: { fontSize: FONT_SIZE.xs, color: COLORS.gray400, textAlign: 'right' },

  // Tags
  tagList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  addTagBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.gray300,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  addTagText: { fontSize: FONT_SIZE.sm, color: COLORS.gray500, fontWeight: '600' },

  // Welcome topics
  topicRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topicInput: {
    flex: 1,
    backgroundColor: COLORS.gray50,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: FONT_SIZE.md,
    color: COLORS.gray900,
  },
  topicRemoveBtn: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  topicRemoveText: { fontSize: 20, color: COLORS.gray400 },
  addTopicBtn: {
    padding: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.gray300,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  addTopicText: { fontSize: FONT_SIZE.sm, color: COLORS.gray500, fontWeight: '600' },

  // Privacy
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BORDER_RADIUS.sm,
    gap: 12,
  },
  privacyOptionSelected: {
    backgroundColor: COLORS.primaryBg,
  },
  privacyRadio: {},
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.gray300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: { borderColor: COLORS.primary },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  privacyText: { flex: 1, gap: 2 },
  privacyLabel: { fontSize: FONT_SIZE.md, color: COLORS.gray700 },
  privacyLabelSelected: { color: COLORS.primary, fontWeight: '600' },
  privacyDesc: { fontSize: FONT_SIZE.xs, color: COLORS.gray500 },

  // Save
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: FONT_SIZE.lg, fontWeight: '700' },

  // Bottom
  bottomActions: { flexDirection: 'row', gap: 12 },
  bottomAction: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  bottomActionText: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.gray700 },
  signOutBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  signOutText: { fontSize: FONT_SIZE.sm, color: COLORS.error, fontWeight: '600' },

  // Modal
  modalContainer: { flex: 1, backgroundColor: COLORS.white },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.xl,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  modalTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.gray900 },
  modalDone: { fontSize: FONT_SIZE.md, color: COLORS.primary, fontWeight: '700' },
  modalContent: { padding: SPACING.xl },
  catSection: { marginBottom: 20 },
  catLabel: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.gray600, marginBottom: 10 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipOption: {
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: COLORS.primaryBg,
    borderColor: COLORS.primary,
  },
  chipDisabled: {
    opacity: 0.4,
  },
  chipText: { fontSize: FONT_SIZE.sm, color: COLORS.gray600 },
  chipTextSelected: { color: COLORS.primary, fontWeight: '600' },
  chipTextDisabled: { color: COLORS.gray400 },
});
