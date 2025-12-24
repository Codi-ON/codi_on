import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "@/routes/paths";

import WebScreens from "@/components/ai-studio/WebScreens";

/**
 * 홈은 "분기 게이트"
 * - 추후 로컬 데이터 여부로 /onboarding vs /main 분기
 */
export default function HomePage() {
  const nav = useNavigate();
  const nextPath = PATHS.main;

  useEffect(() => {
    const t = window.setTimeout(() => nav(nextPath), 300);
    return () => window.clearTimeout(t);
  }, [nav, nextPath]);

  return (
    <div className="min-h-screen">
      {/* 디자인 확인용: AI Studio 화면을 그대로 렌더 */}
      <WebScreens />

      {/* UX 상 자동 이동 안내 */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 glass px-4 py-2 rounded-xl shadow-soft text-sm">
        Loading… 이동 중
      </div>
    </div>
  );
}
