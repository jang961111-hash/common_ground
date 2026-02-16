import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
} from 'react-native';
import { mockProfile } from '../services/mockService';
import { getInterestById } from '../constants/interests';
import { useTheme } from '../contexts/ThemeContext';
import Avatar from '../components/Avatar';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING } from '../constants/theme';
import { User, DemoProfileScreenProps } from '../types';
import { SkeletonUserDetail } from '../components/Skeleton';

export default function DemoProfileScreen({ route, navigation }: DemoProfileScreenProps) {
  const { userId } = route.params;
  const { colors } = useTheme();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    mockProfile.getUserById(userId).then(setUser);
  }, [userId]);

  if (!user) {
    return <SkeletonUserDetail />;
  }

  const allInterests = [...user.recentInterests, ...user.alwaysInterests];

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="뒤로 가기">
          <Text style={[styles.backText, { color: colors.primary }]}>← 뒤로</Text>
        </Pressable>
        <Text style={[styles.headerLabel, { color: colors.gray500 }]}>프로필 미리보기</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 프로필 카드 */}
        <View style={[styles.profileCard, { backgroundColor: colors.gray50 }]} accessible={true} accessibilityLabel={`${user.displayName}의 프로필${user.bio ? `, ${user.bio}` : ''}${user.isOnline ? ', 온라인' : ''}`}>
          <Avatar name={user.displayName} size={72} isOnline={user.isOnline} emoji={user.avatarEmoji} customColor={user.avatarColor} />
          <Text style={[styles.name, { color: colors.gray900 }]}>{user.displayName}</Text>
          {user.bio && <Text style={[styles.bio, { color: colors.gray600 }]}>{user.bio}</Text>}
          {user.isOnline && (
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>온라인</Text>
            </View>
          )}
        </View>

        {/* 관심사 */}
        {allInterests.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.gray900 }]}>🎯 관심사</Text>
            <View style={styles.tagsWrap}>
              {allInterests.map(id => {
                const interest = getInterestById(id);
                return interest ? (
                  <View key={id} style={styles.tag}>
                    <Text style={styles.tagText}>{interest.emoji} {interest.label}</Text>
                  </View>
                ) : null;
              })}
            </View>
          </View>
        )}

        {/* 환영 주제 */}
        {user.welcomeTopics.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.gray900 }]}>💬 이런 주제 환영해요</Text>
            {user.welcomeTopics.map((topic, idx) => (
              <View key={idx} style={[styles.topicItem, { backgroundColor: colors.gray50 }]}>
                <Text style={[styles.topicText, { color: colors.gray700 }]}>{topic}</Text>
              </View>
            ))}
          </View>
        )}

        {/* CTA */}
        <View style={[styles.ctaSection, { backgroundColor: colors.primaryBg }]}>
          <Text style={[styles.ctaTitle, { color: colors.gray800 }]}>나도 프로필 만들어볼까?</Text>
          <Pressable
            style={styles.ctaBtn}
            onPress={() => navigation.navigate('Signup')}
            accessibilityRole="button"
            accessibilityLabel="30초만에 시작하기"
          >
            <Text style={styles.ctaBtnText}>30초만에 시작하기</Text>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: FONT_SIZE.md, color: COLORS.gray500 },

  header: {
    paddingTop: 60, paddingHorizontal: SPACING.xl, paddingBottom: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: FONT_SIZE.md, color: COLORS.primary, fontWeight: '600' },
  headerLabel: { fontSize: FONT_SIZE.md, color: COLORS.gray500, fontWeight: '500' },

  content: { paddingHorizontal: SPACING.xl },

  profileCard: {
    alignItems: 'center', paddingVertical: 28,
    backgroundColor: COLORS.gray50, borderRadius: BORDER_RADIUS.lg,
    marginTop: 8, gap: 8,
  },
  name: { fontSize: 24, fontWeight: '800', color: COLORS.gray900, marginTop: 4 },
  bio: { fontSize: FONT_SIZE.md, color: COLORS.gray600, textAlign: 'center', paddingHorizontal: 20 },
  onlineBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.successBg, borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
  onlineText: { fontSize: FONT_SIZE.xs, color: COLORS.success, fontWeight: '600' },

  section: { marginTop: 24 },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.gray900, marginBottom: 12 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: COLORS.primaryBg, borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  tagText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: '500' },

  topicItem: {
    backgroundColor: COLORS.gray50, borderRadius: BORDER_RADIUS.md,
    padding: 14, marginBottom: 8,
  },
  topicText: { fontSize: FONT_SIZE.md, color: COLORS.gray700 },

  ctaSection: {
    marginTop: 32, alignItems: 'center',
    backgroundColor: COLORS.primaryBg, borderRadius: BORDER_RADIUS.lg,
    padding: 24, gap: 14,
  },
  ctaTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.gray800 },
  ctaBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md,
    paddingVertical: 14, paddingHorizontal: 32,
  },
  ctaBtnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' },
});
