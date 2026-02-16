// ==========================================
// EventCard — 이벤트 카드 컴포넌트
// full / compact 두 가지 모드
// ==========================================
import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { EventPreview, EventRSVP } from '../types';

interface EventCardProps {
  event: EventPreview;
  compact?: boolean;
  onPress?: () => void;
}

const RSVP_CONFIG: Record<EventRSVP, { label: string; color: string }> = {
  GOING: { label: '참석', color: COLORS.success },
  MAYBE: { label: '미정', color: COLORS.warning },
  NOT_GOING: { label: '불참', color: COLORS.gray400 },
};

function formatEventDate(isoDate: string): { day: string; month: string; time: string; weekday: string } {
  const d = new Date(isoDate);
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  return {
    day: String(d.getDate()),
    month: months[d.getMonth()],
    time: `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`,
    weekday: weekdays[d.getDay()],
  };
}

function daysUntil(isoDate: string): string {
  const diff = Math.ceil((new Date(isoDate).getTime() - Date.now()) / 86400000);
  if (diff < 0) return '종료됨';
  if (diff === 0) return '오늘';
  if (diff === 1) return '내일';
  return `${diff}일 후`;
}

export function EventCard({ event, compact = false, onPress }: EventCardProps) {
  const { colors } = useTheme();
  const dateInfo = useMemo(() => formatEventDate(event.date), [event.date]);
  const daysLabel = useMemo(() => daysUntil(event.date), [event.date]);
  const rsvpInfo = event.myRsvp ? RSVP_CONFIG[event.myRsvp] : null;
  const isEnded = event.status === 'ENDED';

  if (compact) {
    return (
      <Pressable
        style={[styles.compactCard, { backgroundColor: colors.white }, SHADOWS.sm]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${event.title} 이벤트`}
      >
        <View style={styles.compactEmoji}>
          <Text style={styles.emojiText}>{event.emoji}</Text>
        </View>
        <View style={styles.compactBody}>
          <Text style={[styles.compactTitle, { color: colors.gray900 }]} numberOfLines={1}>
            {event.title}
          </Text>
          <Text style={[styles.compactDate, { color: colors.gray500 }]}>
            {dateInfo.month} {dateInfo.day}일 ({dateInfo.weekday}) · {dateInfo.time}
          </Text>
        </View>
        {rsvpInfo && (
          <View style={[styles.rsvpDot, { backgroundColor: rsvpInfo.color }]} />
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.white }, SHADOWS.md, isEnded && { opacity: 0.7 }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${event.title} 이벤트 상세 보기`}
    >
      {/* 날짜 블록 */}
      <View style={[styles.dateBlock, { backgroundColor: colors.primaryBg }]}>
        <Text style={[styles.dateMonth, { color: colors.primary }]}>{dateInfo.month}</Text>
        <Text style={[styles.dateDay, { color: colors.primary }]}>{dateInfo.day}</Text>
        <Text style={[styles.dateWeekday, { color: colors.primary }]}>{dateInfo.weekday}</Text>
      </View>

      {/* 본문 */}
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={styles.cardEmoji}>{event.emoji}</Text>
          <Text style={[styles.cardTitle, { color: colors.gray900 }]} numberOfLines={1}>
            {event.title}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: colors.gray500 }]}>
            🕐 {dateInfo.time}
          </Text>
          <Text style={[styles.metaText, { color: colors.gray500 }]}>
            📍 {event.location}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.attendeeText, { color: colors.gray400 }]}>
            👥 {event.attendeeCount}명 참석
          </Text>

          {event.groupName && (
            <View style={[styles.groupTag, { backgroundColor: colors.gray100 }]}>
              <Text style={[styles.groupTagText, { color: colors.gray600 }]}>
                {event.groupName}
              </Text>
            </View>
          )}

          {rsvpInfo && (
            <View style={[styles.rsvpBadge, { backgroundColor: rsvpInfo.color + '20', borderColor: rsvpInfo.color }]}>
              <Text style={[styles.rsvpText, { color: rsvpInfo.color }]}>{rsvpInfo.label}</Text>
            </View>
          )}

          {!rsvpInfo && !isEnded && (
            <View style={[styles.daysTag, { backgroundColor: colors.primaryBg }]}>
              <Text style={[styles.daysText, { color: colors.primary }]}>{daysLabel}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // ── Full card ──
  card: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: 12,
  },
  dateBlock: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  dateMonth: { fontSize: FONT_SIZE.xs, fontWeight: '600', textTransform: 'uppercase' },
  dateDay: { fontSize: 28, fontWeight: '800', lineHeight: 32 },
  dateWeekday: { fontSize: FONT_SIZE.xs, fontWeight: '600', marginTop: 2 },
  cardBody: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardEmoji: { fontSize: 18 },
  cardTitle: { fontSize: FONT_SIZE.md, fontWeight: '700', flex: 1 },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metaText: { fontSize: FONT_SIZE.xs },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  attendeeText: { fontSize: FONT_SIZE.xs },
  groupTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  groupTagText: { fontSize: 10, fontWeight: '600' },
  rsvpBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  rsvpText: { fontSize: 10, fontWeight: '700' },
  daysTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  daysText: { fontSize: 10, fontWeight: '700' },

  // ── Compact card ──
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BORDER_RADIUS.md,
    marginRight: 12,
    width: 240,
    gap: 10,
  },
  compactEmoji: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: { fontSize: 20 },
  compactBody: { flex: 1, gap: 2 },
  compactTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  compactDate: { fontSize: FONT_SIZE.xs },
  rsvpDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
