export default function HistoryPage() {
  return (
    <div className="min-h-screen p-6 bg-brand-bg">
      <h1 className="text-2xl font-bold mb-2">히스토리</h1>
      <p className="text-slate-600 mb-6">
        TODO: 선택했던 옷 기록을 달력(안1) 또는 시즌 묶음(안2)으로 노출
      </p>

      <div className="bg-white rounded-2xl p-4 shadow-card">
        <p className="text-slate-600">
          TODO: 로컬 저장(IndexedDB) → 추후 로그인 시 서버 Import
        </p>
      </div>
    </div>
  );
}