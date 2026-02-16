// ==========================================
// 애니메이션 유틸리티 훅
// ==========================================
import { useRef, useEffect, useMemo } from 'react';
import { Animated, ViewStyle } from 'react-native';

// ── useFadeIn ──
// 컴포넌트 마운트 시 fadeIn + slideUp 애니메이션
export function useFadeIn(delay = 0, duration = 400) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, delay, duration]);

  const animatedStyle: Animated.WithAnimatedObject<ViewStyle> = useMemo(
    () => ({
      opacity,
      transform: [{ translateY }],
    }),
    [opacity, translateY],
  );

  return animatedStyle;
}

// ── useStaggeredList ──
// 리스트 아이템의 순차적 등장 애니메이션
export function useStaggeredList(count: number, staggerDelay = 60) {
  const anims = useRef<Animated.Value[]>([]).current;

  // 필요한 만큼만 Animated.Value 추가
  while (anims.length < count) {
    anims.push(new Animated.Value(0));
  }

  useEffect(() => {
    // 리셋
    anims.forEach((a) => a.setValue(0));

    if (count === 0) return;

    Animated.stagger(
      staggerDelay,
      anims.slice(0, count).map((a) =>
        Animated.timing(a, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [count, staggerDelay]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    getStyle: (index: number): Animated.WithAnimatedObject<ViewStyle> => {
      const anim = anims[index];
      if (!anim) return {};
      return {
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          },
        ],
      };
    },
  };
}

// ── useAnimatedToggle ──
// 토글 스위치의 부드러운 슬라이드 애니메이션
export function useAnimatedToggle(value: boolean, trackWidth = 44, thumbSize = 22) {
  const position = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(position, {
      toValue: value ? 1 : 0,
      useNativeDriver: true,
      friction: 7,
      tension: 40,
    }).start();
  }, [value, position]);

  const thumbTranslateX = position.interpolate({
    inputRange: [0, 1],
    outputRange: [2, trackWidth - thumbSize - 2],
  });

  return {
    thumbStyle: {
      transform: [{ translateX: thumbTranslateX }],
    },
    trackOpacity: position.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
  };
}

// ── usePulse ──
// 주기적 펄스 (주의 끌기용)
export function usePulse(duration = 1500) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.05,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse, duration]);

  return { transform: [{ scale: pulse }] };
}
