// ==========================================
// Common Ground - 배지 상수 정의
// ==========================================
import { BadgeCategory, BadgeRarity } from '../types';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  condition: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // SOCIAL
  {
    id: 'first_connection',
    name: '첫 인연',
    description: '첫 번째 연결을 맺었어요',
    emoji: '🤝',
    category: 'SOCIAL',
    rarity: 'COMMON',
    condition: '첫 연결 수락',
  },
  {
    id: 'social_butterfly',
    name: '소셜 나비',
    description: '10명 이상과 연결되었어요',
    emoji: '🦋',
    category: 'SOCIAL',
    rarity: 'RARE',
    condition: '연결 10명 달성',
  },
  {
    id: 'popular',
    name: '인기인',
    description: '프로필을 50번 이상 열람받았어요',
    emoji: '⭐',
    category: 'SOCIAL',
    rarity: 'EPIC',
    condition: '프로필 열람 50회 달성',
  },

  // PROFILE
  {
    id: 'profile_complete',
    name: '완벽한 프로필',
    description: '프로필 완성도 100%를 달성했어요',
    emoji: '✅',
    category: 'PROFILE',
    rarity: 'COMMON',
    condition: '프로필 완성도 100%',
  },
  {
    id: 'snapshot_star',
    name: '스냅샷 스타',
    description: '스냅샷을 5개 이상 등록했어요',
    emoji: '📸',
    category: 'PROFILE',
    rarity: 'RARE',
    condition: '스냅샷 5개 등록',
  },
  {
    id: 'avatar_artist',
    name: '아바타 아티스트',
    description: '커스텀 아바타를 설정했어요',
    emoji: '🎨',
    category: 'PROFILE',
    rarity: 'COMMON',
    condition: '커스텀 아바타 설정',
  },

  // EXPLORER
  {
    id: 'interest_explorer',
    name: '관심사 탐험가',
    description: '관심사를 10개 이상 등록했어요',
    emoji: '🧭',
    category: 'EXPLORER',
    rarity: 'COMMON',
    condition: '관심사 10개 이상',
  },
  {
    id: 'trend_setter',
    name: '트렌드세터',
    description: '인기 관심사 3개 이상을 보유했어요',
    emoji: '🔥',
    category: 'EXPLORER',
    rarity: 'EPIC',
    condition: '인기 관심사 3개 보유',
  },
  {
    id: 'category_master',
    name: '카테고리 마스터',
    description: '5개 이상 카테고리에 관심사를 등록했어요',
    emoji: '🏅',
    category: 'EXPLORER',
    rarity: 'RARE',
    condition: '5개 카테고리 관심사 보유',
  },

  // CHAT
  {
    id: 'conversation_starter',
    name: '대화의 시작',
    description: '첫 메시지를 보냈어요',
    emoji: '💬',
    category: 'CHAT',
    rarity: 'COMMON',
    condition: '첫 메시지 전송',
  },
  {
    id: 'chatterbox',
    name: '수다쟁이',
    description: '메시지 100개를 전송했어요',
    emoji: '🗣️',
    category: 'CHAT',
    rarity: 'RARE',
    condition: '메시지 100개 전송',
  },

  // SPECIAL
  {
    id: 'perfect_match',
    name: '완벽한 매치',
    description: '호환도 90% 이상인 매치를 만났어요',
    emoji: '💫',
    category: 'SPECIAL',
    rarity: 'LEGENDARY',
    condition: '호환도 90% 이상 매치',
  },
  {
    id: 'early_bird',
    name: '얼리버드',
    description: '가입 7일 내 프로필을 완성했어요',
    emoji: '🐦',
    category: 'SPECIAL',
    rarity: 'EPIC',
    condition: '가입 7일 내 프로필 완성',
  },
  {
    id: 'week_streak',
    name: '7일 연속',
    description: '7일 연속 접속했어요',
    emoji: '🔥',
    category: 'SPECIAL',
    rarity: 'RARE',
    condition: '7일 연속 접속',
  },
];

export const BADGE_CATEGORIES: { key: BadgeCategory | 'ALL'; label: string; emoji: string }[] = [
  { key: 'ALL', label: '전체', emoji: '🏆' },
  { key: 'SOCIAL', label: '소셜', emoji: '🤝' },
  { key: 'PROFILE', label: '프로필', emoji: '👤' },
  { key: 'EXPLORER', label: '탐험', emoji: '🧭' },
  { key: 'CHAT', label: '채팅', emoji: '💬' },
  { key: 'SPECIAL', label: '특별', emoji: '✨' },
];

export const RARITY_COLORS: Record<BadgeRarity, string> = {
  COMMON: '#9CA3AF',
  RARE: '#3B82F6',
  EPIC: '#8B5CF6',
  LEGENDARY: '#F59E0B',
};

export const RARITY_LABELS: Record<BadgeRarity, string> = {
  COMMON: '일반',
  RARE: '레어',
  EPIC: '에픽',
  LEGENDARY: '전설',
};

export const getBadgeById = (id: string): BadgeDefinition | undefined =>
  BADGE_DEFINITIONS.find(b => b.id === id);
