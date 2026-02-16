import { useState, useCallback, useRef, useEffect } from 'react';

// ==========================================
// useApiCall – 비동기 호출 상태 관리 훅
// ==========================================
// loading / error / data 를 자동으로 관리해 줍니다.
//
// 사용 예시:
//   const { data, loading, error, execute, refresh } = useApiCall(
//     () => mockProfile.getProfile(),
//   );
//
//   // 자동 실행 (mount 시):
//   const { data, loading } = useApiCall(() => fetchUsers(), { immediate: true });

interface UseApiCallOptions {
  /** mount 시 자동 실행 여부 (기본 false) */
  immediate?: boolean;
}

interface UseApiCallReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** 수동 실행 */
  execute: () => Promise<T | null>;
  /** 같은 함수 재실행 (pull-to-refresh 등) */
  refresh: () => Promise<T | null>;
  /** 에러 초기화 */
  clearError: () => void;
}

export function useApiCall<T>(
  fn: () => Promise<T>,
  options: UseApiCallOptions = {},
): UseApiCallReturn<T> {
  const { immediate = false } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const execute = useCallback(async (): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      if (mountedRef.current) {
        setData(result);
        setLoading(false);
      }
      return result;
    } catch (e: any) {
      if (mountedRef.current) {
        setError(e?.message ?? '알 수 없는 오류가 발생했어요');
        setLoading(false);
      }
      return null;
    }
  }, [fn]);

  const refresh = useCallback(async () => execute(), [execute]);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    if (immediate) { execute(); }
  }, [immediate, execute]);

  return { data, loading, error, execute, refresh, clearError };
}

// ==========================================
// useRefreshable – pull-to-refresh 패턴
// ==========================================
export function useRefreshable(onRefresh: () => Promise<void>) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await onRefresh(); } finally { setRefreshing(false); }
  }, [onRefresh]);

  return { refreshing, onRefresh: handleRefresh };
}
