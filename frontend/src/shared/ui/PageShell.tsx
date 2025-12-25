import type { PropsWithChildren, ReactNode } from "react";

type Props = PropsWithChildren<{
  title: string;
  right?: ReactNode;
}>;

export default function PageShell({ title, right, children }: Props) {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {right}
      </div>
      {children}
    </div>
  );
}