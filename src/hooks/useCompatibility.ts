// ==========================================
// useCompatibility — 호환도 점수 계산 훅
// ==========================================
import { useState, useEffect, useCallback } from 'react';
import { mockCompatibility } from '../services/mockService';
import { CompatibilityScore } from '../types';

interface UseCompatibilityResult {
  score: CompatibilityScore | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * 특정 유저와의 호환도 점수를 가져옵니다.
 */
export function useCompatibility(targetUserId: string): UseCompatibilityResult {
  const [score, setScore] = useState<CompatibilityScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await mockCompatibility.getScore(targetUserId);
      setScore(result);
    } catch (e: any) {
      setError(e?.message ?? '호환도를 계산할 수 없어요');
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    load();
  }, [load]);

  return { score, loading, error, refresh: load };
}

interface TopMatch {
  userId: string;
  displayName: string;
  avatarEmoji: string | null;
  avatarColor: string | null;
  score: number;
  label: string;
  emoji: string;
}

interface UseTopMatchesResult {
  matches: TopMatch[];
  loading: boolean;
  refresh: () => void;
}

/**
 * 호환도 상위 매치 유저 목록을 가져옵니다.
 */
export function useTopMatches(limit = 5): UseTopMatchesResult {
  const [matches, setMatches] = useState<TopMatch[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await mockCompatibility.getTopMatches(limit);
      setMatches(data);
    } catch {
      // 에러 시 빈 배열
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    load();
  }, [load]);

  return { matches, loading, refresh: load };
}
