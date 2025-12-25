// src/shared/types.ts

export type RecoLabel = "상의" | "하의" | "아우터";

export type RecoItem = {
  id: string | number;
  label: RecoLabel;
  name: string;
  brand?: string;
  imageUrl?: string;
  inCloset?: boolean;
};

export type RecommendationClosetList = {
  top: RecoItem[];
  bottom: RecoItem[];
  outer: RecoItem[];
};