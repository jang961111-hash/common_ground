// ==========================================
// Common Ground - Mock 데이터 (초기 시드)
// ==========================================
import { User, Snapshot, AppNotification } from '../types';

let _nextId = 100;
const uid = () => `mock-${_nextId++}`;

export const MOCK_USERS: User[] = [
  {
    id: 'user-alice',
    email: 'alice@example.com',
    displayName: '민지',
    avatarUrl: null,
    avatarEmoji: '🎵',
    avatarColor: '#FF6B6B',
    bio: '음악과 여행을 좋아하는 대학생이에요 🎵',
    recentInterests: ['guitar', 'camping', 'japanese_food'],
    alwaysInterests: ['reading', 'coffee', 'photography'],
    welcomeTopics: ['요즘 배우고 있는 기타 얘기', '최근 다녀온 캠핑장 추천'],
    shareLink: 'minji-abc123',
    privacyLevel: 'PUBLIC',
    isOnline: true,
    lastSeen: new Date().toISOString(),
    createdAt: '2026-01-15T09:00:00Z',
  },
  {
    id: 'user-bob',
    email: 'bob@example.com',
    displayName: '준호',
    avatarUrl: null,
    avatarEmoji: '☕',
    avatarColor: '#4ECDC4',
    bio: '개발자 / 러닝 / 커피 매니아 ☕',
    recentInterests: ['running', 'web_dev', 'coffee'],
    alwaysInterests: ['gaming', 'movie', 'cooking'],
    welcomeTopics: ['프론트엔드 개발 이야기', '러닝 코스 추천', '드립 커피 원두 추천'],
    shareLink: 'junho-def456',
    privacyLevel: 'PUBLIC',
    isOnline: true,
    lastSeen: new Date().toISOString(),
    createdAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'user-carol',
    email: 'carol@example.com',
    displayName: '서연',
    avatarUrl: null,
    avatarEmoji: '🎨',
    avatarColor: '#DDA0DD',
    bio: '요리와 그림 그리기가 취미입니다 🎨',
    recentInterests: ['cooking', 'drawing', 'yoga'],
    alwaysInterests: ['reading', 'travel_asia', 'kpop'],
    welcomeTopics: ['최근 만든 요리 자랑', '일러스트 작업 이야기'],
    shareLink: 'seoyeon-ghi789',
    privacyLevel: 'LINK',
    isOnline: false,
    lastSeen: '2026-02-14T18:30:00Z',
    createdAt: '2026-01-25T11:00:00Z',
  },
  {
    id: 'user-dave',
    email: 'dave@example.com',
    displayName: '현우',
    avatarUrl: null,
    avatarEmoji: '🏀',
    avatarColor: '#45B7D1',
    bio: '농구하고 게임하는 직장인 🏀',
    recentInterests: ['basketball', 'gaming', 'ai_ml'],
    alwaysInterests: ['soccer', 'movie', 'web_dev'],
    welcomeTopics: ['NBA 시즌 이야기', '요즘 하는 게임'],
    shareLink: 'hyunwoo-jkl012',
    privacyLevel: 'PUBLIC',
    isOnline: true,
    lastSeen: new Date().toISOString(),
    createdAt: '2026-02-01T12:00:00Z',
  },
  {
    id: 'user-eve',
    email: 'eve@example.com',
    displayName: '유진',
    avatarUrl: null,
    avatarEmoji: '📸',
    avatarColor: '#96CEB4',
    bio: '여행 블로거 / 사진 찍는 거 좋아해요 📸',
    recentInterests: ['photography', 'travel_asia', 'cafe'],
    alwaysInterests: ['hiking', 'movie', 'reading'],
    welcomeTopics: ['최근 여행 사진', '카페 투어 이야기', '인생 영화 추천'],
    shareLink: 'yujin-mno345',
    privacyLevel: 'PUBLIC',
    isOnline: true,
    lastSeen: new Date().toISOString(),
    createdAt: '2026-02-05T13:00:00Z',
  },
  {
    id: 'user-frank',
    email: 'frank@example.com',
    displayName: '도윤',
    avatarUrl: null,
    avatarEmoji: '🎹',
    avatarColor: '#F7DC6F',
    bio: '피아노 치는 개발자 🎹',
    recentInterests: ['piano', 'mobile_dev', 'classical'],
    alwaysInterests: ['guitar', 'coffee', 'reading'],
    welcomeTopics: ['클래식 음악 이야기', '사이드 프로젝트 개발기'],
    shareLink: 'doyun-pqr678',
    privacyLevel: 'FRIENDS',
    isOnline: false,
    lastSeen: '2026-02-13T20:00:00Z',
    createdAt: '2026-02-08T14:00:00Z',
  },
];

export const MOCK_SNAPSHOTS: Snapshot[] = [
  {
    id: 'snap-1',
    userId: 'user-alice',
    imageUrl: 'https://picsum.photos/seed/snap1/400/300',
    caption: '오늘의 캠핑 뷰 🏕️',
    createdAt: '2026-02-14T15:00:00Z',
  },
  {
    id: 'snap-2',
    userId: 'user-alice',
    imageUrl: 'https://picsum.photos/seed/snap2/400/300',
    caption: '기타 연습중 🎸',
    createdAt: '2026-02-13T10:00:00Z',
  },
  {
    id: 'snap-3',
    userId: 'user-bob',
    imageUrl: 'https://picsum.photos/seed/snap3/400/300',
    caption: '한강 러닝 완료! 10km 🏃',
    createdAt: '2026-02-14T08:00:00Z',
  },
  {
    id: 'snap-4',
    userId: 'user-carol',
    imageUrl: 'https://picsum.photos/seed/snap4/400/300',
    caption: '오늘 만든 파스타 🍝',
    createdAt: '2026-02-14T12:00:00Z',
  },
  {
    id: 'snap-5',
    userId: 'user-dave',
    imageUrl: 'https://picsum.photos/seed/snap5/400/300',
    caption: '농구 경기 관전 중 🏀',
    createdAt: '2026-02-14T19:00:00Z',
  },
  {
    id: 'snap-6',
    userId: 'user-eve',
    imageUrl: 'https://picsum.photos/seed/snap6/400/300',
    caption: '제주도 일출 ☀️',
    createdAt: '2026-02-14T06:30:00Z',
  },
  {
    id: 'snap-7',
    userId: 'user-eve',
    imageUrl: 'https://picsum.photos/seed/snap7/400/300',
    caption: '성산일출봉에서',
    createdAt: '2026-02-13T14:00:00Z',
  },
];

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  // 오늘 (2026-02-16)
  {
    id: 'notif-1',
    userId: '',
    type: 'PROFILE_VIEW',
    title: '프로필 열람',
    message: '민지님이 프로필을 열람했어요',
    isRead: false,
    fromUserId: 'user-alice',
    createdAt: '2026-02-16T09:30:00Z',
  },
  {
    id: 'notif-2',
    userId: '',
    type: 'NEW_MATCH',
    title: '공통 관심사 발견!',
    message: '준호님과 3개의 공통 관심사가 있어요',
    isRead: false,
    fromUserId: 'user-bob',
    createdAt: '2026-02-16T08:15:00Z',
  },
  // 어제 (2026-02-15)
  {
    id: 'notif-3',
    userId: '',
    type: 'PROFILE_VIEW',
    title: '프로필 열람',
    message: '하윤님이 프로필을 열람했어요',
    isRead: false,
    fromUserId: 'user-carol',
    createdAt: '2026-02-15T18:45:00Z',
  },
  {
    id: 'notif-4',
    userId: '',
    type: 'NEW_MATCH',
    title: '새로운 매칭!',
    message: '유진님과 2개의 공통 관심사가 있어요',
    isRead: true,
    fromUserId: 'user-eve',
    createdAt: '2026-02-15T14:20:00Z',
  },
  // 이번 주 (2026-02-10 ~ 2026-02-14)
  {
    id: 'notif-5',
    userId: '',
    type: 'SYSTEM',
    title: '프로필 완성도 UP! 🎯',
    message: '관심사를 추가하면 더 정확한 매칭을 받을 수 있어요',
    isRead: true,
    createdAt: '2026-02-14T10:00:00Z',
  },
  {
    id: 'notif-6',
    userId: '',
    type: 'PROFILE_VIEW',
    title: '프로필 열람',
    message: '서준님이 프로필을 열람했어요',
    isRead: true,
    fromUserId: 'user-dave',
    createdAt: '2026-02-13T11:00:00Z',
  },
  {
    id: 'notif-7',
    userId: '',
    type: 'NEW_MATCH',
    title: '공통 관심사 발견!',
    message: '지아님과 4개의 공통 관심사가 있어요',
    isRead: true,
    fromUserId: 'user-alice',
    createdAt: '2026-02-12T16:30:00Z',
  },
  // 이전
  {
    id: 'notif-8',
    userId: '',
    type: 'SYSTEM',
    title: '환영합니다! 🎉',
    message: 'Common Ground에 가입해주셔서 감사합니다. 프로필을 완성해보세요!',
    isRead: true,
    createdAt: '2026-02-08T09:00:00Z',
  },
  {
    id: 'notif-9',
    userId: '',
    type: 'SYSTEM',
    title: '새로운 기능 🚀',
    message: '다크 모드와 오프라인 지원이 추가되었어요!',
    isRead: true,
    createdAt: '2026-02-05T12:00:00Z',
  },
];

// 아바타 색상 (아바타 URL 없을 때 사용)
export const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F0B27A', '#82E0AA',
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
