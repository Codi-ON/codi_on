// src/pages/user/_components/WeatherBackgroundFX.tsx
import React, { useMemo } from "react";
import Snowfall from "react-snowfall";

export type WeatherFxKind = "SNOW" | "RAIN" | "NONE";

type Props = {
    kind: WeatherFxKind;
    /** 0~1 (대충 강도) */
    intensity?: number;
    /** 카드/섹션 내부에 깔 때: absolute inset-0 필요 */
    className?: string;
};

export default function WeatherBackgroundFX({
                                                kind,
                                                intensity = 0.6,
                                                className,
                                            }: Props) {
    const snowflakeCount = useMemo(() => {
        const base = 80; // 기본
        return Math.round(base + base * intensity); // 80~160
    }, [intensity]);

    if (kind === "NONE") return null;

    return (
        <div className={["pointer-events-none absolute inset-0 overflow-hidden", className].filter(Boolean).join(" ")}>
            {kind === "SNOW" ? (
                <Snowfall
                    snowflakeCount={snowflakeCount}
                    style={{ width: "100%", height: "100%" }}
                    // 속도/크기 세부 조절은 라이브러리 버전에 따라 옵션이 다를 수 있어 기본값으로 안정성 우선
                />
            ) : (
                <RainOverlay intensity={intensity} />
            )}

            {/* 살짝 분위기 그라데이션(눈/비 공통) */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/10 to-white/30" />
        </div>
    );
}

function RainOverlay({ intensity }: { intensity: number }) {
    // 방울 개수: 40~120
    const drops = Math.round(40 + 80 * intensity);

    // 인라인 style로 keyframes 박아두면 tailwind 설정 안 건드려도 됨
    return (
        <>
            <style>
                {`
          @keyframes rainDrop {
            0% { transform: translateY(-20vh); opacity: 0; }
            10% { opacity: .45; }
            100% { transform: translateY(120vh); opacity: 0; }
          }
        `}
            </style>

            <div className="absolute inset-0">
                {Array.from({ length: drops }).map((_, i) => {
                    const left = (i * (100 / drops)) + Math.random() * 2; // 분산
                    const delay = Math.random() * 1.2;
                    const duration = 0.8 + Math.random() * 0.9; // 0.8~1.7
                    const height = 14 + Math.random() * 20; // 14~34
                    const opacity = 0.12 + Math.random() * 0.18;

                    return (
                        <span
                            key={i}
                            className="absolute top-0 w-[2px] rounded-full bg-sky-400/70"
                            style={{
                                left: `${left}%`,
                                height: `${height}px`,
                                opacity,
                                filter: "blur(0.2px)",
                                animation: `rainDrop ${duration}s linear ${delay}s infinite`,
                            }}
                        />
                    );
                })}
            </div>
        </>
    );
}