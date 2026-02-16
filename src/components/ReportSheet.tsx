// ==========================================
// ReportSheet — 신고 사유 선택 바텀시트
// ==========================================
import React, { useState, useCallback } from 'react';
import {
  View, Text, Pressable, TextInput, StyleSheet, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING } from '../constants/theme';
import { ReportReason } from '../types';

const REPORT_REASONS: { value: ReportReason; label: string; icon: string }[] = [
  { value: 'SPAM', label: '스팸 / 광고', icon: '📢' },
  { value: 'HARASSMENT', label: '괴롭힘 / 불쾌한 행동', icon: '😠' },
  { value: 'INAPPROPRIATE', label: '부적절한 콘텐츠', icon: '🚫' },
  { value: 'FAKE_PROFILE', label: '허위 프로필', icon: '🎭' },
  { value: 'OTHER', label: '기타', icon: '📝' },
];

interface ReportSheetProps {
  visible: boolean;
  targetUserName: string;
  onSubmit: (reason: ReportReason, detail?: string) => void;
  onClose: () => void;
}

export default function ReportSheet({
  visible,
  targetUserName,
  onSubmit,
  onClose,
}: ReportSheetProps) {
  const { colors } = useTheme();
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!selectedReason) return;
    setSubmitting(true);
    await onSubmit(selectedReason, detail.trim() || undefined);
    setSubmitting(false);
    setSelectedReason(null);
    setDetail('');
  }, [selectedReason, detail, onSubmit]);

  const handleClose = useCallback(() => {
    setSelectedReason(null);
    setDetail('');
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.white }]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <View style={[styles.handle, { backgroundColor: colors.gray300 }]} />

            {/* Title */}
            <Text style={[styles.title, { color: colors.gray900 }]}>신고하기</Text>
            <Text style={[styles.subtitle, { color: colors.gray500 }]}>
              {targetUserName}님을 신고하는 이유를 선택해주세요
            </Text>

            {/* Reason list */}
            <View style={styles.reasons}>
              {REPORT_REASONS.map((reason) => (
                <Pressable
                  key={reason.value}
                  style={[
                    styles.reasonItem,
                    { borderColor: colors.gray200 },
                    selectedReason === reason.value && {
                      borderColor: colors.primary,
                      backgroundColor: colors.primaryBg,
                    },
                  ]}
                  onPress={() => setSelectedReason(reason.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: selectedReason === reason.value }}
                  accessibilityLabel={reason.label}
                >
                  <Text style={styles.reasonIcon}>{reason.icon}</Text>
                  <Text style={[
                    styles.reasonLabel,
                    { color: colors.gray800 },
                    selectedReason === reason.value && { color: colors.primary, fontWeight: '700' },
                  ]}>
                    {reason.label}
                  </Text>
                  <View style={[
                    styles.radio,
                    { borderColor: colors.gray300 },
                    selectedReason === reason.value && { borderColor: colors.primary },
                  ]}>
                    {selectedReason === reason.value && (
                      <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                    )}
                  </View>
                </Pressable>
              ))}
            </View>

            {/* Detail input */}
            {selectedReason && (
              <View style={[styles.detailBox, { borderColor: colors.gray200 }]}>
                <TextInput
                  style={[styles.detailInput, { color: colors.gray900 }]}
                  placeholder="추가 설명 (선택)"
                  placeholderTextColor={colors.gray400}
                  value={detail}
                  onChangeText={setDetail}
                  maxLength={200}
                  multiline
                  accessibilityLabel="신고 추가 설명"
                />
                <Text style={[styles.charCount, { color: colors.gray400 }]}>{detail.length}/200</Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <Pressable
                style={[styles.cancelBtn, { borderColor: colors.gray200 }]}
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="취소"
              >
                <Text style={[styles.cancelText, { color: colors.gray700 }]}>취소</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.submitBtn,
                  { backgroundColor: selectedReason ? COLORS.error : colors.gray300 },
                ]}
                onPress={handleSubmit}
                disabled={!selectedReason || submitting}
                accessibilityRole="button"
                accessibilityLabel="신고 제출"
              >
                <Text style={styles.submitText}>
                  {submitting ? '제출 중...' : '🚨 신고 제출'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    paddingBottom: 40,
    gap: 12,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    marginBottom: 4,
  },
  reasons: {
    gap: 8,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: 12,
  },
  reasonIcon: {
    fontSize: 18,
  },
  reasonLabel: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  detailBox: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: 14,
    gap: 4,
    marginTop: 4,
  },
  detailInput: {
    fontSize: FONT_SIZE.md,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: FONT_SIZE.xs,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});
