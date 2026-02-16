// ==========================================
// BookmarkButton — 북마크 토글 버튼
// 프로필, 그룹, 이벤트 상세에서 사용
// ==========================================
import React, { useState, useEffect, useCallback } from 'react';
import { Pressable, Text, StyleSheet, Animated } from 'react-native';
import { mockBookmarks } from '../services/mockService';
import { useToast } from '../contexts/ToastContext';
import { BookmarkType } from '../types';

interface BookmarkButtonProps {
  targetType: BookmarkType;
  targetId: string;
  /** 크기 (기본 'md') */
  size?: 'sm' | 'md';
  /** 라벨 표시 여부 */
  showLabel?: boolean;
}

export default function BookmarkButton({
  targetType,
  targetId,
  size = 'md',
  showLabel = false,
}: BookmarkButtonProps) {
  const { showToast } = useToast();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const scale = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let mounted = true;
    mockBookmarks.isBookmarked(targetType, targetId).then(result => {
      if (mounted) setIsBookmarked(result);
    });
    return () => { mounted = false; };
  }, [targetType, targetId]);

  const handleToggle = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    // 바운스 애니메이션
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.3, useNativeDriver: true, friction: 3, tension: 200 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();

    try {
      const nowBookmarked = await mockBookmarks.toggleBookmark(targetType, targetId);
      setIsBookmarked(nowBookmarked);
      showToast(
        nowBookmarked ? '북마크에 저장했어요 🔖' : '북마크에서 제거했어요',
        'success',
      );
    } catch {
      showToast('오류가 발생했어요', 'error');
    } finally {
      setLoading(false);
    }
  }, [targetType, targetId, loading, showToast, scale]);

  const iconSize = size === 'sm' ? 18 : 22;

  return (
    <Pressable
      onPress={handleToggle}
      disabled={loading}
      style={styles.btn}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={isBookmarked ? '북마크 해제' : '북마크 저장'}
      accessibilityState={{ selected: isBookmarked }}
    >
      <Animated.Text style={[{ fontSize: iconSize, transform: [{ scale }] }]}>
        {isBookmarked ? '🔖' : '🏷️'}
      </Animated.Text>
      {showLabel && (
        <Text style={[styles.label, { fontSize: size === 'sm' ? 11 : 13 }]}>
          {isBookmarked ? '저장됨' : '저장'}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  label: {
    fontWeight: '600',
    color: '#6B7280',
  },
});
