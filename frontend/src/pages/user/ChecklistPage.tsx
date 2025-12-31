import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SectionHeader, Button, Stepper, cn } from "@/app/DesignSystem";
import {
  MapPin,
  Briefcase,
  Activity,
  Umbrella,
  Navigation,
  ChevronRight,
  Info,
} from "lucide-react";

type Selections = Record<number, string>;

const ChecklistPage: React.FC = () => {
  const navigate = useNavigate();

  const steps = ["날씨 분석", "활동 체크", "스타일 생성", "최종 제안"];
  const [selections, setSelections] = useState<Selections>({});

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

  const goNext = () => {
    if (!isReady) return;

    navigate("/recommendation", {
      state: { selections },
    });
  };

  return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
        <Stepper steps={steps} currentStep={1} />

        {/* ✅ CTA: 3개 선택되면 즉시 활성화 */}
        <div className="sticky top-6 z-30 flex justify-end">
          <Button
              variant="secondary"
              size="lg"
              className={cn(
                  "h-14 px-10 shadow-2xl",
                  isReady ? "shadow-orange-500/20" : "shadow-slate-200/40"
              )}
              disabled={!isReady}
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
            {!isReady
                ? "각 질문에서 1개씩 선택하면 다음 단계(스타일 생성)로 이동할 수 있어요."
                : "선택 완료. 우측 상단 버튼으로 이동하세요."}
          </p>
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
                                selections[qIdx] === opt.label
                                    ? "bg-white/10"
                                    : "bg-slate-50 group-hover:bg-white"
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