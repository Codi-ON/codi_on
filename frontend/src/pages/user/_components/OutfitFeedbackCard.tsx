import React, {useMemo, useState} from "react";
import {Card, cn} from "@/app/DesignSystem";
import {AlertTriangle, Smile, Frown, Meh} from "lucide-react";

type FeedbackValue = "COLD" | "JUST" | "HOT";

type PreferenceStat = {
    label: string;
    value: number; // 0~100
};

type OutfitFeedbackCardProps = {
    title?: string;
    subtitle?: string;
    stats?: PreferenceStat[];
    alertText?: string;
    defaultValue?: FeedbackValue;
    onChange?: (value: FeedbackValue) => void;
};

const defaultStats: PreferenceStat[] = [
    {label: "네이비/블루 계열 선호", value: 92},
    {label: "루즈한 핏 선호", value: 74},
    {label: "활동성 중시", value: 30},
];

const OutfitFeedbackCard: React.FC<OutfitFeedbackCardProps> = ({
                                                                   title = "오늘 완료한 옷는 어떠셨나요?",
                                                                   subtitle = "반응을 학습해 다음 추천을 더 정확히 만듭니다.",
                                                                   stats = defaultStats,
                                                                   defaultValue = "JUST",
                                                                   onChange,
                                                               }) => {
    const [value, setValue] = useState<FeedbackValue>(defaultValue);

    const options = useMemo(
        () => [

            {key: "HOT" as const, label: "모르겠어요", Icon: Meh},
            {key: "JUST" as const, label: "딱 좋아요", Icon: Smile},
            {key: "COLD" as const, label: "별로예요", Icon: Frown},

        ],
        []
    );

    const select = (v: FeedbackValue) => {
        setValue(v);
        onChange?.(v);
    };

    return (
        <Card className="p-7 border-2 border-slate-100 shadow-2xl shadow-navy-900/[0.03]">
            <div className="space-y-2">
                <h3 className="text-xl font-black text-navy-900 tracking-tight">{title}</h3>
                <p className="text-sm text-slate-400 font-medium">{subtitle}</p>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
                {options.map(({key, label, Icon}) => {
                    const active = value === key;
                    return (
                        <button
                            key={key}
                            onClick={() => select(key)}
                            className={cn(
                                "rounded-[28px] border-2 p-5 text-center transition-all",
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
                                <Icon className={cn(active ? "text-navy-900" : "text-slate-400")} size={22}/>
                            </div>
                            <div className={cn("mt-3 text-sm font-black", active ? "text-navy-900" : "text-slate-500")}>
                                {label}
                            </div>
                        </button>
                    );
                })}
            </div>
        </Card>
    );
};

export default OutfitFeedbackCard;