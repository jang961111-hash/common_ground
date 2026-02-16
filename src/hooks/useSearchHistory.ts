// ==========================================
// useSearchHistory — 검색 히스토리 관리 훅
// ==========================================
import { useState, useEffect, useCallback } from 'react';
import { searchHistoryStorage } from '../lib/storage';

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await searchHistoryStorage.getAll();
      setHistory(saved);
      setLoaded(true);
    })();
  }, []);

  /** 검색어 추가 */
  const addSearch = useCallback(async (query: string) => {
    const updated = await searchHistoryStorage.add(query);
    setHistory(updated);
  }, []);

  /** 특정 검색어 삭제 */
  const removeSearch = useCallback(async (query: string) => {
    const updated = await searchHistoryStorage.remove(query);
    setHistory(updated);
  }, []);

  /** 전체 히스토리 삭제 */
  const clearHistory = useCallback(async () => {
    await searchHistoryStorage.clear();
    setHistory([]);
  }, []);

  return { history, loaded, addSearch, removeSearch, clearHistory };
}
