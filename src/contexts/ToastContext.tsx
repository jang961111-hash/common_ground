// ==========================================
// Toast Context — 전역 토스트 알림 시스템
// ==========================================
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {
  Animated,
  Text,
  StyleSheet,
  View,
  Pressable,
} from 'react-native';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';

type ToastType = 'success' | 'error' | 'info';

interface ToastData {
  id: number;
  message: string;
  type: ToastType;
  emoji?: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, emoji?: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

// ── 개별 Toast 아이템 ──
function ToastItem({ toast, onDismiss }: { toast: ToastData; onDismiss: (id: number) => void }) {
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 진입 애니메이션
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 60,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // 자동 퇴장
    const timer = setTimeout(() => {
      dismiss();
    }, 2500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -80,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss(toast.id));
  }, [translateY, opacity, toast.id, onDismiss]);

  const bgColor =
    toast.type === 'error' ? COLORS.error :
    toast.type === 'success' ? COLORS.success :
    COLORS.primary;

  const defaultEmoji =
    toast.type === 'error' ? '❌' :
    toast.type === 'success' ? '✅' :
    'ℹ️';

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: bgColor, transform: [{ translateY }], opacity },
      ]}
    >
      <Pressable onPress={dismiss} style={styles.toastInner}>
        <Text style={styles.toastEmoji}>{toast.emoji ?? defaultEmoji}</Text>
        <Text style={styles.toastText} numberOfLines={2}>
          {toast.message}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ── Provider ──
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const idCounter = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = 'success', emoji?: string) => {
    const id = ++idCounter.current;
    setToasts((prev) => [...prev, { id, message, type, emoji }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 56,
    left: SPACING.lg,
    right: SPACING.lg,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    marginBottom: 8,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.md,
    width: '100%',
    maxWidth: 400,
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    gap: 10,
  },
  toastEmoji: {
    fontSize: 18,
  },
  toastText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
