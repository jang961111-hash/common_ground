// ==========================================
// useDebounce — 입력 디바운싱 훅
// ==========================================
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 값의 변화를 지정된 시간만큼 지연시킵니다.
 * 검색 입력 등에서 불필요한 API 호출을 줄이는 데 유용합니다.
 *
 * @param value 디바운스할 값
 * @param delay 지연 시간 (ms), 기본값 300ms
 * @returns 디바운스된 값
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * 디바운스된 콜백 함수를 반환합니다.
 * 마지막 호출 후 delay ms가 지나야 실행됩니다.
 *
 * @param callback 디바운스할 함수
 * @param delay 지연 시간 (ms), 기본값 300ms
 * @returns 디바운스된 함수
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay = 300,
): (...args: Parameters<T>) => void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // 항상 최신 콜백 참조
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // 클린업
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay],
  );
}
