
import React from 'react';
import { WeatherData } from '../types';
import { Card, Badge, cn } from '../components';
import { Thermometer, Wind, Droplets, Sun } from 'lucide-react';

export const TodayHeroSection: React.FC<{ data: WeatherData }> = ({ data }) => {
  return (
    <Card className="bg-gradient-to-br from-[#0F172A] to-slate-800 text-white border-0 shadow-2xl">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-6xl font-black tracking-tighter">{data.temp}°</div>
              <div className="text-slate-400 text-sm font-bold uppercase mt-1">체감 {data.feelsLike}°</div>
            </div>
            <div className="text-5xl">🌤️</div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-black text-[#F97316]">{data.condition}</div>
            <p className="text-slate-300 text-sm leading-relaxed">{data.description}</p>
          </div>
          <div className="flex gap-2">
             <Badge variant="orange">외출 주의</Badge>
             <Badge variant="navy">우산 권장</Badge>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: '습도', value: `${data.humidity}%`, icon: Droplets, color: 'text-blue-400' },
            { label: '풍속', value: `${data.windSpeed}m/s`, icon: Wind, color: 'text-slate-400' },
            { label: '자외선', value: data.uvIndex, icon: Sun, color: 'text-orange-400' },
            { label: '일출', value: '05:42', icon: Thermometer, color: 'text-yellow-400' },
          ].map((item, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-lg border border-white/10 p-5 rounded-2xl space-y-3">
              <item.icon className={cn("w-5 h-5", item.color)} />
              <div>
                <div className="text-[10px] font-black text-slate-500 uppercase">{item.label}</div>
                <div className="text-lg font-black">{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
