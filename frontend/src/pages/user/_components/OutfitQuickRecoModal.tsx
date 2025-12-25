import React from "react";
import { Card, Button, Badge, cn } from "@/app/DesignSystem";
import { X, Shirt, Layers, PackageOpen, ChevronRight } from "lucide-react";

export type ClosetItem = {
  id: string | number;
  label: "상의" | "하의" | "아우터";
  name: string;
  brand?: string;
  imageUrl?: string;
  inCloset?: boolean;
};

export type RecommendationClosetList = {
  top: ClosetItem[];     // 3
  bottom: ClosetItem[];  // 3
  outer: ClosetItem[];   // 3
};

type Props = {
  open: boolean;
  onClose: () => void;

  // ✅ 오늘 날씨 기반 추천 후보(각 3개씩)
  recoList?: RecommendationClosetList;

  // optional: 상단 컨텍스트(예: "18°C · 일교차 8°C · 실내 활동")
  contextChips?: string[];

  // optional CTA
  onGoRecommendation?: () => void; // "추천 페이지로 이동" 같은 액션
};

const Section = ({
  title,
  icon,
  items,
}: {
  title: "상의" | "하의" | "아우터";
  icon: React.ReactNode;
  items: ClosetItem[];
}) => {
  return (
    <Card className="p-6 border-2 border-slate-100 shadow-2xl shadow-navy-900/[0.03]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
            {icon}
          </div>
          <div>
            <div className="text-xs font-black text-slate-300 tracking-widest uppercase">
              {title}
            </div>
            <div className="text-lg font-black text-navy-900 tracking-tight">
              추천 후보 {items.length}개
            </div>
          </div>
        </div>
        <Badge variant="slate">후보 교체</Badge>
      </div>

      <div className="mt-5 grid gap-4">
        {items.map((it) => (
          <div
            key={it.id}
            className="flex items-center gap-4 p-4 rounded-[28px] border border-slate-100 bg-white hover:bg-slate-50 transition-colors"
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
              {it.imageUrl ? (
                <img src={it.imageUrl} alt={it.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate-300">
                  NO IMG
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-black text-slate-300 tracking-widest uppercase truncate">
                {(it.brand ?? "CODION").toString()}
              </div>
              <div className="text-sm font-black text-navy-900 truncate">
                {it.name}
              </div>
              <div className="mt-1 text-[11px] font-bold text-slate-400">
                {it.inCloset === false ? "미보관" : "옷장 보관 중"}
              </div>
            </div>

            <ChevronRight className="text-slate-300" size={18} />
          </div>
        ))}
      </div>
    </Card>
  );
};

const OutfitQuickRecoModal: React.FC<Props> = ({
  open,
  onClose,
  recoList,
  contextChips = [],
  onGoRecommendation,
}) => {
  if (!open) return null;

  const hasData =
    !!recoList?.top?.length && !!recoList?.bottom?.length && !!recoList?.outer?.length;

  return (
    <div className="fixed inset-0 z-[999]">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-navy-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* dialog */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl">
          <Card className="border-2 border-slate-100 shadow-2xl shadow-navy-900/20 rounded-[40px] overflow-hidden">
            {/* header */}
            <div className="p-8 bg-white border-b border-slate-50">
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0">
                  <div className="text-xs font-black text-slate-300 tracking-widest uppercase">
                    Today quick recommendation
                  </div>
                  <div className="mt-2 text-2xl font-black text-navy-900 tracking-tight">
                    오늘의 추천 후보 한 번에 보기
                  </div>
                  {contextChips.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {contextChips.map((t) => (
                        <div
                          key={t}
                          className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-600"
                        >
                          {t}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!!onGoRecommendation && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-10 px-4 shadow-2xl shadow-orange-500/20"
                      onClick={onGoRecommendation}
                    >
                      추천 화면으로 <ChevronRight className="ml-1" size={16} />
                    </Button>
                  )}
                  <button
                    onClick={onClose}
                    className="w-11 h-11 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 flex items-center justify-center"
                    aria-label="close"
                  >
                    <X />
                  </button>
                </div>
              </div>
            </div>

            {/* body */}
            <div className="p-8 bg-slate-50/40">
              {!hasData ? (
                <Card className="p-10 border-2 border-slate-100 text-center">
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                    <PackageOpen className="text-slate-400" />
                  </div>
                  <div className="mt-4 text-lg font-black text-navy-900">
                    추천 후보 데이터가 없습니다
                  </div>
                  <div className="mt-2 text-sm text-slate-400 font-medium">
                    recoList(top/bottom/outer 각 3개)를 넘겨주세요.
                  </div>
                  <div className="mt-6">
                    <Button onClick={onClose} className="h-11 px-6">
                      닫기
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="grid lg:grid-cols-3 gap-6">
                  <Section
                    title="상의"
                    icon={<Shirt className="text-orange-500" size={18} />}
                    items={recoList!.top}
                  />
                  <Section
                    title="하의"
                    icon={<Layers className="text-navy-900" size={18} />}
                    items={recoList!.bottom}
                  />
                  <Section
                    title="아우터"
                    icon={<Layers className="text-emerald-600" size={18} />}
                    items={recoList!.outer}
                  />
                </div>
              )}
            </div>

            {/* footer */}
            <div className="p-6 bg-white border-t border-slate-50 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" className="h-10 px-5" onClick={onClose}>
                닫기
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OutfitQuickRecoModal;