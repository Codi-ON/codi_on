// src/pages/user/_components/OutfitFeedbackCard.tsx
import React from "react";
import { Card, cn } from "@/app/DesignSystem";
import { ThumbsUp, HelpCircle, ThumbsDown } from "lucide-react";

import { useAppDispatch, useAppSelector } from "@/state/hooks/hooks";
import { setRecoFeedbackScore } from "@/state/outfitReco/outfitRecoSlice";

type Score = 1 | 0 | -1;

const OPTIONS: Array<{
    label: string;
    score: Score;
    icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
    { label: "딱 좋아요", score: 1, icon: ThumbsUp },
    { label: "모르겠어요", score: 0, icon: HelpCircle },
    { label: "별로예요", score: -1, icon: ThumbsDown },
];

export default function OutfitFeedbackCard() {
    const dispatch = useAppDispatch();
    const score = useAppSelector((s) => s.outfitReco.recoFeedbackScore);

    return (
        <Card className="p-10 border-2 border-slate-100">
            <div className="text-2xl font-black text-navy-900 tracking-tight">오늘 입은 옷은 어떠셨나요?</div>
            <div className="mt-2 text-sm text-slate-400 font-medium">반응을 학습해 다음 추천을 더 정확히 만듭니다.</div>

            <div className="mt-8 grid grid-cols-3 gap-4">
                {OPTIONS.map((opt) => {
                    const active = score === opt.score;
                    return (
                        <button
                            key={opt.score}
                            type="button"
                            onClick={() => dispatch(setRecoFeedbackScore(opt.score))}
                            className={cn(
                                "rounded-[28px] border-2 p-8 text-center transition-all",
                                active
                                    ? "bg-orange-500/95 border-orange-500 text-white shadow-2xl shadow-orange-500/20"
                                    : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
                            )}
                        >
                            <div
                                className={cn(
                                    "mx-auto w-14 h-14 rounded-2xl flex items-center justify-center",
                                    active ? "bg-white/10" : "bg-slate-50"
                                )}
                            >
                                <opt.icon size={22} className={cn(active ? "text-white" : "text-slate-400")} />
                            </div>
                            <div className="mt-4 text-sm font-black">{opt.label}</div>
                        </button>
                    );
                })}
            </div>
        </Card>
    );
}