// ==========================================
// CreateEventScreen — 이벤트 생성 화면
// 제목, 설명, 이모지, 날짜/시간, 장소, 관심사, 정원
// ==========================================
import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, StyleSheet, Modal, Platform,
} from 'react-native';
import { CreateEventScreenProps } from '../types';
import { mockEvents } from '../services/mockService';
import { INTERESTS, INTEREST_CATEGORIES } from '../constants/interests';
import ScreenHeader from '../components/ScreenHeader';
import InterestTag from '../components/InterestTag';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING } from '../constants/theme';

const EVENT_EMOJIS = [
  '🎲', '🎵', '🏃', '🍜', '💻', '🎨', '📚', '🎮',
  '🧘', '☕', '🎬', '🎤', '🏕️', '🎯', '🎪', '🌿',
];

// 간단한 날짜/시간 옵션 (모바일 데이트피커 대신)
function generateDateOptions(): { label: string; value: string }[] {
  const options: { label: string; value: string }[] = [];
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const now = new Date();
  for (let i = 1; i <= 14; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    const mm = d.getMonth() + 1;
    const dd = d.getDate();
    const wd = weekdays[d.getDay()];
    options.push({
      label: `${mm}월 ${dd}일 (${wd})`,
      value: `${d.getFullYear()}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`,
    });
  }
  return options;
}

const TIME_OPTIONS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00',
];

const DURATION_OPTIONS = [
  { label: '1시간', hours: 1 },
  { label: '2시간', hours: 2 },
  { label: '3시간', hours: 3 },
  { label: '반나절', hours: 5 },
  { label: '종일', hours: 8 },
];

export default function CreateEventScreen({ route, navigation }: CreateEventScreenProps) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const groupId = route.params?.groupId;

  const [emoji, setEmoji] = useState('🎲');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('14:00');
  const [duration, setDuration] = useState(2);
  const [maxAttendees, setMaxAttendees] = useState('10');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [interestModalVisible, setInterestModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const dateOptions = useMemo(() => generateDateOptions(), []);

  const canSubmit = title.trim().length >= 2 && location.trim().length >= 2 && selectedDate !== '';

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : prev.length < 5 ? [...prev, id] : prev,
    );
  };

  const handleCreate = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const [hh, mm] = selectedTime.split(':').map(Number);
      const startDate = new Date(`${selectedDate}T${selectedTime}:00`);
      const endDate = new Date(startDate.getTime() + duration * 3600000);

      await mockEvents.createEvent({
        title: title.trim(),
        description: description.trim(),
        emoji,
        date: startDate.toISOString(),
        endDate: endDate.toISOString(),
        location: location.trim(),
        groupId: groupId,
        interestIds: selectedInterests,
        maxAttendees: parseInt(maxAttendees, 10) || 10,
      });
      showToast('이벤트가 생성되었어요! 🎉', 'success');
      navigation.goBack();
    } catch {
      showToast('오류가 발생했어요', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      <ScreenHeader title="이벤트 만들기" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* 이모지 선택 */}
        <Text style={[styles.label, { color: colors.gray700 }]}>이모지</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiRow}>
          {EVENT_EMOJIS.map(e => (
            <Pressable
              key={e}
              style={[
                styles.emojiBtn,
                { backgroundColor: colors.gray100 },
                emoji === e && { backgroundColor: colors.primaryBg, borderColor: colors.primary, borderWidth: 2 },
              ]}
              onPress={() => setEmoji(e)}
              accessibilityRole="radio"
              accessibilityState={{ selected: emoji === e }}
              accessibilityLabel={e}
            >
              <Text style={styles.emojiBtnText}>{e}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* 제목 */}
        <Text style={[styles.label, { color: colors.gray700, marginTop: 20 }]}>제목 *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.gray50, color: colors.gray900, borderColor: colors.gray200 }]}
          value={title}
          onChangeText={setTitle}
          placeholder="이벤트 이름을 입력하세요"
          placeholderTextColor={colors.gray400}
          maxLength={40}
        />

        {/* 설명 */}
        <Text style={[styles.label, { color: colors.gray700, marginTop: 16 }]}>설명</Text>
        <TextInput
          style={[styles.input, styles.multiline, { backgroundColor: colors.gray50, color: colors.gray900, borderColor: colors.gray200 }]}
          value={description}
          onChangeText={setDescription}
          placeholder="이벤트에 대해 설명해주세요"
          placeholderTextColor={colors.gray400}
          maxLength={200}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* 장소 */}
        <Text style={[styles.label, { color: colors.gray700, marginTop: 16 }]}>장소 *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.gray50, color: colors.gray900, borderColor: colors.gray200 }]}
          value={location}
          onChangeText={setLocation}
          placeholder="예: 강남역 3번출구 앞"
          placeholderTextColor={colors.gray400}
          maxLength={50}
        />

        {/* 날짜 선택 */}
        <Text style={[styles.label, { color: colors.gray700, marginTop: 20 }]}>날짜 *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {dateOptions.map(opt => (
            <Pressable
              key={opt.value}
              style={[
                styles.chip,
                { borderColor: colors.gray200 },
                selectedDate === opt.value && { borderColor: colors.primary, backgroundColor: colors.primaryBg },
              ]}
              onPress={() => setSelectedDate(opt.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedDate === opt.value }}
            >
              <Text style={[
                styles.chipText,
                { color: colors.gray600 },
                selectedDate === opt.value && { color: colors.primary, fontWeight: '700' },
              ]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* 시작 시간 */}
        <Text style={[styles.label, { color: colors.gray700, marginTop: 16 }]}>시작 시간</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {TIME_OPTIONS.map(t => (
            <Pressable
              key={t}
              style={[
                styles.chipSm,
                { borderColor: colors.gray200 },
                selectedTime === t && { borderColor: colors.primary, backgroundColor: colors.primaryBg },
              ]}
              onPress={() => setSelectedTime(t)}
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedTime === t }}
            >
              <Text style={[
                styles.chipText,
                { color: colors.gray600 },
                selectedTime === t && { color: colors.primary, fontWeight: '700' },
              ]}>
                {t}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* 소요 시간 */}
        <Text style={[styles.label, { color: colors.gray700, marginTop: 16 }]}>소요 시간</Text>
        <View style={styles.durationRow}>
          {DURATION_OPTIONS.map(d => (
            <Pressable
              key={d.hours}
              style={[
                styles.chipSm,
                { borderColor: colors.gray200 },
                duration === d.hours && { borderColor: colors.primary, backgroundColor: colors.primaryBg },
              ]}
              onPress={() => setDuration(d.hours)}
              accessibilityRole="radio"
              accessibilityState={{ selected: duration === d.hours }}
            >
              <Text style={[
                styles.chipText,
                { color: colors.gray600 },
                duration === d.hours && { color: colors.primary, fontWeight: '700' },
              ]}>
                {d.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* 최대 참석자 */}
        <Text style={[styles.label, { color: colors.gray700, marginTop: 16 }]}>최대 참석자</Text>
        <View style={styles.attendeeRow}>
          {['5', '8', '10', '15', '20', '30'].map(n => (
            <Pressable
              key={n}
              style={[
                styles.chipSm,
                { borderColor: colors.gray200 },
                maxAttendees === n && { borderColor: colors.primary, backgroundColor: colors.primaryBg },
              ]}
              onPress={() => setMaxAttendees(n)}
              accessibilityRole="radio"
              accessibilityState={{ selected: maxAttendees === n }}
            >
              <Text style={[
                styles.chipText,
                { color: colors.gray600 },
                maxAttendees === n && { color: colors.primary, fontWeight: '700' },
              ]}>
                {n}명
              </Text>
            </Pressable>
          ))}
        </View>

        {/* 관심사 */}
        <Text style={[styles.label, { color: colors.gray700, marginTop: 20 }]}>관련 관심사</Text>
        <Pressable
          style={[styles.addBtn, { borderColor: colors.gray300 }]}
          onPress={() => setInterestModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="관심사 추가"
        >
          <Text style={[styles.addBtnText, { color: colors.primary }]}>
            + 관심사 추가 ({selectedInterests.length}/5)
          </Text>
        </Pressable>
        {selectedInterests.length > 0 && (
          <View style={styles.selectedTags}>
            {selectedInterests.map(id => (
              <InterestTag key={id} interestId={id} size="sm" onRemove={() => toggleInterest(id)} />
            ))}
          </View>
        )}

        {/* 생성 버튼 */}
        <Pressable
          style={[styles.createBtn, { backgroundColor: canSubmit ? colors.primary : colors.gray300 }]}
          onPress={handleCreate}
          disabled={!canSubmit || submitting}
          accessibilityRole="button"
          accessibilityLabel="이벤트 만들기"
        >
          <Text style={styles.createBtnText}>
            {submitting ? '생성 중...' : '🎉 이벤트 만들기'}
          </Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 관심사 선택 모달 */}
      <Modal visible={interestModalVisible} transparent animationType="slide" onRequestClose={() => setInterestModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setInterestModalVisible(false)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.white }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.gray300 }]} />
            <Text style={[styles.modalTitle, { color: colors.gray900 }]}>관심사 선택 (최대 5개)</Text>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {INTEREST_CATEGORIES.map(cat => {
                const catInterests = INTERESTS.filter(i => i.category === cat);
                return (
                  <View key={cat} style={styles.modalCategory}>
                    <Text style={[styles.modalCatTitle, { color: colors.gray700 }]}>{cat}</Text>
                    <View style={styles.modalTagsRow}>
                      {catInterests.map(interest => {
                        const isSelected = selectedInterests.includes(interest.id);
                        return (
                          <Pressable key={interest.id} onPress={() => toggleInterest(interest.id)}>
                            <InterestTag interestId={interest.id} isHighlighted={isSelected} size="sm" />
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <Pressable
              style={[styles.modalDone, { backgroundColor: colors.primary }]}
              onPress={() => setInterestModalVisible(false)}
              accessibilityRole="button"
            >
              <Text style={styles.modalDoneText}>완료</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.xl, paddingTop: 12 },

  label: { fontSize: FONT_SIZE.sm, fontWeight: '700', marginBottom: 8 },

  input: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: FONT_SIZE.md,
  },
  multiline: {
    minHeight: 80,
    paddingTop: 12,
  },

  emojiRow: { gap: 8, paddingHorizontal: 2 },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiBtnText: { fontSize: 22 },

  chipRow: { gap: 8, paddingHorizontal: 2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  chipSm: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  chipText: { fontSize: FONT_SIZE.sm, fontWeight: '500' },

  durationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  attendeeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  addBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addBtnText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  selectedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },

  createBtn: {
    marginTop: 28,
    paddingVertical: 16,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  createBtnText: { color: '#fff', fontSize: FONT_SIZE.lg, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingTop: 12,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700', paddingHorizontal: SPACING.xl },
  modalBody: { paddingHorizontal: SPACING.xl, marginTop: 16 },
  modalCategory: { marginBottom: 16 },
  modalCatTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', marginBottom: 8 },
  modalTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modalDone: {
    margin: SPACING.xl,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  modalDoneText: { color: '#fff', fontSize: FONT_SIZE.lg, fontWeight: '700' },
});
