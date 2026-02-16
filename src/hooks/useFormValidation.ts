// ==========================================
// useFormValidation — 실시간 폼 검증 훅
// ==========================================
// 필드별 검증 규칙을 정의하고, 실시간 피드백을 제공합니다.
//
// 사용 예시:
//   const form = useFormValidation({
//     email: { value: '', rules: [required('이메일'), isEmail()] },
//     password: { value: '', rules: [required('비밀번호'), minLength(6)] },
//   });
//   <ValidatedInput {...form.field('email')} label="이메일" />
//
import { useState, useCallback, useMemo, useRef } from 'react';

// ── 검증 규칙 타입 ──
export type ValidationRule = (value: string) => string | null;

interface FieldConfig {
  value: string;
  rules: ValidationRule[];
}

interface FieldState {
  value: string;
  error: string | null;
  touched: boolean;
  dirty: boolean;
}

interface FieldProps {
  value: string;
  error: string | null;
  touched: boolean;
  onChangeText: (text: string) => void;
  onBlur: () => void;
}

// ── 기본 제공 검증 규칙 ──

/** 필수 입력 */
export const required = (fieldName: string): ValidationRule =>
  (v) => v.trim() ? null : `${fieldName}을(를) 입력해주세요.`;

/** 이메일 형식 */
export const isEmail = (): ValidationRule =>
  (v) => {
    if (!v.trim()) return null; // required와 조합
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
      ? null
      : '올바른 이메일 형식을 입력해주세요.';
  };

/** 최소 길이 */
export const minLength = (min: number, label?: string): ValidationRule =>
  (v) => {
    if (!v) return null;
    return v.length >= min
      ? null
      : `${label || '입력값'}은(는) ${min}자 이상이어야 합니다.`;
  };

/** 비밀번호 강도 (대소문자 + 숫자 + 특수문자) */
export const passwordStrength = (): ValidationRule =>
  (v) => {
    if (!v || v.length < 6) return null; // minLength와 조합
    let score = 0;
    if (/[a-z]/.test(v)) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[0-9]/.test(v)) score++;
    if (/[^a-zA-Z0-9]/.test(v)) score++;
    if (score < 2) return '비밀번호를 더 복잡하게 만들어주세요.';
    return null;
  };

/** 다른 필드와 일치 확인 */
export const matchField = (otherValue: string, label: string): ValidationRule =>
  (v) => {
    if (!v) return null;
    return v === otherValue ? null : `${label}이(가) 일치하지 않습니다.`;
  };

/** 최대 길이 */
export const maxLength = (max: number, label?: string): ValidationRule =>
  (v) => {
    if (!v) return null;
    return v.length <= max
      ? null
      : `${label || '입력값'}은(는) ${max}자 이하여야 합니다.`;
  };

// ── 비밀번호 강도 계산 유틸 ──

export type PasswordLevel = 'none' | 'weak' | 'fair' | 'strong' | 'excellent';

export function getPasswordStrength(password: string): {
  level: PasswordLevel;
  score: number;     // 0-4
  label: string;
  color: string;
} {
  if (!password) return { level: 'none', score: 0, label: '', color: '#ddd' };

  let score = 0;
  if (password.length >= 6) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 'weak', score, label: '약함', color: '#EF4444' };
  if (score === 2) return { level: 'fair', score, label: '보통', color: '#F59E0B' };
  if (score === 3) return { level: 'strong', score, label: '강함', color: '#10B981' };
  return { level: 'excellent', score, label: '매우 강함', color: '#059669' };
}

// ── useFormValidation 훅 ──

export function useFormValidation<K extends string>(
  config: Record<K, FieldConfig>,
) {
  type Fields = Record<K, FieldState>;

  const keys = Object.keys(config) as K[];

  const initialFields = useMemo(() => {
    const fields = {} as Fields;
    for (const key of keys) {
      fields[key] = {
        value: config[key].value,
        error: null,
        touched: false,
        dirty: false,
      };
    }
    return fields;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [fields, setFields] = useState<Fields>(initialFields);
  const configRef = useRef(config);
  configRef.current = config;

  /** 단일 필드 검증 */
  const validateField = useCallback((key: K, value: string): string | null => {
    const rules = configRef.current[key].rules;
    for (const rule of rules) {
      const error = rule(value);
      if (error) return error;
    }
    return null;
  }, []);

  /** 필드 값 변경 */
  const setValue = useCallback((key: K, value: string) => {
    setFields(prev => {
      const error = prev[key].touched ? validateField(key, value) : null;
      return {
        ...prev,
        [key]: { ...prev[key], value, error, dirty: true },
      };
    });
  }, [validateField]);

  /** 포커스 아웃 시 검증 트리거 */
  const setTouched = useCallback((key: K) => {
    setFields(prev => {
      const error = validateField(key, prev[key].value);
      return {
        ...prev,
        [key]: { ...prev[key], touched: true, error },
      };
    });
  }, [validateField]);

  /** ValidatedInput에 전달할 props 생성 */
  const field = useCallback((key: K): FieldProps => ({
    value: fields[key].value,
    error: fields[key].touched ? fields[key].error : null,
    touched: fields[key].touched,
    onChangeText: (text: string) => setValue(key, text),
    onBlur: () => setTouched(key),
  }), [fields, setValue, setTouched]);

  /** 전체 폼 검증 (제출 시) */
  const validateAll = useCallback((): boolean => {
    let isValid = true;
    setFields(prev => {
      const next = { ...prev };
      for (const key of keys) {
        const error = validateField(key, prev[key].value);
        next[key] = { ...prev[key], touched: true, error };
        if (error) isValid = false;
      }
      return next;
    });
    return isValid;
  }, [keys, validateField]);

  /** 전체 폼이 유효한지 (현재 입력 기준) */
  const isValid = useMemo(() => {
    return keys.every(key => {
      const error = validateField(key, fields[key].value);
      return error === null && fields[key].value.trim().length > 0;
    });
  }, [keys, fields, validateField]);

  /** 특정 필드 값 가져오기 */
  const getValue = useCallback((key: K): string => fields[key].value, [fields]);

  /** 모든 필드 값 가져오기 */
  const getValues = useCallback((): Record<K, string> => {
    const values = {} as Record<K, string>;
    for (const key of keys) {
      values[key] = fields[key].value;
    }
    return values;
  }, [keys, fields]);

  /** 폼 초기화 */
  const reset = useCallback(() => {
    setFields(initialFields);
  }, [initialFields]);

  return {
    fields,
    field,
    setValue,
    setTouched,
    validateAll,
    isValid,
    getValue,
    getValues,
    reset,
  };
}
