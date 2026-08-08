# Common Ground

관심사 기반으로 사람을 연결하는 소셜 네트워킹 앱 프로토타입입니다. React Native(Expo)로 제작 중이며, 현재는 목(mock) 데이터로 전체 화면 흐름을 검증하는 단계입니다.

## 상태

- **진행 단계**: 프론트엔드 UI/UX 프로토타입 (백엔드는 목 데이터 기반, Supabase 연동 준비 중)
- **최근 작업**: 온보딩 튜토리얼 기능 추가 (`작업이력_20260217.md` 참고)
- 실제 서비스 배포 전 단계로, 백엔드 연동·인증·데이터 영속화가 아직 완료되지 않았습니다.

## 주요 기능 (화면 기준)

- **온보딩/인증**: 회원가입, 로그인, 비밀번호 찾기, 8단계 인터랙티브 튜토리얼
- **관심사 매칭**: 관심사 등록/수정, 궁합(compatibility) 계산, 추천 카드
- **디스커버리**: 사용자 탐색(Discover), 검색, 필터
- **연결/커뮤니케이션**: 1:1 대화, 그룹 채팅, 그룹 생성/관리, 대화 주제 추천
- **이벤트**: 이벤트 생성/상세, 참여
- **소셜 피드**: 피드, 스냅샷 갤러리, 북마크, 알림
- **게이미피케이션**: 배지 시스템(카테고리·희귀도별), 배지 획득 모달
- **프로필/설정**: 프로필 편집, 공유 링크, 차단 사용자 관리, 통계·인사이트, 다크/라이트 테마

## 기술 스택

- **App**: React Native 0.81 + Expo ~54 (Expo Router 미사용, React Navigation 사용)
- **언어**: TypeScript
- **네비게이션**: `@react-navigation` (native-stack + bottom-tabs)
- **백엔드/인증**: Supabase (`@supabase/supabase-js`) — 클라이언트 설정만 되어 있고 대부분의 데이터는 아직 `src/services/mockData.ts` / `mockService.ts` 목 데이터로 동작
- **로컬 저장소**: `@react-native-async-storage/async-storage`

## 프로젝트 구조

```
App.tsx                  # 앱 진입점, 네비게이션 스택 구성
src/
  components/             # 재사용 UI 컴포넌트 (Avatar, EventCard, BadgeCard 등)
  screens/                # 화면 단위 컴포넌트 (30개+)
  contexts/               # Auth / Theme / Toast 전역 컨텍스트
  hooks/                  # useApiCall, useCache, useCompatibility 등 커스텀 훅
  constants/              # 배지·관심사·질문·테마 상수 정의
  lib/                    # storage, supabase 클라이언트
  services/               # mockData.ts, mockService.ts (목 데이터 계층), questionEngine.ts
  types/                  # 전역 타입 정의
```

## 실행 방법

```bash
npm install
npm run start      # Expo 개발 서버
npm run ios        # iOS 시뮬레이터
npm run android    # Android 에뮬레이터
npm run web        # 웹
```

`src/lib/supabase.ts`는 `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` 환경변수를 필요로 합니다(현재 저장소에는 값이 커밋되어 있지 않음).

## TODO

- [ ] `mockService.ts` → 실제 Supabase 연동으로 전환
- [ ] 인증 플로우 실제 백엔드 연결
- [ ] 테스트 코드 추가
