import React, { useMemo, useState } from "react";
import { Card, cn } from "@/app/DesignSystem";
import { Smile, Frown, Meh } from "lucide-react";

export type OutfitFeedbackRating = -1 | 0 | 1;

type OutfitFeedbackCardProps = {
    title?: string;
    subtitle?: string;

    /** 초기값(서버에서 받은 feedbackScore 그대로 넣기) */
    defaultValue?: OutfitFeedbackRating;

    /**
     * 저장 훅: 여기서 outfitRepo.submitTodayFeedback({ rating }) 호출하면 됨
     * 실패하면 throw 해줘야 카드가 롤백/에러표시 함
     */
    onChange?: (rating: OutfitFeedbackRating) => Promise<void> | void;
};

const OutfitFeedbackCard: React.FC<OutfitFeedbackCardProps> = ({
                                                                   title = "오늘 완료한 옷은 어떠셨나요?",
                                                                   subtitle = "반응을 학습해 다음 추천을 더 정확히 만듭니다.",
                                                                   defaultValue = 0,
                                                                   onChange,
                                                               }) => {
    const [value, setValue] = useState<OutfitFeedbackRating>(defaultValue);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const options = useMemo(
        () => [
            { key: -1 as const, label: "별로예요", Icon: Frown },
            { key: 0 as const, label: "괜찮아요", Icon: Meh },
            { key: 1 as const, label: "딱 좋아요", Icon: Smile },
        ],
        []
    );

    const select = async (next: OutfitFeedbackRating) => {
        if (saving) return;

        const prev = value;
        setValue(next);
        setError(null);

        if (!onChange) return; // UI만 쓰는 경우

        try {
            setSaving(true);
            await onChange(next);
        } catch (e: any) {
            // 실패하면 롤백 + 에러 표시
            setValue(prev);
            setError(e?.message ?? "피드백 저장에 실패했습니다.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="p-7 border-2 border-slate-100 shadow-2xl shadow-navy-900/[0.03]">
            <div className="space-y-2">
                <h3 className="text-xl font-black text-navy-900 tracking-tight">{title}</h3>
                <p className="text-sm text-slate-400 font-medium">{subtitle}</p>
            </div>

            {error && (
                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {error}
                </div>
            )}

            <div className="mt-6 grid grid-cols-3 gap-3">
                {options.map(({ key, label, Icon }) => {
                    const active = value === key;

                    return (
                        <button
                            key={key}
                            onClick={() => select(key)}
                            disabled={saving}
                            className={cn(
                                "rounded-[28px] border-2 p-5 text-center transition-all",
                                saving ? "opacity-60 cursor-not-allowed" : "",
                                active
                                    ? "border-slate-200 bg-[#F97316] shadow-sm"
                                    : "border-slate-100 bg-white hover:text-slate-400"
                            )}
                        >
                            <div
                                className={cn(
                                    "mx-auto w-12 h-12 rounded-2xl flex items-center justify-center",
                                    active ? "bg-white" : "text-slate-900"
                                )}
                            >
                                <Icon className={cn(active ? "text-navy-900" : "text-slate-400")} size={22} />
                            </div>

                            <div className={cn("mt-3 text-sm font-black", active ? "text-navy-900" : "text-slate-500")}>
                                {saving && active ? "저장 중..." : label}
                            </div>
                        </button>
                    );
                })}
            </div>
        </Card>
    );
};

export default OutfitFeedbackCard;