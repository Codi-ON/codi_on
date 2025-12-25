export default function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-6">
      <div className="text-base font-semibold">{title}</div>
      {description && <div className="mt-2 text-sm text-gray-500">{description}</div>}
    </div>
  );
}