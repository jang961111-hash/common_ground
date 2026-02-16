// ==========================================
// 관심사별 추천 대화 질문 (확장 버전)
// ==========================================

export type QuestionDepth = 'ice' | 'casual' | 'deep';

export type ConversationQuestion = {
  interestId: string;
  questions: QuestionItem[];
};

export type QuestionItem = {
  text: string;
  depth: QuestionDepth;
  /** 후속 질문 (대화 이어가기) */
  followUps?: string[];
};

// 깊이 라벨
export const DEPTH_LABELS: Record<QuestionDepth, { label: string; emoji: string; color: string }> = {
  ice:    { label: '아이스브레이커', emoji: '🧊', color: '#60A5FA' },
  casual: { label: '편한 대화',     emoji: '☕', color: '#34D399' },
  deep:   { label: '깊은 대화',     emoji: '💎', color: '#A78BFA' },
};

// 관심사별 추천 질문 (depth + followUps 포함)
export const INTEREST_QUESTIONS: ConversationQuestion[] = [
  // ── 취미 ──
  {
    interestId: 'reading',
    questions: [
      { text: '요즘 어떤 책 읽고 계세요?', depth: 'ice', followUps: ['어떤 내용이에요?', '어디서 추천 받으셨어요?'] },
      { text: '가장 인상 깊었던 책이 뭐예요?', depth: 'casual', followUps: ['어떤 부분이 인상 깊었어요?', '읽고 나서 삶에 변화가 있었어요?'] },
      { text: '책에서 가장 영향을 많이 받은 가치관이 있다면?', depth: 'deep', followUps: ['그 전엔 어떻게 생각했어요?'] },
      { text: '좋아하는 작가 있어요?', depth: 'casual' },
      { text: '종이책 vs 전자책 어떤 파예요?', depth: 'ice' },
    ],
  },
  {
    interestId: 'gaming',
    questions: [
      { text: '요즘 어떤 게임 하세요?', depth: 'ice', followUps: ['어떤 점이 재밌어요?', '캐릭터 뭐 해요?'] },
      { text: '좋아하는 게임 장르가 뭐예요?', depth: 'casual', followUps: ['그 장르 시작하게 된 계기가 있어요?'] },
      { text: '게임에서 얻은 가장 큰 깨달음이 있다면?', depth: 'deep' },
      { text: '같이 할 수 있는 게임 있어요?', depth: 'ice' },
      { text: '인생 게임이 뭐예요?', depth: 'casual', followUps: ['처음 했을 때 느낌이 어땠어요?'] },
    ],
  },
  {
    interestId: 'photography',
    questions: [
      { text: '사진 찍을 때 어떤 피사체를 좋아하세요?', depth: 'ice' },
      { text: '어떤 카메라 쓰세요?', depth: 'casual', followUps: ['렌즈는 뭐 주로 쓰세요?'] },
      { text: '사진 찍으면서 세상 보는 시선이 바뀐 것 같아요?', depth: 'deep' },
      { text: '가장 마음에 드는 사진이 있다면 어떤 거예요?', depth: 'casual' },
    ],
  },
  {
    interestId: 'drawing',
    questions: [
      { text: '어떤 그림 스타일을 좋아하세요?', depth: 'ice' },
      { text: '디지털 작업 하세요? 아날로그?', depth: 'casual' },
      { text: '그림을 그릴 때 가장 행복한 순간은 언제예요?', depth: 'deep' },
      { text: '최근에 그린 거 있어요?', depth: 'ice', followUps: ['어떤 분위기예요?'] },
    ],
  },
  {
    interestId: 'cooking',
    questions: [
      { text: '자신있는 요리가 뭐예요?', depth: 'ice', followUps: ['레시피 비법 있어요?'] },
      { text: '요리 배우고 싶은 게 있어요?', depth: 'casual' },
      { text: '요리가 나에게 어떤 의미인지 생각해본 적 있어요?', depth: 'deep' },
      { text: '요즘 자주 해먹는 음식이요?', depth: 'ice' },
    ],
  },
  {
    interestId: 'gardening',
    questions: [
      { text: '어떤 식물 키우세요?', depth: 'ice', followUps: ['얼마나 키우셨어요?'] },
      { text: '식물 키우기 팁 있어요?', depth: 'casual' },
      { text: '식물 키우면서 마음이 편해지는 순간이 있어요?', depth: 'deep' },
    ],
  },

  // ── 음악 ──
  {
    interestId: 'kpop',
    questions: [
      { text: '어떤 아티스트 좋아하세요?', depth: 'ice', followUps: ['입덕 계기가 뭐예요?'] },
      { text: '최애곡이 뭐예요?', depth: 'casual', followUps: ['그 곡 듣게 된 계기가 있어요?'] },
      { text: '아이돌 문화가 나에게 어떤 영향을 줬어요?', depth: 'deep' },
      { text: '콘서트 가본 적 있어요?', depth: 'ice' },
    ],
  },
  {
    interestId: 'hiphop',
    questions: [
      { text: '좋아하는 래퍼가 누구예요?', depth: 'ice' },
      { text: '요즘 자주 듣는 앨범 있어요?', depth: 'casual' },
      { text: '힙합 가사 중에 마음에 남는 라인이 있어요?', depth: 'deep' },
      { text: '한국 힙합 vs 외국 힙합?', depth: 'ice' },
    ],
  },
  {
    interestId: 'indie',
    questions: [
      { text: '좋아하는 인디밴드 있어요?', depth: 'ice', followUps: ['어떻게 알게 됐어요?'] },
      { text: '인디 공연 자주 가세요?', depth: 'casual' },
      { text: '인디 음악이 좋은 이유가 뭐라고 생각하세요?', depth: 'deep' },
    ],
  },
  {
    interestId: 'classical',
    questions: [
      { text: '좋아하는 작곡가가 누구예요?', depth: 'ice' },
      { text: '악기 연주하세요?', depth: 'casual', followUps: ['얼마나 연주하셨어요?'] },
      { text: '클래식 음악이 일상에서 어떤 역할을 해요?', depth: 'deep' },
    ],
  },
  {
    interestId: 'jazz',
    questions: [
      { text: '재즈 어떻게 입문하셨어요?', depth: 'casual' },
      { text: '좋아하는 재즈 뮤지션 있어요?', depth: 'ice' },
      { text: '재즈바 추천해주세요!', depth: 'ice' },
    ],
  },
  {
    interestId: 'piano',
    questions: [
      { text: '피아노 얼마나 치셨어요?', depth: 'ice' },
      { text: '좋아하는 피아노곡이 뭐예요?', depth: 'casual' },
      { text: '연습 중인 곡 있어요?', depth: 'ice', followUps: ['어려운 부분이 있어요?'] },
    ],
  },

  // ── 스포츠 ──
  {
    interestId: 'fitness',
    questions: [
      { text: '어떤 운동 위주로 하세요?', depth: 'ice' },
      { text: '운동 루틴이 어떻게 돼요?', depth: 'casual', followUps: ['빈도는요?', '아침/저녁?'] },
      { text: '운동이 멘탈에 미치는 영향이 어때요?', depth: 'deep' },
      { text: '헬스 얼마나 다니셨어요?', depth: 'ice' },
    ],
  },
  {
    interestId: 'running',
    questions: [
      { text: '주로 어디서 달리세요?', depth: 'ice' },
      { text: '마라톤 도전해본 적 있어요?', depth: 'casual' },
      { text: '달릴 때 무슨 생각 해요?', depth: 'deep' },
      { text: '한 번에 얼마나 뛰세요?', depth: 'ice' },
    ],
  },
  {
    interestId: 'climbing',
    questions: [
      { text: '클라이밍 얼마나 하셨어요?', depth: 'ice' },
      { text: '어느 클라이밍장 다니세요?', depth: 'casual' },
      { text: '두려운 루트를 완등했을 때 기분이 어때요?', depth: 'deep' },
    ],
  },
  {
    interestId: 'soccer',
    questions: [
      { text: '축구 자주 하세요?', depth: 'ice' },
      { text: '좋아하는 팀 있어요?', depth: 'casual' },
      { text: '어떤 포지션이에요?', depth: 'ice' },
    ],
  },
  {
    interestId: 'basketball',
    questions: [
      { text: '농구 동호회 있어요?', depth: 'ice' },
      { text: '좋아하는 NBA 선수 있어요?', depth: 'casual' },
      { text: '주로 어디서 농구해요?', depth: 'ice' },
    ],
  },
  {
    interestId: 'swimming',
    questions: [
      { text: '수영 얼마나 하셨어요?', depth: 'ice' },
      { text: '어떤 영법 좋아하세요?', depth: 'casual' },
      { text: '물에서 느끼는 자유로움을 좋아하세요?', depth: 'deep' },
    ],
  },
  {
    interestId: 'hiking',
    questions: [
      { text: '최근에 어느 산 다녀오셨어요?', depth: 'ice', followUps: ['코스 어땠어요?'] },
      { text: '좋아하는 등산 코스 있어요?', depth: 'casual' },
      { text: '산에서 가장 좋은 순간이 언제예요?', depth: 'deep' },
    ],
  },

  // ── 음식 ──
  {
    interestId: 'coffee',
    questions: [
      { text: '어떤 커피 좋아하세요?', depth: 'ice', followUps: ['아이스? 핫?', '원두 종류 선호 있어요?'] },
      { text: '단골 카페 있어요?', depth: 'casual' },
      { text: '커피가 없었으면 하루가 어떨 것 같아요?', depth: 'deep' },
      { text: '홈카페 하세요?', depth: 'casual', followUps: ['어떤 도구 쓰세요?'] },
    ],
  },
  {
    interestId: 'wine',
    questions: [
      { text: '어떤 와인 스타일 좋아하세요?', depth: 'ice' },
      { text: '와인바 추천해주세요!', depth: 'casual' },
      { text: '와인과 함께한 가장 좋은 기억이 있어요?', depth: 'deep' },
    ],
  },
  {
    interestId: 'korean-food',
    questions: [
      { text: '좋아하는 한식 메뉴가 뭐예요?', depth: 'ice' },
      { text: '한식 맛집 추천해주세요!', depth: 'casual' },
      { text: '직접 해먹는 한식 있어요?', depth: 'casual', followUps: ['레시피 알려주세요!'] },
    ],
  },
  {
    interestId: 'japanese-food',
    questions: [
      { text: '회 좋아하세요?', depth: 'ice' },
      { text: '일식 맛집 추천해주세요!', depth: 'casual' },
      { text: '라멘 vs 우동 뭐 좋아해요?', depth: 'ice' },
    ],
  },
  {
    interestId: 'dessert',
    questions: [
      { text: '좋아하는 디저트가 뭐예요?', depth: 'ice' },
      { text: '디저트 맛집 추천해주세요!', depth: 'casual' },
      { text: '직접 베이킹 하세요?', depth: 'casual', followUps: ['주로 뭐 만드세요?'] },
    ],
  },
  {
    interestId: 'vegan',
    questions: [
      { text: '비건 얼마나 되셨어요?', depth: 'ice' },
      { text: '비건 맛집 추천해주세요!', depth: 'casual' },
      { text: '비건 시작 계기가 뭐예요?', depth: 'deep' },
    ],
  },

  // ── 여행 ──
  {
    interestId: 'domestic-travel',
    questions: [
      { text: '최근에 어디 다녀오셨어요?', depth: 'ice', followUps: ['뭐가 좋았어요?'] },
      { text: '국내 여행지 추천해주세요!', depth: 'casual' },
      { text: '여행에서 가장 소중한 건 뭐라고 생각하세요?', depth: 'deep' },
    ],
  },
  {
    interestId: 'overseas-travel',
    questions: [
      { text: '가장 좋았던 나라가 어디예요?', depth: 'ice', followUps: ['뭐가 가장 기억에 남아요?'] },
      { text: '다음 여행 계획 있어요?', depth: 'casual' },
      { text: '여행이 사람을 바꾼다고 생각하세요?', depth: 'deep' },
    ],
  },
  {
    interestId: 'camping',
    questions: [
      { text: '어떤 캠핑 스타일이에요?', depth: 'ice' },
      { text: '캠핑장 추천해주세요!', depth: 'casual' },
      { text: '자연 속에서 느끼는 가장 좋은 점이 뭐예요?', depth: 'deep' },
    ],
  },
  {
    interestId: 'backpacking',
    questions: [
      { text: '배낭여행 어디 다녀오셨어요?', depth: 'ice' },
      { text: '배낭여행 팁 있어요?', depth: 'casual' },
      { text: '혼자 여행하면서 깨달은 것이 있어요?', depth: 'deep' },
    ],
  },

  // ── 기술 ──
  {
    interestId: 'programming',
    questions: [
      { text: '어떤 언어 쓰세요?', depth: 'ice', followUps: ['프론트? 백엔드?'] },
      { text: '사이드 프로젝트 하세요?', depth: 'casual', followUps: ['어떤 프로젝트예요?'] },
      { text: '코딩의 매력이 뭐라고 생각하세요?', depth: 'deep' },
    ],
  },
  {
    interestId: 'ai',
    questions: [
      { text: 'AI 쪽 어떤 분야 관심 있으세요?', depth: 'ice' },
      { text: '직접 모델 만들어보셨어요?', depth: 'casual' },
      { text: 'AI가 우리 삶을 어떻게 바꿀 거라고 생각하세요?', depth: 'deep' },
    ],
  },
  {
    interestId: 'startup',
    questions: [
      { text: '창업에 관심 있으세요?', depth: 'ice' },
      { text: '관심 있는 스타트업 분야가 뭐예요?', depth: 'casual' },
      { text: '실패를 어떻게 바라보세요?', depth: 'deep' },
    ],
  },
  {
    interestId: 'crypto',
    questions: [
      { text: '어떤 코인 관심 있으세요?', depth: 'ice' },
      { text: '투자 얼마나 하셨어요?', depth: 'casual' },
      { text: 'Web3 쪽에도 관심 있어요?', depth: 'casual' },
    ],
  },
  {
    interestId: 'design',
    questions: [
      { text: '어떤 디자인 분야예요?', depth: 'ice' },
      { text: '어떤 툴 쓰세요?', depth: 'casual' },
      { text: '좋은 디자인이란 뭐라고 생각하세요?', depth: 'deep' },
    ],
  },

  // ── 문화 ──
  {
    interestId: 'movies',
    questions: [
      { text: '요즘 본 영화 중 괜찮았던 거요?', depth: 'ice', followUps: ['어떤 점이 좋았어요?'] },
      { text: '좋아하는 영화 장르가 뭐예요?', depth: 'casual' },
      { text: '인생에 영향을 준 영화가 있어요?', depth: 'deep' },
      { text: '영화관 자주 가세요?', depth: 'ice' },
    ],
  },
  {
    interestId: 'drama',
    questions: [
      { text: '요즘 보는 드라마 있어요?', depth: 'ice', followUps: ['어디까지 봤어요?'] },
      { text: '인생 드라마가 뭐예요?', depth: 'casual' },
      { text: '드라마에서 감정 이입했던 캐릭터가 있어요?', depth: 'deep' },
    ],
  },
  {
    interestId: 'anime',
    questions: [
      { text: '요즘 보는 애니 있어요?', depth: 'ice' },
      { text: '인생 애니가 뭐예요?', depth: 'casual', followUps: ['몇 번이나 봤어요?'] },
      { text: '애니에서 가장 감동받은 장면이 있어요?', depth: 'deep' },
    ],
  },
  {
    interestId: 'webtoon',
    questions: [
      { text: '요즘 보는 웹툰 있어요?', depth: 'ice' },
      { text: '추천 웹툰 있어요?', depth: 'casual' },
      { text: '어떤 장르 좋아하세요?', depth: 'ice' },
    ],
  },
  {
    interestId: 'exhibition',
    questions: [
      { text: '최근에 본 전시 있어요?', depth: 'ice', followUps: ['어떤 전시였어요?'] },
      { text: '좋아하는 작가 있어요?', depth: 'casual' },
      { text: '예술이 삶에서 어떤 역할을 해요?', depth: 'deep' },
    ],
  },
  {
    interestId: 'musical',
    questions: [
      { text: '최근에 본 뮤지컬 있어요?', depth: 'ice' },
      { text: '인생 뮤지컬이 뭐예요?', depth: 'casual', followUps: ['몇 번이나 보셨어요?'] },
      { text: '무대의 어떤 매력에 빠진 거예요?', depth: 'deep' },
    ],
  },

  // ── 라이프 ──
  {
    interestId: 'pet',
    questions: [
      { text: '어떤 반려동물 키우세요?', depth: 'ice', followUps: ['이름이 뭐예요?', '성격이 어때요?'] },
      { text: '반려동물 키우면서 가장 좋은 점이요?', depth: 'casual' },
      { text: '반려동물이 나에게 가르쳐준 것이 있다면?', depth: 'deep' },
    ],
  },
  {
    interestId: 'meditation',
    questions: [
      { text: '명상 얼마나 하셨어요?', depth: 'ice' },
      { text: '어떤 방식으로 하세요?', depth: 'casual' },
      { text: '명상을 통해 달라진 점이 있어요?', depth: 'deep' },
    ],
  },
  {
    interestId: 'fashion',
    questions: [
      { text: '좋아하는 스타일이 어때요?', depth: 'ice' },
      { text: '요즘 관심 가는 브랜드 있어요?', depth: 'casual' },
      { text: '패션이 자신감에 미치는 영향이 있어요?', depth: 'deep' },
    ],
  },
  {
    interestId: 'interior',
    questions: [
      { text: '인테리어 스타일이 어때요?', depth: 'ice' },
      { text: '인테리어 영감 어디서 받으세요?', depth: 'casual' },
      { text: 'DIY 인테리어 해보셨어요?', depth: 'casual' },
    ],
  },
  {
    interestId: 'self-dev',
    questions: [
      { text: '요즘 어떤 공부 하세요?', depth: 'ice' },
      { text: '자기계발 팁 있어요?', depth: 'casual' },
      { text: '스스로 성장했다고 느낀 순간이 있어요?', depth: 'deep' },
    ],
  },
];

// ==========================================
// 상황별 아이스브레이커
// ==========================================
export type SituationCategory = 'first_meet' | 'group' | 'networking' | 'casual_chat';

export interface SituationQuestion {
  text: string;
  followUps?: string[];
}

export const SITUATION_LABELS: Record<SituationCategory, { label: string; emoji: string; desc: string }> = {
  first_meet:   { label: '처음 만남',   emoji: '👋', desc: '어색함을 깨는 가벼운 질문' },
  group:        { label: '그룹 모임',   emoji: '👥', desc: '여러 사람과 함께하는 자리' },
  networking:   { label: '네트워킹',    emoji: '🤝', desc: '전문적인 관계 형성' },
  casual_chat:  { label: '가벼운 수다', emoji: '💬', desc: '편하게 나누는 일상 대화' },
};

export const SITUATION_QUESTIONS: Record<SituationCategory, SituationQuestion[]> = {
  first_meet: [
    { text: '오늘 어떻게 오시게 됐어요?', followUps: ['누가 소개해줬어요?'] },
    { text: '여기 자주 오세요?', followUps: ['다른 추천 장소도 있어요?'] },
    { text: '이 모임 처음이세요?', followUps: ['어떻게 알게 됐어요?'] },
    { text: '어떤 일 하세요? (부담 없이!)', followUps: ['재밌어요?', '하게 된 계기가 있어요?'] },
    { text: '이런 자리에서 보통 먼저 말 거시는 편이에요?', followUps: ['저도 사실은요...'] },
    { text: '오늘 분위기 어때요? 편한가요?', followUps: ['그런 편이시군요!'] },
  ],
  group: [
    { text: '다들 어떻게 알게 된 사이에요?' },
    { text: '여기 음식/음료 뭐가 괜찮아요?' },
    { text: '이 중에서 제일 먼저 알게 된 사람이 누구예요?' },
    { text: '요즘 다 같이 가면 재밌는 곳 추천 있어요?' },
    { text: '저만 아는 사람이 없는 건 아니죠? ㅎㅎ' },
  ],
  networking: [
    { text: '어떤 분야에서 일하고 계세요?', followUps: ['전공도 그쪽이었어요?'] },
    { text: '최근에 흥미로운 프로젝트 하셨어요?', followUps: ['어떤 기술 쓰셨어요?'] },
    { text: '이 업계 트렌드 중에 주목하는 게 있어요?' },
    { text: '커리어에서 가장 의미 있었던 경험이 뭐예요?' },
    { text: '혹시 멘토 같은 분이 계세요?' },
  ],
  casual_chat: [
    { text: '요즘 뭐에 빠져 있어요?', followUps: ['언제부터요?', '계기가 있어요?'] },
    { text: '주말엔 주로 뭐 하세요?' },
    { text: '요즘 재밌게 본 거 있어요? (드라마, 영화, 유튜브...)' },
    { text: '올해 목표 같은 거 있어요?', followUps: ['잘 되고 있어요?'] },
    { text: '스트레스 풀 때 뭐 해요?' },
    { text: '요즘 음식 맛집 다녀온 데 있어요?' },
    { text: '최근에 뿌듯했던 일 있어요?' },
    { text: '휴가 계획 있어요?', followUps: ['어디로요?'] },
  ],
};

// 일반 대화 질문 (관심사 무관)
export const GENERAL_QUESTIONS: string[] = [
  '요즘 뭐에 빠져 있어요?',
  '주말엔 주로 뭐 하세요?',
  '요즘 재밌게 본 거 있어요?',
  '올해 목표 같은 거 있어요?',
  '취미가 뭐예요?',
  '휴가 계획 있어요?',
  '요즘 관심사가 뭐예요?',
  '스트레스 풀 때 뭐 해요?',
];

// ==========================================
// 크로스 관심사 질문 (두 관심사 연결)
// ==========================================
export interface CrossInterestQuestion {
  interestA: string;
  interestB: string;
  question: string;
}

export const CROSS_INTEREST_QUESTIONS: CrossInterestQuestion[] = [
  { interestA: 'coffee', interestB: 'reading', question: '카페에서 책 읽는 거 좋아하세요? 추천 카페 있어요?' },
  { interestA: 'hiking', interestB: 'photography', question: '등산하면서 사진도 찍으세요? 멋진 풍경 사진 있어요?' },
  { interestA: 'cooking', interestB: 'overseas-travel', question: '여행 가서 먹었던 음식 직접 만들어본 적 있어요?' },
  { interestA: 'fitness', interestB: 'cooking', question: '운동하면서 식단 관리도 하세요? 추천 레시피 있어요?' },
  { interestA: 'programming', interestB: 'gaming', question: '게임 만들어본 적 있어요? 아니면 만들고 싶은 게임 있어요?' },
  { interestA: 'movies', interestB: 'reading', question: '원작 소설이 좋아요 영화가 좋아요? 괜찮았던 원작 기반 영화 있어요?' },
  { interestA: 'music', interestB: 'running', question: '달릴 때 듣는 플레이리스트 있어요? 공유해주세요!' },
  { interestA: 'coffee', interestB: 'design', question: '카페 인테리어 보면서 영감 받는 편이에요?' },
  { interestA: 'camping', interestB: 'cooking', question: '캠핑할 때 요리 직접 하세요? 캠핑 요리 추천해주세요!' },
  { interestA: 'fashion', interestB: 'photography', question: '패션 사진 찍는 거 좋아하세요? 아웃핏 공유 많이 하세요?' },
  { interestA: 'pet', interestB: 'hiking', question: '반려동물이랑 산책 자주 하세요? 추천 코스 있어요?' },
  { interestA: 'ai', interestB: 'design', question: 'AI 디자인 도구 써보셨어요? 어떤게 좋아요?' },
  { interestA: 'drama', interestB: 'korean-food', question: '드라마 보면서 나온 음식 해먹어본 적 있어요?' },
  { interestA: 'wine', interestB: 'cooking', question: '와인이랑 잘 어울리는 요리 추천해주세요!' },
  { interestA: 'meditation', interestB: 'running', question: '러닝도 일종의 명상이라는 말에 공감하세요?' },
];

// 관심사 ID로 추천 질문 가져오기 (text만 반환하는 레거시 호환용)
export const getQuestionsForInterest = (interestId: string): string[] => {
  const found = INTEREST_QUESTIONS.find(q => q.interestId === interestId);
  return found?.questions.map(q => q.text) || [];
};

// 관심사 ID로 상세 질문 가져오기
export const getDetailedQuestionsForInterest = (interestId: string): QuestionItem[] => {
  const found = INTEREST_QUESTIONS.find(q => q.interestId === interestId);
  return found?.questions || [];
};
