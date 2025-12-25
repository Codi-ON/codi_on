import type { RecommendTodayResponse } from "../api/types";

export default function RecommendSummaryCard({ data }: { data: RecommendTodayResponse }) {
  return (
    <div className="rounded-xl border bg-white p-6">
      <div className="text-sm text-gray-500">{data.date}</div>
      <div className="mt-1 text-lg font-semibold">{data.summary}</div>
    </div>
  );
}