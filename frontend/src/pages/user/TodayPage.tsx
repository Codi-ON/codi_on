import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SectionHeader, Card, Badge, Button, cn } from "../../app/DesignSystem";
import { WeatherHeroSection } from "../../shared/ui/sections/WeatherHeroSection";
import { MOCK_WEATHER } from "../../shared/ui/mock/data";
import {
  MapPin,
  RefreshCw,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  History,
  ThermometerSun,
  Activity,
} from "lucide-react";

import OutfitQuickRecoModal, {
  RecommendationClosetList,
} from "@/pages/user/_components/OutfitQuickRecoModal";

const TodayPage: React.FC = () => {
  const navigate = useNavigate();

  // ✅ 모달 오픈 상태
  const [openReco, setOpenReco] = useState(false);

  // ✅ 임시 recoList (지금은 mock, 나중엔 API 결과로 교체)
  const recoList: RecommendationClosetList = {
    top: [
      { id: 1, label: "상의", name: "라이트 니트", brand: "SOFT KNIT", imageUrl: "https://picsum.photos/200/200?random=11", inCloset: true },
      { id: 2, label: "상의", name: "코튼 셔츠", brand: "COTTON BASIC", imageUrl: "https://picsum.photos/200/200?random=12", inCloset: true },
      { id: 3, label: "상의", name: "린넨 셔츠", brand: "LINEN", imageUrl: "https://picsum.photos/200/200?random=13", inCloset: true },
    ],
    bottom: [
      { id: 4, label: "하의", name: "코튼 팬츠", brand: "COTTON WORKS", imageUrl: "https://picsum.photos/200/200?random=21", inCloset: true },
      { id: 5, label: "하의", name: "슬랙스", brand: "URBAN", imageUrl: "https://picsum.photos/200/200?random=22", inCloset: true },
      { id: 6, label: "하의", name: "데님", brand: "DENIM", imageUrl: "https://picsum.photos/200/200?random=23", inCloset: true },
    ],
    outer: [
      { id: 7, label: "아우터", name: "미니멀 자켓", brand: "URBAN OUTER", imageUrl: "https://picsum.photos/200/200?random=31", inCloset: true },
      { id: 8, label: "아우터", name: "윈드브레이커", brand: "SPORT", imageUrl: "https://picsum.photos/200/200?random=32", inCloset: true },
      { id: 9, label: "아우터", name: "가디건", brand: "BASIC", imageUrl: "https://picsum.photos/200/200?random=33", inCloset: true },
    ],
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <SectionHeader
        title="Alex님, 좋은 아침입니다!"
        subtitle="역삼동의 현재 날씨와 Alex님의 선호도를 반영한 오늘의 코디 요약입니다."
        action={
          <>
            <Button variant="outline" size="sm" icon={RefreshCw}>
              날씨 업데이트
            </Button>
            <Button variant="secondary" size="sm" icon={MapPin}>
              서울 역삼동
            </Button>
          </>
        }
      />

      <WeatherHeroSection data={MOCK_WEATHER} />

      <div className="grid lg:grid-cols-12 gap-10">
        {/* LEFT */}
        <div className="lg:col-span-8 space-y-10">
          <Card title="AI 스타일링 분석 리포트" subtitle="데이터 기반 맞춤형 의복 지수 분석">
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="p-8 bg-navy-900 text-white rounded-[40px] shadow-2xl shadow-navy-900/20 relative overflow-hidden">
                  <Sparkles className="absolute -top-4 -right-4 w-24 h-24 text-white/5" />
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-xs font-black">
                      AI
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Personal Stylist Insight
                    </span>
                  </div>
                  <p className="text-xl font-bold leading-snug">
                    오늘 Alex님은 실내 활동 위주이므로, 기온차를 대비한 가벼운 니트와 통기성이 좋은 슬랙스를 매치해보세요.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                    오늘의 주요 추천 사유
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 border border-slate-100">
                      <ThermometerSun size={14} className="text-orange-500" /> 일교차 8°C
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 border border-slate-100">
                      <Activity size={14} className="text-navy-900" /> 낮은 활동량 선호
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 border border-slate-100">
                      <Sparkles size={14} className="text-blue-500" /> 최근 즐겨찾는 색감
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <ul className="space-y-4">
                  {[
                    { text: "오전 10시까지 윈드브레이커 권장", color: "text-orange-500" },
                    { text: "자외선 지수가 높으니 린넨 소재 추천", color: "text-emerald-500" },
                    { text: "오후 6시 이후 갑작스러운 풍속 증가 대비", color: "text-blue-500" },
                  ].map((tip, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group hover:border-navy-900/10 transition-colors"
                    >
                      <CheckCircle2 className={cn("shrink-0 mt-0.5", tip.color)} size={18} />
                      <span className="text-sm font-bold text-slate-700">{tip.text}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant="primary"
                  className="w-full h-14"
                  onClick={() => setOpenReco(true)}
                >
                  전체 코디 리스트 확인
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-8">
            <Card title="내일의 날씨 예보" subtitle="미리 준비하는 내일의 스타일">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl">
                    ☁️
                  </div>
                  <div>
                    <div className="text-lg font-black text-navy-900">14°C / 20°C</div>
                    <div className="text-xs text-slate-400 font-medium">대체로 흐림 · 강수확률 20%</div>
                  </div>
                </div>
                <Badge variant="slate">흐림</Badge>
              </div>
            </Card>

            <Card title="옷장 건강 상태" subtitle="보유 아이템 다양성 분석">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-2xl font-black text-navy-900">Good</div>
                  <p className="text-xs text-slate-400 font-medium">봄/가을 상의 아이템이 풍부합니다.</p>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-slate-100 flex items-center justify-center text-[10px] font-black text-emerald-600">
                  82%
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-4 space-y-10">
          <Card title="최근 코디 히스토리" className="h-full">
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 group-hover:shadow-lg transition-all">
                    <img
                      src={`https://picsum.photos/100/100?random=${i + 20}`}
                      alt="History"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-navy-900 truncate">어반 미니멀 룩</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                      2024.05.{15 - i} · 18°C ☀️
                    </div>
                  </div>
                  <ChevronRight className="text-slate-300 group-hover:text-navy-900 transition-colors" size={16} />
                </div>
              ))}

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-[10px] uppercase tracking-widest font-black"
                icon={History}
                onClick={() => navigate("/history")}
              >
                전체 히스토리 보기
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* ✅ 모달은 페이지 최하단에 1번만 렌더 */}
      <OutfitQuickRecoModal
        open={openReco}
        onClose={() => setOpenReco(false)}
        recoList={recoList}
        contextChips={["18°C", "일교차 8°C", "실내 활동 위주"]}
        onGoRecommendation={() => {
          setOpenReco(false);
          // 원하면 여기서 추천 페이지로 이동시키기
          // navigate("/recommendation", { state: { recoList } })
        }}
      />
    </div>
  );
};

export default TodayPage;