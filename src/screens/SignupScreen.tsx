import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useFormValidation, required, isEmail, minLength, matchField } from '../hooks/useFormValidation';
import ValidatedInput from '../components/ValidatedInput';
import PasswordStrength from '../components/PasswordStrength';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING } from '../constants/theme';
import type { SignupScreenProps } from '../types';

export default function SignupScreen({ navigation }: SignupScreenProps) {
  const { signUp } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const form = useFormValidation({
    email: {
      value: '',
      rules: [required('이메일'), isEmail()],
    },
    password: {
      value: '',
      rules: [required('비밀번호'), minLength(6, '비밀번호')],
    },
    confirmPassword: {
      value: '',
      rules: [required('비밀번호 확인')],
    },
  });

  // confirmPassword는 password 값에 의존하므로 동적 검증
  const confirmError = useMemo(() => {
    const confirm = form.getValue('confirmPassword');
    const pw = form.getValue('password');
    if (!confirm) return null;
    return confirm === pw ? null : '비밀번호가 일치하지 않습니다.';
  }, [form]);

  const handleSignUp = async () => {
    const valid = form.validateAll();
    if (!valid) return;
    if (confirmError) return;

    setErrorMsg('');
    setLoading(true);
    const result = await signUp(form.getValue('email'), form.getValue('password'));
    if (result.error) {
      setErrorMsg(result.error);
      setLoading(false);
      return;
    }
    // 가입 성공 → 온보딩 플로우
    navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
  };

  const passwordValue = form.getValue('password');
  const canSubmit = form.isValid && !confirmError;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.white }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="뒤로 가기">
          <Text style={[styles.backText, { color: colors.primary }]}>← 뒤로</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.gray900 }]}>회원가입</Text>
          <Text style={[styles.subtitle, { color: colors.gray500 }]}>Common Ground에 오신 것을 환영합니다</Text>
        </View>

        <View style={styles.form}>
          <ValidatedInput
            {...form.field('email')}
            label="이메일"
            placeholder="example@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            textContentType="emailAddress"
            showSuccess
            returnKeyType="next"
          />

          <ValidatedInput
            {...form.field('password')}
            label="비밀번호"
            placeholder="6자 이상 입력하세요"
            secureTextEntry
            textContentType="newPassword"
            hint="영문, 숫자, 특수문자를 조합하면 더 안전해요"
            returnKeyType="next"
            bottomElement={<PasswordStrength password={passwordValue} />}
          />

          <ValidatedInput
            {...form.field('confirmPassword')}
            label="비밀번호 확인"
            placeholder="비밀번호를 다시 입력하세요"
            secureTextEntry
            textContentType="newPassword"
            showSuccess
            error={confirmError || form.field('confirmPassword').error}
            returnKeyType="done"
          />

          {!!errorMsg && (
            <View style={styles.errorBox} accessibilityRole="alert">
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <Pressable
            style={[
              styles.submitBtn,
              (loading || !canSubmit) && styles.submitDisabled,
            ]}
            onPress={handleSignUp}
            disabled={loading || !canSubmit}
            accessibilityRole="button"
            accessibilityLabel={loading ? '가입 중' : '가입하기'}
            accessibilityState={{ disabled: loading || !canSubmit }}
          >
            <Text style={styles.submitText}>
              {loading ? '가입 중...' : '가입하기'}
            </Text>
          </Pressable>
        </View>

        <Pressable style={styles.linkBtn} onPress={() => navigation.navigate('Login')} accessibilityRole="link" accessibilityLabel="로그인 페이지로 이동">
          <Text style={[styles.linkText, { color: colors.gray500 }]}>
            이미 계정이 있으신가요? <Text style={[styles.linkBold, { color: colors.primary }]}>로그인</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backBtn: { marginBottom: 20 },
  backText: { fontSize: FONT_SIZE.md, color: COLORS.primary },
  header: { gap: 8, marginBottom: 32 },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.gray900 },
  subtitle: { fontSize: FONT_SIZE.md, color: COLORS.gray500 },
  form: { gap: 18 },
  inputGroup: { gap: 6 },
  label: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.gray700 },
  input: {
    backgroundColor: COLORS.gray50,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: FONT_SIZE.md,
    color: COLORS.gray900,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: BORDER_RADIUS.sm,
    padding: 12,
  },
  errorText: { color: COLORS.error, fontSize: FONT_SIZE.sm },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: FONT_SIZE.lg, fontWeight: '700' },
  linkBtn: { alignItems: 'center', marginTop: 24 },
  linkText: { fontSize: FONT_SIZE.sm, color: COLORS.gray500 },
  linkBold: { color: COLORS.primary, fontWeight: '600' },
});
