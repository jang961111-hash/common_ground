// ==========================================
// Common Ground - Storage Utility
// AsyncStorage 기반 데이터 영속성 레이어
// ==========================================
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── 스토리지 키 상수 ──
const KEYS = {
  AUTH_USER: '@cg/auth_user',
  AUTH_USER_ID: '@cg/auth_user_id',
  THEME_MODE: '@cg/theme_mode',
  SEARCH_HISTORY: '@cg/search_history',
  NOTIFICATION_SETTINGS: '@cg/notification_settings',
  CACHE_PREFIX: '@cg/cache/',
} as const;

// ── 캐시 항목 (만료 시간 포함) ──
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  /** TTL (ms). 기본 5분 */
  ttl: number;
}

// ==========================================
// 기본 스토리지 유틸
// ==========================================

/** JSON 직렬화하여 저장 */
async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[Storage] setItem failed:', key, e);
  }
}

/** JSON 파싱하여 읽기 */
async function getItem<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn('[Storage] getItem failed:', key, e);
    return null;
  }
}

/** 키 삭제 */
async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.warn('[Storage] removeItem failed:', key, e);
  }
}

/** 여러 키 삭제 */
async function removeItems(keys: string[]): Promise<void> {
  try {
    await AsyncStorage.multiRemove(keys);
  } catch (e) {
    console.warn('[Storage] removeItems failed:', e);
  }
}

// ==========================================
// Auth 영속성
// ==========================================

export const authStorage = {
  /** 로그인한 사용자 ID 저장 */
  async saveUserId(userId: string): Promise<void> {
    await setItem(KEYS.AUTH_USER_ID, userId);
  },

  /** 캐시된 사용자 프로필 저장 */
  async saveUser(user: any): Promise<void> {
    await setItem(KEYS.AUTH_USER, user);
  },

  /** 저장된 사용자 ID 가져오기 */
  async getUserId(): Promise<string | null> {
    return getItem<string>(KEYS.AUTH_USER_ID);
  },

  /** 캐시된 사용자 프로필 가져오기 */
  async getUser<T>(): Promise<T | null> {
    return getItem<T>(KEYS.AUTH_USER);
  },

  /** 로그아웃 시 인증 데이터 삭제 */
  async clear(): Promise<void> {
    await removeItems([KEYS.AUTH_USER_ID, KEYS.AUTH_USER]);
  },
};

// ==========================================
// 테마 영속성
// ==========================================

export const themeStorage = {
  /** 테마 모드 저장 */
  async saveMode(mode: string): Promise<void> {
    await setItem(KEYS.THEME_MODE, mode);
  },

  /** 저장된 테마 모드 가져오기 */
  async getMode(): Promise<string | null> {
    return getItem<string>(KEYS.THEME_MODE);
  },
};

// ==========================================
// 검색 히스토리
// ==========================================

const MAX_SEARCH_HISTORY = 10;

export const searchHistoryStorage = {
  /** 검색어 추가 (중복 제거, 최대 10개) */
  async add(query: string): Promise<string[]> {
    const trimmed = query.trim();
    if (!trimmed) return await this.getAll();
    const existing = await this.getAll();
    const filtered = existing.filter(q => q !== trimmed);
    const updated = [trimmed, ...filtered].slice(0, MAX_SEARCH_HISTORY);
    await setItem(KEYS.SEARCH_HISTORY, updated);
    return updated;
  },

  /** 전체 검색 히스토리 가져오기 */
  async getAll(): Promise<string[]> {
    return (await getItem<string[]>(KEYS.SEARCH_HISTORY)) ?? [];
  },

  /** 특정 검색어 삭제 */
  async remove(query: string): Promise<string[]> {
    const existing = await this.getAll();
    const updated = existing.filter(q => q !== query);
    await setItem(KEYS.SEARCH_HISTORY, updated);
    return updated;
  },

  /** 전체 히스토리 삭제 */
  async clear(): Promise<void> {
    await removeItem(KEYS.SEARCH_HISTORY);
  },
};

// ==========================================
// 범용 캐시 (TTL 기반)
// ==========================================

const DEFAULT_TTL = 5 * 60 * 1000; // 5분

export const cache = {
  /**
   * 데이터를 캐시에 저장
   * @param key 캐시 키 (예: 'discover_online')
   * @param data 저장할 데이터
   * @param ttl 유효 시간(ms). 기본 5분
   */
  async set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    await setItem(KEYS.CACHE_PREFIX + key, entry);
  },

  /**
   * 캐시에서 데이터 읽기.
   * 만료된 캐시도 반환하되, isStale 플래그로 구분.
   */
  async get<T>(key: string): Promise<{ data: T; isStale: boolean } | null> {
    const entry = await getItem<CacheEntry<T>>(KEYS.CACHE_PREFIX + key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    return {
      data: entry.data,
      isStale: age > entry.ttl,
    };
  },

  /** 특정 캐시 키 삭제 */
  async remove(key: string): Promise<void> {
    await removeItem(KEYS.CACHE_PREFIX + key);
  },

  /** 모든 캐시 삭제 (설정/인증은 유지) */
  async clearAll(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(k => k.startsWith(KEYS.CACHE_PREFIX));
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (e) {
      console.warn('[Storage] clearAll cache failed:', e);
    }
  },
};

// ==========================================
// 알림 설정 영속성
// ==========================================

export interface NotificationSettings {
  pushEnabled: boolean;
  matchAlert: boolean;
  viewAlert: boolean;
  systemAlert: boolean;
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  pushEnabled: true,
  matchAlert: true,
  viewAlert: true,
  systemAlert: true,
};

export const notificationSettingsStorage = {
  /** 알림 설정 저장 */
  async save(settings: NotificationSettings): Promise<void> {
    await setItem(KEYS.NOTIFICATION_SETTINGS, settings);
  },

  /** 알림 설정 불러오기 (boolean 보장) */
  async get(): Promise<NotificationSettings> {
    const saved = await getItem<NotificationSettings>(KEYS.NOTIFICATION_SETTINGS);
    if (!saved) return DEFAULT_NOTIFICATION_SETTINGS;
    // AsyncStorage 복원 시 string→boolean 안전 변환
    return {
      pushEnabled: saved.pushEnabled === true || saved.pushEnabled === ('true' as any),
      matchAlert: saved.matchAlert === true || saved.matchAlert === ('true' as any),
      viewAlert: saved.viewAlert === true || saved.viewAlert === ('true' as any),
      systemAlert: saved.systemAlert === true || saved.systemAlert === ('true' as any),
    };
  },

  /** 개별 설정 업데이트 */
  async update(partial: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const current = await this.get();
    const updated = { ...current, ...partial };
    await this.save(updated);
    return updated;
  },
};

// ==========================================
// 전체 초기화 (계정 삭제 등)
// ==========================================

export async function clearAllStorage(): Promise<void> {
  try {
    await AsyncStorage.clear();
  } catch (e) {
    console.warn('[Storage] clearAll failed:', e);
  }
}
