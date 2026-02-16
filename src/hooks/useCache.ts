// ==========================================
// useCache – Stale-While-Revalidate 패턴 훅
// ==========================================
// 캐시된 데이터를 먼저 보여주고, 백그라운드에서 최신 데이터를 가져옵니다.
//
// 사용 예시:
//   const { data, loading, isStale, refresh } = useCache(
//     'discover_online',
//     () => mockDiscover.getOnlineUsers(),
//     { ttl: 3 * 60 * 1000 },  // 3분
//   );
//
import { useState, useEffect, useCallback, useRef } from 'react';
import { cache } from '../lib/storage';

interface UseCacheOptions {
  /** 캐시 유효 시간(ms). 기본 5분 */
  ttl?: number;
  /** mount 시 자동 실행 여부 (기본 true) */
  immediate?: boolean;
}

interface UseCacheReturn<T> {
  /** 현재 데이터 (캐시 or 최신) */
  data: T | null;
  /** 최초 로딩 중 (캐시 없이 네트워크만 기다리는 상태) */
  loading: boolean;
  /** 현재 데이터가 캐시(stale)인지 여부 */
  isStale: boolean;
  /** 백그라운드에서 최신 데이터 가져오는 중 */
  isRevalidating: boolean;
  /** 에러 */
  error: string | null;
  /** 수동 새로고침 */
  refresh: () => Promise<void>;
}

export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseCacheOptions = {},
): UseCacheReturn<T> {
  const { ttl = 5 * 60 * 1000, immediate = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const loadFromCacheAndFetch = useCallback(async () => {
    // 1. 캐시에서 먼저 읽기
    const cached = await cache.get<T>(key);
    if (cached) {
      if (mountedRef.current) {
        setData(cached.data);
        setIsStale(cached.isStale);
        setLoading(false);
      }

      // 캐시가 아직 신선하면 네트워크 요청 안 함
      if (!cached.isStale) return;
    }

    // 2. 네트워크에서 가져오기 (신선한 캐시 없을 때 or stale)
    if (mountedRef.current) {
      setIsRevalidating(true);
      if (!cached) setLoading(true); // 캐시 없을 때만 로딩 표시
    }

    try {
      setError(null);
      const fresh = await fetcher();
      if (mountedRef.current) {
        setData(fresh);
        setIsStale(false);
        setIsRevalidating(false);
        setLoading(false);
      }
      // 캐시에 저장
      await cache.set(key, fresh, ttl);
    } catch (e: any) {
      if (mountedRef.current) {
        setError(e?.message ?? '데이터를 불러올 수 없어요');
        setIsRevalidating(false);
        setLoading(false);
      }
    }
  }, [key, fetcher, ttl]);

  const refresh = useCallback(async () => {
    setIsRevalidating(true);
    try {
      setError(null);
      const fresh = await fetcher();
      if (mountedRef.current) {
        setData(fresh);
        setIsStale(false);
        setIsRevalidating(false);
      }
      await cache.set(key, fresh, ttl);
    } catch (e: any) {
      if (mountedRef.current) {
        setError(e?.message ?? '데이터를 불러올 수 없어요');
        setIsRevalidating(false);
      }
    }
  }, [key, fetcher, ttl]);

  useEffect(() => {
    if (immediate) loadFromCacheAndFetch();
  }, [immediate, loadFromCacheAndFetch]);

  return { data, loading, isStale, isRevalidating, error, refresh };
}
