import type { RecommendTodayResponse } from "../api/types";
import RecommendSummaryCard from "./RecommendSummaryCard";
import RecommendItemList from "./RecommendItemList";

export default function TodayRecommendSection({ data }: { data: RecommendTodayResponse }) {
  return (
    <section className="space-y-4">
      <RecommendSummaryCard data={data} />
      <RecommendItemList items={data.items} />
    </section>
  );
}