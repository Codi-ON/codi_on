export default function ClosetPage() {
  return (
    <div className="min-h-screen p-6 bg-brand-bg">
      <h1 className="text-2xl font-bold mb-2">옷장</h1>
      <p className="text-slate-600 mb-6">
        TODO: 옷 등록/검색/필터(계절/카테고리/이름) + 인기(클릭) 정렬
      </p>

      <div className="bg-white rounded-2xl p-4 shadow-card">
        <p className="text-slate-600">
          TODO: IndexedDB(Dexie) 기반 로컬 옷장 먼저 구현 후, 추후 서버 CRUD로 확장
        </p>
      </div>
    </div>
  );
}