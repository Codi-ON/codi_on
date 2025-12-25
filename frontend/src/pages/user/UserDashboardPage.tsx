
import React from 'react';
import { Card } from '../../shared/ui/components/Card';
import { Button } from '../../shared/ui/components/Button';
import { TrendingUp, Award, Zap, PieChart } from 'lucide-react';

const UserDashboardPage: React.FC = () => {
  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-[#0F172A] tracking-tighter">나의 스타일 통계</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">패션 라이프스타일을 데이터로 확인하세요.</p>
        </div>
        <Button variant="outline" size="sm">지난달 리포트 보기</Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: '스타일 랭킹', value: '상위 12%', icon: Award, color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: '이번 달 코디 완성', value: '24회', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-50' },
          { label: '가장 많이 입은 컬러', value: '네이비', icon: PieChart, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: '추천 수락률', value: '82%', icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50' },
        ].map((stat, i) => (
          <Card key={i} className="p-6">
             <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
                <stat.icon size={24} />
             </div>
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
             <div className="text-2xl font-black text-[#0F172A] mt-1">{stat.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
           <Card title="스타일 이용 퍼널" subtitle="추천부터 피드백까지의 전환 과정">
              <div className="space-y-6 py-4">
                 {[
                   { step: '추천 생성', count: 124, percentage: 100 },
                   { step: '코디 선택', count: 82, percentage: 66 },
                   { step: '히스토리 저장', count: 64, percentage: 51 },
                   { step: '피드백 완료', count: 12, percentage: 10 },
                 ].map((item, i) => (
                   <div key={i} className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                         <span>{item.step}</span>
                         <span className="text-slate-400 font-medium">{item.count}회 ({item.percentage}%)</span>
                      </div>
                      <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden">
                         <div className="h-full bg-[#F97316] rounded-full transition-all duration-1000" style={{ width: `${item.percentage}%` }} />
                      </div>
                   </div>
                 ))}
              </div>
           </Card>
        </div>

        <div className="lg:col-span-4">
           <Card title="선호 카테고리 분포" className="h-full">
              <div className="flex flex-col items-center justify-center h-full space-y-8">
                 <div className="relative w-40 h-40">
                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                       <path className="text-slate-100" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                       <path className="text-[#0F172A]" strokeDasharray="42, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                       <path className="text-[#F97316]" strokeDasharray="28, 100" strokeDashoffset="-42" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                       <span className="text-2xl font-black text-[#0F172A]">70%</span>
                       <span className="text-[8px] font-bold text-slate-400 uppercase">Top/Bottom</span>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#0F172A]" /><span className="text-[10px] font-bold">상의 (42%)</span></div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#F97316]" /><span className="text-[10px] font-bold">하의 (28%)</span></div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-400" /><span className="text-[10px] font-bold">아우터 (15%)</span></div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-200" /><span className="text-[10px] font-bold">기타 (15%)</span></div>
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
};

export default UserDashboardPage;
