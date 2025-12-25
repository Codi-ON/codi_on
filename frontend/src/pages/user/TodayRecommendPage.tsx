import PageShell from "@/shared/ui/PageShell";
import EmptyState from "@/shared/ui/EmptyState";
import ErrorState from "@/shared/ui/ErrorState";
import TodayRecommendSection from "@/features/recommend-today/ui/TodayRecommendSection";
import { useTodayRecommend } from "@/features/recommend-today/model/useTodayRecommend";

export default function TodayRecommendPage() {
  const { data, isLoading, isError, error } = useTodayRecommend();

  return (
    <PageShell title="오늘의 코디 추천">
      {isLoading && <div className="rounded-xl border bg-white p-6">로딩중…</div>}

      {isError && (
        <ErrorState
          title="추천 데이터를 불러오지 못했습니다."
          description={error instanceof Error ? error.message : "알 수 없는 오류"}
        />
      )}

      {!isLoading && !isError && !data && (
        <EmptyState title="추천 데이터가 없습니다." description="서버 연결/엔드포인트를 확인하세요." />
      )}

      {data && <TodayRecommendSection data={data} />}
    </PageShell>
  );
}