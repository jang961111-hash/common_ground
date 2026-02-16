// ==========================================
// AnimatedPressable — 스케일 프레스 피드백 래퍼
// ==========================================
import React, { useRef, useCallback } from 'react';
import {
  Pressable,
  Animated,
  ViewStyle,
  StyleProp,
  GestureResponderEvent,
  AccessibilityRole,
  AccessibilityState,
} from 'react-native';

interface AnimatedPressableProps {
  style?: StyleProp<ViewStyle>;
  /** 프레스 시 축소 비율 (기본: 0.97) */
  scaleValue?: number;
  /** 애니메이션 비활성화 */
  noAnimation?: boolean;
  children?: React.ReactNode;
  onPress?: () => void;
  onPressIn?: (e: GestureResponderEvent) => void;
  onPressOut?: (e: GestureResponderEvent) => void;
  disabled?: boolean;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityState?: AccessibilityState;
  accessibilityHint?: string;
  testID?: string;
  hitSlop?: number | { top?: number; bottom?: number; left?: number; right?: number };
}

/**
 * Pressable을 감싸서 누를 때 spring scale 피드백을 제공합니다.
 * 기존 Pressable과 동일한 API로 드롭인 교체 가능.
 */
export default function AnimatedPressable({
  style,
  children,
  scaleValue = 0.97,
  noAnimation = false,
  onPressIn,
  onPressOut,
  disabled,
  ...props
}: AnimatedPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
      if (!noAnimation && !disabled) {
        Animated.spring(scale, {
          toValue: scaleValue,
          useNativeDriver: true,
          friction: 6,
          tension: 100,
        }).start();
      }
      onPressIn?.(e);
    },
    [noAnimation, disabled, scaleValue, scale, onPressIn],
  );

  const handlePressOut = useCallback(
    (e: GestureResponderEvent) => {
      if (!noAnimation && !disabled) {
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 4,
          tension: 80,
        }).start();
      }
      onPressOut?.(e);
    },
    [noAnimation, disabled, scale, onPressOut],
  );

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      {...props}
    >
      <Animated.View style={[style as ViewStyle, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
