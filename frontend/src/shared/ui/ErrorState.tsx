export default function ErrorState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
      <div className="text-base font-semibold text-red-900">{title}</div>
      {description && <div className="mt-2 text-sm text-red-800">{description}</div>}
    </div>
  );
}