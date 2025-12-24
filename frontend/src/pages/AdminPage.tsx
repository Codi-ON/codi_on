export default function AdminPage() {
  return (
    <div className="min-h-screen p-6 bg-brand-bg">
      <h1 className="text-2xl font-bold mb-2">대시보드(관리자)</h1>
      <p className="text-slate-600 mb-6">
        TODO: 세션/클릭/추천 funnel 지표, 월별 다운로드, 최근 로그 조회
      </p>

      <div className="bg-white rounded-2xl p-4 shadow-card">
        <p className="text-slate-600">
          TODO: /api/admin/session-metrics/dashboard, /api/admin/dashboard/clicks 등 연결
        </p>
      </div>
    </div>
  );
}