import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import Avatar from '../components/Avatar';
import AnimatedPressable from '../components/AnimatedPressable';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { ShareProfileScreenProps } from '../types';

const copyToClipboard = async (text: string) => {
  if (Platform.OS === 'web') {
    try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
  }
  return false;
};

export default function ShareProfileScreen({ navigation }: ShareProfileScreenProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { colors } = useTheme();
  const [copied, setCopied] = React.useState(false);

  if (!user) return null;

  const shareUrl = `https://commonground.app/p/${user.shareLink}`;

  const handleCopy = async () => {
    const ok = await copyToClipboard(shareUrl);
    if (ok) {
      setCopied(true);
      showToast('링크가 복사되었어요!', 'success', '📋');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.white }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="뒤로 가기">
          <Text style={[styles.backText, { color: colors.primary }]}>← 뒤로</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.gray900 }]}>프로필 공유</Text>
      </View>

      {/* 미리보기 카드 */}
      <View style={[styles.previewCard, { backgroundColor: colors.gray50, borderColor: colors.gray200 }]}>
        <Avatar name={user.displayName} size={64} emoji={user.avatarEmoji} customColor={user.avatarColor} />
        <Text style={[styles.previewName, { color: colors.gray900 }]}>{user.displayName}</Text>
        {user.bio && <Text style={[styles.previewBio, { color: colors.gray600 }]}>{user.bio}</Text>}
        <View style={styles.previewInterests}>
          {[...user.recentInterests, ...user.alwaysInterests].slice(0, 5).map(id => {
            const interest = require('../constants/interests').getInterestById(id);
            if (!interest) return null;
            return (
              <View key={id} style={styles.miniTag}>
                <Text style={styles.miniTagText}>{interest.emoji} {interest.label}</Text>
              </View>
            );
          })}
        </View>
        <Text style={[styles.previewHint, { color: colors.gray400 }]}>상대방에게 이렇게 보여요</Text>
      </View>

      {/* QR 코드 (시뮬레이션) */}
      <View style={styles.qrSection}>
        <Text style={[styles.sectionTitle, { color: colors.gray800 }]}>📱 QR 코드</Text>
        <View style={styles.qrBox}>
          <View style={[styles.qrPlaceholder, { backgroundColor: colors.white, borderColor: colors.gray200 }]} accessible={true} accessibilityLabel={`${user.displayName}의 프로필 QR 코드`}>
            <Text style={styles.qrEmoji}>📷</Text>
            <Text style={[styles.qrText, { color: colors.gray500 }]}>QR 코드</Text>
            <View style={styles.qrGrid}>
              {Array.from({ length: 9 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.qrBlock,
                    { backgroundColor: Math.random() > 0.3 ? COLORS.gray900 : COLORS.white },
                  ]}
                />
              ))}
            </View>
          </View>
          <Text style={[styles.qrHint, { color: colors.gray500 }]}>이 QR 코드를 스캔하면 프로필을 볼 수 있어요</Text>
        </View>
      </View>

      {/* 링크 공유 */}
      <View style={styles.linkSection}>
        <Text style={[styles.sectionTitle, { color: colors.gray800 }]}>🔗 링크 공유</Text>
        <View style={[styles.linkBox, { backgroundColor: colors.gray50, borderColor: colors.gray200 }]}>
          <Text style={[styles.linkUrl, { color: colors.gray600 }]} numberOfLines={1}>{shareUrl}</Text>
          <Pressable style={styles.copyBtn} onPress={handleCopy} accessibilityRole="button" accessibilityLabel={copied ? '링크 복사됨' : '프로필 링크 복사'}>
            <Text style={styles.copyBtnText}>{copied ? '✓ 복사됨' : '복사'}</Text>
          </Pressable>
        </View>
      </View>

      {/* 공유 방법 */}
      <View style={styles.shareMethodsSection}>
        <Text style={[styles.sectionTitle, { color: colors.gray800 }]}>공유하기</Text>
        <View style={styles.shareMethods}>
          <AnimatedPressable style={[styles.shareMethod, { backgroundColor: colors.gray50, borderColor: colors.gray200 }]} onPress={handleCopy} accessibilityRole="button" accessibilityLabel="링크 복사">
            <Text style={styles.shareIcon}>📋</Text>
            <Text style={[styles.shareLabel, { color: colors.gray600 }]}>링크 복사</Text>
          </AnimatedPressable>
          <AnimatedPressable style={[styles.shareMethod, { backgroundColor: colors.gray50, borderColor: colors.gray200 }]} onPress={() => showToast('카카오톡 공유 (준비 중)', 'info', '💬')} accessibilityRole="button" accessibilityLabel="카카오톡으로 공유">
            <Text style={styles.shareIcon}>💬</Text>
            <Text style={[styles.shareLabel, { color: colors.gray600 }]}>카카오톡</Text>
          </AnimatedPressable>
          <AnimatedPressable style={[styles.shareMethod, { backgroundColor: colors.gray50, borderColor: colors.gray200 }]} onPress={() => showToast('인스타그램 공유 (준비 중)', 'info', '📸')} accessibilityRole="button" accessibilityLabel="인스타그램으로 공유">
            <Text style={styles.shareIcon}>📸</Text>
            <Text style={[styles.shareLabel, { color: colors.gray600 }]}>인스타그램</Text>
          </AnimatedPressable>
          <AnimatedPressable style={[styles.shareMethod, { backgroundColor: colors.gray50, borderColor: colors.gray200 }]} onPress={() => showToast('기타 공유 (준비 중)', 'info', '📤')} accessibilityRole="button" accessibilityLabel="기타 방법으로 공유">
            <Text style={styles.shareIcon}>📤</Text>
            <Text style={[styles.shareLabel, { color: colors.gray600 }]}>기타</Text>
          </AnimatedPressable>
        </View>
      </View>

      {/* 팁 */}
      <View style={[styles.tipBox, { backgroundColor: colors.primaryBg }]}>
        <Text style={[styles.tipTitle, { color: colors.primary }]}>💡 활용 팁</Text>
        <Text style={[styles.tipText, { color: colors.gray600 }]}>
          • 모임이나 네트워킹 행사 전에 미리 공유해보세요{'\n'}
          • QR코드를 명함에 넣으면 관심사를 자연스럽게 공유할 수 있어요{'\n'}
          • 링크를 메신저에 보내면 상대방이 대화 주제를 미리 준비할 수 있어요
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.xl,
    paddingTop: 60,
    gap: 24,
  },
  header: { gap: 12 },
  backBtn: { padding: 4 },
  backText: { fontSize: FONT_SIZE.md, color: COLORS.primary, fontWeight: '600' },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.gray900 },

  // Preview
  previewCard: {
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.lg,
    padding: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  previewName: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.gray900, marginTop: 4 },
  previewBio: { fontSize: FONT_SIZE.sm, color: COLORS.gray600, textAlign: 'center' },
  previewInterests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  miniTag: {
    backgroundColor: COLORS.primaryBg,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  miniTagText: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: '500' },
  previewHint: { fontSize: FONT_SIZE.xs, color: COLORS.gray400, marginTop: 8 },

  // QR
  qrSection: { gap: 12 },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.gray800 },
  qrBox: { alignItems: 'center', gap: 12 },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.gray200,
    ...SHADOWS.md,
  },
  qrEmoji: { fontSize: 32, marginBottom: 8 },
  qrText: { fontSize: FONT_SIZE.sm, color: COLORS.gray500, fontWeight: '600', marginBottom: 12 },
  qrGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 60,
    height: 60,
  },
  qrBlock: {
    width: 20,
    height: 20,
  },
  qrHint: { fontSize: FONT_SIZE.sm, color: COLORS.gray500 },

  // Link
  linkSection: { gap: 12 },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    overflow: 'hidden',
  },
  linkUrl: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray600,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  copyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  copyBtnText: { color: '#fff', fontSize: FONT_SIZE.sm, fontWeight: '600' },

  // Share methods
  shareMethodsSection: { gap: 12 },
  shareMethods: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  shareMethod: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  shareIcon: { fontSize: 24 },
  shareLabel: { fontSize: FONT_SIZE.xs, color: COLORS.gray600, fontWeight: '500' },

  // Tip
  tipBox: {
    backgroundColor: COLORS.primaryBg,
    borderRadius: BORDER_RADIUS.md,
    padding: 16,
    gap: 8,
  },
  tipTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.primary },
  tipText: { fontSize: FONT_SIZE.sm, color: COLORS.gray600, lineHeight: 20 },
});
