import type { RecommendationClosetList } from "./types";

export const MOCK_RECO_CLOSET_LIST: RecommendationClosetList = {
  top: [
    { id: "t1", category: "TOP", name: "라이트 니트", brand: "SOFT KNIT", imageUrl: "https://picsum.photos/200/200?random=11" },
    { id: "t2", category: "TOP", name: "린넨 셔츠", brand: "LINEN LINE", imageUrl: "https://picsum.photos/200/200?random=12" },
    { id: "t3", category: "TOP", name: "코튼 셔츠", brand: "CODION BASIC", imageUrl: "https://picsum.photos/200/200?random=13" },
  ],
  bottom: [
    { id: "b1", category: "BOTTOM", name: "코튼 팬츠", brand: "COTTON WORKS", imageUrl: "https://picsum.photos/200/200?random=21" },
    { id: "b2", category: "BOTTOM", name: "테이퍼드 슬랙스", brand: "URBAN LINE", imageUrl: "https://picsum.photos/200/200?random=22" },
    { id: "b3", category: "BOTTOM", name: "와이드 데님", brand: "DAILY DENIM", imageUrl: "https://picsum.photos/200/200?random=23" },
  ],
  outer: [
    { id: "o1", category: "OUTER", name: "미니멀 자켓", brand: "URBAN OUTER", imageUrl: "https://picsum.photos/200/200?random=31" },
    { id: "o2", category: "OUTER", name: "경량 윈드브레이커", brand: "TECH SERIES", imageUrl: "https://picsum.photos/200/200?random=32" },
    { id: "o3", category: "OUTER", name: "라이트 가디건", brand: "CLASSIC KNIT", imageUrl: "https://picsum.photos/200/200?random=33" },
  ],
};