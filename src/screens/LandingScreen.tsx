import React from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, Animated, Dimensions,
} from 'react-native';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING } from '../constants/theme';
import { MOCK_USERS } from '../services/mockData';
import { getInterestById } from '../constants/interests';
import Avatar from '../components/Avatar';
import { getAvatarColor } from '../services/mockData';
import AnimatedPressable from '../components/AnimatedPressable';
import { useFadeIn } from '../hooks/useAnimations';
import { useTheme } from '../contexts/ThemeContext';
import type { LandingScreenProps } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 데모용 프로필 3개 (로그인 없이 볼 수 있는 예시)
const DEMO_PROFILES = MOCK_USERS.filter(u => u.privacyLevel === 'PUBLIC').slice(0, 3);

export default function LandingScreen({ navigation }: LandingScreenProps) {
  const heroFade = useFadeIn(0);
  const scenarioFade = useFadeIn(150);
  const howFade = useFadeIn(300);
  const demoFade = useFadeIn(450);
  const ctaFade = useFadeIn(600);
  const { colors } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.white }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <Animated.View style={[styles.hero, heroFade]} accessible={true} accessibilityRole="header">
        <Text style={styles.logo}>🤝</Text>
        <Text style={[styles.title, { color: colors.gray900 }]}>Common Ground</Text>
        <Text style={[styles.tagline, { color: colors.gray800 }]}>모임에서 어색한 침묵, 이제 끝.</Text>
        <Text style={[styles.subtitle, { color: colors.gray500 }]}>
          QR 하나로 프로필을 공유하고{'\n'}공통 관심사로 자연스럽게 대화를 시작하세요
        </Text>
      </Animated.View>

      {/* 핵심 시나리오 */}
      <Animated.View style={[styles.scenario, scenarioFade]}>
        <Text style={styles.scenarioTitle}>이럴 때 쓰세요</Text>
        <View style={styles.scenarioList}>
          <ScenarioItem emoji="🎉" text="네트워킹 행사에서 처음 만난 사람과" />
          <ScenarioItem emoji="🏫" text="새 학기, 동아리 OT 첫 만남에서" />
          <ScenarioItem emoji="☕" text="소개팅이나 모임에서 대화 물꼬를" />
        </View>
      </Animated.View>

      {/* 어떻게 작동하나요 */}
      <Animated.View style={[styles.howSection, howFade]}>
        <Text style={styles.howTitle}>3단계로 끝.</Text>
        <View style={styles.steps}>
          <StepItem num="1" title="관심사 등록" desc="30초면 충분해요" />
          <View style={styles.stepArrow}><Text style={styles.stepArrowText}>→</Text></View>
          <StepItem num="2" title="QR 공유" desc="상대에게 보여주세요" />
          <View style={styles.stepArrow}><Text style={styles.stepArrowText}>→</Text></View>
          <StepItem num="3" title="대화 시작" desc="추천 주제로 바로!" />
        </View>
      </Animated.View>

      {/* 데모 프로필 미리보기 (로그인 없이 체험) */}
      <Animated.View style={[styles.demoSection, demoFade]}>
        <Text style={styles.demoTitle}>이런 프로필이 만들어져요</Text>
        <Text style={styles.demoSubtitle}>탭해서 미리 구경해보세요</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.demoScroll}
          snapToInterval={SCREEN_WIDTH * 0.7 + 12}
          decelerationRate="fast"
        >
          {DEMO_PROFILES.map((user, idx) => (
            <AnimatedPressable
              key={user.id}
              style={styles.demoCard}
              onPress={() => navigation.navigate('DemoProfile', { userId: user.id })}
              accessibilityRole="button"
              accessibilityLabel={`${user.displayName}의 데모 프로필 보기`}
            >
              <Avatar name={user.displayName} size={52} isOnline={user.isOnline} emoji={user.avatarEmoji} customColor={user.avatarColor} />
              <Text style={styles.demoName}>{user.displayName}</Text>
              <Text style={styles.demoBio} numberOfLines={2}>{user.bio}</Text>
              <View style={styles.demoTags}>
                {[...user.recentInterests, ...user.alwaysInterests].slice(0, 4).map(id => {
                  const interest = getInterestById(id);
                  return interest ? (
                    <View key={id} style={styles.demoTag}>
                      <Text style={styles.demoTagText}>{interest.emoji} {interest.label}</Text>
                    </View>
                  ) : null;
                })}
              </View>
              {user.welcomeTopics.length > 0 && (
                <View style={styles.demoTopicBox}>
                  <Text style={styles.demoTopicLabel}>💬 이런 주제 환영!</Text>
                  <Text style={styles.demoTopicText} numberOfLines={1}>
                    {user.welcomeTopics[0]}
                  </Text>
                </View>
              )}
            </AnimatedPressable>
          ))}
        </ScrollView>
      </Animated.View>

      {/* CTA Buttons */}
      <Animated.View style={[styles.buttonSection, ctaFade]}>
        <AnimatedPressable
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Signup')}
          accessibilityRole="button"
          accessibilityLabel="30초만에 프로필 만들기"
        >
          <Text style={styles.primaryBtnText}>30초만에 프로필 만들기</Text>
        </AnimatedPressable>
        <AnimatedPressable
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('Login')}
          accessibilityRole="button"
          accessibilityLabel="로그인하기"
        >
          <Text style={styles.secondaryBtnText}>이미 계정이 있어요</Text>
        </AnimatedPressable>
      </Animated.View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

function ScenarioItem({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.scenarioItem}>
      <Text style={styles.scenarioEmoji}>{emoji}</Text>
      <Text style={styles.scenarioText}>{text}</Text>
    </View>
  );
}

function StepItem({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <View style={styles.stepItem}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{num}</Text>
      </View>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDesc}>{desc}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  contentContainer: { paddingBottom: 40 },

  // Hero
  hero: { alignItems: 'center', paddingTop: 70, paddingHorizontal: SPACING.xl, gap: 8 },
  logo: { fontSize: 56 },
  title: { fontSize: 30, fontWeight: '800', color: COLORS.gray900, letterSpacing: -0.5 },
  tagline: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.primary, marginTop: 4 },
  subtitle: {
    fontSize: FONT_SIZE.md, color: COLORS.gray500, textAlign: 'center', lineHeight: 22, marginTop: 4,
  },

  // Scenario
  scenario: { paddingHorizontal: SPACING.xl, marginTop: 32 },
  scenarioTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.gray900, marginBottom: 14 },
  scenarioList: { gap: 10 },
  scenarioItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.gray50, borderRadius: BORDER_RADIUS.md, padding: 14,
  },
  scenarioEmoji: { fontSize: 24 },
  scenarioText: { fontSize: FONT_SIZE.md, color: COLORS.gray700, flex: 1 },

  // How it works
  howSection: { paddingHorizontal: SPACING.xl, marginTop: 32 },
  howTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.gray900, marginBottom: 16 },
  steps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  stepItem: { alignItems: 'center', flex: 1, gap: 6 },
  stepNum: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' },
  stepTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.gray800 },
  stepDesc: { fontSize: FONT_SIZE.xs, color: COLORS.gray500 },
  stepArrow: { paddingHorizontal: 4, marginBottom: 16 },
  stepArrowText: { fontSize: 18, color: COLORS.gray300, fontWeight: '300' },

  // Demo profiles
  demoSection: { marginTop: 32, paddingLeft: SPACING.xl },
  demoTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.gray900 },
  demoSubtitle: { fontSize: FONT_SIZE.sm, color: COLORS.gray500, marginTop: 4, marginBottom: 14 },
  demoScroll: { paddingRight: SPACING.xl, gap: 12 },
  demoCard: {
    width: SCREEN_WIDTH * 0.7,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.lg,
    padding: 20,
    gap: 10,
  },
  demoName: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.gray900, marginTop: 4 },
  demoBio: { fontSize: FONT_SIZE.sm, color: COLORS.gray600, lineHeight: 18 },
  demoTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  demoTag: {
    backgroundColor: COLORS.primaryBg, borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  demoTagText: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: '500' },
  demoTopicBox: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.sm, padding: 10,
    borderWidth: 1, borderColor: COLORS.gray200, marginTop: 2,
  },
  demoTopicLabel: { fontSize: FONT_SIZE.xs, color: COLORS.gray500, fontWeight: '600' },
  demoTopicText: { fontSize: FONT_SIZE.sm, color: COLORS.gray700, marginTop: 2 },

  // Buttons
  buttonSection: { paddingHorizontal: SPACING.xl, marginTop: 32, gap: 12 },
  primaryBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md,
    paddingVertical: 16, alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: FONT_SIZE.lg, fontWeight: '700' },
  secondaryBtn: {
    borderRadius: BORDER_RADIUS.md, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.gray200,
  },
  secondaryBtnText: { color: COLORS.gray600, fontSize: FONT_SIZE.md, fontWeight: '600' },
});
