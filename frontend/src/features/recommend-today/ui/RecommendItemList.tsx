import type { RecommendItem } from "../api/types";

export default function RecommendItemList({ items }: { items: RecommendItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((it) => (
        <div key={it.id} className="rounded-xl border bg-white p-5">
          <div className="text-xs text-gray-500">{it.category}</div>
          <div className="mt-1 text-base font-semibold">{it.name}</div>
        </div>
      ))}
    </div>
  );
}