// ==========================================
// EventDetailScreen — 이벤트 상세 화면
// 상세 정보, 참석자 목록, RSVP 버튼
// ==========================================
import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, RefreshControl, FlatList,
} from 'react-native';
import { EventDetailScreenProps, AppEvent, EventAttendee, EventRSVP } from '../types';
import { mockEvents } from '../services/mockService';
import ScreenHeader from '../components/ScreenHeader';
import Avatar from '../components/Avatar';
import InterestTag from '../components/InterestTag';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { useApiCall } from '../hooks/useApiCall';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';
import BookmarkButton from '../components/BookmarkButton';

type EventWithRsvp = AppEvent & { myRsvp: EventRSVP | null };

const RSVP_OPTIONS: { value: EventRSVP; label: string; emoji: string; color: string }[] = [
  { value: 'GOING', label: '참석할게요', emoji: '✅', color: COLORS.success },
  { value: 'MAYBE', label: '아직 미정', emoji: '🤔', color: COLORS.warning },
  { value: 'NOT_GOING', label: '불참', emoji: '❌', color: COLORS.error },
];

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const wd = weekdays[d.getDay()];
  const hh = d.getHours().toString().padStart(2, '0');
  const mi = d.getMinutes().toString().padStart(2, '0');
  return `${mm}월 ${dd}일 (${wd}) ${hh}:${mi}`;
}

function formatTimeRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sh = s.getHours().toString().padStart(2, '0');
  const sm = s.getMinutes().toString().padStart(2, '0');
  const eh = e.getHours().toString().padStart(2, '0');
  const em = e.getMinutes().toString().padStart(2, '0');
  return `${sh}:${sm} - ${eh}:${em}`;
}

export default function EventDetailScreen({ route, navigation }: EventDetailScreenProps) {
  const { eventId } = route.params;
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [rsvpLoading, setRsvpLoading] = useState(false);

  const fetchDetail = useCallback(
    () => mockEvents.getEventDetail(eventId),
    [eventId],
  );
  const fetchAttendees = useCallback(
    () => mockEvents.getEventAttendees(eventId),
    [eventId],
  );

  const { data: event, loading, error, refresh: refreshDetail } = useApiCall<EventWithRsvp>(fetchDetail, { immediate: true });
  const { data: attendees, refresh: refreshAttendees } = useApiCall<EventAttendee[]>(fetchAttendees, { immediate: true });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshDetail(), refreshAttendees()]);
    setRefreshing(false);
  }, [refreshDetail, refreshAttendees]);

  const handleRsvp = useCallback(async (rsvp: EventRSVP) => {
    setRsvpLoading(true);
    try {
      await mockEvents.rsvpEvent(eventId, rsvp);
      const labels: Record<EventRSVP, string> = { GOING: '참석으로 변경했어요!', MAYBE: '미정으로 변경했어요', NOT_GOING: '불참으로 변경했어요' };
      showToast(labels[rsvp], 'success');
      await Promise.all([refreshDetail(), refreshAttendees()]);
    } catch {
      showToast('오류가 발생했어요', 'error');
    } finally {
      setRsvpLoading(false);
    }
  }, [eventId, showToast, refreshDetail, refreshAttendees]);

  const goingList = useMemo(() => (attendees ?? []).filter(a => a.rsvp === 'GOING'), [attendees]);
  const maybeList = useMemo(() => (attendees ?? []).filter(a => a.rsvp === 'MAYBE'), [attendees]);

  const isEnded = event?.status === 'ENDED' || event?.status === 'CANCELLED';

  if (loading && !event) {
    return (
      <View style={[styles.container, { backgroundColor: colors.white }]}>
        <ScreenHeader title="이벤트" onBack={() => navigation.goBack()} />
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingEmoji}>📅</Text>
          <Text style={[styles.loadingText, { color: colors.gray400 }]}>불러오는 중...</Text>
        </View>
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={[styles.container, { backgroundColor: colors.white }]}>
        <ScreenHeader title="이벤트" onBack={() => navigation.goBack()} />
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingEmoji}>😢</Text>
          <Text style={[styles.loadingText, { color: colors.gray400 }]}>이벤트를 찾을 수 없어요</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      <ScreenHeader title="이벤트" onBack={() => navigation.goBack()} rightElement={<BookmarkButton targetType="EVENT" targetId={eventId} size="sm" />} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 히어로 섹션 */}
        <View style={[styles.hero, { backgroundColor: colors.primaryBg }]}>
          <Text style={styles.heroEmoji}>{event.emoji}</Text>
          <Text style={[styles.heroTitle, { color: colors.gray900 }]}>{event.title}</Text>
          {event.groupName && (
            <View style={[styles.groupBadge, { backgroundColor: colors.white }]}>
              <Text style={[styles.groupBadgeText, { color: colors.primary }]}>👥 {event.groupName}</Text>
            </View>
          )}
        </View>

        {/* 상태 배너 (종료된 경우) */}
        {isEnded && (
          <View style={[styles.endedBanner, { backgroundColor: colors.gray100 }]}>
            <Text style={[styles.endedText, { color: colors.gray500 }]}>
              {event.status === 'CANCELLED' ? '🚫 취소된 이벤트입니다' : '✅ 종료된 이벤트입니다'}
            </Text>
          </View>
        )}

        {/* 정보 카드 */}
        <View style={[styles.infoCard, { backgroundColor: colors.white }, SHADOWS.sm]}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📅</Text>
            <View>
              <Text style={[styles.infoLabel, { color: colors.gray500 }]}>날짜</Text>
              <Text style={[styles.infoValue, { color: colors.gray900 }]}>{formatDateTime(event.date)}</Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.gray100 }]} />

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🕐</Text>
            <View>
              <Text style={[styles.infoLabel, { color: colors.gray500 }]}>시간</Text>
              <Text style={[styles.infoValue, { color: colors.gray900 }]}>{formatTimeRange(event.date, event.endDate)}</Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.gray100 }]} />

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <View>
              <Text style={[styles.infoLabel, { color: colors.gray500 }]}>장소</Text>
              <Text style={[styles.infoValue, { color: colors.gray900 }]}>{event.location}</Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.gray100 }]} />

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>👤</Text>
            <View>
              <Text style={[styles.infoLabel, { color: colors.gray500 }]}>주최자</Text>
              <Text style={[styles.infoValue, { color: colors.gray900 }]}>
                {event.hostEmoji ? `${event.hostEmoji} ` : ''}{event.hostName}
              </Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.gray100 }]} />

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>👥</Text>
            <View>
              <Text style={[styles.infoLabel, { color: colors.gray500 }]}>참석 현황</Text>
              <Text style={[styles.infoValue, { color: colors.gray900 }]}>
                {event.attendeeCount} / {event.maxAttendees}명
              </Text>
            </View>
          </View>
        </View>

        {/* 설명 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.gray800 }]}>📝 설명</Text>
          <Text style={[styles.descText, { color: colors.gray600 }]}>{event.description}</Text>
        </View>

        {/* 관심사 태그 */}
        {event.interestIds.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.gray800 }]}>🏷️ 관련 관심사</Text>
            <View style={styles.tagsRow}>
              {event.interestIds.map(id => (
                <InterestTag key={id} interestId={id} size="sm" />
              ))}
            </View>
          </View>
        )}

        {/* RSVP 버튼 */}
        {!isEnded && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.gray800 }]}>📋 참석 여부</Text>
            <View style={styles.rsvpRow}>
              {RSVP_OPTIONS.map(opt => {
                const isActive = event.myRsvp === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    style={[
                      styles.rsvpBtn,
                      { borderColor: colors.gray200 },
                      isActive && { borderColor: opt.color, backgroundColor: opt.color + '15' },
                    ]}
                    onPress={() => handleRsvp(opt.value)}
                    disabled={rsvpLoading}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={opt.label}
                  >
                    <Text style={styles.rsvpEmoji}>{opt.emoji}</Text>
                    <Text style={[
                      styles.rsvpLabel,
                      { color: colors.gray600 },
                      isActive && { color: opt.color, fontWeight: '700' },
                    ]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* 참석자 목록 */}
        {goingList.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.gray800 }]}>
              ✅ 참석 ({goingList.length})
            </Text>
            <View style={styles.attendeeList}>
              {goingList.map(a => (
                <View key={a.userId} style={styles.attendeeItem}>
                  <Avatar name={a.displayName} size={36} emoji={a.avatarEmoji} customColor={a.avatarColor} />
                  <Text style={[styles.attendeeName, { color: colors.gray700 }]}>{a.displayName}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {maybeList.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.gray800 }]}>
              🤔 미정 ({maybeList.length})
            </Text>
            <View style={styles.attendeeList}>
              {maybeList.map(a => (
                <View key={a.userId} style={styles.attendeeItem}>
                  <Avatar name={a.displayName} size={36} emoji={a.avatarEmoji} customColor={a.avatarColor} />
                  <Text style={[styles.attendeeName, { color: colors.gray500 }]}>{a.displayName}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 20 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingEmoji: { fontSize: 48 },
  loadingText: { fontSize: FONT_SIZE.md },

  // Hero
  hero: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: SPACING.xl,
    gap: 12,
  },
  heroEmoji: { fontSize: 56 },
  heroTitle: { fontSize: FONT_SIZE.xxl, fontWeight: '800', textAlign: 'center' },
  groupBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
  },
  groupBadgeText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },

  // Ended banner
  endedBanner: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  endedText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },

  // Info card
  infoCard: {
    marginHorizontal: SPACING.xl,
    marginTop: 16,
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  infoIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  infoLabel: { fontSize: FONT_SIZE.xs },
  infoValue: { fontSize: FONT_SIZE.md, fontWeight: '600', marginTop: 1 },
  divider: { height: 1, marginLeft: 40 },

  // Sections
  section: {
    marginTop: 24,
    paddingHorizontal: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginBottom: 12,
  },
  descText: { fontSize: FONT_SIZE.md, lineHeight: 22 },

  // Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  // RSVP
  rsvpRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rsvpBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
  },
  rsvpEmoji: { fontSize: 22 },
  rsvpLabel: { fontSize: FONT_SIZE.xs, fontWeight: '600' },

  // Attendees
  attendeeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  attendeeItem: {
    alignItems: 'center',
    width: 64,
    gap: 4,
  },
  attendeeName: { fontSize: FONT_SIZE.xs, textAlign: 'center' },
});
