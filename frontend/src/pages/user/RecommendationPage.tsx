import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, Button, Badge, Stepper, cn } from "../../app/DesignSystem";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Calendar as CalendarIcon,
} from "lucide-react";
import OutfitFeedbackCard from "@/pages/user/_components/OutfitFeedbackCard";

export type ClosetItem = {
  id: string | number;
  label: "상의" | "하의" | "아우터";
  name: string;
  brand?: string;
  imageUrl?: string;
  inCloset?: boolean;
};

export type RecommendationClosetList = {
  top: ClosetItem[];
  bottom: ClosetItem[];
  outer: ClosetItem[];
};

type LocationState = {
  recoList?: RecommendationClosetList;
  selections?: Record<number, string>;
};

const RecommendationPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: LocationState };

  const recoList = state?.recoList;
  const steps = ["날씨 분석", "활동 체크", "스타일 생성", "최종 제안"];

  if (!recoList?.top?.length || !recoList?.bottom?.length || !recoList?.outer?.length) {
    return (
      <div className="space-y-10">
        <Stepper steps={steps} currentStep={3} />
        <Card className="p-14 text-center border-2 border-slate-100">
          <div className="text-2xl font-black text-navy-900">추천 후보 데이터가 비어있습니다</div>
          <div className="mt-2 text-sm text-slate-400 font-medium">
            ChecklistPage에서 navigate 시 recoList를 state로 전달해야 합니다.
          </div>
          <div className="mt-8">
            <Button onClick={() => navigate("/checklist")} className="h-11 px-8">
              체크리스트로 돌아가기
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const [topIdx, setTopIdx] = useState(0);
  const [bottomIdx, setBottomIdx] = useState(0);
  const [outerIdx, setOuterIdx] = useState(0);

  const selectedOutfit = useMemo(
    () => ({
      top: recoList.top[topIdx],
      bottom: recoList.bottom[bottomIdx],
      outer: recoList.outer[outerIdx],
    }),
    [recoList, topIdx, bottomIdx, outerIdx]
  );

  const goCalendar = () => {
    navigate("/calendar", { state: { selectedOutfit } });
  };

  const Chooser = ({
    title,
    list,
    index,
    onPrev,
    onNext,
  }: {
    title: "상의" | "하의" | "아우터";
    list: ClosetItem[];
    index: number;
    onPrev: () => void;
    onNext: () => void;
  }) => {
    const item = list[index];

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="text-sm font-black text-slate-500">{title}</div>
          <div className="text-xs font-black text-slate-300">
            {index + 1}/{list.length}
          </div>
        </div>

        <div className="rounded-[28px] border-2 border-slate-100 bg-white p-5">
          <div className="grid grid-cols-[120px_1fr] gap-5 items-center">
            {/* 이미지 영역 */}
            <div className="relative w-[120px] h-[120px]">
              <div className="w-full h-full rounded-[26px] bg-slate-100 overflow-hidden border border-slate-200">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-black text-slate-300">
                    NO IMG
                  </div>
                )}
              </div>

              {/* 버튼은 “사진 양옆” */}
              <button
                onClick={onPrev}
                className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white border border-slate-100 shadow-lg flex items-center justify-center hover:bg-slate-50"
                aria-label="prev"
              >
                <ChevronLeft />
              </button>
              <button
                onClick={onNext}
                className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white border border-slate-100 shadow-lg flex items-center justify-center hover:bg-slate-50"
                aria-label="next"
              >
                <ChevronRight />
              </button>
            </div>

            {/* 텍스트 영역 */}
            <div className="min-w-0">
              <div className="text-[11px] font-black text-slate-300 tracking-widest uppercase">
                {title} · {(item.brand ?? "CODION").toString()}
              </div>

              <div className="mt-1 text-xl font-black text-navy-900 truncate">{item.name}</div>

              <div className="mt-2 flex items-center gap-2">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle size={16} />
                  <span className="text-sm font-black">
                    {item.inCloset === false ? "미보관" : "옷장 보관 중"}
                  </span>
                </div>
                <span className="text-sm font-black text-slate-300">·</span>
                <span className="text-sm font-black text-slate-400">후보 교체</span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                {list.map((_, i) => (
                  <span
                    key={i}
                    className={cn("w-2.5 h-2.5 rounded-full", i === index ? "bg-orange-500" : "bg-slate-200")}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <Stepper steps={steps} currentStep={3} />

      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* LEFT */}
          <Card className="lg:col-span-7 p-7 border-2 border-slate-100 shadow-2xl shadow-navy-900/[0.03]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-black text-slate-300 tracking-widest uppercase">구성 아이템 선택</div>
                <div className="mt-2 text-2xl font-black text-navy-900 tracking-tight">오늘의 추천 조합</div>
              </div>
              <Badge variant="slate">후보 교체 가능</Badge>
            </div>

            <div className="mt-7 space-y-7">
              <Chooser
                title="상의"
                list={recoList.top}
                index={topIdx}
                onPrev={() => setTopIdx((p) => (p - 1 + recoList.top.length) % recoList.top.length)}
                onNext={() => setTopIdx((p) => (p + 1) % recoList.top.length)}
              />
              <Chooser
                title="하의"
                list={recoList.bottom}
                index={bottomIdx}
                onPrev={() => setBottomIdx((p) => (p - 1 + recoList.bottom.length) % recoList.bottom.length)}
                onNext={() => setBottomIdx((p) => (p + 1) % recoList.bottom.length)}
              />
              <Chooser
                title="아우터"
                list={recoList.outer}
                index={outerIdx}
                onPrev={() => setOuterIdx((p) => (p - 1 + recoList.outer.length) % recoList.outer.length)}
                onNext={() => setOuterIdx((p) => (p + 1) % recoList.outer.length)}
              />
            </div>
          </Card>

          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
            <Card className="p-7 border-2 border-slate-100 shadow-2xl shadow-navy-900/[0.03]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-black text-slate-300 tracking-widest uppercase">최종 미리보기</div>
                  <div className="mt-2 text-2xl font-black text-navy-900 tracking-tight">선택한 조합</div>
                </div>

                <Button
                  variant="secondary"
                  size="lg"
                  className="h-11 px-5 text-sm font-black whitespace-nowrap shadow-2xl shadow-orange-500/20"
                  onClick={goCalendar}
                >
                  캘린더에 저장하기 <CalendarIcon className="ml-2" size={18} />
                </Button>
              </div>

              <div className="mt-7 grid grid-cols-3 gap-3">
                {[
                  { label: "상의", item: selectedOutfit.top },
                  { label: "하의", item: selectedOutfit.bottom },
                  { label: "아우터", item: selectedOutfit.outer },
                ].map(({ label, item }) => (
                  <div key={label} className="rounded-[24px] border border-slate-100 bg-white p-4 text-center">
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate-300">
                          NO IMG
                        </div>
                      )}
                    </div>

                    <div className="mt-2 text-[10px] font-black text-slate-300 tracking-widest uppercase">{label}</div>
                    <div className="mt-1 text-sm font-black text-navy-900 truncate">{item.name}</div>

                    <div className="mt-2 flex items-center justify-center gap-2 text-emerald-600">
                      <CheckCircle size={14} />
                      <span className="text-[11px] font-black">옷장 보관</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 안내/가이드는 “짧게 1줄”만 */}
              <div className="mt-6 rounded-[12px] border border-slate-100 bg-slate-50 px-5 py-4">
                <div className="text-sm font-bold text-slate-600">
                 오늘은 어제보다 5도 높아요! 옷 선택 시 유의하세요
                </div>
              </div>
            </Card>

            <OutfitFeedbackCard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecommendationPage;