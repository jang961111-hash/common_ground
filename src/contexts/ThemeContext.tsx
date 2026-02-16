// ==========================================
// ThemeContext — 다크 모드 지원
// ==========================================
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { COLORS, DARK_COLORS, ThemeColors } from '../constants/theme';
import { themeStorage } from '../lib/storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  /** 현재 적용된 색상 팔레트 */
  colors: ThemeColors;
  /** 다크 모드 활성 여부 */
  isDark: boolean;
  /** 현재 테마 모드 설정 */
  themeMode: ThemeMode;
  /** 테마 모드 변경 */
  setThemeMode: (mode: ThemeMode) => void;
  /** 다크/라이트 토글 (system 모드면 반대쪽으로) */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: COLORS,
  isDark: false,
  themeMode: 'system',
  setThemeMode: () => {},
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isReady, setIsReady] = useState(false);

  // 앱 시작 시 저장된 테마 모드 복원
  useEffect(() => {
    (async () => {
      const saved = await themeStorage.getMode();
      if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
        setThemeModeState(saved as ThemeMode);
      }
      setIsReady(true);
    })();
  }, []);

  // 테마 모드 변경 시 저장
  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    themeStorage.saveMode(mode);
  }, []);

  const isDark = useMemo(() => {
    if (themeMode === 'system') return systemScheme === 'dark';
    return themeMode === 'dark';
  }, [themeMode, systemScheme]);

  const colors = useMemo(() => (isDark ? DARK_COLORS : COLORS), [isDark]);

  const toggleTheme = useCallback(() => {
    setThemeModeState((prev) => {
      let next: ThemeMode;
      if (prev === 'system') next = isDark ? 'light' : 'dark';
      else next = prev === 'dark' ? 'light' : 'dark';
      themeStorage.saveMode(next);
      return next;
    });
  }, [isDark]);

  const value = useMemo<ThemeContextValue>(
    () => ({ colors, isDark, themeMode, setThemeMode, toggleTheme }),
    [colors, isDark, themeMode, setThemeMode, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
