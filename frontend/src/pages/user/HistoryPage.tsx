import React from "react";
import { Card } from "../../app/DesignSystem";
import { MOCK_HISTORY } from "../../shared/ui/mock/data";
import { Calendar as CalendarIcon, List, ArrowRight } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // ✅ 라우트 기반 active 처리
  const isList = pathname.startsWith("/history");

  return (
    <div className="space-y-10">
      {/* 헤더 + 토글(라우팅) */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#0F172A] tracking-tighter">스타일 히스토리</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            내가 완성한 과거의 스타일을 한눈에 살펴보세요.
          </p>
        </div>

        {/* ✅ 상단 우측 토글 (라우팅 전환) */}
        <div className="sticky top-6 z-30 self-end">
          <div className="bg-white p-1 rounded-2xl border border-slate-200 flex gap-1 shadow-sm">
            <button
              onClick={() => navigate("/calendar")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                !isList
                  ? "bg-[#0F172A] text-white shadow-lg shadow-navy-900/20"
                  : "text-slate-400 hover:bg-slate-50"
              }`}
            >
              <CalendarIcon size={16} /> 캘린더
            </button>

            <button
              onClick={() => navigate("/history")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isList
                  ? "bg-[#0F172A] text-white shadow-lg shadow-navy-900/20"
                  : "text-slate-400 hover:bg-slate-50"
              }`}
            >
              <List size={16} /> 리스트
            </button>
          </div>
        </div>
      </div>

      {/* ✅ HistoryPage는 “리스트(카드)”만 렌더링 */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {MOCK_HISTORY.map((entry, idx) => (
          <Card key={idx} className="hover:shadow-xl transition-all cursor-pointer group">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{entry.date}</div>
                <div className="text-lg font-black text-[#0F172A]">{entry.styleName}</div>
              </div>
              <div className="text-right">
                <div className="text-xl">{entry.weatherIcon}</div>
                <div className="text-[10px] font-black text-slate-500">{entry.weatherTemp}°C</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {entry.images.map((img, i) => (
                <div key={i} className="aspect-[4/5] bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
                  <img
                    src={img}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    alt="Style"
                  />
                </div>
              ))}
            </div>

            <button className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-[#F97316] hover:text-white transition-all flex items-center justify-center gap-2">
              상세 보기 <ArrowRight size={14} />
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HistoryPage;