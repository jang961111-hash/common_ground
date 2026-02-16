// ==========================================
// 질문 추천 엔진
// ==========================================
// 공통 관심사, 크로스 관심사, 상황별 질문을 종합적으로 생성

import {
  QuestionItem,
  QuestionDepth,
  getDetailedQuestionsForInterest,
  CROSS_INTEREST_QUESTIONS,
  SITUATION_QUESTIONS,
  SituationCategory,
  SituationQuestion,
  GENERAL_QUESTIONS,
} from '../constants/questions';

// ── 생성된 질문 아이템 ──
export interface GeneratedQuestion {
  id: string;
  text: string;
  depth: QuestionDepth;
  source: 'common' | 'their' | 'cross' | 'situation' | 'general';
  /** 관련 관심사 ID */
  interestId?: string;
  /** 크로스 관심사 ID 쌍 */
  crossInterests?: [string, string];
  /** 후속 질문 목록 */
  followUps?: string[];
  /** 상황 카테고리 */
  situation?: SituationCategory;
}

// ── 추천 결과 ──
export interface QuestionRecommendation {
  /** 공통 관심사 기반 */
  commonQuestions: GeneratedQuestion[];
  /** 상대방만의 관심사 */
  theirQuestions: GeneratedQuestion[];
  /** 크로스 관심사 (두 관심사 연결) */
  crossQuestions: GeneratedQuestion[];
  /** 상황별 아이스브레이커 */
  situationQuestions: GeneratedQuestion[];
  /** 모든 질문 합쳐서 깊이별로 분류 */
  byDepth: Record<QuestionDepth, GeneratedQuestion[]>;
  /** 총 질문 수 */
  totalCount: number;
}

// 셔플 유틸
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── 메인 추천 함수 ──
export function generateQuestions(params: {
  myInterests: string[];
  theirInterests: string[];
  /** 깊이 필터 (없으면 전체) */
  depthFilter?: QuestionDepth;
  /** 상황 필터 */
  situationFilter?: SituationCategory;
  /** 이미 본 질문 ID (중복 방지) */
  seenIds?: Set<string>;
}): QuestionRecommendation {
  const { myInterests, theirInterests, depthFilter, situationFilter, seenIds } = params;

  const commonIds = theirInterests.filter(id => myInterests.includes(id));
  const onlyTheirIds = theirInterests.filter(id => !myInterests.includes(id));

  let idCounter = 0;
  const makeId = (prefix: string) => `${prefix}-${idCounter++}`;

  // 1. 공통 관심사 기반 질문
  const commonQuestions: GeneratedQuestion[] = [];
  for (const interestId of commonIds) {
    let items = getDetailedQuestionsForInterest(interestId);
    if (depthFilter) items = items.filter(q => q.depth === depthFilter);
    const picked = shuffle(items).slice(0, 3);
    for (const q of picked) {
      commonQuestions.push({
        id: makeId('common'),
        text: q.text,
        depth: q.depth,
        source: 'common',
        interestId,
        followUps: q.followUps,
      });
    }
  }

  // 2. 상대방만의 관심사
  const theirQuestions: GeneratedQuestion[] = [];
  for (const interestId of onlyTheirIds.slice(0, 4)) {
    let items = getDetailedQuestionsForInterest(interestId);
    if (depthFilter) items = items.filter(q => q.depth === depthFilter);
    // 상대방 관심사에는 가벼운 질문 위주
    const sorted = items.sort((a, b) => {
      const order: Record<QuestionDepth, number> = { ice: 0, casual: 1, deep: 2 };
      return order[a.depth] - order[b.depth];
    });
    const picked = sorted.slice(0, 2);
    for (const q of picked) {
      theirQuestions.push({
        id: makeId('their'),
        text: q.text,
        depth: q.depth,
        source: 'their',
        interestId,
        followUps: q.followUps,
      });
    }
  }

  // 3. 크로스 관심사 질문
  const crossQuestions: GeneratedQuestion[] = [];
  const allMySet = new Set(myInterests);
  const allTheirSet = new Set(theirInterests);
  for (const cq of CROSS_INTEREST_QUESTIONS) {
    const aInMy = allMySet.has(cq.interestA) || allTheirSet.has(cq.interestA);
    const bInMy = allMySet.has(cq.interestB) || allTheirSet.has(cq.interestB);
    if (aInMy && bInMy) {
      crossQuestions.push({
        id: makeId('cross'),
        text: cq.question,
        depth: 'casual',
        source: 'cross',
        crossInterests: [cq.interestA, cq.interestB],
      });
    }
  }

  // 4. 상황별 질문
  const situationQuestions: GeneratedQuestion[] = [];
  const situations: SituationCategory[] = situationFilter
    ? [situationFilter]
    : ['first_meet', 'group', 'networking', 'casual_chat'];
  
  for (const sit of situations) {
    const qs = SITUATION_QUESTIONS[sit];
    const picked = shuffle(qs).slice(0, situationFilter ? 6 : 2);
    for (const q of picked) {
      situationQuestions.push({
        id: makeId('situation'),
        text: q.text,
        depth: 'ice',
        source: 'situation',
        situation: sit,
        followUps: q.followUps,
      });
    }
  }

  // seenIds 필터
  const filterSeen = (arr: GeneratedQuestion[]) =>
    seenIds ? arr.filter(q => !seenIds.has(q.id)) : arr;

  const all = [
    ...filterSeen(commonQuestions),
    ...filterSeen(theirQuestions),
    ...filterSeen(crossQuestions),
    ...filterSeen(situationQuestions),
  ];

  // 깊이별 분류
  const byDepth: Record<QuestionDepth, GeneratedQuestion[]> = {
    ice: all.filter(q => q.depth === 'ice'),
    casual: all.filter(q => q.depth === 'casual'),
    deep: all.filter(q => q.depth === 'deep'),
  };

  return {
    commonQuestions: filterSeen(commonQuestions),
    theirQuestions: filterSeen(theirQuestions),
    crossQuestions: filterSeen(crossQuestions),
    situationQuestions: filterSeen(situationQuestions),
    byDepth,
    totalCount: all.length,
  };
}

// ── 질문 새로고침 (다른 세트) ──
export function refreshQuestions(params: {
  myInterests: string[];
  theirInterests: string[];
  depthFilter?: QuestionDepth;
  situationFilter?: SituationCategory;
}): QuestionRecommendation {
  return generateQuestions(params);
}
