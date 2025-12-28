import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SectionHeader, Button, Stepper, cn } from "@/app/DesignSystem";
import { MapPin, Briefcase, Activity, Umbrella, Navigation, ChevronRight, Info } from "lucide-react";
import { recoRepo } from "@/lib/repo/recoRepo";

// selections는 UI 용. 서버에 보낼 때도 그대로 쓰면 됨.
export type RecommendationRequest = {
  selections?: Record<number, string>;
};

type RecommendationClosetList = {
  top: Array<{ id: string; category: "TOP"; name: string; brand?: string; imageUrl?: string | null }>;
  bottom: Array<{ id: string; category: "BOTTOM"; name: string; brand?: string; imageUrl?: string | null }>;
  outer: Array<{ id: string; category: "OUTER"; name: string; brand?: string; imageUrl?: string | null }>;
};

const ChecklistPage: React.FC = () => {
  const navigate = useNavigate();

  const steps = ["날씨 분석", "활동 체크", "스타일 생성", "최종 제안"];
  const [selections, setSelections] = useState<Record<number, string>>({});
  const [recoList, setRecoList] = useState<RecommendationClosetList | null>(null);
  const [loadingReco, setLoadingReco] = useState(false);
  const [recoError, setRecoError] = useState<string | null>(null);

  const questions = [
    {
      q: "오늘 주요 활동 장소는 어디인가요?",
      subtitle: "실내/실외 비중에 따라 소재와 두께감을 조절해 드립니다.",
      options: [
        { label: "실내 위주 (사무실/카페)", icon: Briefcase },
        { label: "야외 활동 많음 (출장/여행)", icon: MapPin },
        { label: "장거리 이동 (대중교통/운전)", icon: Navigation },
      ],
    },
    {
      q: "오늘 어떤 성격의 모임이 있나요?",
      subtitle: "상황에 맞는 격식 수준을 AI가 판단합니다.",
      options: [
        { label: "비즈니스 / 포멀", icon: Briefcase },
        { label: "캐주얼 / 데일리", icon: Activity },
        { label: "특별한 기념일 / 데이트", icon: Umbrella },
      ],
    },
    {
      q: "예상 활동 강도는 어느 정도인가요?",
      subtitle: "땀 배출과 활동성을 고려한 추천을 제공합니다.",
      options: [
        { label: "정적임 (앉아있는 시간 많음)", icon: Briefcase },
        { label: "적당함 (일반적인 도심 활동)", icon: Activity },
        { label: "매우 높음 (장시간 걷기/운동)", icon: Activity },
      ],
    },
  ];

  const handleSelect = (qIdx: number, opt: string) => {
    setSelections((prev) => ({ ...prev, [qIdx]: opt }));
  };

  const isReady = useMemo(
    () => Object.keys(selections).length === questions.length,
    [selections, questions.length]
  );

  // ✅ selections 완성되면 repo 호출(mock이면 즉시 mock 반환)
  useEffect(() => {
    let alive = true;

    const run = async () => {
      if (!isReady) {
        setRecoList(null);
        setRecoError(null);
        return;
      }

      setLoadingReco(true);
      setRecoError(null);

      try {
        const result = await recoRepo.getRecommendationClosetList({ selections });
        if (!alive) return;
        setRecoList(result as any);
      } catch (e: any) {
        if (!alive) return;
        setRecoList(null);
        setRecoError(e?.message ?? "추천 후보 생성에 실패했습니다.");
      } finally {
        if (!alive) return;
        setLoadingReco(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [isReady, selections]);

  const canGoNext = isReady && !loadingReco && !!recoList;

  const goNext = () => {
    if (!canGoNext || !recoList) return;
    // ✅ state로 넘기되, RecommendationPage는 state 없어도 repo로 복구됨
    navigate("/recommendation", {
      state: { selections, recoList },
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      <Stepper steps={steps} currentStep={1} />

      {/* CTA */}
      <div className="sticky top-6 z-30 flex justify-end">
        <Button
          variant="secondary"
          size="lg"
          className={cn(
            "h-14 px-10 shadow-2xl",
            canGoNext ? "shadow-orange-500/20" : "shadow-slate-200/40"
          )}
          disabled={!canGoNext}
          onClick={goNext}
        >
          스타일 제안 보기 <ChevronRight className="ml-2" />
        </Button>
      </div>

      <SectionHeader
        title="활동 분석"
        subtitle="오늘의 추천 정확도를 올리기 위해 핵심 정보만 빠르게 확인할게요."
      />

      <div className="space-y-1">
        <p className="text-slate-400 text-sm font-medium">
          {!isReady && "각 질문에서 1개씩 선택하면 추천 생성이 시작됩니다."}
          {isReady && loadingReco && "추천 후보를 생성 중입니다. 잠시만 기다려주세요."}
          {isReady && !loadingReco && recoList && "추천 후보 생성 완료. 우측 상단 버튼으로 이동하세요."}
        </p>
        {recoError && <p className="text-sm font-bold text-red-500">{recoError}</p>}
      </div>

      <div className="space-y-10">
        {questions.map((item, qIdx) => (
          <div key={qIdx} className="space-y-6">
            <div className="space-y-1 ml-1">
              <h3 className="text-xl font-black text-navy-900 tracking-tighter flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-orange-500 text-white flex items-center justify-center text-[10px]">
                  {qIdx + 1}
                </span>
                {item.q}
              </h3>
              <p className="text-sm text-slate-400 font-medium">{item.subtitle}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {item.options.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => handleSelect(qIdx, opt.label)}
                  className={cn(
                    "flex flex-col items-center gap-4 p-8 rounded-[32px] border-2 transition-all group",
                    selections[qIdx] === opt.label
                      ? "bg-navy-900 border-navy-900 text-white shadow-2xl shadow-navy-900/20"
                      : "bg-white border-slate-100 text-slate-500 hover:border-orange-500/20 hover:bg-orange-50/30"
                  )}
                >
                  <div
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                      selections[qIdx] === opt.label ? "bg-white/10" : "bg-slate-50 group-hover:bg-white"
                    )}
                  >
                    <opt.icon
                      size={24}
                      className={cn(
                        selections[qIdx] === opt.label
                          ? "text-orange-500"
                          : "text-slate-400 group-hover:text-navy-900"
                      )}
                    />
                  </div>
                  <span className="text-sm font-black tracking-tight">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-3 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
        <Info size={18} className="text-slate-400" />
        <p className="text-xs text-slate-500 font-medium">
          답변은 저장하지 않으며 오늘의 추천 생성에만 일시적으로 반영됩니다.
        </p>
      </div>
    </div>
  );
};

export default ChecklistPage;