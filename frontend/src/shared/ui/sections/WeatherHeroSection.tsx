import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/Card';
import type { WeatherData, WeeklyForecastItem } from '../types';
import { Sun, Wind, Droplets, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';

const clampWeekly = (weekly?: WeeklyForecastItem[]) => {
  if (!weekly || weekly.length === 0) return [];
  return weekly.slice(0, 7);
};

export const WeatherHeroSection: React.FC<{ data: WeatherData }> = ({ data }) => {
  const weekly = clampWeekly(data.weekly);

  return (
    <Card
      className={[
        // ✅ 오렌지 “톤”만 깔고, 전체는 밝게 연결
        'relative overflow-hidden border border-slate-200/70',
        'bg-gradient-to-br from-white via-white to-orange-50/60',
        'shadow-[0_20px_60px_-30px_rgba(15,23,42,0.25)]',
      ].join(' ')}
    >
      {/* ✅ 아주 얇은 패턴(우중충 방지: 어두운 면적 최소화) */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.08]">
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-orange-400 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-slate-900 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-10">
        {/* =========================
            LEFT: 핵심 요약 + 주간예보
           ========================= */}
        <div className="flex-1 space-y-7">
          {/* 상단 요약 */}
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-start gap-4">
                <div className="text-7xl font-black tracking-tighter text-slate-900">
                  {data.temp}°
                </div>
                <div className="pt-2">
                  <div className="text-xl font-black text-orange-600">{data.condition}</div>
                  <div className="text-sm text-slate-500 font-semibold">체감 {data.feelsLike}°</div>
                </div>
              </div>

              <p className="text-[15px] font-bold text-slate-700 max-w-xl leading-relaxed">
                {data.description}
              </p>

              {/* 시그널 */}
              <div className="flex flex-wrap gap-2 pt-1">
                {data.signals.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-full text-xs font-black text-slate-700 border border-slate-200/70"
                  >
                    <AlertCircle size={14} className="text-orange-500" />
                    {s}
                  </div>
                ))}
              </div>
            </div>

            {/* CTA를 왼쪽에 “작게” 붙이면 시선 분산됨 → 타일로 이동시키는 게 맞음 */}
          </div>

          {/* ✅ 왼쪽 하단 빈 공간 해결: 주간 예보 */}
          <div className="rounded-3xl border border-slate-200/70 bg-white/75 backdrop-blur px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-black text-slate-900">이번 주 날씨</div>
                <div className="text-xs font-bold text-slate-500 mt-1">
                  일주일 흐름을 보고 옷 선택 실수 줄이기
                </div>
              </div>

              <div className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-full">
                Weekly
              </div>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-2">
              {(weekly.length ? weekly : new Array(7).fill(null)).map((it, idx) => {
                const item = it as WeeklyForecastItem | null;

                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200/70 bg-white px-3 py-3 text-center"
                  >
                    <div className="text-[11px] font-black text-slate-700">
                      {item?.dayLabel ?? '-'}
                    </div>

                    <div className="mt-2 text-lg leading-none">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-slate-50 border border-slate-200/70">
                        {item?.icon ?? '—'}
                      </span>
                    </div>

                    <div className="mt-2 text-[11px] font-black text-slate-900">
                      {item ? `${item.max}°` : '—'}
                      <span className="text-slate-400 font-black"> / </span>
                      <span className="text-slate-500">{item ? `${item.min}°` : '—'}</span>
                    </div>

                    <div className="mt-1 text-[10px] font-bold text-slate-500">
                      {typeof item?.pop === 'number' ? `강수 ${item.pop}%` : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* =========================
            RIGHT: 타일(흰색) 2x2
            - 1:1 비율 보장: aspect-square
           ========================= */}
        <div className="w-full lg:w-[380px]">
          <div className="grid grid-cols-2 gap-4">
            {/* 습도 */}
            <div className="aspect-square rounded-3xl bg-white border border-slate-200/70 p-5 shadow-sm">
              <Droplets className="mb-3 text-blue-500" size={20} />
              <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">습도</div>
              <div className="mt-1 text-2xl font-black text-slate-900">{data.humidity}%</div>
              <div className="mt-2 text-xs font-bold text-slate-500">쾌적도에 직접 영향</div>
            </div>

            {/* 풍속 */}
            <div className="aspect-square rounded-3xl bg-white border border-slate-200/70 p-5 shadow-sm">
              <Wind className="mb-3 text-slate-700" size={20} />
              <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">풍속</div>
              <div className="mt-1 text-2xl font-black text-slate-900">{data.windSpeed}m/s</div>
              <div className="mt-2 text-xs font-bold text-slate-500">체감 온도 변동</div>
            </div>

            {/* CTA: 오늘의 옷 추천 */}
            <Link to="/checklist" className="block">
              <div
                className={[
                  'aspect-square rounded-3xl p-5',
                  'bg-orange-500 text-white',
                  'shadow-[0_18px_40px_-20px_rgba(249,115,22,0.65)]',
                  'border border-orange-400/30',
                  'transition hover:-translate-y-0.5 hover:shadow-[0_22px_55px_-25px_rgba(249,115,22,0.75)]',
                  'group',
                ].join(' ')}
              >
                <div className="flex items-center justify-between">
                  <Sparkles className="text-white" size={20} />
                  <ArrowRight className="text-white/70 group-hover:text-white transition" size={18} />
                </div>

                <div className="mt-5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/80">
                    추천 시작
                  </div>
                  <div className="mt-2 text-2xl font-black leading-snug">
                    오늘의
                    <br />
                    옷 추천
                  </div>
                  <div className="mt-2 text-xs font-bold text-white/80">
                    체크리스트로 이동
                  </div>
                </div>
              </div>
            </Link>

            {/* 자외선 */}
            <div className="aspect-square rounded-3xl bg-white border border-slate-200/70 p-5 shadow-sm">
              <Sun className="mb-3 text-orange-600" size={20} />
              <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">자외선</div>
              <div className="mt-1 text-2xl font-black text-slate-900">{data.uvIndex}</div>
              <div className="mt-2 text-xs font-bold text-slate-500">피부/소재 선택</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};