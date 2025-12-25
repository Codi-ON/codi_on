import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/health", () => {
    return HttpResponse.json({ ok: true });
  }),

  http.get("/api/recommend/today", () => {
    return HttpResponse.json({
      date: "2025-12-25",
      summary: "추천 3세트",
      items: [
        { id: "1", name: "맨투맨", category: "TOP" },
        { id: "2", name: "슬랙스", category: "BOTTOM" },
        { id: "3", name: "롱코트", category: "OUTER" },
      ],
    });
  }),
];