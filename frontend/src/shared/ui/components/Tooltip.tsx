import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import {cn} from "@/app/DesignSystem.tsx";

type Props = {
    content: React.ReactNode;
    children: React.ReactNode;
    side?: "top" | "right" | "bottom" | "left";
    align?: "start" | "center" | "end";
    className?: string;
};

export function Tooltip({
                            content,
                            children,
                            side = "bottom",
                            align = "center",
                            className,
                        }: Props) {
    return (
        <TooltipPrimitive.Provider delayDuration={150}>
            <TooltipPrimitive.Root>
                <TooltipPrimitive.Trigger asChild>
                    {children}
                </TooltipPrimitive.Trigger>

                {/* ✅ Portal로 body에 뜸 */}
                <TooltipPrimitive.Portal>
                    <TooltipPrimitive.Content
                        side={side}
                        align={align}
                        sideOffset={8}
                        className={cn(
                            "z-[9999] max-w-[260px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-xl",
                            "animate-in fade-in-0 zoom-in-95",
                            className
                        )}
                    >
                        {content}
                        <TooltipPrimitive.Arrow className="fill-white" />
                    </TooltipPrimitive.Content>
                </TooltipPrimitive.Portal>
            </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>
    );
}