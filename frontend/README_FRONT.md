# Codi-ON Frontend 문서 (React/Next.js · Guest Mode · 2주 MVP 기준)

## 0. 문서 목적
- **프론트 개발 방향을 고정**하고, 언제 다시 봐도 “어디를 어떻게 구현해야 하는지” 바로 이해할 수 있게 정리한다.
- 로그인 없이도 동작하는 **Guest Mode MVP**를 기준으로 한다.
- 이 문서는 **React/Next.js 관점**에서만 작성한다. (백엔드 구현 논의는 제외)

---

## 1. 제품 핵심 루프 (MVP 우선순위)
**날씨 → 체크리스트 → 오늘의 추천 → 아이템 클릭/선택 → 히스토리 확인**

MVP에서 이 루프가 매끄럽게 돌아가면 “서비스가 돈다”가 증명된다.

---

## 2. 범위 정의
### 포함(MVP)
- 오늘 날씨 조회 및 표시
- 체크리스트 입력/저장(로컬)
- 오늘의 추천 조회 및 표시(카테고리별 최대 3개 규칙 반영)
- 옷장(로컬) 등록/목록/검색/필터
- 선택 기록(히스토리) 저장 및 조회
- 클릭/세션/이벤트 로그 전송(실패해도 UX 영향 없음)
- **Empty/Error/Fallback UI** 표준화

### 제외(후순위)
- 로그인/계정/동기화
- My 페이지의 계정 관리(아이디/비밀번호 변경 등)
- 사용자 랭킹/성비/나이대 등 통계 기반 개인화(로그인/데이터 기반이 선행돼야 함)

---

## 3. 기술 스택 (Front Only)
- Framework: **Next.js (App Router) + TypeScript**
- Styling/UI: **TailwindCSS + shadcn/ui**
- Local DB: **IndexedDB (Dexie)**
- API: `fetch` 기반 공통 request 래퍼 (MVP), 추후 RTK Query로 확장 가능
- Utility: `dayjs`, `uuid`
- Quality: ESLint/Prettier, path alias `@/`

---

## 4. 아키텍처 원칙
### 4.1 Guest Mode 원칙
- 로그인 없이도 조회/추천은 동작
- “저장/동기화”가 필요한 기능은 UI에서만 “로그인 유도” (백 작업 없이 처리)
- 유저 상태(옷장/체크리스트/히스토리)는 **로컬(IndexedDB) 기준**

### 4.2 라우팅 원칙 (App Router)
- `/` 진입 시 **로컬 데이터 존재 여부**로 분기
  - 옷장 데이터 존재 → `/main`
  - 없으면 → `/onboarding`
- 로컬 저장소 접근은 Client에서만 가능하므로, 분기 페이지는 Client Component로 구현

### 4.3 API 호출 원칙
- 공통 request 래퍼를 통해 **에러 처리/응답 파싱을 일원화**
- 서버가 비어있거나(빈 배열) dev 환경에서 500이 나도 **정상 플로우로 취급**하고 UI로 흡수한다.

---

## 5. 폴더 구조(권장)
```txt
src/
  app/
    page.tsx                  # '/' → guest 분기
    onboarding/page.tsx
    main/page.tsx
    closet/page.tsx
    history/page.tsx

  components/
    states/EmptyState.tsx
    states/ErrorState.tsx
    states/LoadingState.tsx
    cards/ClothingCard.tsx
    forms/ChecklistForm.tsx

  lib/
    request.ts                # fetch 래퍼 + ApiError
    query.ts                  # URLSearchParams 빌더
    date.ts
    constants.ts

  services/
    weather.ts
    recommend.ts
    clothes.ts
    logs.ts

  db/
    db.ts                     # Dexie 인스턴스/버전
    closetRepo.ts
    settingsRepo.ts
    historyRepo.ts

  types/
    api.ts                    # ApiResponse<T>, 공통 타입
    domain.ts                 # ClothingItem 등 도메인 타입
    enums.ts