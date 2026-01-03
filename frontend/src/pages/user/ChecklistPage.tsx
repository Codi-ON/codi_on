// src/pages/user/ChecklistPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SectionHeader, Button, Stepper, cn } from "@/app/DesignSystem";
import {
  Briefcase,
  MapPin,
  Navigation,
  Activity,
  Zap,
  ThermometerSun,
  ThermometerSnowflake,
  ThumbsUp,
  HelpCircle,
  ChevronRight,
  Info,
} from "lucide-react";

import { useAppDispatch } from "@/state/hooks/hooks";
import { setChecklist } from "@/state/outfitReco/outfitRecoSlice";

export type UsageType = "INDOOR" | "OUTDOOR" | "BOTH";
export type ThicknessLevel = "THICK" | "NORMAL" | "THIN";
export type YesterdayFeedback = "HOT" | "OK" | "COLD" | "UNKNOWN";

export type ChecklistAnswer = {
  usageType?: UsageType;
  thicknessLevel?: ThicknessLevel; // 활동 강도로 산출/선택
  yesterdayFeedback?: YesterdayFeedback;
};

export type ChecklistSubmitDto = Required<
    Pick<ChecklistAnswer, "usageType" | "thicknessLevel" | "yesterdayFeedback">
> & {
  clientDateISO?: string;
};

const STORAGE_KEY = "codion.checklist.answer.v1";

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

type QuestionKey = keyof ChecklistAnswer;

type Question<T extends QuestionKey> = {
  key: T;
  q: string;
  subtitle: string;
  cols: 3 | 4;
  options: Array<{
    label: string;
    value: NonNullable<ChecklistAnswer[T]>;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }>;
};

const steps = ["날씨 분석", "활동 체크", "스타일 생성", "최종 제안"];

const questions: Array<Question<any>> = [
  {
    key: "usageType",
    q: "오늘 주요 활동 환경은 어떤가요?",
    subtitle: "실내/실외 비중에 따라 추천 후보를 조정합니다.",
    cols: 3,
    options: [
      { label: "실내 위주", value: "INDOOR" as UsageType, icon: Briefcase },
      { label: "실외 위주", value: "OUTDOOR" as UsageType, icon: MapPin },
      { label: "실내/실외 반반", value: "BOTH" as UsageType, icon: Navigation },
    ],
  },
  {
    key: "thicknessLevel",
    q: "오늘 예상 활동 강도는 어느 정도인가요?",
    subtitle: "활동성이 높을수록 가벼운 두께가 편한 경우가 많습니다.",
    cols: 3,
    options: [
      { label: "정적임", value: "THICK" as ThicknessLevel, icon: Briefcase },
      { label: "적당함", value: "NORMAL" as ThicknessLevel, icon: Activity },
      { label: "매우 높음", value: "THIN" as ThicknessLevel, icon: Zap },
    ],
  },
  {
    key: "yesterdayFeedback",
    q: "어제 코디는 어땠나요?",
    subtitle: "누적 피드백으로 다음 추천을 미세조정합니다.",
    cols: 4,
    options: [
      { label: "더웠어요", value: "HOT" as YesterdayFeedback, icon: ThermometerSun },
      { label: "딱 좋았어요", value: "OK" as YesterdayFeedback, icon: ThumbsUp },
      { label: "추웠어요", value: "COLD" as YesterdayFeedback, icon: ThermometerSnowflake },
      { label: "모르겠어요", value: "UNKNOWN" as YesterdayFeedback, icon: HelpCircle },
    ],
  },
];

const ChecklistPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [answer, setAnswer] = useState<ChecklistAnswer>({});

  // ✅ 세션 복구(직접접속/새로고침 대비)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") setAnswer(parsed);
    } catch {
      // ignore
    }
  }, []);

  // ✅ 세션 저장
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answer));
    } catch {
      // ignore
    }
  }, [answer]);

  const completedCount = useMemo(() => {
    let c = 0;
    if (answer.usageType) c++;
    if (answer.thicknessLevel) c++;
    if (answer.yesterdayFeedback) c++;
    return c;
  }, [answer]);

  const isReady = completedCount === 3;

  const onSelect = <T extends QuestionKey>(key: T, value: NonNullable<ChecklistAnswer[T]>) => {
    setAnswer((prev) => ({ ...prev, [key]: value }));
  };

  const goNext = () => {
    if (!isReady) return;

    const submit: ChecklistSubmitDto = {
      usageType: answer.usageType!,
      thicknessLevel: answer.thicknessLevel!,
      yesterdayFeedback: answer.yesterdayFeedback!,
      clientDateISO: toISODate(new Date()),
    };

    // ✅ Redux에 저장 (RecommendationPage에서 전역으로 읽음)
    dispatch(setChecklist(submit));

    // ✅ state로 넘기지 않는다
    navigate("/recommendation");
  };

  return (
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
        <Stepper steps={steps} currentStep={1} />

        {/* ✅ CTA: 3개 선택되면 활성화 */}
        <div className="sticky top-6 z-30 flex justify-end">
          <Button
              variant="secondary"
              size="lg"
              className={cn("h-14 px-10 shadow-2xl", isReady ? "shadow-orange-500/20" : "shadow-slate-200/40")}
              disabled={!isReady}
              onClick={goNext}
          >
            스타일 제안 보기 <ChevronRight className="ml-2" />
          </Button>
        </div>

        <SectionHeader title="활동 체크리스트" subtitle="오늘 추천 정확도를 올리기 위해 3가지만 빠르게 확인할게요." />

        <div className="space-y-1">
          <p className="text-slate-400 text-sm font-medium">
            {!isReady ? `각 질문에서 1개씩 선택하세요. (${completedCount}/3)` : "선택 완료. 우측 상단 버튼으로 이동하세요."}
          </p>
        </div>

        <div className="space-y-10">
          {questions.map((item, idx) => {
            const selected = answer[item.key] as string | undefined;
            const gridCols = item.cols === 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-1 md:grid-cols-3";

            return (
                <div key={item.key} className="space-y-6">
                  <div className="space-y-1 ml-1">
                    <h3 className="text-xl font-black text-navy-900 tracking-tighter flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-orange-500 text-white flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                      {item.q}
                    </h3>
                    <p className="text-sm text-slate-400 font-medium">{item.subtitle}</p>
                  </div>

                  <div className={cn("grid gap-4", gridCols)}>
                    {item.options.map((opt) => {
                      const active = selected === opt.value;
                      return (
                          <button
                              key={String(opt.value)}
                              onClick={() => onSelect(item.key, opt.value)}
                              className={cn(
                                  "flex flex-col items-center gap-4 p-8 rounded-[32px] border-2 transition-all group",
                                  active
                                      ? "bg-navy-900 border-navy-900 text-white shadow-2xl shadow-navy-900/20"
                                      : "bg-white border-slate-100 text-slate-500 hover:border-orange-500/20 hover:bg-orange-50/30"
                              )}
                          >
                            <div
                                className={cn(
                                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                                    active ? "bg-white/10" : "bg-slate-50 group-hover:bg-white"
                                )}
                            >
                              <opt.icon
                                  size={24}
                                  className={cn(active ? "text-orange-500" : "text-slate-400 group-hover:text-navy-900")}
                              />
                            </div>
                            <span className="text-sm font-black tracking-tight">{opt.label}</span>
                          </button>
                      );
                    })}
                  </div>
                </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-3 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
          <Info size={18} className="text-slate-400" />
          <p className="text-xs text-slate-500 font-medium">답변은 세션에만 임시 저장되며, 오늘의 추천 생성에만 반영됩니다.</p>
        </div>
      </div>
  );
};

export default ChecklistPage;