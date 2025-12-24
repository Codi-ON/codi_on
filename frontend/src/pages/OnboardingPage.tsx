import { useNavigate } from "react-router-dom";
import { PATHS } from "@/routes/paths";

export default function OnboardingPage() {
  const nav = useNavigate();

  return (
    <div className="min-h-screen p-6 bg-brand-bg">
      <h1 className="text-2xl font-bold mb-2">온보딩</h1>
      <p className="text-slate-600 mb-6">
        게스트 모드로 바로 사용 가능합니다. (로그인은 추후)
      </p>

      <div className="space-y-3">
        <button
          className="w-full rounded-xl bg-brand-primary text-white py-3 shadow-card hover:shadow-card-hover transition"
          onClick={() => nav(PATHS.main)}
        >
          오늘 추천 보러가기
        </button>

        <button
          className="w-full rounded-xl bg-white py-3 shadow-card hover:shadow-card-hover transition"
          onClick={() => nav(PATHS.closet)}
        >
          옷장 등록/관리로 이동
        </button>
      </div>
    </div>
  );
}