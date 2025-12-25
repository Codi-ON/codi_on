export type RecommendCategory = "TOP" | "BOTTOM" | "OUTER" | "ONEPIECE";

export type RecommendItem = {
  id: string;
  name: string;
  category: RecommendCategory;
};

export type RecommendTodayResponse = {
  date: string; // YYYY-MM-DD
  summary: string;
  items: RecommendItem[];
};