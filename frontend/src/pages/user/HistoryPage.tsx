// src/pages/CalendarPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { outfitRepo } from "@/lib/repo/outfitRepo";

// -------------------- types (유연 파싱) --------------------
type MonthlyResponseDto = {
    year: number;
    month: number; // 1~12
    days: any[];   // 스키마 확정 전이라 any 허용
};

type DaySummary = {
    dateISO: string;          // YYYY-MM-DD
    hasOutfit: boolean;
    hasFeedback?: boolean;
    // 필요하면 확장
    // weather?: { min?: number; max?: number; condition?: string };
    // outfit?: { items?: Array<{ name: string; imageUrl?: string | null; category?: string }> };
};

function toISODate(d: Date) {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function parseDaySummary(raw: any): DaySummary | null {
    if (!raw || typeof raw !== "object") return null;

    // 가장 흔한 케이스 1) { date: "2026-01-09", ... }
    const dateISO =
        typeof raw.date === "string"
            ? raw.date
            : typeof raw.dateISO === "string"
                ? raw.dateISO
                : typeof raw.day === "string"
                    ? raw.day
                    : null;

    if (!dateISO) return null;

    // hasOutfit 추정
    const hasOutfit =
        typeof raw.hasOutfit === "boolean"
            ? raw.hasOutfit
            : !!raw.outfit || !!raw.items || !!raw.clothingIds;

    const hasFeedback =
        typeof raw.hasFeedback === "boolean" ? raw.hasFeedback : !!raw.feedback;

    return { dateISO, hasOutfit, hasFeedback };
}

// -------------------- month matrix --------------------
function getMonthMatrix(year: number, month1to12: number) {
    const first = new Date(year, month1to12 - 1, 1);
    const last = new Date(year, month1to12, 0);
    const startDay = first.getDay(); // 0 Sun
    const totalDays = last.getDate();

    const cells: Array<{ date: Date | null }> = [];
    for (let i = 0; i < startDay; i++) cells.push({ date: null });
    for (let d = 1; d <= totalDays; d++) cells.push({ date: new Date(year, month1to12 - 1, d) });
    while (cells.length % 7 !== 0) cells.push({ date: null });

    const rows: Array<Array<{ date: Date | null }>> = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
}

// -------------------- mini guide (1회, 3초) --------------------
const GUIDE_KEY = "codion.history.guide.seen.v1";

function MiniGuideToast({ onDone }: { onDone: () => void }) {
    useEffect(() => {
        const t = window.setTimeout(() => onDone(), 3000);
        return () => window.clearTimeout(t);
    }, [onDone]);

    return (
        <div className="fixed top-5 left-1/2 z-50 w-[420px] -translate-x-1/2 rounded-2xl border bg-white/95 p-4 shadow-lg backdrop-blur">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 h-9 w-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                    i
                </div>
                <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900">OOTD 히스토리 사용법</div>
                    <div className="mt-1 text-sm text-slate-600">
                        날짜 클릭 → 우측 상세 확인 → 필요하면 내보내기/필터
                    </div>
                </div>
                <button
                    onClick={onDone}
                    className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
                >
                    닫기
                </button>
            </div>
        </div>
    );
}

// -------------------- right detail panel --------------------
function RightDetailPanel({
                              selectedDateISO,
                              day,
                              onExport,
                          }: {
    selectedDateISO: string;
    day: DaySummary | null;
    onExport: () => void;
}) {
    const hasOutfit = !!day?.hasOutfit;

    return (
        <aside className="sticky top-6 h-[calc(100vh-96px)] w-[360px] shrink-0 rounded-3xl border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <div className="text-xs text-slate-500">선택 날짜</div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">{selectedDateISO}</div>
                </div>
                <button
                    onClick={onExport}
                    className="rounded-xl border px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                    내보내기
                </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-2xl border bg-slate-50 p-3">
                    <div className="text-[11px] text-slate-500">저장</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{hasOutfit ? "완료" : "없음"}</div>
                </div>
                <div className="rounded-2xl border bg-slate-50 p-3">
                    <div className="text-[11px] text-slate-500">피드백</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                        {day?.hasFeedback ? "있음" : "없음"}
                    </div>
                </div>
                <div className="rounded-2xl border bg-slate-50 p-3">
                    <div className="text-[11px] text-slate-500">상태</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{hasOutfit ? "기록됨" : "대기"}</div>
                </div>
            </div>

            <div className="mt-5 rounded-3xl border p-4">
                <div className="text-sm font-semibold text-slate-900">요약</div>
                <div className="mt-2 text-sm text-slate-600 leading-relaxed">
                    {hasOutfit
                        ? "이 날짜의 아웃핏 기록이 있습니다. 우측에서 상세 확인 후 필요하면 수정/삭제를 진행하세요."
                        : "아직 기록이 없습니다. 오늘 추천에서 저장하거나, 옷장을 먼저 채우면 정확도가 올라갑니다."}
                </div>
            </div>

            <div className="mt-5">
                <div className="text-sm font-semibold text-slate-900">아웃핏 프리뷰</div>

                {!hasOutfit ? (
                    <div className="mt-2 rounded-3xl border bg-slate-50 p-4">
                        <div className="text-sm text-slate-700 font-semibold">기록 없음</div>
                        <div className="mt-1 text-sm text-slate-600">
                            옷이 적으면 추천 정확도가 떨어질 수 있어요.
                        </div>

                        <div className="mt-3 rounded-2xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
                            옷이 부족해 추천이 제한될 수 있습니다. 옷장에 아이템을 추가해 주세요.
                        </div>

                        <div className="mt-4 flex gap-2">
                            <a
                                href="/closet"
                                className="flex-1 rounded-2xl bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800"
                            >
                                옷장 채우기
                            </a>
                            <a
                                href="/recommendation"
                                className="flex-1 rounded-2xl border px-4 py-2 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50"
                            >
                                오늘 추천
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="mt-2 space-y-3">
                        {/* 실제로는 day.outfit.items 같은 걸로 렌더링하면 됨. 지금은 스키마 확정 전이라 placeholder */}
                        <div className="rounded-3xl border p-4">
                            <div className="text-xs text-slate-500">상의</div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">저장된 상의</div>
                        </div>
                        <div className="rounded-3xl border p-4">
                            <div className="text-xs text-slate-500">하의</div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">저장된 하의</div>
                        </div>
                        <div className="rounded-3xl border p-4">
                            <div className="text-xs text-slate-500">아우터</div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">저장된 아우터(선택)</div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <button className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                                수정
                            </button>
                            <button className="rounded-2xl border px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                                삭제
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}

// -------------------- page --------------------
export default function CalendarPage() {
    const [params] = useSearchParams();
    const navigate = useNavigate();

    const now = new Date();
    const initialDateISO = params.get("date") || toISODate(now);
    const initial = new Date(initialDateISO);

    const [year, setYear] = useState<number>(initial.getFullYear());
    const [month, setMonth] = useState<number>(initial.getMonth() + 1);
    const [selectedDateISO, setSelectedDateISO] = useState<string>(initialDateISO);

    // 1회 가이드
    const [showGuide, setShowGuide] = useState(false);
    useEffect(() => {
        const seen = localStorage.getItem(GUIDE_KEY);
        if (!seen) {
            setShowGuide(true);
            localStorage.setItem(GUIDE_KEY, "1");
        }
    }, []);

    const { data, isLoading, error } = useQuery({
        queryKey: ["outfits-monthly", year, month],
        queryFn: async (): Promise<MonthlyResponseDto> => {
            // month: 1~12
            return await outfitRepo.getMonthlyOutfits(year, month);
        },
    });

    const daySummaries: DaySummary[] = useMemo(() => {
        const days = Array.isArray(data?.days) ? data!.days : [];
        return days.map(parseDaySummary).filter(Boolean) as DaySummary[];
    }, [data]);

    const dayMap = useMemo(() => {
        const m = new Map<string, DaySummary>();
        daySummaries.forEach((d) => m.set(d.dateISO, d));
        return m;
    }, [daySummaries]);

    const selectedDay = dayMap.get(selectedDateISO) || null;

    const matrix = useMemo(() => getMonthMatrix(year, month), [year, month]);

    const moveMonth = (delta: number) => {
        const d = new Date(year, month - 1 + delta, 1);
        setYear(d.getFullYear());
        setMonth(d.getMonth() + 1);
    };

    const onSelectDate = (iso: string) => {
        setSelectedDateISO(iso);
        navigate(`/calendar?date=${iso}`, { replace: true });
    };

    const onExport = () => {
        // 기존 버튼 유지. 실제 다운로드 로직은 프로젝트 방식에 맞춰 연결.
        // 예: outfitRepo.exportMonthly(year, month) -> file download
        console.log("export monthly", { year, month });
    };

    return (
        <div className="px-8 py-6">
            {showGuide && <MiniGuideToast onDone={() => setShowGuide(false)} />}

            <div className="mb-5 flex items-start justify-between">
                <div>
                    <div className="text-3xl font-extrabold text-slate-900">OOTD 캘린더</div>
                    <div className="mt-2 text-sm text-slate-600">
                        기록된 날짜만 신호가 표시됩니다. 날짜 클릭 시 우측 패널에서 상세 확인
                    </div>
                </div>

                <div className="flex gap-2">
                    <button className="rounded-2xl border px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                        필터
                    </button>
                    <button
                        onClick={onExport}
                        className="rounded-2xl border px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    >
                        내보내기
                    </button>
                </div>
            </div>

            <div className="flex gap-6">
                {/* main calendar */}
                <main className="flex-1 rounded-3xl border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-slate-900">
                            {year}년 {month}월 <span className="ml-2 text-sm font-medium text-slate-500">달력</span>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => moveMonth(-1)}
                                className="h-10 w-10 rounded-2xl border text-slate-700 hover:bg-slate-50"
                                aria-label="prev"
                            >
                                ‹
                            </button>
                            <button
                                onClick={() => moveMonth(1)}
                                className="h-10 w-10 rounded-2xl border text-slate-700 hover:bg-slate-50"
                                aria-label="next"
                            >
                                ›
                            </button>
                        </div>
                    </div>

                    <div className="mt-5 rounded-3xl border p-4">
                        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-400">
                            <div className="text-red-500">SUN</div>
                            <div>MON</div>
                            <div>TUE</div>
                            <div>WED</div>
                            <div>THU</div>
                            <div>FRI</div>
                            <div className="text-blue-500">SAT</div>
                        </div>

                        <div className="mt-3 grid gap-2">
                            {matrix.map((row, rIdx) => (
                                <div key={rIdx} className="grid grid-cols-7 gap-2">
                                    {row.map((cell, cIdx) => {
                                        if (!cell.date) {
                                            return <div key={cIdx} className="h-20 rounded-2xl bg-slate-50" />;
                                        }

                                        const iso = toISODate(cell.date);
                                        const isSelected = iso === selectedDateISO;
                                        const summary = dayMap.get(iso);
                                        const hasSignal = !!summary?.hasOutfit;

                                        return (
                                            <button
                                                key={cIdx}
                                                onClick={() => onSelectDate(iso)}
                                                className={[
                                                    "relative h-20 rounded-2xl border p-3 text-left transition",
                                                    isSelected ? "border-slate-900 ring-2 ring-slate-200" : "hover:bg-slate-50",
                                                ].join(" ")}
                                            >
                                                <div className="text-sm font-semibold text-slate-900">{cell.date.getDate()}</div>

                                                {hasSignal && (
                                                    <div className="absolute left-3 top-10 flex items-center gap-2">
                                                        <span className="h-2 w-2 rounded-full bg-orange-500" />
                                                        <span className="text-xs text-slate-500">기록 있음</span>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>

                        {!isLoading && !error && daySummaries.length === 0 && (
                            <div className="mt-5 rounded-3xl border bg-slate-50 p-5">
                                <div className="text-sm font-semibold text-slate-900">아직 기록이 없어요</div>
                                <div className="mt-1 text-sm text-slate-600">
                                    저장된 OOTD가 생기면 이 달력에 신호가 표시됩니다.
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <a
                                        href="/recommendation"
                                        className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                                    >
                                        오늘 추천으로 가기
                                    </a>
                                    <a
                                        href="/closet"
                                        className="rounded-2xl border px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-white"
                                    >
                                        옷장 채우기
                                    </a>
                                </div>
                            </div>
                        )}

                        {isLoading && (
                            <div className="mt-5 rounded-3xl border bg-slate-50 p-5 text-sm text-slate-600">
                                로딩 중…
                            </div>
                        )}

                        {error && (
                            <div className="mt-5 rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                                월별 데이터를 불러오지 못했습니다.
                            </div>
                        )}
                    </div>
                </main>

                {/* right panel */}
                <RightDetailPanel selectedDateISO={selectedDateISO} day={selectedDay} onExport={onExport} />
            </div>
        </div>
    );
}