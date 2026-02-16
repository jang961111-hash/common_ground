// ==========================================
// Common Ground - 전체 타입 정의
// ==========================================
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// --- 관심사 관련 ---
export type InterestType = 'RECENT' | 'ALWAYS';

export type PrivacyLevel = 'PUBLIC' | 'LINK' | 'FRIENDS' | 'PRIVATE';

// --- 사용자 ---
export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  avatarEmoji: string | null;    // 커스텀 아바타 이모지 (e.g. '😎')
  avatarColor: string | null;    // 커스텀 아바타 배경색 (e.g. '#FF6B6B')
  bio: string | null;
  recentInterests: string[];   // 요즘 관심사 ID 목록
  alwaysInterests: string[];   // 항상 관심사 ID 목록
  welcomeTopics: string[];     // 대화 환영 주제 (최대 5개)
  shareLink: string;           // 고유 공유 링크
  privacyLevel: PrivacyLevel;
  isOnline: boolean;
  lastSeen: string | null;
  createdAt: string;
}

// --- 스냅샷 ---
export interface Snapshot {
  id: string;
  userId: string;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
}

// --- 알림 ---
export type NotificationType = 'PROFILE_VIEW' | 'NEW_MATCH' | 'SYSTEM';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  fromUserId?: string;
  createdAt: string;
}

// --- 열람 기록 ---
export interface ProfileViewLog {
  id: string;
  viewerId: string;
  profileId: string;
  viewerName: string;
  viewedAt: string;
}

// --- 연결(친구) ---
export type ConnectionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface ConnectionRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUserName: string;
  toUserName: string;
  status: ConnectionStatus;
  message?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectedUser {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  isOnline: boolean;
  commonInterestCount: number;
  connectedAt: string;
}

// --- 채팅/메시징 ---
export interface MessageReaction {
  emoji: string;
  userId: string;
  displayName: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  readAt: string | null;
  reactions: MessageReaction[];
}

export interface Conversation {
  id: string;
  participantIds: [string, string];
  lastMessage: ChatMessage | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

// --- 신고/차단 ---
export type ReportReason =
  | 'SPAM'
  | 'HARASSMENT'
  | 'INAPPROPRIATE'
  | 'FAKE_PROFILE'
  | 'OTHER';

export interface UserReport {
  id: string;
  reporterId: string;
  targetUserId: string;
  reason: ReportReason;
  detail?: string;
  createdAt: string;
}

export interface BlockedUser {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  blockedAt: string;
}

// --- 활동 통계 ---
export interface DailyCount {
  date: string;  // 'YYYY-MM-DD'
  count: number;
}

export interface ActivityStats {
  profileViews: number;
  profileViewsTrend: number;       // 전주 대비 변동 %
  profileViewsDaily: DailyCount[]; // 최근 7일
  totalConnections: number;
  newConnectionsThisWeek: number;
  totalConversations: number;
  messagesSent: number;
  messagesReceived: number;
  topInterests: { interestId: string; viewCount: number }[];
  joinedDaysAgo: number;
}

// --- 관심사 트렌드 & 추천 ---
export type InterestTrend = 'rising' | 'hot' | 'steady';

export interface TrendingInterest {
  interestId: string;
  userCount: number;
  trend: InterestTrend;
}

export interface InterestRecommendation {
  interestId: string;
  reason: string;
  matchedUserCount: number;
}

// --- 추천 질문 ---
export interface RecommendedQuestion {
  id: string;
  interestId: string;
  question: string;
  type: 'DEFAULT' | 'AI';
}

// --- 발견 화면 아이템 ---
export interface DiscoverItem {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  recentInterests: string[];
  alwaysInterests: string[];
  isOnline: boolean;
  lastSeen: string | null;
  commonInterestCount: number;
  latestSnapshot: Snapshot | null;
}

// --- 소셜 피드 ---
export type FeedItemType =
  | 'SNAPSHOT_POSTED'
  | 'CONNECTION_MADE'
  | 'INTEREST_UPDATED'
  | 'USER_JOINED';

export interface FeedItem {
  id: string;
  type: FeedItemType;
  userId: string;
  userName: string;
  avatarEmoji: string | null;
  avatarColor: string | null;
  timestamp: string;
  // 타입별 데이터
  snapshot?: Snapshot;                // SNAPSHOT_POSTED
  connectedUserName?: string;         // CONNECTION_MADE
  updatedInterests?: string[];        // INTEREST_UPDATED
}

// --- 배지 & 업적 ---
export type BadgeCategory = 'SOCIAL' | 'PROFILE' | 'EXPLORER' | 'CHAT' | 'SPECIAL';
export type BadgeRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  condition: string;
  progress: number;            // 0-100
  unlockedAt: string | null;   // null이면 미달성
}

export interface UserBadgeSummary {
  totalBadges: number;
  unlockedCount: number;
  recentBadge: Badge | null;
  badges: Badge[];
}

// --- 관심사 기반 그룹 ---
export type GroupRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface InterestGroup {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  interestIds: string[];
  ownerId: string;
  memberCount: number;
  maxMembers: number;
  isPublic: boolean;
  createdAt: string;
}

export interface GroupMember {
  userId: string;
  displayName: string;
  avatarEmoji: string | null;
  avatarColor: string | null;
  role: GroupRole;
  joinedAt: string;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderEmoji: string | null;
  text: string;
  createdAt: string;
}

export interface GroupPreview {
  id: string;
  name: string;
  emoji: string;
  color: string;
  memberCount: number;
  interestIds: string[];
  lastActivity: string;
  isMember: boolean;
}

// --- 호환도 점수 ---
export interface CategoryScore {
  category: string;
  score: number;        // 0-100
  commonCount: number;
  totalPossible: number;
}

export interface CompatibilityScore {
  overall: number;          // 0-100 총점
  interestScore: number;    // 관심사 교집합 점수
  categoryScore: number;    // 카테고리 다양성 점수
  topicScore: number;       // 대화주제 교집합 점수
  commonInterests: string[];         // 겹치는 관심사 ID 목록
  commonCategories: string[];        // 겹치는 카테고리 목록
  commonTopics: string[];            // 겹치는 대화 주제
  categoryBreakdown: CategoryScore[];// 카테고리별 상세
  label: string;            // '완벽한 매치' | '좋은 궁합' | ...
  emoji: string;            // 라벨 이모지
}

// --- 이벤트 & 모임 ---
export type EventStatus = 'UPCOMING' | 'ONGOING' | 'ENDED' | 'CANCELLED';
export type EventRSVP = 'GOING' | 'MAYBE' | 'NOT_GOING';

// --- 북마크 ---
export type BookmarkType = 'USER' | 'GROUP' | 'EVENT';

export interface Bookmark {
  id: string;
  userId: string;         // 북마크한 사용자
  targetType: BookmarkType;
  targetId: string;
  note: string | null;    // 사용자 메모
  createdAt: string;
}

export interface BookmarkWithPreview extends Bookmark {
  // 미리보기 데이터 (targetType에 따라 하나만 존재)
  userPreview?: {
    displayName: string;
    avatarEmoji: string | null;
    avatarColor: string | null;
    bio: string | null;
    isOnline: boolean;
  };
  groupPreview?: {
    name: string;
    emoji: string;
    color: string;
    memberCount: number;
  };
  eventPreview?: {
    title: string;
    emoji: string;
    date: string;
    location: string;
    status: EventStatus;
  };
}

export interface AppEvent {
  id: string;
  title: string;
  description: string;
  emoji: string;
  date: string;           // ISO — 시작 시각
  endDate: string;        // ISO — 종료 시각
  location: string;
  groupId: string | null;
  groupName: string | null;
  hostId: string;
  hostName: string;
  hostEmoji: string | null;
  maxAttendees: number;
  attendeeCount: number;
  interestIds: string[];
  status: EventStatus;
  createdAt: string;
}

export interface EventAttendee {
  userId: string;
  displayName: string;
  avatarEmoji: string | null;
  avatarColor: string | null;
  rsvp: EventRSVP;
  respondedAt: string;
}

export interface EventPreview {
  id: string;
  title: string;
  emoji: string;
  date: string;
  location: string;
  attendeeCount: number;
  myRsvp: EventRSVP | null;
  groupName: string | null;
  status: EventStatus;
}

// --- 통합 검색 ---
export type SearchResultType = 'USER' | 'GROUP' | 'EVENT';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string | null;
  emoji: string | null;
  avatarUrl: string | null;
  avatarColor: string | null;
  interestIds: string[];
  isOnline?: boolean;
  memberCount?: number;
  date?: string;
  matchReason: string;   // e.g. '이름 일치', '관심사 일치'
}

export interface TrendingSearch {
  keyword: string;
  count: number;
  emoji: string;
}

// --- 프로필 인사이트 ---
export interface ProfileVisitor {
  userId: string;
  displayName: string;
  avatarEmoji: string | null;
  avatarColor: string | null;
  visitedAt: string;
  commonInterestCount: number;
  viewCount: number;  // 총 방문 횟수
}

export interface InterestEngagement {
  interestId: string;
  views: number;
  connections: number;
  score: number;        // 0-100 인기도
}

export interface WeeklySummary {
  totalViews: number;
  uniqueVisitors: number;
  viewsTrend: number;       // 전주 대비 %
  topVisitor: ProfileVisitor | null;
  peakDay: string;           // 가장 많이 본 요일
  peakHour: number;          // 가장 많이 보는 시간
  newConnections: number;
  interestEngagement: InterestEngagement[];
}

export interface ProfileInsightsData {
  daily: DailyCount[];         // 7일 조회수
  hourly: number[];            // 24시간별 조회 분포
  visitors: ProfileVisitor[];  // 최근 방문자
  summary: WeeklySummary;
}

// --- 활동 타임라인 ---
export type ActivityType =
  | 'PROFILE_VIEW_RECEIVED'   // 누군가 내 프로필 열람
  | 'CONNECTION_MADE'         // 연결 성사
  | 'CONNECTION_REQUEST'      // 연결 요청 보냄/받음
  | 'BADGE_EARNED'            // 배지 획득
  | 'GROUP_JOINED'            // 그룹 가입
  | 'EVENT_JOINED'            // 이벤트 참여
  | 'INTEREST_UPDATED'        // 관심사 변경
  | 'PROFILE_UPDATED'         // 프로필 수정
  | 'SNAPSHOT_ADDED'          // 스냅샷 추가
  | 'BOOKMARK_ADDED';         // 북마크 추가

export interface ActivityTimelineItem {
  id: string;
  type: ActivityType;
  title: string;
  subtitle: string | null;
  emoji: string;              // 활동 타입 아이콘
  relatedUserId: string | null;
  relatedUserName: string | null;
  relatedUserEmoji: string | null;
  relatedUserColor: string | null;
  metadata: Record<string, string | number | null>;  // 추가 데이터
  createdAt: string;
}

// --- 사용자 메모 ---
export interface UserNote {
  id: string;
  authorId: string;          // 메모 작성자
  targetUserId: string;      // 대상 사용자
  targetUserName: string;
  targetUserEmoji: string | null;
  targetUserColor: string | null;
  content: string;
  tags: string[];             // 사용자 정의 태그 (e.g. '친절함', '영화 팔')
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 네비게이션 타입
// ==========================================

// --- 하단 탭 ---
export type MainTabParamList = {
  Home: undefined;
  Discover: undefined;
  Groups: undefined;
  Profile: { scrollTo?: string } | undefined;
};

// --- 루트 스택 ---
export type RootStackParamList = {
  Landing: undefined;
  Signup: undefined;
  Login: undefined;
  Onboarding: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  UserDetail: { userId: string };
  DemoProfile: { userId: string };
  ConversationTopics: {
    displayName: string;
    commonInterests: string[];
    theirInterests: string[];
  };
  ShareProfile: undefined;
  Settings: undefined;
  Notifications: undefined;
  Connections: undefined;
  Conversations: undefined;
  Chat: { conversationId?: string; userId: string };
  Stats: undefined;
  BlockedUsers: undefined;
  EditProfile: undefined;
  EditInterests: { type: InterestType };
  SnapshotGallery: { userId?: string } | undefined;
  Feed: undefined;
  Compatibility: { userId: string };
  Badges: undefined;
  Groups: undefined;
  GroupDetail: { groupId: string };
  CreateGroup: undefined;
  EventDetail: { eventId: string };
  CreateEvent: { groupId?: string } | undefined;
  Bookmarks: undefined;
  Search: undefined;
  Insights: undefined;
  ActivityTimeline: undefined;
  UserNotes: undefined;
  Tutorial: undefined;
};

// --- 스택 화면 Props ---
export type LandingScreenProps = NativeStackScreenProps<RootStackParamList, 'Landing'>;
export type SignupScreenProps = NativeStackScreenProps<RootStackParamList, 'Signup'>;
export type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
export type OnboardingScreenProps = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;
export type UserDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'UserDetail'>;
export type DemoProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'DemoProfile'>;
export type ConversationTopicsScreenProps = NativeStackScreenProps<RootStackParamList, 'ConversationTopics'>;
export type ShareProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'ShareProfile'>;
export type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;
export type NotificationsScreenProps = NativeStackScreenProps<RootStackParamList, 'Notifications'>;
export type ConnectionsScreenProps = NativeStackScreenProps<RootStackParamList, 'Connections'>;
export type ConversationsScreenProps = NativeStackScreenProps<RootStackParamList, 'Conversations'>;
export type ChatScreenProps = NativeStackScreenProps<RootStackParamList, 'Chat'>;
export type StatsScreenProps = NativeStackScreenProps<RootStackParamList, 'Stats'>;
export type BlockedUsersScreenProps = NativeStackScreenProps<RootStackParamList, 'BlockedUsers'>;
export type EditProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;
export type EditInterestsScreenProps = NativeStackScreenProps<RootStackParamList, 'EditInterests'>;
export type SnapshotGalleryScreenProps = NativeStackScreenProps<RootStackParamList, 'SnapshotGallery'>;
export type FeedScreenProps = NativeStackScreenProps<RootStackParamList, 'Feed'>;
export type CompatibilityScreenProps = NativeStackScreenProps<RootStackParamList, 'Compatibility'>;
export type BadgesScreenProps = NativeStackScreenProps<RootStackParamList, 'Badges'>;
export type GroupsScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Groups'>,
  NativeStackScreenProps<RootStackParamList>
>;
export type GroupDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'GroupDetail'>;
export type CreateGroupScreenProps = NativeStackScreenProps<RootStackParamList, 'CreateGroup'>;
export type EventDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'EventDetail'>;
export type CreateEventScreenProps = NativeStackScreenProps<RootStackParamList, 'CreateEvent'>;
export type BookmarksScreenProps = NativeStackScreenProps<RootStackParamList, 'Bookmarks'>;
export type SearchScreenProps = NativeStackScreenProps<RootStackParamList, 'Search'>;
export type InsightsScreenProps = NativeStackScreenProps<RootStackParamList, 'Insights'>;
export type ActivityTimelineScreenProps = NativeStackScreenProps<RootStackParamList, 'ActivityTimeline'>;
export type UserNotesScreenProps = NativeStackScreenProps<RootStackParamList, 'UserNotes'>;
export type TutorialScreenProps = NativeStackScreenProps<RootStackParamList, 'Tutorial'>;

// --- 탭 화면 Props (탭 내부에서 스택으로 navigate 가능) ---
export type HomeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;
export type DiscoverScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Discover'>,
  NativeStackScreenProps<RootStackParamList>
>;
export type ProfileScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList>
>;


// --- Auth 상태 ---
export interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  isLoading: boolean;
}
