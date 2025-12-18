# CODION Backend

CODION 서비스의 API 서버입니다. 사용자/의류/날씨 캐시/추천/행동 로그/관리자 대시보드 통계까지 서비스 전체를 백엔드 기준으로 담당합니다.

## Quick Links
- Swagger: http://localhost:8080/swagger-ui.html
- Team Rules: /.github/commit-pr-guide.md
- PR Template: /.github/pull_request_template.md

## At a Glance

| 항목 | 내용 |
|---|---|
| Runtime | Java 17, Spring Boot |
| DB | PostgreSQL |
| API | REST |
| Docs | Swagger (Source of Truth) |
| Weather Policy | 현재 기본 위치: 서울 고정 (추후 위치 기능 리팩토링) |
| Logging | Click / Session / Recommendation Event / Feedback |
| Admin | Dashboard Overview + 지표/추이/Top N |

## Ownership

| 도메인 | 책임 |
|---|---|
| User / Setting | 사용자 프로필/설정 |
| Closet / Item | 의류(아이템) 등록/수정/삭제/조회 |
| Daily Weather Cache | 일별 날씨 캐싱, 추천 입력 데이터 제공 |
| Recommendation | 추천 생성, 후보군, 체크리스트, 피드백, 히스토리 |
| Logging | 클릭/세션/추천 이벤트 로그 수집 |
| Admin Dashboard | KPI/추이/Top N 등 통계 API 제공 |

## Architecture

```text
Controller  ->  Service  ->  Repository  ->  DB
   |              |
 DTO(Request/Response)   Domain/Enum
```

- Controller: 요청/응답, validation, HTTP contract
- Service: 추천 판단, 집계(통계), 트랜잭션
- Repository: Query, Index 활용
- DTO: 엔티티 직접 노출 금지(응답/호출 기반 DTO 분리)

## Project Structure (Backend)

```text
src/main/java/com.codion.backend
 ├─ api
 │  ├─ controller
 │  ├─ service
 │  └─ dto
 ├─ domain
 │  ├─ entity
 │  ├─ repository
 │  └─ enum
 └─ global
    ├─ config
    └─ exception
```

## Data Model Snapshot (ERD 핵심)

추천 결과만 남기지 않고, 추천이 만들어진 과정(전략/퍼널)과 사용자 반응(클릭/피드백)까지 추적 가능한 구조를 핵심으로 둡니다.

### Core Tables
- USER, USER_SETTING
- CLOSET, CLOTHING_ITEM, CLOTHING_ITEM_SEASON
- DAILY_WEATHER (CACHE)
  - id PK
  - UNIQUE(region, weather_date)
  - feels_like_temperature (double)
  - cloud_amount (int, 0~100)
  - fetched_at 유지
- RECOMMENDATION
- RECOMMENDATION_ITEM_CANDIDATE
- RECOMMENDATION_CHECKLIST
- RECOMMENDATION_EVENT_LOG (월별 파티션)
- RECOMMENDATION_FEEDBACK
- OUTFIT_HISTORY
- ITEM_CLICK_LOG
- SESSION_LOG

## Enums (Contract)

- Category
- UsageType (INDOOR / OUTDOOR / BOTH)
- Thickness
- Season
- RecoStrategy
- RecoFunnel

Enum은 추천 정책/로그 집계에서 서버-클라이언트 계약(contract) 역할을 합니다.

## Running

### Prerequisites
- Java 17
- Docker Desktop
- PostgreSQL (Docker 또는 Local)

### Local
```bash
./gradlew bootRun
```

### Docker
```bash
docker-compose up -d
```

## Configuration (Example)

```text
SPRING_PROFILES_ACTIVE=local

DB_URL=jdbc:postgresql://localhost:5432/codion
DB_USERNAME=codion
DB_PASSWORD=codion
```

## Swagger (API Docs)

Swagger는 정식 엔드포인트 목록의 기준입니다.

```text
http://localhost:8080/swagger-ui.html
```

## Official Endpoint Index (정식 엔드포인트 인덱스)

README는 “인덱스”, Swagger는 “정식 계약서”로 유지합니다. (경로/스펙 변경 시 Swagger 우선)

### Admin Dashboard
| Method | Path | Purpose |
|---|---|---|
| GET | /api/admin/dashboard/overview | 대시보드 상단 KPI 요약 |
| GET | /api/admin/dashboard/clicks/daily | 일별 클릭 추이(그래프용) |
| GET | /api/admin/dashboard/clicks/top-items | 많이 클릭된 아이템 TOP N |

### Logging
| Method | Path | Purpose |
|---|---|---|
| POST | /api/log/item-clicks | 아이템 클릭 로그 적재 |
| POST | /api/log/sessions | 세션 로그 적재 |
| POST | /api/log/recommendation-events | 추천 이벤트 로그 적재(퍼널/전략) |

### Recommendation
| Method | Path | Purpose |
|---|---|---|
| POST | /api/recommendations | 추천 생성 |
| GET | /api/recommendations/{id} | 추천 상세 조회 |
| GET | /api/recommendations/history | 추천 히스토리 |
| POST | /api/recommendations/{id}/feedback | 추천 피드백 저장 |

### Closet / Item
| Method | Path | Purpose |
|---|---|---|
| POST | /api/closet/items | 의류 등록 |
| PUT | /api/closet/items/{id} | 의류 수정 |
| DELETE | /api/closet/items/{id} | 의류 삭제 |
| GET | /api/closet/items | 의류 목록 조회 |

### Weather Cache
| Method | Path | Purpose |
|---|---|---|
| GET | /api/weather/daily | 일별 날씨 캐시 조회 |
| POST | /api/weather/daily/refresh | 캐시 갱신(필요 시) |

## Admin Dashboard Data Contract (프론트/대시보드 계약)

대시보드는 “데이터 계약”이 핵심입니다. 프론트 카드/차트/테이블이 안정적으로 붙도록 응답 DTO를 고정합니다.

### 1) GET /api/admin/dashboard/overview

Response (Example)
```json
{
  "range": { "from": "2025-12-01", "to": "2025-12-18" },
  "kpi": {
    "totalUsers": 1204,
    "activeUsers": 312,
    "totalRecommendations": 8421,
    "totalItemClicks": 19650,
    "conversionRate": 0.27
  },
  "top": {
    "topStrategy": "RULE_BASED",
    "topFunnelStep": "RESULT_VIEW"
  }
}
```

Notes
- range: 집계 기간(기본: 최근 7~30일 정책)
- kpi: 상단 카드에 바로 바인딩
- conversionRate: 정의는 팀에서 고정(예: 추천 결과 조회 대비 클릭)

### 2) GET /api/admin/dashboard/clicks/daily?from=YYYY-MM-DD&to=YYYY-MM-DD

Response (Example)
```json
{
  "range": { "from": "2025-12-01", "to": "2025-12-18" },
  "series": [
    { "date": "2025-12-01", "clickCount": 120 },
    { "date": "2025-12-02", "clickCount": 98 },
    { "date": "2025-12-03", "clickCount": 160 }
  ]
}
```

Notes
- 프론트 라인차트/바차트에 바로 사용
- 날짜 누락을 0으로 채울지(서버 보정) 정책으로 고정 가능

### 3) GET /api/admin/dashboard/clicks/top-items?limit=10&from=YYYY-MM-DD&to=YYYY-MM-DD

Response (Example)
```json
{
  "range": { "from": "2025-12-01", "to": "2025-12-18" },
  "items": [
    { "itemId": 101, "name": "Black Puffer Jacket", "category": "OUTER", "clickCount": 320 },
    { "itemId": 58, "name": "Grey Knit", "category": "TOP", "clickCount": 271 }
  ]
}
```

Notes
- limit 기본값: 10
- 프론트는 table/list에 그대로 바인딩

## Smoke Test (Backend Minimum)

- [ ] Swagger UI 접근 가능
- [ ] GET /api/admin/dashboard/overview 200 OK
- [ ] GET /api/admin/dashboard/clicks/daily 200 OK
- [ ] GET /api/admin/dashboard/clicks/top-items 200 OK
- [ ] POST 클릭 로그 적재 200/201 OK
- [ ] POST 세션 로그 적재 200/201 OK
- [ ] POST 추천 생성 200 OK
- [ ] 추천 상세/히스토리 조회 200 OK
- [ ] 피드백 저장 200/201 OK
- [ ] DAILY_WEATHER: UNIQUE(region, weather_date) 중복 방지 확인

## Git Workflow (Team Standard)

### Branch
- feature/* : 기능
- fix/* : 버그
- refactor/* : 리팩토링
- chore/* : 설정/기타
- docs/* : 문서

### Commit Prefix
- feature :
- fix :
- refactor :
- chore :

### PR Rules
- PR 제목 = 브랜치명 그대로
- PR 템플릿 필수
- 한 PR = 한 목적

## Roadmap (Backend)

- 위치 기능 도입: 현재 서울 고정 → 위치 기반 확장
- 로그 집계 성능 개선: 파티션/인덱스/집계 전략 고도화
- 관리자 지표 확장: 퍼널/전략별 성과 지표 강화
- 추천 전략 실험(A/B) 구조 확장


