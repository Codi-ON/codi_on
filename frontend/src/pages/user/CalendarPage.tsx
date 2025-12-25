import React, { useMemo } from "react";
import { Card, Button, Badge, SectionHeader, cn } from "../../app/DesignSystem";
import { ChevronLeft, ChevronRight, Filter, Download, CalendarDays, List } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as any;
  const outfit = state?.selectedOutfit; // { top, bottom, outer } (있으면 활용)

  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const dates = Array.from({ length: 35 }, (_, i) => i - 4);

  // (옵션) 오늘 저장한 outfit이 있으면, 달력 상단에 살짝 배지/프리뷰로 활용 가능
  const hasOutfit = useMemo(() => !!outfit, [outfit]);

  return (
    <div className="space-y-10 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <SectionHeader title="OOTD 캘린더" subtitle="한 달 동안의 나의 스타일 기록을 확인하세요." />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={Filter}>
            필터
          </Button>
          <Button variant="outline" size="sm" icon={Download}>
            내보내기
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-navy-900">2024년 5월</h2>
            {hasOutfit && <Badge variant="orange">방금 저장한 코디 있음</Badge>}
          </div>

          <div className="flex gap-1 bg-white border border-slate-200 p-1 rounded-xl">
            <button className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
              <ChevronLeft size={18} />
            </button>
            <button className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      {/* ✅ 하단 토글: 달력(현재) / 리스트(HistoryPage로 라우팅) */}
      <div className="sticky bottom-6 z-30 flex justify-center">
        <div className="rounded-full border border-slate-200 bg-white/90 backdrop-blur px-2 py-2 shadow-lg">
          <div className="flex items-center gap-2">
            <button
              type="button"
              // 현재 페이지니까 이동 없음
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black transition-all",
                "bg-orange-500 text-white shadow-md shadow-orange-500/30"
              )}
              aria-pressed={true}
            >
              <CalendarDays size={18} />
              달력
            </button>

            <button
              type="button"
              onClick={() => navigate("/history")}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black transition-all",
                "bg-transparent text-slate-600 hover:bg-slate-50"
              )}
              aria-pressed={false}
            >
              <List size={18} />
              리스트
            </button>
          </div>
        </div>
      </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-xs font-bold text-slate-500">코디 완료</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-200" />
            <span className="text-xs font-bold text-slate-500">기록 없음</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-100">
          {days.map((d) => (
            <div
              key={d}
              className="py-4 text-center text-[10px] font-black text-slate-400 tracking-widest"
            >
              {d}
            </div>
          ))}
        </div>


        <div className="grid grid-cols-7">
          {dates.map((d, i) => (
            <div
              key={i}
              className={cn(
                "min-h-[140px] border-r border-b border-slate-50 p-4 transition-all hover:bg-slate-50 group cursor-pointer",
                i % 7 === 6 && "border-r-0"
              )}
            >
              <div
                className={cn(
                  "text-sm font-black mb-2",
                  d <= 0 || d > 31 ? "text-slate-200" : "text-slate-400 group-hover:text-navy-900"
                )}
              >
                {d <= 0 ? d + 30 : d > 31 ? d - 31 : d}
              </div>

              {d > 0 && d < 31 && i % 4 === 0 && (
                <div className="space-y-2">
                  <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-sm relative">
                    <img
                      src={`https://picsum.photos/100/100?random=${d}`}
                      className="w-full h-full object-cover"
                      alt="OOTD"
                    />
                    <div className="absolute top-1 right-1">
                      <div className="w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-[8px]">
                        ✨
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-navy-900 truncate">어반 캐주얼</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>


    </div>
  );
};

export default CalendarPage;