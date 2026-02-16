// ==========================================
// NotificationItem — 스와이프 삭제 가능한 알림 아이템
// ==========================================
import React, { useRef, useCallback } from 'react';
import {
  View, Text, Pressable, Animated, PanResponder, StyleSheet,
  LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING } from '../constants/theme';
import { AppNotification } from '../types';

// Android LayoutAnimation 활성화
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DELETE_THRESHOLD = -80;

function iconForType(type: string): string {
  switch (type) {
    case 'PROFILE_VIEW': return '👁️';
    case 'NEW_MATCH': return '✨';
    case 'SYSTEM': return '📢';
    default: return '🔔';
  }
}

function formatTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  const weeks = Math.floor(days / 7);
  return `${weeks}주 전`;
}

interface NotificationItemProps {
  notification: AppNotification;
  onPress: (notif: AppNotification) => void;
  onDelete: (notifId: string) => void;
}

export default React.memo(function NotificationItem({
  notification,
  onPress,
  onDelete,
}: NotificationItemProps) {
  const { colors } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const isSwipingRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        // 수평 이동이 수직보다 클 때만 스와이프로 인식
        return Math.abs(gesture.dx) > Math.abs(gesture.dy) && Math.abs(gesture.dx) > 10;
      },
      onPanResponderGrant: () => {
        isSwipingRef.current = true;
      },
      onPanResponderMove: (_, gesture) => {
        if (gesture.dx < 0) {
          translateX.setValue(gesture.dx);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        isSwipingRef.current = false;
        if (gesture.dx < DELETE_THRESHOLD) {
          // 삭제 애니메이션
          Animated.timing(translateX, {
            toValue: -400,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            onDelete(notification.id);
          });
        } else {
          // 원위치 복귀
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        isSwipingRef.current = false;
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  const handlePress = useCallback(() => {
    if (!isSwipingRef.current) {
      onPress(notification);
    }
  }, [onPress, notification]);

  const deleteOpacity = translateX.interpolate({
    inputRange: [-120, -60, 0],
    outputRange: [1, 0.8, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.wrapper}>
      {/* 삭제 배경 */}
      <Animated.View
        style={[styles.deleteBackground, { opacity: deleteOpacity }]}
      >
        <Text style={styles.deleteIcon}>🗑️</Text>
        <Text style={styles.deleteText}>삭제</Text>
      </Animated.View>

      {/* 알림 카드 */}
      <Animated.View
        style={[{ transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <Pressable
          style={[
            styles.notifItem,
            { backgroundColor: colors.white },
            !notification.isRead && [styles.notifUnread, { backgroundColor: colors.primaryBg }],
          ]}
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel={`${notification.title} ${notification.message}${!notification.isRead ? ', 읽지 않음' : ''}. 왼쪽으로 밀어서 삭제`}
        >
          <View style={styles.notifIcon}>
            <Text style={{ fontSize: 22 }}>{iconForType(notification.type)}</Text>
          </View>
          <View style={styles.notifContent}>
            <Text
              style={[
                styles.notifTitle,
                { color: colors.gray700 },
                !notification.isRead && [styles.notifTitleUnread, { color: colors.gray900 }],
              ]}
            >
              {notification.title}
            </Text>
            <Text
              style={[styles.notifMessage, { color: colors.gray500 }]}
              numberOfLines={2}
            >
              {notification.message}
            </Text>
            <Text style={[styles.notifTime, { color: colors.gray400 }]}>
              {formatTime(notification.createdAt)}
            </Text>
          </View>
          {!notification.isRead && (
            <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginBottom: 4,
  },
  deleteBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FF4444',
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 20,
    gap: 6,
  },
  deleteIcon: { fontSize: 18 },
  deleteText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZE.sm },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: BORDER_RADIUS.md,
    gap: 12,
  },
  notifUnread: {
    backgroundColor: COLORS.primaryBg,
  },
  notifIcon: { marginTop: 2 },
  notifContent: { flex: 1, gap: 4 },
  notifTitle: { fontSize: FONT_SIZE.md, fontWeight: '500', color: COLORS.gray700 },
  notifTitleUnread: { fontWeight: '700', color: COLORS.gray900 },
  notifMessage: { fontSize: FONT_SIZE.sm, color: COLORS.gray500, lineHeight: 18 },
  notifTime: { fontSize: FONT_SIZE.xs, color: COLORS.gray400 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 6,
  },
});
