// ==========================================
// TutorialScreen – 앱 사용 가이드 (인터랙티브 튜토리얼)
// ==========================================
import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, Dimensions, FlatList, Animated,
  NativeScrollEvent, NativeSyntheticEvent,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { TutorialScreenProps } from '../types';

// ── 튜토리얼 스텝 데이터 ────────────────
interface TutorialStep {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  tips: string[];
  accentColor: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    emoji: '👋',
    title: 'Common Ground에 오신 걸\n환영해요!',
    subtitle: '대화의 시작을 더 쉽게',
    description: '관심사를 공유하고, 대화 주제를 추천받아\n자연스러운 만남을 만들어 보세요.',
    tips: ['좌우로 스와이프하거나 버튼을 눌러 진행하세요'],
    accentColor: COLORS.primary,
  },
  {
    id: 'profile',
    emoji: '✨',
    title: '나만의 프로필 만들기',
    subtitle: '첫인상을 설정해요',
    description: '아바타, 이름, 자기소개를 설정하고\n나를 표현하는 프로필을 완성하세요.',
    tips: [
      '아바타 이모지와 색상을 자유롭게 선택',
      '자기소개는 짧고 인상적으로 작성',
      '프로필 완성도가 높을수록 매칭률 UP',
    ],
    accentColor: '#6366F1',
  },
  {
    id: 'interests',
    emoji: '🎯',
    title: '관심사 등록하기',
    subtitle: '공통 관심사로 연결돼요',
    description: '좋아하는 것을 등록하면\n비슷한 취향의 사람을 추천해 드려요.',
    tips: [
      '관심사를 많이 등록할수록 매칭 정확도 UP',
      '트렌딩 관심사도 확인해 보세요',
      '언제든 수정할 수 있어요',
    ],
    accentColor: '#F59E0B',
  },
  {
    id: 'discover',
    emoji: '🔍',
    title: '사람 발견하기',
    subtitle: 'Discover 탭을 활용하세요',
    description: '온라인 사용자를 둘러보고\n관심사가 맞는 사람을 찾아보세요.',
    tips: [
      '호환성 점수로 얼마나 잘 맞는지 확인',
      '프로필을 눌러 상세 정보를 확인하세요',
      '검색 기능으로 특정 관심사를 가진 사람 탐색',
    ],
    accentColor: '#10B981',
  },
  {
    id: 'connect',
    emoji: '🤝',
    title: '연결 요청 보내기',
    subtitle: '대화의 시작',
    description: '마음에 드는 사람에게 연결 요청을 보내\n대화를 시작해 보세요.',
    tips: [
      '연결 요청 시 추천 대화 주제가 제공돼요',
      '상대방이 수락하면 채팅이 열려요',
      '알림으로 수락 여부를 확인할 수 있어요',
    ],
    accentColor: '#EC4899',
  },
  {
    id: 'chat',
    emoji: '💬',
    title: '채팅으로 대화하기',
    subtitle: '자유롭게 소통해요',
    description: '연결된 사람과 실시간 채팅으로\n더 깊은 대화를 나눠 보세요.',
    tips: [
      '메시지를 길게 눌러 리액션을 남겨 보세요',
      '대화 주제가 떨어지면 추천 주제를 활용',
      '불편한 사용자는 신고/차단할 수 있어요',
    ],
    accentColor: '#8B5CF6',
  },
  {
    id: 'groups',
    emoji: '👥',
    title: '그룹 & 이벤트',
    subtitle: '함께하는 즐거움',
    description: '관심사 기반 그룹에 참여하고\n오프라인 이벤트도 만들어 보세요.',
    tips: [
      '그룹에서 비슷한 관심사의 사람들을 만나세요',
      '이벤트를 직접 만들 수도 있어요',
      '북마크로 관심 있는 활동을 저장하세요',
    ],
    accentColor: '#F97316',
  },
  {
    id: 'more',
    emoji: '🚀',
    title: '더 많은 기능들',
    subtitle: '다양하게 활용해 보세요',
    description: '프로필 공유, 활동 통계, 배지 수집 등\n다양한 기능을 탐험해 보세요!',
    tips: [
      '📊 활동 통계에서 나의 소셜 패턴 확인',
      '🏅 배지를 수집해 성취감을 느껴보세요',
      '🔗 QR코드로 프로필을 간편하게 공유',
      '📝 메모 기능으로 인상 깊은 사람을 기록',
    ],
    accentColor: '#0EA5E9',
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── 메인 컴포넌트 ────────────────────────
export default function TutorialScreen({ navigation }: TutorialScreenProps) {
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const isLast = currentIndex === TUTORIAL_STEPS.length - 1;

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== currentIndex && index >= 0 && index < TUTORIAL_STEPS.length) {
      setCurrentIndex(index);
    }
  }, [currentIndex]);

  const goToIndex = useCallback((index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
  }, []);

  const handleNext = useCallback(() => {
    if (isLast) {
      navigation.goBack();
    } else {
      goToIndex(currentIndex + 1);
    }
  }, [isLast, currentIndex, goToIndex, navigation]);

  const handleSkip = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // ── 스텝 카드 렌더러 ──
  const renderStep = useCallback(({ item, index }: { item: TutorialStep; index: number }) => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.85, 1, 0.85],
      extrapolate: 'clamp',
    });
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.4, 1, 0.4],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.stepContainer, { width: SCREEN_WIDTH, opacity, transform: [{ scale }] }]}>
        {/* 이모지 아이콘 */}
        <View style={[styles.emojiCircle, { backgroundColor: item.accentColor + '18' }]}>
          <Text style={styles.emojiText}>{item.emoji}</Text>
        </View>

        {/* 타이틀 */}
        <Text style={[styles.stepTitle, { color: colors.gray900 }]}>{item.title}</Text>
        <Text style={[styles.stepSubtitle, { color: item.accentColor }]}>{item.subtitle}</Text>

        {/* 설명 */}
        <Text style={[styles.stepDescription, { color: colors.gray600 }]}>{item.description}</Text>

        {/* 팁 카드 */}
        <View style={[styles.tipsCard, { backgroundColor: colors.white, borderColor: colors.gray100 }]}>
          <Text style={[styles.tipsHeader, { color: colors.gray500 }]}>💡 팁</Text>
          {item.tips.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={[styles.tipBullet, { color: item.accentColor }]}>•</Text>
              <Text style={[styles.tipText, { color: colors.gray700 }]}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* 페이지 번호 */}
        <Text style={[styles.pageNum, { color: colors.gray400 }]}>
          {index + 1} / {TUTORIAL_STEPS.length}
        </Text>
      </Animated.View>
    );
  }, [scrollX, colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.gray50 }]}>  
      {/* 상단 스킵 버튼 */}
      <View style={styles.topBar}>
        <Pressable onPress={handleSkip} hitSlop={12} accessibilityRole="button" accessibilityLabel="건너뛰기">
          <Text style={[styles.skipText, { color: colors.gray500 }]}>건너뛰기</Text>
        </Pressable>
      </View>

      {/* 카드 FlatList */}
      <Animated.FlatList
        ref={flatListRef}
        data={TUTORIAL_STEPS}
        keyExtractor={(item) => item.id}
        renderItem={renderStep}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true, listener: handleScroll },
        )}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* 하단 컨트롤 */}
      <View style={[styles.bottomBar, { backgroundColor: colors.gray50 }]}>
        {/* 인디케이터 도트 */}
        <View style={styles.dotsRow}>
          {TUTORIAL_STEPS.map((step, i) => {
            const dotWidth = scrollX.interpolate({
              inputRange: [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH],
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange: [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH],
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Pressable key={step.id} onPress={() => goToIndex(i)} hitSlop={8}>
                <Animated.View
                  style={[
                    styles.dot,
                    {
                      width: dotWidth,
                      opacity: dotOpacity,
                      backgroundColor: TUTORIAL_STEPS[currentIndex].accentColor,
                    },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>

        {/* 이전/다음 버튼 */}
        <View style={styles.navButtons}>
          {currentIndex > 0 ? (
            <Pressable
              style={[styles.navBtn, styles.prevBtn, { borderColor: colors.gray200 }]}
              onPress={() => goToIndex(currentIndex - 1)}
              accessibilityRole="button"
              accessibilityLabel="이전"
            >
              <Text style={[styles.navBtnText, { color: colors.gray600 }]}>← 이전</Text>
            </Pressable>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          <Pressable
            style={[styles.navBtn, styles.nextBtn, { backgroundColor: TUTORIAL_STEPS[currentIndex].accentColor }]}
            onPress={handleNext}
            accessibilityRole="button"
            accessibilityLabel={isLast ? '시작하기' : '다음'}
          >
            <Text style={[styles.navBtnText, { color: '#FFFFFF' }]}>
              {isLast ? '시작하기 🎉' : '다음 →'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ── 스타일 ──────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray50 },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.xl,
    paddingTop: 56,
    paddingBottom: 8,
  },
  skipText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.gray500,
  },

  stepContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl + 8,
    paddingBottom: 80,
  },

  emojiCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emojiText: {
    fontSize: 48,
  },

  stepTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.gray900,
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: FONT_SIZE.md,
    lineHeight: 24,
    color: COLORS.gray600,
    textAlign: 'center',
    marginBottom: 24,
  },

  tipsCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    padding: 16,
    gap: 8,
    ...SHADOWS.sm,
  },
  tipsHeader: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.gray500,
    marginBottom: 4,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipBullet: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginTop: 1,
  },
  tipText: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    color: COLORS.gray700,
    flex: 1,
  },

  pageNum: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray400,
    marginTop: 16,
  },

  bottomBar: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: 40,
    paddingTop: 8,
  },

  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },

  navButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  navBtn: {
    flex: 1,
    height: 52,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
  },
  nextBtn: {
    backgroundColor: COLORS.primary,
  },
  navBtnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});
