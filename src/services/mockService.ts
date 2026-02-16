// ==========================================
// Common Ground - Mock Service Layer
// In-memory 상태로 백엔드 API를 시뮬레이션
// ==========================================
import { User, Snapshot, AppNotification, DiscoverItem, PrivacyLevel, ConnectionRequest, ConnectedUser, ChatMessage, Conversation, ActivityStats, DailyCount, UserReport, BlockedUser, ReportReason, TrendingInterest, InterestRecommendation, InterestTrend, FeedItem, FeedItemType, CompatibilityScore, CategoryScore, Badge, UserBadgeSummary, InterestGroup, GroupPreview, GroupMember, GroupMessage, GroupRole, AppEvent, EventPreview, EventAttendee, EventRSVP, EventStatus, Bookmark, BookmarkWithPreview, BookmarkType, SearchResult, SearchResultType, TrendingSearch, ProfileVisitor, InterestEngagement, WeeklySummary, ProfileInsightsData, ActivityType, ActivityTimelineItem, MessageReaction, UserNote } from '../types';
import { MOCK_USERS, MOCK_SNAPSHOTS, MOCK_NOTIFICATIONS } from './mockData';
import { INTERESTS, getInterestById } from '../constants/interests';
import { BADGE_DEFINITIONS } from '../constants/badges';

// ---- In-Memory Store ----
let users: User[] = [...MOCK_USERS];
let snapshots: Snapshot[] = [...MOCK_SNAPSHOTS];
let notifications: AppNotification[] = [...MOCK_NOTIFICATIONS];
let connections: ConnectionRequest[] = [];
let conversations: Conversation[] = [];
let chatMessages: ChatMessage[] = [];
let blockedPairs: { blockerId: string; blockedId: string; blockedAt: string }[] = [];
let reports: UserReport[] = [];
let currentUserId: string | null = null;
let _nextId = 1000;

const genId = () => `id-${_nextId++}`;
const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

// ==========================================
// Auth
// ==========================================
export const mockAuth = {
  async signUp(email: string, password: string): Promise<{ user: User; error?: string }> {
    await delay(500);
    const exists = users.find(u => u.email === email);
    if (exists) return { user: null as any, error: '이미 가입된 이메일입니다.' };

    const id = genId();
    const shareLink = `${email.split('@')[0]}-${id.slice(-6)}`;
    const newUser: User = {
      id,
      email,
      displayName: email.split('@')[0],
      avatarUrl: null,
      avatarEmoji: null,
      avatarColor: null,
      bio: null,
      recentInterests: [],
      alwaysInterests: [],
      welcomeTopics: [],
      shareLink,
      privacyLevel: 'PUBLIC',
      isOnline: true,
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    currentUserId = id;

    // 환영 알림
    notifications.push({
      id: genId(),
      userId: id,
      type: 'SYSTEM',
      title: '환영합니다! 🎉',
      message: 'Common Ground에 가입해주셔서 감사합니다!',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return { user: newUser };
  },

  async signIn(email: string, _password: string): Promise<{ user: User | null; error?: string }> {
    await delay(500);
    const user = users.find(u => u.email === email);
    if (!user) return { user: null, error: '계정을 찾을 수 없습니다.' };
    currentUserId = user.id;
    user.isOnline = true;
    user.lastSeen = new Date().toISOString();
    return { user };
  },

  async signOut(): Promise<void> {
    await delay(200);
    if (currentUserId) {
      const user = users.find(u => u.id === currentUserId);
      if (user) {
        user.isOnline = false;
        user.lastSeen = new Date().toISOString();
      }
    }
    currentUserId = null;
  },

  async getCurrentUser(): Promise<User | null> {
    if (!currentUserId) return null;
    return users.find(u => u.id === currentUserId) ?? null;
  },

  /** 앱 재시작 시 저장된 userId로 세션 복원 */
  async restoreSession(userId: string): Promise<User | null> {
    const user = users.find(u => u.id === userId);
    if (user) {
      currentUserId = userId;
      user.isOnline = true;
      user.lastSeen = new Date().toISOString();
      return user;
    }
    return null;
  },

  isLoggedIn(): boolean {
    return currentUserId !== null;
  },
};

// ==========================================
// Profile
// ==========================================
export const mockProfile = {
  async getMyProfile(): Promise<User | null> {
    await delay(200);
    return mockAuth.getCurrentUser();
  },

  async updateProfile(updates: Partial<Pick<User, 'displayName' | 'bio' | 'avatarUrl' | 'avatarEmoji' | 'avatarColor' | 'recentInterests' | 'alwaysInterests' | 'welcomeTopics' | 'privacyLevel'>>): Promise<{ user: User | null; error?: string }> {
    await delay(300);
    if (!currentUserId) return { user: null, error: '로그인이 필요합니다.' };
    const user = users.find(u => u.id === currentUserId);
    if (!user) return { user: null, error: '유저를 찾을 수 없습니다.' };

    if (updates.displayName !== undefined) user.displayName = updates.displayName;
    if (updates.bio !== undefined) user.bio = updates.bio;
    if (updates.avatarUrl !== undefined) user.avatarUrl = updates.avatarUrl;
    if (updates.avatarEmoji !== undefined) user.avatarEmoji = updates.avatarEmoji;
    if (updates.avatarColor !== undefined) user.avatarColor = updates.avatarColor;
    if (updates.recentInterests !== undefined) user.recentInterests = updates.recentInterests;
    if (updates.alwaysInterests !== undefined) user.alwaysInterests = updates.alwaysInterests;
    if (updates.welcomeTopics !== undefined) user.welcomeTopics = updates.welcomeTopics;
    if (updates.privacyLevel !== undefined) user.privacyLevel = updates.privacyLevel;

    return { user };
  },

  async getUserById(userId: string): Promise<User | null> {
    await delay(200);
    return users.find(u => u.id === userId) ?? null;
  },

  async getUserByShareLink(shareLink: string): Promise<User | null> {
    await delay(200);
    return users.find(u => u.shareLink === shareLink) ?? null;
  },

  async toggleOnlineStatus(isOnline: boolean): Promise<void> {
    await delay(100);
    if (!currentUserId) return;
    const user = users.find(u => u.id === currentUserId);
    if (user) {
      user.isOnline = isOnline;
      user.lastSeen = new Date().toISOString();
    }
  },
};

// ==========================================
// Discover
// ==========================================
export const mockDiscover = {
  async getOnlineUsers(): Promise<DiscoverItem[]> {
    await delay(400);
    const me = await mockAuth.getCurrentUser();
    const myRecent = me?.recentInterests ?? [];
    const myAlways = me?.alwaysInterests ?? [];
    const myAllInterests = [...myRecent, ...myAlways];

    return users
      .filter(u => u.id !== currentUserId && u.isOnline && u.privacyLevel !== 'PRIVATE')
      .map(u => {
        const theirAll = [...u.recentInterests, ...u.alwaysInterests];
        const commonCount = theirAll.filter(id => myAllInterests.includes(id)).length;
        const latestSnap = snapshots
          .filter(s => s.userId === u.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;

        return {
          userId: u.id,
          displayName: u.displayName,
          avatarUrl: u.avatarUrl,
          bio: u.bio,
          recentInterests: u.recentInterests,
          alwaysInterests: u.alwaysInterests,
          isOnline: u.isOnline,
          lastSeen: u.lastSeen,
          commonInterestCount: commonCount,
          latestSnapshot: latestSnap,
        };
      })
      .sort((a, b) => b.commonInterestCount - a.commonInterestCount);
  },

  async getAllUsers(): Promise<DiscoverItem[]> {
    await delay(400);
    const me = await mockAuth.getCurrentUser();
    const myAllInterests = [...(me?.recentInterests ?? []), ...(me?.alwaysInterests ?? [])];

    return users
      .filter(u => u.id !== currentUserId && u.privacyLevel !== 'PRIVATE')
      .map(u => {
        const theirAll = [...u.recentInterests, ...u.alwaysInterests];
        const commonCount = theirAll.filter(id => myAllInterests.includes(id)).length;
        const latestSnap = snapshots
          .filter(s => s.userId === u.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;

        return {
          userId: u.id,
          displayName: u.displayName,
          avatarUrl: u.avatarUrl,
          bio: u.bio,
          recentInterests: u.recentInterests,
          alwaysInterests: u.alwaysInterests,
          isOnline: u.isOnline,
          lastSeen: u.lastSeen,
          commonInterestCount: commonCount,
          latestSnapshot: latestSnap,
        };
      })
      .sort((a, b) => b.commonInterestCount - a.commonInterestCount);
  },
};

// ==========================================
// Snapshots
// ==========================================
export const mockSnapshots = {
  async getMySnapshots(): Promise<Snapshot[]> {
    await delay(200);
    if (!currentUserId) return [];
    return snapshots
      .filter(s => s.userId === currentUserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getUserSnapshots(userId: string): Promise<Snapshot[]> {
    await delay(200);
    return snapshots
      .filter(s => s.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async addSnapshot(caption: string | null): Promise<Snapshot> {
    await delay(500);
    const snap: Snapshot = {
      id: genId(),
      userId: currentUserId!,
      imageUrl: `https://picsum.photos/seed/${Date.now()}/400/300`,
      caption,
      createdAt: new Date().toISOString(),
    };
    snapshots.push(snap);
    return snap;
  },

  async deleteSnapshot(snapId: string): Promise<void> {
    await delay(200);
    snapshots = snapshots.filter(s => s.id !== snapId);
  },

  async updateCaption(snapId: string, caption: string | null): Promise<Snapshot | null> {
    await delay(200);
    const snap = snapshots.find(s => s.id === snapId);
    if (!snap) return null;
    snap.caption = caption;
    return { ...snap };
  },

  async getSnapshotCount(userId: string): Promise<number> {
    await delay(50);
    return snapshots.filter(s => s.userId === userId).length;
  },
};

// ==========================================
// Notifications
// ==========================================
export const mockNotifications = {
  async getNotifications(): Promise<AppNotification[]> {
    await delay(200);
    if (!currentUserId) return [];
    return notifications
      .filter(n => n.userId === currentUserId || n.userId === '')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async markAsRead(notifId: string): Promise<void> {
    await delay(100);
    const n = notifications.find(x => x.id === notifId);
    if (n) n.isRead = true;
  },

  async markAllAsRead(): Promise<void> {
    await delay(100);
    notifications.forEach(n => {
      if (n.userId === currentUserId || n.userId === '') {
        n.isRead = true;
      }
    });
  },

  async getUnreadCount(): Promise<number> {
    if (!currentUserId) return 0;
    return notifications.filter(
      n => (n.userId === currentUserId || n.userId === '') && !n.isRead
    ).length;
  },

  async deleteNotification(notifId: string): Promise<void> {
    await delay(100);
    notifications = notifications.filter(n => n.id !== notifId);
  },

  async deleteAllRead(): Promise<void> {
    await delay(100);
    notifications = notifications.filter(
      n => !n.isRead || !((n.userId === currentUserId) || n.userId === ''),
    );
  },

  async addProfileViewNotification(viewerName: string, fromUserId: string): Promise<void> {
    if (!currentUserId) return;
    notifications.push({
      id: genId(),
      userId: currentUserId,
      type: 'PROFILE_VIEW',
      title: '프로필 열람',
      message: `${viewerName}님이 프로필을 열람했어요`,
      isRead: false,
      fromUserId,
      createdAt: new Date().toISOString(),
    });
  },
};

// ==========================================
// Profile View (열람 기록)
// ==========================================
export const mockProfileView = {
  async recordView(profileId: string): Promise<void> {
    await delay(100);
    if (!currentUserId || currentUserId === profileId) return;
    const me = await mockAuth.getCurrentUser();
    if (me) {
      // 상대방에게 열람 알림
      const target = users.find(u => u.id === profileId);
      if (target) {
        notifications.push({
          id: genId(),
          userId: profileId,
          type: 'PROFILE_VIEW',
          title: '프로필 열람',
          message: `${me.displayName}님이 프로필을 열람했어요`,
          isRead: false,
          fromUserId: currentUserId,
          createdAt: new Date().toISOString(),
        });
      }
    }
  },
};
// ==========================================
// Connections (친구/연결)
// ==========================================
export const mockConnections = {
  /** 연결 요청 보내기 */
  async sendRequest(toUserId: string, message?: string): Promise<{ error?: string }> {
    await delay(300);
    if (!currentUserId) return { error: '로그인이 필요합니다' };
    if (currentUserId === toUserId) return { error: '자신에게 요청할 수 없어요' };

    // 이미 요청 있는지 확인
    const existing = connections.find(
      c => (c.fromUserId === currentUserId && c.toUserId === toUserId) ||
           (c.fromUserId === toUserId && c.toUserId === currentUserId),
    );
    if (existing) {
      if (existing.status === 'ACCEPTED') return { error: '이미 연결된 사용자예요' };
      if (existing.status === 'PENDING') return { error: '이미 요청을 보냈어요' };
    }

    const me = users.find(u => u.id === currentUserId);
    const target = users.find(u => u.id === toUserId);
    if (!me || !target) return { error: '사용자를 찾을 수 없어요' };

    connections.push({
      id: genId(),
      fromUserId: currentUserId,
      toUserId,
      fromUserName: me.displayName,
      toUserName: target.displayName,
      status: 'PENDING',
      message,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 상대방에게 알림
    notifications.push({
      id: genId(),
      userId: toUserId,
      type: 'NEW_MATCH',
      title: '연결 요청',
      message: `${me.displayName}님이 연결을 요청했어요`,
      isRead: false,
      fromUserId: currentUserId,
      createdAt: new Date().toISOString(),
    });

    return {};
  },

  /** 요청 수락 */
  async acceptRequest(requestId: string): Promise<void> {
    await delay(200);
    const req = connections.find(c => c.id === requestId);
    if (req) {
      req.status = 'ACCEPTED';
      req.updatedAt = new Date().toISOString();

      // 요청자에게 알림
      const me = users.find(u => u.id === currentUserId);
      notifications.push({
        id: genId(),
        userId: req.fromUserId,
        type: 'NEW_MATCH',
        title: '연결 수락! 🎉',
        message: `${me?.displayName ?? '사용자'}님이 연결 요청을 수락했어요`,
        isRead: false,
        fromUserId: currentUserId ?? '',
        createdAt: new Date().toISOString(),
      });
    }
  },

  /** 요청 거절 */
  async rejectRequest(requestId: string): Promise<void> {
    await delay(200);
    const req = connections.find(c => c.id === requestId);
    if (req) {
      req.status = 'REJECTED';
      req.updatedAt = new Date().toISOString();
    }
  },

  /** 연결 끊기 */
  async disconnect(userId: string): Promise<void> {
    await delay(200);
    connections = connections.filter(
      c => !((c.fromUserId === currentUserId && c.toUserId === userId) ||
             (c.fromUserId === userId && c.toUserId === currentUserId)),
    );
  },

  /** 내게 온 대기 중 요청 목록 */
  async getPendingRequests(): Promise<ConnectionRequest[]> {
    await delay(200);
    if (!currentUserId) return [];
    return connections.filter(
      c => c.toUserId === currentUserId && c.status === 'PENDING',
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /** 내가 보낸 대기 중 요청 */
  async getSentRequests(): Promise<ConnectionRequest[]> {
    await delay(200);
    if (!currentUserId) return [];
    return connections.filter(
      c => c.fromUserId === currentUserId && c.status === 'PENDING',
    );
  },

  /** 연결된 사용자 목록 */
  async getConnections(): Promise<ConnectedUser[]> {
    await delay(200);
    if (!currentUserId) return [];
    const myInterests = (() => {
      const me = users.find(u => u.id === currentUserId);
      return me ? [...me.recentInterests, ...me.alwaysInterests] : [];
    })();

    return connections
      .filter(c => c.status === 'ACCEPTED' && (c.fromUserId === currentUserId || c.toUserId === currentUserId))
      .map(c => {
        const otherId = c.fromUserId === currentUserId ? c.toUserId : c.fromUserId;
        const other = users.find(u => u.id === otherId);
        if (!other) return null;
        const theirInterests = [...other.recentInterests, ...other.alwaysInterests];
        return {
          userId: other.id,
          displayName: other.displayName,
          avatarUrl: other.avatarUrl,
          bio: other.bio,
          isOnline: other.isOnline,
          commonInterestCount: theirInterests.filter(id => myInterests.includes(id)).length,
          connectedAt: c.updatedAt,
        };
      })
      .filter(Boolean) as ConnectedUser[];
  },

  /** 특정 사용자와의 연결 상태 확인 */
  async getConnectionStatus(userId: string): Promise<{ status: 'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'CONNECTED'; requestId?: string }> {
    await delay(100);
    if (!currentUserId) return { status: 'NONE' };
    const conn = connections.find(
      c => (c.fromUserId === currentUserId && c.toUserId === userId) ||
           (c.fromUserId === userId && c.toUserId === currentUserId),
    );
    if (!conn) return { status: 'NONE' };
    if (conn.status === 'ACCEPTED') return { status: 'CONNECTED', requestId: conn.id };
    if (conn.status === 'PENDING') {
      if (conn.fromUserId === currentUserId) return { status: 'PENDING_SENT', requestId: conn.id };
      return { status: 'PENDING_RECEIVED', requestId: conn.id };
    }
    return { status: 'NONE' };
  },

  /** 연결 수 */
  async getConnectionCount(): Promise<number> {
    if (!currentUserId) return 0;
    return connections.filter(
      c => c.status === 'ACCEPTED' && (c.fromUserId === currentUserId || c.toUserId === currentUserId),
    ).length;
  },

  /** 대기 요청 수 */
  async getPendingCount(): Promise<number> {
    if (!currentUserId) return 0;
    return connections.filter(
      c => c.toUserId === currentUserId && c.status === 'PENDING',
    ).length;
  },
};

// ==========================================
// Chat / Messaging
// ==========================================

// 자동 응답 메시지 풀
const AUTO_REPLIES = [
  '오 재미있네요! 😊',
  '저도 그 생각했어요!',
  '좋은 하루 보내세요~ 🌟',
  '그거 정말 좋죠!',
  '맞아요 맞아요 ㅎㅎ',
  '다음에 같이 해봐요!',
  '우와 정말요? 대박',
  'ㅋㅋㅋ 완전 공감',
  '궁금하긴 했어요!',
  '좋은 얘기네요 👍',
];

export const mockChat = {
  /** 대화방 가져오기 또는 생성 */
  async getOrCreateConversation(otherUserId: string): Promise<Conversation> {
    await delay(200);
    if (!currentUserId) throw new Error('Not logged in');

    // 기존 대화방 찾기
    const existing = conversations.find(
      c => c.participantIds.includes(currentUserId!) && c.participantIds.includes(otherUserId),
    );
    if (existing) return existing;

    // 새 대화방 생성
    const conv: Conversation = {
      id: genId(),
      participantIds: [currentUserId, otherUserId],
      lastMessage: null,
      unreadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    conversations.push(conv);
    return conv;
  },

  /** 대화 목록 (최근순) */
  async getConversations(): Promise<(Conversation & { otherUser: { id: string; displayName: string; avatarUrl: string | null; isOnline: boolean } })[]> {
    await delay(300);
    if (!currentUserId) return [];

    return conversations
      .filter(c => c.participantIds.includes(currentUserId!))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .map(c => {
        const otherId = c.participantIds.find(id => id !== currentUserId)!;
        const other = users.find(u => u.id === otherId);
        // 현재 사용자 기준 안읽은 수 계산
        const unread = chatMessages.filter(
          m => m.conversationId === c.id && m.senderId !== currentUserId && !m.readAt,
        ).length;
        return {
          ...c,
          unreadCount: unread,
          otherUser: {
            id: otherId,
            displayName: other?.displayName ?? '알 수 없음',
            avatarUrl: other?.avatarUrl ?? null,
            isOnline: other?.isOnline ?? false,
          },
        };
      })
      .filter(c => c.lastMessage !== null); // 메시지가 있는 대화만
  },

  /** 메시지 목록 (오래된 순) */
  async getMessages(conversationId: string, limit = 50): Promise<ChatMessage[]> {
    await delay(200);
    return chatMessages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(-limit);
  },

  /** 메시지 전송 (자동 응답 포함) */
  async sendMessage(conversationId: string, text: string): Promise<ChatMessage> {
    await delay(150);
    if (!currentUserId) throw new Error('Not logged in');

    const msg: ChatMessage = {
      id: genId(),
      conversationId,
      senderId: currentUserId,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      readAt: null,
      reactions: [],
    };
    chatMessages.push(msg);

    // 대화방 업데이트
    const conv = conversations.find(c => c.id === conversationId);
    if (conv) {
      conv.lastMessage = msg;
      conv.updatedAt = msg.createdAt;
    }

    // 1~3초 후 자동 응답
    const otherId = conv?.participantIds.find(id => id !== currentUserId);
    if (otherId) {
      setTimeout(() => {
        const reply: ChatMessage = {
          id: genId(),
          conversationId,
          senderId: otherId,
          text: AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)],
          createdAt: new Date().toISOString(),
          readAt: null,
          reactions: [],
        };
        chatMessages.push(reply);
        if (conv) {
          conv.lastMessage = reply;
          conv.updatedAt = reply.createdAt;
        }
      }, 1000 + Math.random() * 2000);
    }

    return msg;
  },

  /** 대화방 메시지 모두 읽음 처리 */
  async markAsRead(conversationId: string): Promise<void> {
    await delay(100);
    if (!currentUserId) return;
    chatMessages
      .filter(m => m.conversationId === conversationId && m.senderId !== currentUserId && !m.readAt)
      .forEach(m => { m.readAt = new Date().toISOString(); });
  },

  /** 전체 안읽은 메시지 수 */
  async getTotalUnread(): Promise<number> {
    if (!currentUserId) return 0;
    const myConvIds = conversations
      .filter(c => c.participantIds.includes(currentUserId!))
      .map(c => c.id);
    return chatMessages.filter(
      m => myConvIds.includes(m.conversationId) && m.senderId !== currentUserId && !m.readAt,
    ).length;
  },

  /** 메시지에 리액션 추가/토글 */
  async toggleReaction(messageId: string, emoji: string): Promise<ChatMessage> {
    await delay(100);
    if (!currentUserId) throw new Error('Not logged in');

    const msg = chatMessages.find(m => m.id === messageId);
    if (!msg) throw new Error('Message not found');

    // reactions 배열이 없으면 초기화
    if (!msg.reactions) msg.reactions = [];

    const existingIdx = msg.reactions.findIndex(
      r => r.emoji === emoji && r.userId === currentUserId,
    );

    if (existingIdx >= 0) {
      // 이미 있으면 제거 (토글)
      msg.reactions.splice(existingIdx, 1);
    } else {
      // 없으면 추가
      const currentUser = users.find(u => u.id === currentUserId);
      const reaction: MessageReaction = {
        emoji,
        userId: currentUserId,
        displayName: currentUser?.displayName ?? '나',
        createdAt: new Date().toISOString(),
      };
      msg.reactions.push(reaction);
    }

    return { ...msg };
  },

  /** 메시지의 리액션 목록 */
  async getReactions(messageId: string): Promise<MessageReaction[]> {
    await delay(50);
    const msg = chatMessages.find(m => m.id === messageId);
    return msg?.reactions ?? [];
  },
};

// ==========================================
// Activity Stats
// ==========================================

export const mockStats = {
  /** 활동 통계 조회 */
  async getStats(): Promise<ActivityStats> {
    await delay(400);
    if (!currentUserId) {
      throw new Error('Not logged in');
    }

    const me = users.find(u => u.id === currentUserId);
    const now = new Date();

    // 최근 7일 프로필 조회수 (시뮬레이션)
    const profileViewsDaily: DailyCount[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      // 랜덤 조회수 (2~15)
      profileViewsDaily.push({
        date: dateStr,
        count: Math.floor(Math.random() * 14) + 2,
      });
    }

    const totalViews = profileViewsDaily.reduce((s, d) => s + d.count, 0);
    const prevWeekViews = Math.floor(totalViews * (0.7 + Math.random() * 0.6));
    const trend = prevWeekViews > 0 ? Math.round(((totalViews - prevWeekViews) / prevWeekViews) * 100) : 0;

    // 연결 통계
    const myConnections = connections.filter(
      c => c.status === 'ACCEPTED' && (c.fromUserId === currentUserId || c.toUserId === currentUserId),
    );
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const newThisWeek = myConnections.filter(
      c => new Date(c.updatedAt) >= oneWeekAgo,
    ).length;

    // 대화 통계
    const myConvs = conversations.filter(c => c.participantIds.includes(currentUserId!));
    const myMessages = chatMessages.filter(m => m.senderId === currentUserId);
    const receivedMessages = chatMessages.filter(
      m => m.senderId !== currentUserId && myConvs.some(c => c.id === m.conversationId),
    );

    // 인기 관심사 (조회수 시뮬레이션)
    const allInterests = [...(me?.recentInterests ?? []), ...(me?.alwaysInterests ?? [])];
    const topInterests = allInterests.slice(0, 5).map(id => ({
      interestId: id,
      viewCount: Math.floor(Math.random() * 20) + 5,
    })).sort((a, b) => b.viewCount - a.viewCount);

    // 가입 일수
    const joinedDaysAgo = me
      ? Math.floor((now.getTime() - new Date(me.createdAt).getTime()) / (24 * 60 * 60 * 1000))
      : 0;

    return {
      profileViews: totalViews,
      profileViewsTrend: trend,
      profileViewsDaily,
      totalConnections: myConnections.length,
      newConnectionsThisWeek: newThisWeek,
      totalConversations: myConvs.filter(c => c.lastMessage !== null).length,
      messagesSent: myMessages.length,
      messagesReceived: receivedMessages.length,
      topInterests,
      joinedDaysAgo,
    };
  },
};

// ==========================================
// Safety (차단/신고)
// ==========================================
export const mockSafety = {
  /** 사용자 차단 */
  async blockUser(targetUserId: string): Promise<{ success: boolean; error?: string }> {
    await delay();
    if (!currentUserId) return { success: false, error: '로그인이 필요합니다.' };
    if (targetUserId === currentUserId) return { success: false, error: '자기 자신을 차단할 수 없습니다.' };

    const already = blockedPairs.find(
      bp => bp.blockerId === currentUserId && bp.blockedId === targetUserId,
    );
    if (already) return { success: false, error: '이미 차단된 사용자입니다.' };

    blockedPairs.push({
      blockerId: currentUserId,
      blockedId: targetUserId,
      blockedAt: new Date().toISOString(),
    });

    // 연결도 자동 삭제
    connections = connections.filter(
      c => !(
        (c.fromUserId === currentUserId && c.toUserId === targetUserId) ||
        (c.fromUserId === targetUserId && c.toUserId === currentUserId)
      ),
    );

    return { success: true };
  },

  /** 차단 해제 */
  async unblockUser(targetUserId: string): Promise<{ success: boolean }> {
    await delay();
    blockedPairs = blockedPairs.filter(
      bp => !(bp.blockerId === currentUserId && bp.blockedId === targetUserId),
    );
    return { success: true };
  },

  /** 차단 목록 조회 */
  async getBlockedUsers(): Promise<BlockedUser[]> {
    await delay();
    if (!currentUserId) return [];
    const myBlocks = blockedPairs.filter(bp => bp.blockerId === currentUserId);
    return myBlocks.map(bp => {
      const u = users.find(u => u.id === bp.blockedId);
      return {
        userId: bp.blockedId,
        displayName: u?.displayName ?? '알 수 없음',
        avatarUrl: u?.avatarUrl ?? null,
        blockedAt: bp.blockedAt,
      };
    });
  },

  /** 차단 여부 확인 */
  async isBlocked(targetUserId: string): Promise<boolean> {
    await delay(100);
    if (!currentUserId) return false;
    return blockedPairs.some(
      bp => bp.blockerId === currentUserId && bp.blockedId === targetUserId,
    );
  },

  /** 사용자가 나를 차단했는지 확인 */
  async isBlockedByUser(targetUserId: string): Promise<boolean> {
    await delay(100);
    if (!currentUserId) return false;
    return blockedPairs.some(
      bp => bp.blockerId === targetUserId && bp.blockedId === currentUserId,
    );
  },

  /** 특정 사용자가 차단된 사용자인지 (양방향) */
  async isBlockedEither(targetUserId: string): Promise<boolean> {
    await delay(100);
    if (!currentUserId) return false;
    return blockedPairs.some(
      bp =>
        (bp.blockerId === currentUserId && bp.blockedId === targetUserId) ||
        (bp.blockerId === targetUserId && bp.blockedId === currentUserId),
    );
  },

  /** 차단된 사용자 ID 목록 (필터링용) */
  async getBlockedUserIds(): Promise<string[]> {
    await delay(50);
    if (!currentUserId) return [];
    return blockedPairs
      .filter(bp => bp.blockerId === currentUserId || bp.blockedId === currentUserId)
      .map(bp => bp.blockerId === currentUserId ? bp.blockedId : bp.blockerId);
  },

  /** 신고 접수 */
  async reportUser(
    targetUserId: string,
    reason: ReportReason,
    detail?: string,
  ): Promise<{ success: boolean; error?: string }> {
    await delay(400);
    if (!currentUserId) return { success: false, error: '로그인이 필요합니다.' };
    if (targetUserId === currentUserId) return { success: false, error: '자기 자신을 신고할 수 없습니다.' };

    reports.push({
      id: genId(),
      reporterId: currentUserId,
      targetUserId,
      reason,
      detail,
      createdAt: new Date().toISOString(),
    });

    return { success: true };
  },
};

// ========== 관심사 트렌드 & 추천 ==========
export const mockInterestTrends = {
  /** 트렌딩 관심사 — 사용자들 사이에서 인기 있는 관심사 */
  async getTrending(): Promise<TrendingInterest[]> {
    await delay(200);

    // 모든 사용자 관심사를 집계
    const countMap: Record<string, number> = {};
    for (const u of users) {
      for (const id of [...u.recentInterests, ...u.alwaysInterests]) {
        countMap[id] = (countMap[id] || 0) + 1;
      }
    }

    // INTERESTS에 있는 것만 필터 + 정렬
    const trending: TrendingInterest[] = Object.entries(countMap)
      .filter(([id]) => getInterestById(id))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([interestId, userCount], idx) => ({
        interestId,
        userCount,
        trend: (idx < 2 ? 'hot' : idx < 5 ? 'rising' : 'steady') as InterestTrend,
      }));

    return trending;
  },

  /** 연결된 친구 기반 관심사 추천 */
  async getRecommendedForMe(): Promise<InterestRecommendation[]> {
    await delay(250);
    if (!currentUserId) return [];

    const me = users.find(u => u.id === currentUserId);
    if (!me) return [];

    const myInterests = new Set([...me.recentInterests, ...me.alwaysInterests]);

    // 연결된 친구 찾기
    const acceptedConns = connections.filter(
      c => c.status === 'ACCEPTED' &&
        (c.fromUserId === currentUserId || c.toUserId === currentUserId),
    );
    const friendIds = acceptedConns.map(c =>
      c.fromUserId === currentUserId ? c.toUserId : c.fromUserId,
    );

    // 친구 없으면 모든 사용자의 관심사로 추천
    const sourceUsers = friendIds.length > 0
      ? users.filter(u => friendIds.includes(u.id))
      : users.filter(u => u.id !== currentUserId);

    // 내가 아직 선택하지 않은 관심사 집계
    const recommendMap: Record<string, { count: number; names: string[] }> = {};

    for (const u of sourceUsers) {
      for (const id of [...u.recentInterests, ...u.alwaysInterests]) {
        if (myInterests.has(id)) continue;
        if (!getInterestById(id)) continue;
        if (!recommendMap[id]) recommendMap[id] = { count: 0, names: [] };
        recommendMap[id].count++;
        if (!recommendMap[id].names.includes(u.displayName)) {
          recommendMap[id].names.push(u.displayName);
        }
      }
    }

    const recommendations: InterestRecommendation[] = Object.entries(recommendMap)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 8)
      .map(([interestId, data]) => {
        const namePreview = data.names.slice(0, 2).join(', ');
        const extra = data.names.length > 2 ? ` 외 ${data.names.length - 2}명` : '';
        const reason = friendIds.length > 0
          ? `${namePreview}${extra}님이 관심`
          : `${data.count}명의 사용자가 관심`;

        return {
          interestId,
          reason,
          matchedUserCount: data.count,
        };
      });

    return recommendations;
  },

  /** 특정 관심사의 인기도 점수 (0~100) */
  async getPopularity(interestId: string): Promise<number> {
    await delay(50);
    let count = 0;
    for (const u of users) {
      if (u.recentInterests.includes(interestId) || u.alwaysInterests.includes(interestId)) {
        count++;
      }
    }
    return Math.min(100, Math.round((count / Math.max(users.length, 1)) * 100));
  },
};

// ========== 소셜 피드 ==========
export const mockFeed = {
  /** 타임라인 피드 (내 활동 + 연결된 친구 활동) */
  async getFeed(): Promise<FeedItem[]> {
    await delay(300);
    if (!currentUserId) return [];

    // 차단된 유저 제외
    const blockedIds = new Set(
      blockedPairs
        .filter(bp => bp.blockerId === currentUserId || bp.blockedId === currentUserId)
        .map(bp => bp.blockerId === currentUserId ? bp.blockedId : bp.blockerId),
    );

    // 연결된 친구 ID
    const acceptedConns = connections.filter(
      c => c.status === 'ACCEPTED' &&
        (c.fromUserId === currentUserId || c.toUserId === currentUserId),
    );
    const friendIds = new Set(
      acceptedConns.map(c =>
        c.fromUserId === currentUserId ? c.toUserId : c.fromUserId,
      ),
    );

    // 피드에 포함할 사용자 (본인 + 친구 + 온라인 사용자 일부)
    const feedUserIds = new Set([currentUserId, ...friendIds]);
    users
      .filter(u => u.isOnline && !blockedIds.has(u.id))
      .slice(0, 3)
      .forEach(u => feedUserIds.add(u.id));

    const items: FeedItem[] = [];

    // 1. 스냅샷 피드
    for (const snap of snapshots) {
      if (!feedUserIds.has(snap.userId) || blockedIds.has(snap.userId)) continue;
      const u = users.find(x => x.id === snap.userId);
      if (!u) continue;
      items.push({
        id: `feed-snap-${snap.id}`,
        type: 'SNAPSHOT_POSTED',
        userId: u.id,
        userName: u.displayName,
        avatarEmoji: u.avatarEmoji,
        avatarColor: u.avatarColor,
        timestamp: snap.createdAt,
        snapshot: snap,
      });
    }

    // 2. 연결 성사 피드
    for (const conn of acceptedConns) {
      if (blockedIds.has(conn.fromUserId) || blockedIds.has(conn.toUserId)) continue;
      const fromUser = users.find(x => x.id === conn.fromUserId);
      const toUser = users.find(x => x.id === conn.toUserId);
      if (!fromUser || !toUser) continue;

      const isMe = conn.fromUserId === currentUserId || conn.toUserId === currentUserId;
      const actorId = isMe ? currentUserId : conn.fromUserId;
      const actor = users.find(x => x.id === actorId);
      const other = actorId === conn.fromUserId ? toUser : fromUser;

      if (actor) {
        items.push({
          id: `feed-conn-${conn.id}`,
          type: 'CONNECTION_MADE',
          userId: actor.id,
          userName: actor.displayName,
          avatarEmoji: actor.avatarEmoji,
          avatarColor: actor.avatarColor,
          timestamp: conn.updatedAt,
          connectedUserName: other.displayName,
        });
      }
    }

    // 3. 사용자 가입 피드 (최근 가입자)
    const recentUsers = users
      .filter(u => feedUserIds.has(u.id) && !blockedIds.has(u.id) && u.id !== currentUserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);

    for (const u of recentUsers) {
      items.push({
        id: `feed-join-${u.id}`,
        type: 'USER_JOINED',
        userId: u.id,
        userName: u.displayName,
        avatarEmoji: u.avatarEmoji,
        avatarColor: u.avatarColor,
        timestamp: u.createdAt,
      });
    }

    // 4. 관심사 변경 피드 (온라인 사용자)
    const onlineOthers = users
      .filter(u => u.isOnline && u.id !== currentUserId && !blockedIds.has(u.id))
      .slice(0, 4);

    for (const u of onlineOthers) {
      if (u.recentInterests.length > 0) {
        items.push({
          id: `feed-interest-${u.id}`,
          type: 'INTEREST_UPDATED',
          userId: u.id,
          userName: u.displayName,
          avatarEmoji: u.avatarEmoji,
          avatarColor: u.avatarColor,
          timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          updatedInterests: u.recentInterests.slice(0, 3),
        });
      }
    }

    // 시간순 정렬 (최신 먼저)
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return items;
  },
};

// ==========================================
// Compatibility — 호환도 점수 계산
// ==========================================
export const mockCompatibility = {
  /** 두 사용자 간 호환도 점수 산출 */
  async getScore(targetUserId: string): Promise<CompatibilityScore | null> {
    await delay(400);
    if (!currentUserId) return null;

    const me = users.find(u => u.id === currentUserId);
    const target = users.find(u => u.id === targetUserId);
    if (!me || !target) return null;

    // 1. 관심사 교집합 (alwaysInterests 가중 1.5x, recentInterests 1.0x)
    const myAll = new Set([...me.recentInterests, ...me.alwaysInterests]);
    const theirAll = new Set([...target.recentInterests, ...target.alwaysInterests]);
    const myAlwaysSet = new Set(me.alwaysInterests);
    const theirAlwaysSet = new Set(target.alwaysInterests);

    const commonInterests: string[] = [];
    for (const id of myAll) {
      if (theirAll.has(id)) commonInterests.push(id);
    }

    // 가중 관심사 점수
    let interestWeight = 0;
    let maxWeight = 0;
    for (const id of myAll) {
      const w = myAlwaysSet.has(id) ? 1.5 : 1.0;
      maxWeight += w;
      if (theirAll.has(id)) {
        const tw = theirAlwaysSet.has(id) ? 1.5 : 1.0;
        interestWeight += (w + tw) / 2;
      }
    }
    const interestScore = maxWeight > 0
      ? Math.round(Math.min((interestWeight / maxWeight) * 100, 100))
      : 0;

    // 2. 카테고리 다양성
    const getCategories = (ids: string[]) => {
      const cats = new Set<string>();
      for (const id of ids) {
        const interest = getInterestById(id);
        if (interest) cats.add(interest.category);
      }
      return cats;
    };
    const myCats = getCategories([...me.recentInterests, ...me.alwaysInterests]);
    const theirCats = getCategories([...target.recentInterests, ...target.alwaysInterests]);
    const commonCategories: string[] = [];
    for (const c of myCats) {
      if (theirCats.has(c)) commonCategories.push(c);
    }
    const totalCats = new Set([...myCats, ...theirCats]).size;
    const categoryScore = totalCats > 0
      ? Math.round((commonCategories.length / totalCats) * 100)
      : 0;

    // 3. 카테고리별 상세 breakdown
    const allCats = [...new Set([...myCats, ...theirCats])];
    const categoryBreakdown: CategoryScore[] = allCats.map(cat => {
      const myInCat = [...me.recentInterests, ...me.alwaysInterests].filter(
        id => getInterestById(id)?.category === cat,
      );
      const theirInCat = [...target.recentInterests, ...target.alwaysInterests].filter(
        id => getInterestById(id)?.category === cat,
      );
      const commonInCat = myInCat.filter(id => theirInCat.includes(id));
      const total = new Set([...myInCat, ...theirInCat]).size;
      return {
        category: cat,
        score: total > 0 ? Math.round((commonInCat.length / total) * 100) : 0,
        commonCount: commonInCat.length,
        totalPossible: total,
      };
    }).sort((a, b) => b.score - a.score);

    // 4. 대화 주제 교집합
    const commonTopics = me.welcomeTopics.filter(t =>
      target.welcomeTopics.some(tt => tt.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(tt.toLowerCase())),
    );
    const maxTopics = Math.max(me.welcomeTopics.length, target.welcomeTopics.length, 1);
    const topicScore = Math.round((commonTopics.length / maxTopics) * 100);

    // 5. 종합 점수 (가중 평균)
    const overall = Math.round(
      interestScore * 0.5 + categoryScore * 0.25 + topicScore * 0.25,
    );

    // 라벨 결정
    let label: string;
    let emoji: string;
    if (overall >= 80) { label = '완벽한 매치'; emoji = '💫'; }
    else if (overall >= 60) { label = '좋은 궁합'; emoji = '✨'; }
    else if (overall >= 40) { label = '괜찮은 시작'; emoji = '🌱'; }
    else if (overall >= 20) { label = '새로운 발견'; emoji = '🔍'; }
    else { label = '탐색해 보세요'; emoji = '🌈'; }

    return {
      overall,
      interestScore,
      categoryScore,
      topicScore,
      commonInterests,
      commonCategories,
      commonTopics,
      categoryBreakdown,
      label,
      emoji,
    };
  },

  /** 최고 호환도 유저 목록 (추천) */
  async getTopMatches(limit = 5): Promise<{ userId: string; displayName: string; avatarEmoji: string | null; avatarColor: string | null; score: number; label: string; emoji: string }[]> {
    await delay(400);
    if (!currentUserId) return [];

    const blockedIds = new Set(
      blockedPairs
        .filter(bp => bp.blockerId === currentUserId || bp.blockedId === currentUserId)
        .map(bp => bp.blockerId === currentUserId ? bp.blockedId : bp.blockerId),
    );

    const results: { userId: string; displayName: string; avatarEmoji: string | null; avatarColor: string | null; score: number; label: string; emoji: string }[] = [];

    for (const u of users) {
      if (u.id === currentUserId || blockedIds.has(u.id)) continue;
      const compat = await this.getScore(u.id);
      if (compat) {
        results.push({
          userId: u.id,
          displayName: u.displayName,
          avatarEmoji: u.avatarEmoji,
          avatarColor: u.avatarColor,
          score: compat.overall,
          label: compat.label,
          emoji: compat.emoji,
        });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  },
};

// ==========================================
// Badges — 배지 & 업적
// ==========================================
let unlockedBadges: { badgeId: string; unlockedAt: string }[] = [];

export const mockBadges = {
  /** 배지 달성 조건 체크 & 전체 배지 목록 반환 */
  async getBadges(): Promise<UserBadgeSummary> {
    await delay(350);
    if (!currentUserId) {
      return { totalBadges: BADGE_DEFINITIONS.length, unlockedCount: 0, recentBadge: null, badges: [] };
    }

    const me = users.find(u => u.id === currentUserId);
    if (!me) {
      return { totalBadges: BADGE_DEFINITIONS.length, unlockedCount: 0, recentBadge: null, badges: [] };
    }

    // 조건별 진행도 계산
    const acceptedConns = connections.filter(
      c => c.status === 'ACCEPTED' && (c.fromUserId === currentUserId || c.toUserId === currentUserId),
    );
    const mySnaps = snapshots.filter(s => s.userId === currentUserId);
    const myMessages = chatMessages.filter(m => m.senderId === currentUserId);
    const allInterests = [...me.recentInterests, ...me.alwaysInterests];
    const uniqueCats = new Set(allInterests.map(id => getInterestById(id)?.category).filter(Boolean));
    const hasCustomAvatar = !!me.avatarEmoji;
    const profilePct = _calcProfilePct(me);
    const profileViews = notifications.filter(n => n.type === 'PROFILE_VIEW' && n.userId === currentUserId).length + 12; // 기본 뷰 추가
    const daysSinceJoin = Math.floor((Date.now() - new Date(me.createdAt).getTime()) / 86400000);

    const conditionMap: Record<string, { progress: number; met: boolean }> = {
      first_connection: { progress: Math.min(acceptedConns.length, 1) * 100, met: acceptedConns.length >= 1 },
      social_butterfly: { progress: Math.min(acceptedConns.length / 10, 1) * 100, met: acceptedConns.length >= 10 },
      popular: { progress: Math.min(profileViews / 50, 1) * 100, met: profileViews >= 50 },
      profile_complete: { progress: profilePct, met: profilePct >= 100 },
      snapshot_star: { progress: Math.min(mySnaps.length / 5, 1) * 100, met: mySnaps.length >= 5 },
      avatar_artist: { progress: hasCustomAvatar ? 100 : 0, met: hasCustomAvatar },
      interest_explorer: { progress: Math.min(allInterests.length / 10, 1) * 100, met: allInterests.length >= 10 },
      trend_setter: { progress: Math.min(allInterests.length / 3, 1) * 100, met: allInterests.length >= 3 },
      category_master: { progress: Math.min(uniqueCats.size / 5, 1) * 100, met: uniqueCats.size >= 5 },
      conversation_starter: { progress: Math.min(myMessages.length, 1) * 100, met: myMessages.length >= 1 },
      chatterbox: { progress: Math.min(myMessages.length / 100, 1) * 100, met: myMessages.length >= 100 },
      perfect_match: { progress: 0, met: false }, // 호환도는 별도 체크
      early_bird: { progress: profilePct >= 100 && daysSinceJoin <= 7 ? 100 : Math.min(profilePct, 99), met: profilePct >= 100 && daysSinceJoin <= 7 },
      week_streak: { progress: Math.min(Math.random() * 100, 85), met: false }, // 모의 시뮬레이션
    };

    // perfect_match 체크 (비동기 호환도 계산)
    let hasNinetyMatch = false;
    for (const u of users) {
      if (u.id === currentUserId) continue;
      // 간단 계산: 관심사 교집합 비율
      const theirAll = [...u.recentInterests, ...u.alwaysInterests];
      const common = allInterests.filter(id => theirAll.includes(id));
      const ratio = theirAll.length > 0 ? (common.length / Math.max(allInterests.length, theirAll.length)) * 100 : 0;
      if (ratio >= 90) { hasNinetyMatch = true; break; }
    }
    if (hasNinetyMatch) {
      conditionMap.perfect_match = { progress: 100, met: true };
    } else {
      // 최고 호환도 기준 진행도
      let maxRatio = 0;
      for (const u of users) {
        if (u.id === currentUserId) continue;
        const theirAll = [...u.recentInterests, ...u.alwaysInterests];
        const common = allInterests.filter(id => theirAll.includes(id));
        const ratio = theirAll.length > 0 ? (common.length / Math.max(allInterests.length, theirAll.length)) * 100 : 0;
        if (ratio > maxRatio) maxRatio = ratio;
      }
      conditionMap.perfect_match = { progress: Math.round(Math.min(maxRatio / 90, 1) * 100), met: false };
    }

    // 배지 리스트 생성
    const badges: Badge[] = BADGE_DEFINITIONS.map(def => {
      const cond = conditionMap[def.id] ?? { progress: 0, met: false };
      const existing = unlockedBadges.find(ub => ub.badgeId === def.id);

      // 새로 달성된 경우 기록
      if (cond.met && !existing) {
        unlockedBadges.push({ badgeId: def.id, unlockedAt: new Date().toISOString() });
      }

      const unlocked = existing || (cond.met ? unlockedBadges.find(ub => ub.badgeId === def.id) : null);

      return {
        ...def,
        progress: Math.round(cond.progress),
        unlockedAt: unlocked?.unlockedAt ?? null,
      };
    });

    const unlocked = badges.filter(b => b.unlockedAt);
    const sorted = [...unlocked].sort((a, b) =>
      new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime(),
    );

    return {
      totalBadges: BADGE_DEFINITIONS.length,
      unlockedCount: unlocked.length,
      recentBadge: sorted[0] ?? null,
      badges,
    };
  },

  /** 새로 달성된 배지만 반환 (축하 모달용) */
  async checkNewBadges(): Promise<Badge[]> {
    const prevIds = new Set(unlockedBadges.map(ub => ub.badgeId));
    const summary = await this.getBadges();
    return summary.badges.filter(b => b.unlockedAt && !prevIds.has(b.id));
  },
};

// 프로필 완성도 계산 (ProfileCompletionGuide와 동일 로직)
function _calcProfilePct(user: User): number {
  let filled = 0;
  let total = 5;
  if (user.displayName) filled++;
  if (user.bio) filled++;
  if (user.recentInterests.length > 0) filled++;
  if (user.alwaysInterests.length > 0) filled++;
  if (user.welcomeTopics.length > 0 && user.welcomeTopics.some(t => t.trim())) filled++;
  return Math.round((filled / total) * 100);
}

// ==========================================
// Groups — 관심사 기반 그룹
// ==========================================
const GROUP_COLORS = ['#3B82F6', '#EF4444', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

let groups: InterestGroup[] = [
  {
    id: 'grp-1', name: '영화 마니아', description: '최신 영화부터 클래식까지 함께 이야기해요',
    emoji: '🎬', color: '#EF4444', interestIds: ['movies', 'animation', 'drama'],
    ownerId: 'user-2', memberCount: 23, maxMembers: 50, isPublic: true,
    createdAt: '2026-01-15T09:00:00Z',
  },
  {
    id: 'grp-2', name: '코딩 모임', description: '개발 이야기와 사이드 프로젝트 공유',
    emoji: '💻', color: '#3B82F6', interestIds: ['coding', 'ai', 'startup'],
    ownerId: 'user-3', memberCount: 41, maxMembers: 50, isPublic: true,
    createdAt: '2026-01-20T12:00:00Z',
  },
  {
    id: 'grp-3', name: '여행 버디', description: '여행 계획과 후기를 나눠요 ✈️',
    emoji: '✈️', color: '#22C55E', interestIds: ['travel', 'photography', 'food'],
    ownerId: 'user-4', memberCount: 18, maxMembers: 30, isPublic: true,
    createdAt: '2026-01-25T15:00:00Z',
  },
  {
    id: 'grp-4', name: '음악 감상실', description: '좋은 음악을 함께 듣고 공유해요',
    emoji: '🎵', color: '#8B5CF6', interestIds: ['music', 'concert', 'kpop'],
    ownerId: 'user-5', memberCount: 35, maxMembers: 50, isPublic: true,
    createdAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'grp-5', name: '독서 클럽', description: '이달의 책을 같이 읽어요 📚',
    emoji: '📚', color: '#F59E0B', interestIds: ['reading', 'writing', 'philosophy'],
    ownerId: 'user-2', memberCount: 12, maxMembers: 20, isPublic: true,
    createdAt: '2026-02-05T08:00:00Z',
  },
  {
    id: 'grp-6', name: '맛집 탐험대', description: '숨은 맛집을 발견하고 공유합니다',
    emoji: '🍽️', color: '#EC4899', interestIds: ['food', 'cooking', 'cafe'],
    ownerId: 'user-3', memberCount: 28, maxMembers: 50, isPublic: true,
    createdAt: '2026-02-08T14:00:00Z',
  },
];

let groupMembers: { groupId: string; userId: string; role: GroupRole; joinedAt: string }[] = [
  { groupId: 'grp-1', userId: 'user-2', role: 'OWNER', joinedAt: '2026-01-15T09:00:00Z' },
  { groupId: 'grp-1', userId: 'user-3', role: 'MEMBER', joinedAt: '2026-01-16T10:00:00Z' },
  { groupId: 'grp-2', userId: 'user-3', role: 'OWNER', joinedAt: '2026-01-20T12:00:00Z' },
  { groupId: 'grp-2', userId: 'user-4', role: 'ADMIN', joinedAt: '2026-01-21T11:00:00Z' },
  { groupId: 'grp-3', userId: 'user-4', role: 'OWNER', joinedAt: '2026-01-25T15:00:00Z' },
  { groupId: 'grp-4', userId: 'user-5', role: 'OWNER', joinedAt: '2026-02-01T10:00:00Z' },
  { groupId: 'grp-5', userId: 'user-2', role: 'OWNER', joinedAt: '2026-02-05T08:00:00Z' },
  { groupId: 'grp-6', userId: 'user-3', role: 'OWNER', joinedAt: '2026-02-08T14:00:00Z' },
];

let groupMessages: GroupMessage[] = [
  { id: 'gm-1', groupId: 'grp-1', senderId: 'user-2', senderName: '김민수', senderEmoji: '😎', text: '오늘 새로 나온 영화 봤어요? 진짜 대박!', createdAt: '2026-02-15T10:00:00Z' },
  { id: 'gm-2', groupId: 'grp-1', senderId: 'user-3', senderName: '이지은', senderEmoji: '🌸', text: '아직 못 봤는데 평점이 엄청 높더라고요', createdAt: '2026-02-15T10:05:00Z' },
  { id: 'gm-3', groupId: 'grp-2', senderId: 'user-3', senderName: '이지은', senderEmoji: '🌸', text: '사이드 프로젝트 같이 하실 분?', createdAt: '2026-02-15T11:00:00Z' },
  { id: 'gm-4', groupId: 'grp-2', senderId: 'user-4', senderName: '박서준', senderEmoji: '🚀', text: '저요! 어떤 프로젝트인가요?', createdAt: '2026-02-15T11:10:00Z' },
  { id: 'gm-5', groupId: 'grp-3', senderId: 'user-4', senderName: '박서준', senderEmoji: '🚀', text: '이번 주말에 제주도 어때요?', createdAt: '2026-02-14T09:00:00Z' },
  { id: 'gm-6', groupId: 'grp-4', senderId: 'user-5', senderName: '최유나', senderEmoji: '🎵', text: '새 앨범 들어보셨나요? 명곡입니다', createdAt: '2026-02-15T08:30:00Z' },
];

export const mockGroups = {
  /** 추천 그룹 (내 관심사 기반 + 전체) */
  async getRecommendedGroups(): Promise<GroupPreview[]> {
    await delay(300);
    const me = users.find(u => u.id === currentUserId);
    const myInterests = me ? [...me.recentInterests, ...me.alwaysInterests] : [];

    return groups
      .map(g => {
        const isMember = groupMembers.some(gm => gm.groupId === g.id && gm.userId === currentUserId);
        const overlap = g.interestIds.filter(id => myInterests.includes(id)).length;
        return { ...g, isMember, _overlap: overlap };
      })
      .sort((a, b) => b._overlap - a._overlap)
      .map(({ _overlap, ownerId, maxMembers, isPublic, description, createdAt, ...rest }) => ({
        ...rest,
        lastActivity: groupMessages
          .filter(m => m.groupId === rest.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.createdAt ?? createdAt ?? new Date().toISOString(),
      }));
  },

  /** 내가 가입한 그룹 */
  async getMyGroups(): Promise<GroupPreview[]> {
    await delay(250);
    const myMemberships = groupMembers.filter(gm => gm.userId === currentUserId);
    return myMemberships
      .map(gm => {
        const g = groups.find(gr => gr.id === gm.groupId);
        if (!g) return null;
        const lastMsg = groupMessages
          .filter(m => m.groupId === g.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        return {
          id: g.id, name: g.name, emoji: g.emoji, color: g.color,
          memberCount: g.memberCount, interestIds: g.interestIds,
          lastActivity: lastMsg?.createdAt ?? g.createdAt,
          isMember: true,
        } as GroupPreview;
      })
      .filter(Boolean) as GroupPreview[];
  },

  /** 그룹 상세 */
  async getGroupDetail(groupId: string): Promise<InterestGroup | null> {
    await delay(250);
    return groups.find(g => g.id === groupId) ?? null;
  },

  /** 그룹 멤버 목록 */
  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    await delay(200);
    const gms = groupMembers.filter(gm => gm.groupId === groupId);
    return gms.map(gm => {
      const u = users.find(usr => usr.id === gm.userId);
      return {
        userId: gm.userId,
        displayName: u?.displayName ?? '알 수 없음',
        avatarEmoji: u?.avatarEmoji ?? null,
        avatarColor: u?.avatarColor ?? null,
        role: gm.role,
        joinedAt: gm.joinedAt,
      };
    });
  },

  /** 그룹 생성 */
  async createGroup(data: { name: string; description: string; emoji: string; interestIds: string[] }): Promise<InterestGroup> {
    await delay(400);
    if (!currentUserId) throw new Error('로그인이 필요합니다');
    const newGroup: InterestGroup = {
      id: genId(),
      name: data.name,
      description: data.description,
      emoji: data.emoji,
      color: GROUP_COLORS[groups.length % GROUP_COLORS.length],
      interestIds: data.interestIds,
      ownerId: currentUserId,
      memberCount: 1,
      maxMembers: 50,
      isPublic: true,
      createdAt: new Date().toISOString(),
    };
    groups.push(newGroup);
    groupMembers.push({
      groupId: newGroup.id, userId: currentUserId,
      role: 'OWNER', joinedAt: newGroup.createdAt,
    });
    return newGroup;
  },

  /** 그룹 가입 */
  async joinGroup(groupId: string): Promise<void> {
    await delay(300);
    if (!currentUserId) throw new Error('로그인이 필요합니다');
    const already = groupMembers.find(gm => gm.groupId === groupId && gm.userId === currentUserId);
    if (already) return;
    groupMembers.push({
      groupId, userId: currentUserId,
      role: 'MEMBER', joinedAt: new Date().toISOString(),
    });
    const g = groups.find(gr => gr.id === groupId);
    if (g) g.memberCount++;
  },

  /** 그룹 탈퇴 */
  async leaveGroup(groupId: string): Promise<void> {
    await delay(300);
    if (!currentUserId) return;
    const idx = groupMembers.findIndex(gm => gm.groupId === groupId && gm.userId === currentUserId);
    if (idx >= 0) {
      groupMembers.splice(idx, 1);
      const g = groups.find(gr => gr.id === groupId);
      if (g && g.memberCount > 0) g.memberCount--;
    }
  },

  /** 그룹 메시지 목록 */
  async getGroupMessages(groupId: string): Promise<GroupMessage[]> {
    await delay(200);
    return groupMessages
      .filter(m => m.groupId === groupId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  /** 그룹 메시지 전송 */
  async sendGroupMessage(groupId: string, text: string): Promise<GroupMessage> {
    await delay(200);
    if (!currentUserId) throw new Error('로그인이 필요합니다');
    const me = users.find(u => u.id === currentUserId);
    const msg: GroupMessage = {
      id: genId(),
      groupId,
      senderId: currentUserId,
      senderName: me?.displayName ?? '나',
      senderEmoji: me?.avatarEmoji ?? null,
      text,
      createdAt: new Date().toISOString(),
    };
    groupMessages.push(msg);
    return msg;
  },

  /** 그룹 검색 */
  async searchGroups(query: string): Promise<GroupPreview[]> {
    await delay(250);
    const q = query.toLowerCase();
    return groups
      .filter(g => g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q))
      .map(g => ({
        id: g.id, name: g.name, emoji: g.emoji, color: g.color,
        memberCount: g.memberCount, interestIds: g.interestIds,
        lastActivity: g.createdAt,
        isMember: groupMembers.some(gm => gm.groupId === g.id && gm.userId === currentUserId),
      }));
  },
};

// ==========================================
// Events & Meetups
// ==========================================
const now = new Date();
const dayMs = 86400000;
const isoFuture = (daysOffset: number, hour = 14) => {
  const d = new Date(now.getTime() + daysOffset * dayMs);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

let events: AppEvent[] = [
  {
    id: 'ev1', title: '주말 보드게임 모임', description: '다양한 보드게임을 함께 즐겨요! 초보자도 환영합니다.',
    emoji: '🎲', date: isoFuture(3, 15), endDate: isoFuture(3, 18), location: '강남 보드게임카페',
    groupId: 'g1', groupName: '보드게임 러버즈', hostId: 'user-me', hostName: '나', hostEmoji: null,
    maxAttendees: 12, attendeeCount: 7, interestIds: ['hobby_board', 'hobby_puzzle'],
    status: 'UPCOMING', createdAt: isoFuture(-2),
  },
  {
    id: 'ev2', title: '인디 음악 감상회', description: '이번 주 인디 신보를 함께 들으며 이야기 나눠요.',
    emoji: '🎵', date: isoFuture(5, 19), endDate: isoFuture(5, 21), location: '홍대 카페 뮤직룸',
    groupId: 'g2', groupName: '인디 음악 감상회', hostId: 'user2', hostName: '지민', hostEmoji: '🎸',
    maxAttendees: 15, attendeeCount: 9, interestIds: ['music_indie', 'music_concert'],
    status: 'UPCOMING', createdAt: isoFuture(-3),
  },
  {
    id: 'ev3', title: '한강 러닝 크루', description: '한강을 따라 5km 러닝! 속도 무관, 함께 달려요.',
    emoji: '🏃', date: isoFuture(1, 7), endDate: isoFuture(1, 9), location: '반포 한강공원 입구',
    groupId: null, groupName: null, hostId: 'user3', hostName: '수진', hostEmoji: '🏋️',
    maxAttendees: 20, attendeeCount: 14, interestIds: ['sports_running', 'sports_fitness'],
    status: 'UPCOMING', createdAt: isoFuture(-5),
  },
  {
    id: 'ev4', title: '맛집 탐방: 을지로 편', description: '을지로 숨은 맛집을 함께 탐방해요.',
    emoji: '🍜', date: isoFuture(7, 12), endDate: isoFuture(7, 14), location: '을지로3가역 2번 출구',
    groupId: 'g4', groupName: '맛집 탐험대', hostId: 'user4', hostName: '민수', hostEmoji: '🍕',
    maxAttendees: 8, attendeeCount: 6, interestIds: ['food_cooking', 'food_cafe'],
    status: 'UPCOMING', createdAt: isoFuture(-1),
  },
  {
    id: 'ev5', title: '코딩 스터디 밋업', description: 'React Native & TypeScript 심화 스터디.',
    emoji: '💻', date: isoFuture(2, 10), endDate: isoFuture(2, 13), location: '판교 스타벅스 2층',
    groupId: 'g5', groupName: '코드 크래프터즈', hostId: 'user5', hostName: '영호', hostEmoji: '🖥️',
    maxAttendees: 10, attendeeCount: 5, interestIds: ['tech_coding', 'tech_ai'],
    status: 'UPCOMING', createdAt: isoFuture(-4),
  },
  {
    id: 'ev6', title: '전시회 관람: 현대미술', description: '서울시립미술관 기획전을 같이 볼 사람!',
    emoji: '🎨', date: isoFuture(-1, 13), endDate: isoFuture(-1, 16), location: '서울시립미술관',
    groupId: null, groupName: null, hostId: 'user2', hostName: '지민', hostEmoji: '🎸',
    maxAttendees: 10, attendeeCount: 8, interestIds: ['culture_art', 'culture_museum'],
    status: 'ENDED', createdAt: isoFuture(-7),
  },
];

let eventAttendees: (EventAttendee & { eventId: string })[] = [
  { eventId: 'ev1', userId: 'user-me', displayName: '나', avatarEmoji: null, avatarColor: null, rsvp: 'GOING', respondedAt: isoFuture(-1) },
  { eventId: 'ev1', userId: 'user2', displayName: '지민', avatarEmoji: '🎸', avatarColor: '#8B5CF6', rsvp: 'GOING', respondedAt: isoFuture(-1) },
  { eventId: 'ev1', userId: 'user3', displayName: '수진', avatarEmoji: '🏋️', avatarColor: '#22C55E', rsvp: 'MAYBE', respondedAt: isoFuture(-1) },
  { eventId: 'ev2', userId: 'user-me', displayName: '나', avatarEmoji: null, avatarColor: null, rsvp: 'MAYBE', respondedAt: isoFuture(-2) },
  { eventId: 'ev3', userId: 'user-me', displayName: '나', avatarEmoji: null, avatarColor: null, rsvp: 'GOING', respondedAt: isoFuture(-3) },
  { eventId: 'ev5', userId: 'user-me', displayName: '나', avatarEmoji: null, avatarColor: null, rsvp: 'GOING', respondedAt: isoFuture(-2) },
  { eventId: 'ev6', userId: 'user-me', displayName: '나', avatarEmoji: null, avatarColor: null, rsvp: 'GOING', respondedAt: isoFuture(-6) },
];

export const mockEvents = {
  /** 다가오는 이벤트 (내 관심사 기반 추천) */
  async getUpcomingEvents(): Promise<EventPreview[]> {
    await delay(300);
    const me = users.find(u => u.id === currentUserId);
    const myInterests = me ? [...me.recentInterests, ...me.alwaysInterests] : [];

    return events
      .filter(e => e.status === 'UPCOMING')
      .map(e => {
        const overlap = e.interestIds.filter(id => myInterests.includes(id)).length;
        const myRsvp = eventAttendees.find(a => a.eventId === e.id && a.userId === currentUserId)?.rsvp ?? null;
        return { ...e, myRsvp, _overlap: overlap };
      })
      .sort((a, b) => {
        // 참석 중인 이벤트 우선 → 관심사 겹침 순 → 날짜 순
        const aGoing = a.myRsvp === 'GOING' ? 1 : 0;
        const bGoing = b.myRsvp === 'GOING' ? 1 : 0;
        if (bGoing !== aGoing) return bGoing - aGoing;
        if (b._overlap !== a._overlap) return b._overlap - a._overlap;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      })
      .map(({ _overlap, ...rest }) => ({
        id: rest.id, title: rest.title, emoji: rest.emoji,
        date: rest.date, location: rest.location, attendeeCount: rest.attendeeCount,
        myRsvp: rest.myRsvp, groupName: rest.groupName, status: rest.status,
      }));
  },

  /** 내가 참석 예정인 이벤트 */
  async getMyEvents(): Promise<EventPreview[]> {
    await delay(250);
    const myRsvps = eventAttendees.filter(a => a.userId === currentUserId && a.rsvp !== 'NOT_GOING');
    return myRsvps
      .map(rsvp => {
        const e = events.find(ev => ev.id === rsvp.eventId);
        if (!e) return null;
        return {
          id: e.id, title: e.title, emoji: e.emoji,
          date: e.date, location: e.location, attendeeCount: e.attendeeCount,
          myRsvp: rsvp.rsvp, groupName: e.groupName, status: e.status,
        } as EventPreview;
      })
      .filter(Boolean) as EventPreview[];
  },

  /** 이벤트 상세 */
  async getEventDetail(eventId: string): Promise<AppEvent & { myRsvp: EventRSVP | null }> {
    await delay(300);
    const e = events.find(ev => ev.id === eventId);
    if (!e) throw new Error('이벤트를 찾을 수 없습니다');
    const myRsvp = eventAttendees.find(a => a.eventId === eventId && a.userId === currentUserId)?.rsvp ?? null;
    return { ...e, myRsvp };
  },

  /** 참석자 목록 */
  async getEventAttendees(eventId: string): Promise<EventAttendee[]> {
    await delay(200);
    return eventAttendees
      .filter(a => a.eventId === eventId)
      .sort((a, b) => {
        const order: Record<EventRSVP, number> = { GOING: 0, MAYBE: 1, NOT_GOING: 2 };
        return order[a.rsvp] - order[b.rsvp];
      });
  },

  /** RSVP 변경 */
  async rsvpEvent(eventId: string, rsvp: EventRSVP): Promise<void> {
    await delay(300);
    if (!currentUserId) throw new Error('로그인이 필요합니다');
    const me = users.find(u => u.id === currentUserId);
    const existing = eventAttendees.find(a => a.eventId === eventId && a.userId === currentUserId);
    const ev = events.find(e => e.id === eventId);

    if (existing) {
      const wasGoing = existing.rsvp === 'GOING';
      existing.rsvp = rsvp;
      existing.respondedAt = new Date().toISOString();
      if (ev) {
        if (wasGoing && rsvp !== 'GOING') ev.attendeeCount = Math.max(0, ev.attendeeCount - 1);
        if (!wasGoing && rsvp === 'GOING') ev.attendeeCount++;
      }
    } else {
      eventAttendees.push({
        eventId,
        userId: currentUserId,
        displayName: me?.displayName ?? '나',
        avatarEmoji: me?.avatarEmoji ?? null,
        avatarColor: me?.avatarColor ?? null,
        rsvp,
        respondedAt: new Date().toISOString(),
      });
      if (ev && rsvp === 'GOING') ev.attendeeCount++;
    }
  },

  /** 이벤트 생성 */
  async createEvent(data: {
    title: string;
    description: string;
    emoji: string;
    date: string;
    endDate: string;
    location: string;
    groupId?: string;
    interestIds: string[];
    maxAttendees: number;
  }): Promise<AppEvent> {
    await delay(400);
    if (!currentUserId) throw new Error('로그인이 필요합니다');
    const me = users.find(u => u.id === currentUserId);
    const group = data.groupId ? groups.find(g => g.id === data.groupId) : null;

    const newEvent: AppEvent = {
      id: genId(),
      title: data.title,
      description: data.description,
      emoji: data.emoji,
      date: data.date,
      endDate: data.endDate,
      location: data.location,
      groupId: data.groupId ?? null,
      groupName: group?.name ?? null,
      hostId: currentUserId,
      hostName: me?.displayName ?? '나',
      hostEmoji: me?.avatarEmoji ?? null,
      maxAttendees: data.maxAttendees,
      attendeeCount: 1,
      interestIds: data.interestIds,
      status: 'UPCOMING',
      createdAt: new Date().toISOString(),
    };

    events.push(newEvent);
    // 호스트 자동 참석
    eventAttendees.push({
      eventId: newEvent.id,
      userId: currentUserId,
      displayName: me?.displayName ?? '나',
      avatarEmoji: me?.avatarEmoji ?? null,
      avatarColor: me?.avatarColor ?? null,
      rsvp: 'GOING',
      respondedAt: new Date().toISOString(),
    });

    return newEvent;
  },
};

// ==========================================
// Bookmarks & Favorites
// ==========================================
let bookmarks: Bookmark[] = [
  { id: 'bm1', userId: 'user-me', targetType: 'USER', targetId: 'user2', note: '음악 취향이 비슷한 친구', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'bm2', userId: 'user-me', targetType: 'USER', targetId: 'user3', note: null, createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 'bm3', userId: 'user-me', targetType: 'GROUP', targetId: 'g2', note: '재미있는 그룹', createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: 'bm4', userId: 'user-me', targetType: 'EVENT', targetId: 'ev2', note: null, createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
];

export const mockBookmarks = {
  /** 북마크 목록 (미리보기 포함) */
  async getBookmarks(typeFilter?: BookmarkType): Promise<BookmarkWithPreview[]> {
    await delay(300);
    let filtered = bookmarks.filter(b => b.userId === currentUserId);
    if (typeFilter) filtered = filtered.filter(b => b.targetType === typeFilter);

    return filtered
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(bm => {
        const result: BookmarkWithPreview = { ...bm };
        if (bm.targetType === 'USER') {
          const u = users.find(usr => usr.id === bm.targetId);
          if (u) result.userPreview = {
            displayName: u.displayName, avatarEmoji: u.avatarEmoji,
            avatarColor: u.avatarColor, bio: u.bio, isOnline: u.isOnline,
          };
        } else if (bm.targetType === 'GROUP') {
          const g = groups.find(gr => gr.id === bm.targetId);
          if (g) result.groupPreview = {
            name: g.name, emoji: g.emoji, color: g.color, memberCount: g.memberCount,
          };
        } else if (bm.targetType === 'EVENT') {
          const e = events.find(ev => ev.id === bm.targetId);
          if (e) result.eventPreview = {
            title: e.title, emoji: e.emoji, date: e.date, location: e.location, status: e.status,
          };
        }
        return result;
      });
  },

  /** 북마크 여부 확인 */
  async isBookmarked(targetType: BookmarkType, targetId: string): Promise<boolean> {
    await delay(100);
    return bookmarks.some(b => b.userId === currentUserId && b.targetType === targetType && b.targetId === targetId);
  },

  /** 북마크 토글 (추가/제거) */
  async toggleBookmark(targetType: BookmarkType, targetId: string): Promise<boolean> {
    await delay(200);
    if (!currentUserId) throw new Error('로그인이 필요합니다');
    const idx = bookmarks.findIndex(b => b.userId === currentUserId && b.targetType === targetType && b.targetId === targetId);
    if (idx >= 0) {
      bookmarks.splice(idx, 1);
      return false; // 제거됨
    } else {
      bookmarks.push({
        id: genId(),
        userId: currentUserId,
        targetType,
        targetId,
        note: null,
        createdAt: new Date().toISOString(),
      });
      return true; // 추가됨
    }
  },

  /** 북마크 메모 업데이트 */
  async updateNote(bookmarkId: string, note: string): Promise<void> {
    await delay(200);
    const bm = bookmarks.find(b => b.id === bookmarkId);
    if (bm) bm.note = note || null;
  },

  /** 북마크 삭제 */
  async removeBookmark(bookmarkId: string): Promise<void> {
    await delay(200);
    bookmarks = bookmarks.filter(b => b.id !== bookmarkId);
  },

  /** 북마크 수 */
  async getBookmarkCount(): Promise<number> {
    await delay(100);
    return bookmarks.filter(b => b.userId === currentUserId).length;
  },
};

// ==========================================
// Unified Search (통합 검색)
// ==========================================
const TRENDING_SEARCHES: TrendingSearch[] = [
  { keyword: '보드게임', count: 42, emoji: '🎲' },
  { keyword: '러닝', count: 38, emoji: '🏃' },
  { keyword: '맛집', count: 35, emoji: '🍜' },
  { keyword: '코딩', count: 31, emoji: '💻' },
  { keyword: '음악', count: 28, emoji: '🎵' },
  { keyword: '여행', count: 25, emoji: '✈️' },
  { keyword: '영화', count: 22, emoji: '🎬' },
  { keyword: '독서', count: 19, emoji: '📚' },
];

export const mockSearch = {
  /** 통합 검색 — 유저, 그룹, 이벤트를 한번에 검색 */
  async search(query: string, typeFilter?: SearchResultType): Promise<SearchResult[]> {
    await delay(350);
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const results: SearchResult[] = [];
    const me = users.find(u => u.id === currentUserId);
    const myAllInterests = me ? [...me.recentInterests, ...me.alwaysInterests] : [];

    // — 유저 검색 —
    if (!typeFilter || typeFilter === 'USER') {
      for (const u of users) {
        if (u.id === currentUserId) continue;
        if (u.privacyLevel === 'PRIVATE') continue;

        const nameMatch = u.displayName.toLowerCase().includes(q);
        const bioMatch = (u.bio ?? '').toLowerCase().includes(q);
        const interestMatch = [...u.recentInterests, ...u.alwaysInterests].some(iid => {
          const info = getInterestById(iid);
          return info?.label.toLowerCase().includes(q);
        });

        if (nameMatch || bioMatch || interestMatch) {
          const matchReason = nameMatch ? '이름 일치' : bioMatch ? '소개글 일치' : '관심사 일치';
          results.push({
            id: u.id,
            type: 'USER',
            title: u.displayName,
            subtitle: u.bio,
            emoji: u.avatarEmoji,
            avatarUrl: u.avatarUrl,
            avatarColor: u.avatarColor,
            interestIds: [...u.recentInterests, ...u.alwaysInterests].slice(0, 4),
            isOnline: u.isOnline,
            matchReason,
          });
        }
      }
    }

    // — 그룹 검색 —
    if (!typeFilter || typeFilter === 'GROUP') {
      for (const g of groups) {
        const nameMatch = g.name.toLowerCase().includes(q);
        const descMatch = g.description.toLowerCase().includes(q);
        const interestMatch = g.interestIds.some(iid => {
          const info = getInterestById(iid);
          return info?.label.toLowerCase().includes(q);
        });

        if (nameMatch || descMatch || interestMatch) {
          const matchReason = nameMatch ? '그룹명 일치' : descMatch ? '설명 일치' : '관심사 일치';
          const isMember = groupMembers.some(gm => gm.groupId === g.id && gm.userId === currentUserId);
          results.push({
            id: g.id,
            type: 'GROUP',
            title: g.name,
            subtitle: g.description,
            emoji: g.emoji,
            avatarUrl: null,
            avatarColor: g.color,
            interestIds: g.interestIds.slice(0, 4),
            memberCount: g.memberCount,
            matchReason,
          });
        }
      }
    }

    // — 이벤트 검색 —
    if (!typeFilter || typeFilter === 'EVENT') {
      for (const e of events) {
        const nameMatch = e.title.toLowerCase().includes(q);
        const descMatch = e.description.toLowerCase().includes(q);
        const locMatch = e.location.toLowerCase().includes(q);
        const interestMatch = e.interestIds.some(iid => {
          const info = getInterestById(iid);
          return info?.label.toLowerCase().includes(q);
        });

        if (nameMatch || descMatch || locMatch || interestMatch) {
          const matchReason = nameMatch ? '이벤트명 일치' : locMatch ? '장소 일치' : descMatch ? '설명 일치' : '관심사 일치';
          results.push({
            id: e.id,
            type: 'EVENT',
            title: e.title,
            subtitle: e.location,
            emoji: e.emoji,
            avatarUrl: null,
            avatarColor: null,
            interestIds: e.interestIds.slice(0, 4),
            date: e.date,
            matchReason,
          });
        }
      }
    }

    return results;
  },

  /** 인기 검색어 */
  async getTrendingSearches(): Promise<TrendingSearch[]> {
    await delay(200);
    return [...TRENDING_SEARCHES];
  },

  /** 추천 검색어 (자동완성) */
  async getSuggestions(query: string): Promise<string[]> {
    await delay(150);
    const q = query.trim().toLowerCase();
    if (!q || q.length < 1) return [];

    const suggestions = new Set<string>();

    // 유저 이름
    for (const u of users) {
      if (u.id === currentUserId) continue;
      if (u.displayName.toLowerCase().includes(q)) {
        suggestions.add(u.displayName);
      }
    }
    // 그룹 이름
    for (const g of groups) {
      if (g.name.toLowerCase().includes(q)) {
        suggestions.add(g.name);
      }
    }
    // 이벤트 이름
    for (const e of events) {
      if (e.title.toLowerCase().includes(q)) {
        suggestions.add(e.title);
      }
    }
    // 관심사 라벨
    for (const interest of INTERESTS) {
      if (interest.label.toLowerCase().includes(q)) {
        suggestions.add(interest.label);
      }
    }

    return Array.from(suggestions).slice(0, 8);
  },
};

// ==========================================
// Profile Insights (프로필 인사이트)
// ==========================================
export const mockInsights = {
  async getInsights(): Promise<ProfileInsightsData> {
    await delay(400);
    const now = new Date();
    const dayMs = 86400000;
    const me = users.find(u => u.id === currentUserId);
    const myInterests = me ? [...me.recentInterests, ...me.alwaysInterests] : [];

    // 7일간 조회수 (랜덤 시뮬레이션)
    const daily: DailyCount[] = [];
    const counts = [5, 8, 12, 7, 15, 10, 18];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * dayMs);
      daily.push({
        date: d.toISOString().split('T')[0],
        count: counts[6 - i],
      });
    }

    // 24시간별 조회 분포
    const hourly: number[] = [
      1, 0, 0, 0, 0, 1, 2, 5, 8, 12, 10, 7,
      9, 11, 8, 6, 5, 7, 10, 14, 11, 8, 4, 2,
    ];

    // 방문자 목록
    const otherUsers = users.filter(u => u.id !== currentUserId);
    const visitors: ProfileVisitor[] = otherUsers.slice(0, 6).map((u, idx) => {
      const theirAll = [...u.recentInterests, ...u.alwaysInterests];
      const commonCount = theirAll.filter(id => myInterests.includes(id)).length;
      return {
        userId: u.id,
        displayName: u.displayName,
        avatarEmoji: u.avatarEmoji,
        avatarColor: u.avatarColor,
        visitedAt: new Date(now.getTime() - (idx * 3 + 1) * 3600000).toISOString(),
        commonInterestCount: commonCount,
        viewCount: Math.floor(Math.random() * 5) + 1,
      };
    });

    // 관심사별 인기도
    const interestEngagement: InterestEngagement[] = myInterests.slice(0, 6).map((iid, idx) => ({
      interestId: iid,
      views: Math.floor(Math.random() * 30) + 5,
      connections: Math.floor(Math.random() * 10) + 1,
      score: Math.floor(Math.random() * 60) + 40,
    })).sort((a, b) => b.score - a.score);

    const totalViews = daily.reduce((s, d) => s + d.count, 0);
    const peakDayIdx = counts.indexOf(Math.max(...counts));
    const peakDayDate = new Date(now.getTime() - (6 - peakDayIdx) * dayMs);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const peakHourIdx = hourly.indexOf(Math.max(...hourly));

    const summary: WeeklySummary = {
      totalViews,
      uniqueVisitors: visitors.length,
      viewsTrend: 23,
      topVisitor: visitors[0] ?? null,
      peakDay: dayNames[peakDayDate.getDay()],
      peakHour: peakHourIdx,
      newConnections: 3,
      interestEngagement,
    };

    return { daily, hourly, visitors, summary };
  },
};

// ==========================================
// mockTimeline – 활동 타임라인
// ==========================================
export const mockTimeline = {
  async getTimeline(filter?: ActivityType | 'ALL'): Promise<ActivityTimelineItem[]> {
    await delay(400);
    const now = Date.now();
    const h = 3600_000;
    const d = 24 * h;

    const otherUsers = users.filter(u => u.id !== currentUserId);
    const pick = (arr: typeof otherUsers) => arr[Math.floor(Math.random() * arr.length)];

    const items: ActivityTimelineItem[] = [
      // 프로필 열람
      {
        id: 'tl-1', type: 'PROFILE_VIEW_RECEIVED',
        title: `${otherUsers[0]?.displayName || '누군가'}님이 프로필을 열람했어요`,
        subtitle: '요즘 관심사에 관심을 보인 것 같아요',
        emoji: '👁️',
        relatedUserId: otherUsers[0]?.id ?? null,
        relatedUserName: otherUsers[0]?.displayName ?? null,
        relatedUserEmoji: otherUsers[0]?.avatarEmoji ?? null,
        relatedUserColor: otherUsers[0]?.avatarColor ?? null,
        metadata: {}, createdAt: new Date(now - 2 * h).toISOString(),
      },
      {
        id: 'tl-2', type: 'PROFILE_VIEW_RECEIVED',
        title: `${otherUsers[1]?.displayName || '누군가'}님이 프로필을 열람했어요`,
        subtitle: null,
        emoji: '👁️',
        relatedUserId: otherUsers[1]?.id ?? null,
        relatedUserName: otherUsers[1]?.displayName ?? null,
        relatedUserEmoji: otherUsers[1]?.avatarEmoji ?? null,
        relatedUserColor: otherUsers[1]?.avatarColor ?? null,
        metadata: {}, createdAt: new Date(now - 8 * h).toISOString(),
      },
      // 연결 성사
      {
        id: 'tl-3', type: 'CONNECTION_MADE',
        title: `${otherUsers[2]?.displayName || '새 친구'}님과 연결되었어요!`,
        subtitle: '이제 대화를 시작해 보세요',
        emoji: '🤝',
        relatedUserId: otherUsers[2]?.id ?? null,
        relatedUserName: otherUsers[2]?.displayName ?? null,
        relatedUserEmoji: otherUsers[2]?.avatarEmoji ?? null,
        relatedUserColor: otherUsers[2]?.avatarColor ?? null,
        metadata: {}, createdAt: new Date(now - 1 * d).toISOString(),
      },
      // 연결 요청 받음
      {
        id: 'tl-4', type: 'CONNECTION_REQUEST',
        title: `${otherUsers[3]?.displayName || '누군가'}님이 연결 요청을 보냈어요`,
        subtitle: '공통 관심사 3개',
        emoji: '📩',
        relatedUserId: otherUsers[3]?.id ?? null,
        relatedUserName: otherUsers[3]?.displayName ?? null,
        relatedUserEmoji: otherUsers[3]?.avatarEmoji ?? null,
        relatedUserColor: otherUsers[3]?.avatarColor ?? null,
        metadata: { commonInterests: 3 }, createdAt: new Date(now - 1.5 * d).toISOString(),
      },
      // 배지 획득
      {
        id: 'tl-5', type: 'BADGE_EARNED',
        title: '🌟 첫 만남 배지를 획득했어요!',
        subtitle: '첫 번째 연결을 만들었어요',
        emoji: '🏅',
        relatedUserId: null, relatedUserName: null,
        relatedUserEmoji: null, relatedUserColor: null,
        metadata: { badgeName: '첫 만남' }, createdAt: new Date(now - 2 * d).toISOString(),
      },
      {
        id: 'tl-6', type: 'BADGE_EARNED',
        title: '💬 대화의 달인 배지를 획득했어요!',
        subtitle: '10번의 대화를 나누었어요',
        emoji: '🏅',
        relatedUserId: null, relatedUserName: null,
        relatedUserEmoji: null, relatedUserColor: null,
        metadata: { badgeName: '대화의 달인' }, createdAt: new Date(now - 3 * d).toISOString(),
      },
      // 그룹 가입
      {
        id: 'tl-7', type: 'GROUP_JOINED',
        title: '"영화 덕후들" 그룹에 가입했어요',
        subtitle: '멤버 12명',
        emoji: '👥',
        relatedUserId: null, relatedUserName: null,
        relatedUserEmoji: null, relatedUserColor: null,
        metadata: { groupName: '영화 덕후들' }, createdAt: new Date(now - 3.5 * d).toISOString(),
      },
      // 이벤트 참여
      {
        id: 'tl-8', type: 'EVENT_JOINED',
        title: '"커피 철학 모임" 이벤트에 참여했어요',
        subtitle: '2월 20일 오후 3시',
        emoji: '📅',
        relatedUserId: null, relatedUserName: null,
        relatedUserEmoji: null, relatedUserColor: null,
        metadata: { eventName: '커피 철학 모임' }, createdAt: new Date(now - 4 * d).toISOString(),
      },
      // 관심사 변경
      {
        id: 'tl-9', type: 'INTEREST_UPDATED',
        title: '요즘 관심사를 업데이트했어요',
        subtitle: '새로 추가: 프로그래밍, AI',
        emoji: '✨',
        relatedUserId: null, relatedUserName: null,
        relatedUserEmoji: null, relatedUserColor: null,
        metadata: { added: 2, removed: 0 }, createdAt: new Date(now - 5 * d).toISOString(),
      },
      // 프로필 수정
      {
        id: 'tl-10', type: 'PROFILE_UPDATED',
        title: '프로필 사진과 소개를 수정했어요',
        subtitle: null,
        emoji: '✏️',
        relatedUserId: null, relatedUserName: null,
        relatedUserEmoji: null, relatedUserColor: null,
        metadata: {}, createdAt: new Date(now - 5.5 * d).toISOString(),
      },
      // 스냅샷 추가
      {
        id: 'tl-11', type: 'SNAPSHOT_ADDED',
        title: '새 스냅샷을 추가했어요',
        subtitle: '"오늘의 커피 ☕"',
        emoji: '📸',
        relatedUserId: null, relatedUserName: null,
        relatedUserEmoji: null, relatedUserColor: null,
        metadata: { caption: '오늘의 커피 ☕' }, createdAt: new Date(now - 6 * d).toISOString(),
      },
      // 북마크
      {
        id: 'tl-12', type: 'BOOKMARK_ADDED',
        title: `${otherUsers[4]?.displayName || '사용자'}님을 북마크했어요`,
        subtitle: null,
        emoji: '🔖',
        relatedUserId: otherUsers[4]?.id ?? null,
        relatedUserName: otherUsers[4]?.displayName ?? null,
        relatedUserEmoji: otherUsers[4]?.avatarEmoji ?? null,
        relatedUserColor: otherUsers[4]?.avatarColor ?? null,
        metadata: {}, createdAt: new Date(now - 6.5 * d).toISOString(),
      },
      // 추가 프로필 열람
      {
        id: 'tl-13', type: 'PROFILE_VIEW_RECEIVED',
        title: `${otherUsers[5 % otherUsers.length]?.displayName || '누군가'}님이 프로필을 열람했어요`,
        subtitle: null,
        emoji: '👁️',
        relatedUserId: otherUsers[5 % otherUsers.length]?.id ?? null,
        relatedUserName: otherUsers[5 % otherUsers.length]?.displayName ?? null,
        relatedUserEmoji: otherUsers[5 % otherUsers.length]?.avatarEmoji ?? null,
        relatedUserColor: otherUsers[5 % otherUsers.length]?.avatarColor ?? null,
        metadata: {}, createdAt: new Date(now - 7 * d).toISOString(),
      },
    ];

    // 필터 적용
    const filtered = (!filter || filter === 'ALL')
      ? items
      : items.filter(i => i.type === filter);

    // 시간 내림차순
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
};

// ==========================================
// mockNotes – 사용자 메모
// ==========================================
let userNotes: UserNote[] = [];

export const mockNotes = {
  /** 내 메모 전체 조회 (최신순) */
  async getNotes(): Promise<UserNote[]> {
    await delay(300);
    if (!currentUserId) return [];
    return userNotes
      .filter(n => n.authorId === currentUserId)
      .sort((a, b) => {
        // 고정 메모 우선
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  },

  /** 특정 사용자에 대한 메모 조회 */
  async getNoteForUser(targetUserId: string): Promise<UserNote | null> {
    await delay(100);
    if (!currentUserId) return null;
    return userNotes.find(
      n => n.authorId === currentUserId && n.targetUserId === targetUserId,
    ) ?? null;
  },

  /** 메모 생성/수정 (upsert) */
  async saveNote(targetUserId: string, content: string, tags: string[] = []): Promise<UserNote> {
    await delay(200);
    if (!currentUserId) throw new Error('Not logged in');

    const targetUser = users.find(u => u.id === targetUserId);
    const existing = userNotes.find(
      n => n.authorId === currentUserId && n.targetUserId === targetUserId,
    );

    if (existing) {
      existing.content = content;
      existing.tags = tags;
      existing.updatedAt = new Date().toISOString();
      return { ...existing };
    }

    const note: UserNote = {
      id: genId(),
      authorId: currentUserId,
      targetUserId,
      targetUserName: targetUser?.displayName ?? '알 수 없음',
      targetUserEmoji: targetUser?.avatarEmoji ?? null,
      targetUserColor: targetUser?.avatarColor ?? null,
      content,
      tags,
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    userNotes.push(note);
    return { ...note };
  },

  /** 메모 삭제 */
  async deleteNote(noteId: string): Promise<void> {
    await delay(150);
    userNotes = userNotes.filter(n => n.id !== noteId);
  },

  /** 고정/해제 토글 */
  async togglePin(noteId: string): Promise<UserNote> {
    await delay(100);
    const note = userNotes.find(n => n.id === noteId);
    if (!note) throw new Error('Note not found');
    note.isPinned = !note.isPinned;
    note.updatedAt = new Date().toISOString();
    return { ...note };
  },
};
