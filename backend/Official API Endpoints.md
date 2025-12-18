## 정식 엔드포인트 목록 (Official API Endpoints)

> Base URL: `http://localhost:8080`  
> 원칙: 정식 경로는 `/api/**`만 사용 (레거시 경로는 미사용)

### Weather (Public)
- `GET /api/weather/today`  
  - Query(optional): `region`(default: Seoul), `lat`(default: 37.5665), `lon`(default: 126.9780)
- `GET /api/weather/weekly`  
  - Query(optional): `region`(default: Seoul), `lat`(default: 37.5665), `lon`(default: 126.9780)

### Weather (Admin)
- `POST /api/admin/weather/weekly/refresh`  
  - 목적: 주간 날씨 강제 갱신(관리자/배치)

### Logs (Public)
- `POST /api/logs/click`  
  - Body: `ItemClickLogRequestDto`
- `POST /api/logs/session`  
  - Body: `SessionLogRequestDto`

### Admin Dashboard / Analytics
- `GET /api/admin/session-metrics/dashboard`  
  - Query: `from`, `to` (컨트롤러 시그니처 기준 포맷 사용)
- `GET /api/admin/session-logs/recent`  
  - Query(optional): `limit`
- `GET /api/admin/session-logs/range`  
  - Query: `from`, `to`, Query(optional): `limit`
- `GET /api/admin/dashboard/clicks`  
  - Query: `from`, `to`, Query(optional): `topN` (region 정책 유지 시 `region` optional)

### Recommendation (Public)
- `GET /api/recommend/today`  
  - Query(optional): `region`(default: Seoul), `lat`(default: 37.5665), `lon`(default: 126.9780), `limit`(default: 20)
- `GET /api/recommend/today/by-category`  
  - Query: `category`  
  - Query(optional): `region`, `lat`, `lon`, `limit`

### Recommendation Logs (Admin)
- `GET /api/admin/recommendation-logs/recent`  
  - Query(optional): `limit` (default 100, clamp 1~500)
- `GET /api/admin/recommendation-logs/range`  
  - Query: `from`, `to`, Query(optional): `limit` (default 100, clamp 1~500)

### Clothing Items (CRUD + Search)
- `POST /api/clothes`  
  - Body: `ClothingItemCreateRequestDto`
- `GET /api/clothes/{id}`
- `PATCH /api/clothes/{id}`  
  - Body: `ClothingItemUpdateRequestDto`
- `DELETE /api/clothes/{id}`
- `GET /api/clothes/search`  
  - Query: `temp`, `category`, `usageType`, `seasons`, `sort`, `limit`, `clothingId` 등 (DTO 기준)
- `GET /api/clothes/popular`  
  - Query(optional): `category`, `limit`(default 10)
- `POST /api/clothes/{id}/select`  
  - 목적: select count 증가
