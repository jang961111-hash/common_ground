// ==========================================
// ConfirmDialog — 커스텀 확인 다이얼로그
// ==========================================
// 네이티브 Alert 대신 테마와 일관된 모달 다이얼로그를 제공합니다.
//
// 사용 예시:
//   <ConfirmDialog
//     visible={showLogout}
//     title="로그아웃"
//     message="정말 로그아웃 하시겠어요?"
//     confirmLabel="로그아웃"
//     destructive
//     onConfirm={() => signOut()}
//     onCancel={() => setShowLogout(false)}
//   />
//
import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING } from '../constants/theme';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 위험한 액션 여부 (확인 버튼이 빨간색) */
  destructive?: boolean;
  /** 확인 콜백 */
  onConfirm: () => void;
  /** 취소 콜백 */
  onCancel: () => void;
  /** 아이콘 이모지 */
  icon?: string;
}

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  destructive = false,
  onConfirm,
  onCancel,
  icon,
}: ConfirmDialogProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View
          style={[styles.dialog, { backgroundColor: colors.white }]}
          accessibilityRole="alert"
        >
          {icon && <Text style={styles.icon}>{icon}</Text>}

          <Text style={[styles.title, { color: colors.gray900 }]}>{title}</Text>

          <Text style={[styles.message, { color: colors.gray500 }]}>{message}</Text>

          <View style={styles.actions}>
            <Pressable
              style={[styles.btn, styles.cancelBtn, { borderColor: colors.gray200 }]}
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
            >
              <Text style={[styles.cancelText, { color: colors.gray700 }]}>{cancelLabel}</Text>
            </Pressable>

            <Pressable
              style={[
                styles.btn,
                styles.confirmBtn,
                { backgroundColor: destructive ? COLORS.error : colors.primary },
              ]}
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  icon: {
    fontSize: 40,
    marginBottom: 4,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    width: '100%',
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  cancelText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
  },
  confirmText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: '#fff',
  },
});
