import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Switch,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { mockProfile } from '../services/mockService';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import ScreenHeader from '../components/ScreenHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import { notificationSettingsStorage, NotificationSettings } from '../lib/storage';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING } from '../constants/theme';
import { PrivacyLevel, SettingsScreenProps } from '../types';

const PRIVACY_OPTIONS: { value: PrivacyLevel; label: string; desc: string }[] = [
  { value: 'PUBLIC', label: '🌐 전체 공개', desc: '누구나 프로필을 볼 수 있어요' },
  { value: 'LINK', label: '🔗 링크 공개', desc: '링크를 가진 사람만 볼 수 있어요' },
  { value: 'FRIENDS', label: '👥 친구만', desc: '연결된 사람만 볼 수 있어요' },
  { value: 'PRIVATE', label: '🔒 비공개', desc: '나만 볼 수 있어요' },
];

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { user, signOut, refreshUser } = useAuth();
  const { colors, isDark, themeMode, setThemeMode } = useTheme();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [matchAlert, setMatchAlert] = useState(true);
  const [viewAlert, setViewAlert] = useState(true);
  const [systemAlert, setSystemAlert] = useState(true);
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>(
    user?.privacyLevel ?? 'PUBLIC'
  );
  const [saving, setSaving] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // 알림 설정 복원
  useEffect(() => {
    notificationSettingsStorage.get().then(settings => {
      setPushEnabled(settings.pushEnabled);
      setMatchAlert(settings.matchAlert);
      setViewAlert(settings.viewAlert);
      setSystemAlert(settings.systemAlert);
    });
  }, []);

  // 알림 설정 변경 핸들러
  const handleNotifToggle = useCallback((key: keyof NotificationSettings, value: boolean) => {
    const setters: Record<keyof NotificationSettings, (v: boolean) => void> = {
      pushEnabled: setPushEnabled,
      matchAlert: setMatchAlert,
      viewAlert: setViewAlert,
      systemAlert: setSystemAlert,
    };
    setters[key](value);
    notificationSettingsStorage.update({ [key]: value });
  }, []);

  const handlePrivacyChange = async (level: PrivacyLevel) => {
    setPrivacyLevel(level);
    setSaving(true);
    await mockProfile.updateProfile({ privacyLevel: level });
    await refreshUser();
    setSaving(false);
  };

  const handleSignOut = () => {
    setShowLogoutDialog(true);
  };

  const confirmSignOut = async () => {
    setShowLogoutDialog(false);
    await signOut();
  };

  const handleDeleteAccount = () => {
    setShowDeleteDialog(true);
  };

  const confirmDeleteAccount = async () => {
    setShowDeleteDialog(false);
    await signOut();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.gray50 }]}>
      <ScreenHeader title="설정" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* 계정 정보 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.gray500 }]}>계정 정보</Text>
          <View style={[styles.card, { backgroundColor: colors.white }]}>
            <View style={styles.profileRow}>
              <Avatar name={user?.displayName ?? '?'} size={48} isOnline={user?.isOnline} emoji={user?.avatarEmoji} customColor={user?.avatarColor} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.userName, { color: colors.gray900 }]}>{user?.displayName}</Text>
                <Text style={[styles.userEmail, { color: colors.gray500 }]}>{user?.email}</Text>
              </View>
              <Pressable onPress={() => navigation.navigate('Main', { screen: 'Profile' })} accessibilityRole="link" accessibilityLabel="프로필 편집">
                <Text style={[styles.editLink, { color: colors.primary }]}>편집</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* 테마 설정 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.gray500 }]}>테마</Text>
          <View style={[styles.card, { backgroundColor: colors.white }]}>
            {(['light', 'dark', 'system'] as const).map((mode) => {
              const labels = { light: '☀️ 라이트 모드', dark: '🌙 다크 모드', system: '📱 시스템 설정' };
              const descs = { light: '밝은 테마를 사용해요', dark: '어두운 테마를 사용해요', system: '기기 설정을 따라가요' };
              return (
                <React.Fragment key={mode}>
                  <Pressable
                    style={[
                      styles.privacyOption,
                      themeMode === mode && [styles.privacySelected, { backgroundColor: colors.primaryBg }],
                    ]}
                    onPress={() => setThemeMode(mode)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: themeMode === mode }}
                    accessibilityLabel={`${labels[mode]} ${descs[mode]}`}
                  >
                    <View style={styles.privacyInfo}>
                      <Text style={[styles.privacyLabel, { color: colors.gray800 }]}>{labels[mode]}</Text>
                      <Text style={[styles.privacyDesc, { color: colors.gray500 }]}>{descs[mode]}</Text>
                    </View>
                    <View style={[
                      styles.radio,
                      { borderColor: colors.gray300 },
                      themeMode === mode && { borderColor: colors.primary },
                    ]}>
                      {themeMode === mode && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                    </View>
                  </Pressable>
                  {mode !== 'system' && <View style={[styles.divider, { backgroundColor: colors.gray100 }]} />}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* 공개 범위 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.gray500 }]}>프로필 공개 범위</Text>
          <View style={[styles.card, { backgroundColor: colors.white }]}>
            {PRIVACY_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[
                  styles.privacyOption,
                  privacyLevel === opt.value && styles.privacySelected,
                ]}
                onPress={() => handlePrivacyChange(opt.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected: privacyLevel === opt.value }}
                accessibilityLabel={`${opt.label} ${opt.desc}`}
              >
                <View style={styles.privacyInfo}>
                  <Text style={[styles.privacyLabel, { color: colors.gray800 }]}>{opt.label}</Text>
                  <Text style={[styles.privacyDesc, { color: colors.gray500 }]}>{opt.desc}</Text>
                </View>
                <View style={[
                  styles.radio,
                  privacyLevel === opt.value && styles.radioActive,
                ]}>
                  {privacyLevel === opt.value && <View style={styles.radioInner} />}
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 알림 설정 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.gray500 }]}>알림 설정</Text>
          <View style={[styles.card, { backgroundColor: colors.white }]}>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.gray800 }]}>푸시 알림</Text>
                <Text style={[styles.toggleDesc, { color: colors.gray500 }]}>앱 알림을 받습니다</Text>
              </View>
              <Switch
                value={!!pushEnabled}
                onValueChange={(v) => handleNotifToggle('pushEnabled', v)}
                trackColor={{ false: COLORS.gray200, true: COLORS.primary + '44' }}
                thumbColor={pushEnabled ? COLORS.primary : COLORS.gray400}
                accessibilityLabel="푸시 알림"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.gray800 }]}>관심사 매칭 알림</Text>
                <Text style={[styles.toggleDesc, { color: colors.gray500 }]}>공통 관심사 사용자 알림</Text>
              </View>
              <Switch
                value={!!matchAlert}
                onValueChange={(v) => handleNotifToggle('matchAlert', v)}
                trackColor={{ false: COLORS.gray200, true: COLORS.primary + '44' }}
                thumbColor={matchAlert ? COLORS.primary : COLORS.gray400}
                accessibilityLabel="관심사 매칭 알림"
                disabled={!pushEnabled}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.gray800 }]}>프로필 열람 알림</Text>
                <Text style={[styles.toggleDesc, { color: colors.gray500 }]}>내 프로필을 본 사람 알림</Text>
              </View>
              <Switch
                value={!!viewAlert}
                onValueChange={(v) => handleNotifToggle('viewAlert', v)}
                trackColor={{ false: COLORS.gray200, true: COLORS.primary + '44' }}
                thumbColor={viewAlert ? COLORS.primary : COLORS.gray400}
                accessibilityLabel="프로필 열람 알림"
                disabled={!pushEnabled}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.gray800 }]}>시스템 알림</Text>
                <Text style={[styles.toggleDesc, { color: colors.gray500 }]}>업데이트 및 공지사항</Text>
              </View>
              <Switch
                value={!!systemAlert}
                onValueChange={(v) => handleNotifToggle('systemAlert', v)}
                trackColor={{ false: COLORS.gray200, true: COLORS.primary + '44' }}
                thumbColor={systemAlert ? COLORS.primary : COLORS.gray400}
                accessibilityLabel="시스템 알림"
                disabled={!pushEnabled}
              />
            </View>
            {!pushEnabled && (
              <Text style={[styles.disabledHint, { color: colors.gray400 }]}>
                푸시 알림을 켜면 세부 알림을 설정할 수 있어요
              </Text>
            )}
          </View>
        </View>

        {/* 안전 & 개인정보 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.gray500 }]}>안전 & 개인정보</Text>
          <View style={[styles.card, { backgroundColor: colors.white }]}>
            <Pressable
              style={styles.infoRow}
              onPress={() => navigation.navigate('BlockedUsers')}
              accessibilityRole="link"
              accessibilityLabel="차단 목록 관리"
            >
              <Text style={styles.infoLabel}>🚫 차단 목록 관리</Text>
              <Text style={styles.infoArrow}>→</Text>
            </Pressable>
          </View>
        </View>

        {/* 앱 정보 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.gray500 }]}>앱 정보</Text>
          <View style={[styles.card, { backgroundColor: colors.white }]}>
            <Pressable
              style={styles.infoRow}
              onPress={() => navigation.navigate('Tutorial')}
              accessibilityRole="link"
              accessibilityLabel="앱 사용 가이드"
            >
              <Text style={styles.infoLabel}>📖 앱 사용 가이드</Text>
              <Text style={styles.infoArrow}>→</Text>
            </Pressable>
            <View style={[styles.divider, { backgroundColor: colors.gray100 }]} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>버전</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
            <View style={styles.divider} />
            <Pressable style={styles.infoRow} accessibilityRole="link" accessibilityLabel="이용약관">
              <Text style={styles.infoLabel}>이용약관</Text>
              <Text style={styles.infoArrow}>→</Text>
            </Pressable>
            <View style={styles.divider} />
            <Pressable style={styles.infoRow} accessibilityRole="link" accessibilityLabel="개인정보처리방침">
              <Text style={styles.infoLabel}>개인정보처리방침</Text>
              <Text style={styles.infoArrow}>→</Text>
            </Pressable>
            <View style={styles.divider} />
            <Pressable style={styles.infoRow} accessibilityRole="link" accessibilityLabel="오픈소스 라이선스">
              <Text style={styles.infoLabel}>오픈소스 라이선스</Text>
              <Text style={styles.infoArrow}>→</Text>
            </Pressable>
          </View>
        </View>

        {/* 위험 영역 */}
        <View style={styles.section}>
          <Button
            title="로그아웃"
            variant="outline"
            onPress={handleSignOut}
          />
          <View style={{ height: 12 }} />
          <Button
            title="회원 탈퇴"
            variant="danger"
            onPress={handleDeleteAccount}
          />
        </View>

        <Text style={styles.footer}>Common Ground © 2025</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 로그아웃 확인 다이얼로그 */}
      <ConfirmDialog
        visible={showLogoutDialog}
        icon="👋"
        title="로그아웃"
        message="정말 로그아웃 하시겠어요?"
        confirmLabel="로그아웃"
        destructive
        onConfirm={confirmSignOut}
        onCancel={() => setShowLogoutDialog(false)}
      />

      {/* 회원 탈퇴 확인 다이얼로그 */}
      <ConfirmDialog
        visible={showDeleteDialog}
        icon="⚠️"
        title="회원 탈퇴"
        message={"탈퇴하면 모든 데이터가 삭제되며\n복구할 수 없습니다. 정말 탈퇴하시겠어요?"}
        confirmLabel="탈퇴"
        destructive
        onConfirm={confirmDeleteAccount}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray50 },

  content: { padding: SPACING.xl },

  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
  },

  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  userName: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.gray900 },
  userEmail: { fontSize: FONT_SIZE.sm, color: COLORS.gray500, marginTop: 2 },
  editLink: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: '600' },

  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: BORDER_RADIUS.md,
  },
  privacySelected: { backgroundColor: COLORS.primaryBg },
  privacyInfo: { flex: 1 },
  privacyLabel: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.gray800 },
  privacyDesc: { fontSize: FONT_SIZE.xs, color: COLORS.gray500, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: COLORS.primary },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleLabel: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.gray800 },
  toggleDesc: { fontSize: FONT_SIZE.xs, color: COLORS.gray500, marginTop: 2 },

  disabledHint: {
    fontSize: FONT_SIZE.xs,
    marginTop: 8,
    fontStyle: 'italic',
  },

  divider: { height: 1, backgroundColor: COLORS.gray100, marginVertical: 4 },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: { fontSize: FONT_SIZE.md, color: COLORS.gray800 },
  infoValue: { fontSize: FONT_SIZE.md, color: COLORS.gray500 },
  infoArrow: { fontSize: FONT_SIZE.md, color: COLORS.gray400 },

  footer: {
    textAlign: 'center',
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray400,
    marginTop: 20,
  },
});
