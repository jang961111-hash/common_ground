// 관심사 카테고리 및 태그 정의

export type InterestCategory = 
  | '취미'
  | '음악'
  | '스포츠'
  | '음식'
  | '여행'
  | '기술'
  | '문화'
  | '라이프';

export type Interest = {
  id: string;
  label: string;
  emoji: string;
  category: InterestCategory;
};

export const INTERESTS: Interest[] = [
  // 취미
  { id: 'reading', label: '독서', emoji: '📚', category: '취미' },
  { id: 'gaming', label: '게임', emoji: '🎮', category: '취미' },
  { id: 'photography', label: '사진', emoji: '📷', category: '취미' },
  { id: 'drawing', label: '그림', emoji: '🎨', category: '취미' },
  { id: 'cooking', label: '요리', emoji: '👨‍🍳', category: '취미' },
  { id: 'gardening', label: '원예', emoji: '🌱', category: '취미' },
  
  // 음악
  { id: 'kpop', label: 'K-POP', emoji: '🎤', category: '음악' },
  { id: 'hiphop', label: '힙합', emoji: '🎧', category: '음악' },
  { id: 'indie', label: '인디', emoji: '🎸', category: '음악' },
  { id: 'classical', label: '클래식', emoji: '🎻', category: '음악' },
  { id: 'jazz', label: '재즈', emoji: '🎷', category: '음악' },
  { id: 'piano', label: '피아노', emoji: '🎹', category: '음악' },
  
  // 스포츠
  { id: 'fitness', label: '헬스', emoji: '💪', category: '스포츠' },
  { id: 'running', label: '러닝', emoji: '🏃', category: '스포츠' },
  { id: 'climbing', label: '클라이밍', emoji: '🧗', category: '스포츠' },
  { id: 'soccer', label: '축구', emoji: '⚽', category: '스포츠' },
  { id: 'basketball', label: '농구', emoji: '🏀', category: '스포츠' },
  { id: 'swimming', label: '수영', emoji: '🏊', category: '스포츠' },
  { id: 'hiking', label: '등산', emoji: '🥾', category: '스포츠' },
  
  // 음식
  { id: 'coffee', label: '커피', emoji: '☕', category: '음식' },
  { id: 'wine', label: '와인', emoji: '🍷', category: '음식' },
  { id: 'korean-food', label: '한식', emoji: '🍚', category: '음식' },
  { id: 'japanese-food', label: '일식', emoji: '🍣', category: '음식' },
  { id: 'dessert', label: '디저트', emoji: '🍰', category: '음식' },
  { id: 'vegan', label: '비건', emoji: '🥗', category: '음식' },
  
  // 여행
  { id: 'domestic-travel', label: '국내여행', emoji: '🚗', category: '여행' },
  { id: 'overseas-travel', label: '해외여행', emoji: '✈️', category: '여행' },
  { id: 'camping', label: '캠핑', emoji: '⛺', category: '여행' },
  { id: 'backpacking', label: '배낭여행', emoji: '🎒', category: '여행' },
  
  // 기술
  { id: 'programming', label: '프로그래밍', emoji: '💻', category: '기술' },
  { id: 'ai', label: 'AI', emoji: '🤖', category: '기술' },
  { id: 'startup', label: '스타트업', emoji: '🚀', category: '기술' },
  { id: 'crypto', label: '크립토', emoji: '₿', category: '기술' },
  { id: 'design', label: '디자인', emoji: '✏️', category: '기술' },
  
  // 문화
  { id: 'movies', label: '영화', emoji: '🎬', category: '문화' },
  { id: 'drama', label: '드라마', emoji: '📺', category: '문화' },
  { id: 'anime', label: '애니', emoji: '🎌', category: '문화' },
  { id: 'webtoon', label: '웹툰', emoji: '📱', category: '문화' },
  { id: 'exhibition', label: '전시', emoji: '🖼️', category: '문화' },
  { id: 'musical', label: '뮤지컬', emoji: '🎭', category: '문화' },
  
  // 라이프
  { id: 'pet', label: '반려동물', emoji: '🐕', category: '라이프' },
  { id: 'meditation', label: '명상', emoji: '🧘', category: '라이프' },
  { id: 'fashion', label: '패션', emoji: '👗', category: '라이프' },
  { id: 'interior', label: '인테리어', emoji: '🏠', category: '라이프' },
  { id: 'self-dev', label: '자기계발', emoji: '📈', category: '라이프' },
];

export const INTEREST_CATEGORIES: InterestCategory[] = [
  '취미', '음악', '스포츠', '음식', '여행', '기술', '문화', '라이프'
];

export const getInterestById = (id: string): Interest | undefined => {
  return INTERESTS.find(i => i.id === id);
};

export const getInterestsByCategory = (category: InterestCategory): Interest[] => {
  return INTERESTS.filter(i => i.category === category);
};
