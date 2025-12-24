import { useNavigate } from "react-router-dom";
import { PATHS } from "@/routes/paths";
export default function MainPage() {
  const nav = useNavigate();

  return (
    <div className="min-h-screen p-6 bg-brand-bg">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">오늘의 추천</h1>
        <button
          className="px-3 py-2 rounded-lg bg-white shadow-card"
          onClick={() => nav(PATHS.closet)}
        >
          옷장
        </button>
      </header>

      <section className="bg-white rounded-2xl p-4 shadow-card">
        <p className="text-slate-600">
          TODO: GET /api/recommend/today 붙일 자리
        </p>
        <p className="text-slate-500 text-sm mt-2">
          빈 데이터면 EmptyState, 실패면 ErrorState로 처리 예정
        </p>
      </section>

      <div className="mt-6 flex gap-3">
        <button
          className="flex-1 py-3 rounded-xl bg-white shadow-card"
          onClick={() => nav(PATHS.history)}
        >
          히스토리
        </button>
        <button
          className="flex-1 py-3 rounded-xl bg-white shadow-card"
          onClick={() => nav(PATHS.admin)}
        >
          대시보드
        </button>
      </div>
    </div>
  );
}