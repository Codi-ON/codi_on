# Codion Data Contract (Spring ↔ ML)
**Scope:** Today Recommend (MVP)  
**Goal:** Spring과 ML 서비스 간 요청/응답 JSON 스펙을 고정해 연동/디버깅 비용을 최소화한다.  
**Naming:** JSON key는 **camelCase**를 사용한다.

---

## Endpoint
- **Method:** POST
- **Path:** `/v1/recommend/today`

> ML 서비스 base URL은 환경변수로 관리한다.  
> 예) `ML_BASE_URL=http://localhost:8000`

---

## Request (Spring → ML)

### Schema (MVP)
```json
{
  "requestId": "string",
  "userId": 1,
  "topK": 3,
  "weather": {
    "temp": 18.2,
    "humidity": 55,
    "wind": 3.1,
    "rainProb": 20,
    "uvIndex": 3
  },
  "closetItems": [
    {
      "closetItemId": 10,
      "category": "outer",
      "seasonTags": ["spring", "fall"],
      "materialTags": ["cotton"],
      "warmthLevel": 2,
      "waterproof": false,
      "color": "black"
    }
  ],
  "context": {
    "purpose": "work",
    "style": "casual"
  }
}
