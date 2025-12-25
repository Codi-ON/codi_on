
import React from 'react';
import { Card, Button, Badge, SectionHeader } from '../../app/DesignSystem';
import { ChevronLeft, Edit3, Trash2, Calendar, TrendingUp, Zap, Share2 } from 'lucide-react';

interface ItemDetailPageProps {
  onBack?: () => void;
}

const ItemDetailPage: React.FC<ItemDetailPageProps> = ({ onBack }) => {
  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
              <ChevronLeft size={24} />
            </button>
          )}
          <h1 className="text-3xl font-black text-navy-900 tracking-tighter">아이템 상세 정보</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={Share2}>공유</Button>
          <Button variant="outline" size="sm" icon={Edit3}>편집</Button>
          <Button variant="danger" size="sm" icon={Trash2}>삭제</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        {/* Item View */}
        <div className="lg:col-span-5">
           <div className="aspect-[3/4] bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden relative group">
              <img src="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover" alt="Item" />
              <div className="absolute inset-0 bg-navy-900/10 group-hover:bg-transparent transition-colors"></div>
              <div className="absolute bottom-8 left-8">
                 <Badge variant="navy">아우터</Badge>
              </div>
           </div>
        </div>

        {/* Info & Stats */}
        <div className="lg:col-span-7 space-y-8">
           <div className="space-y-2">
              <div className="text-xs font-black text-orange-500 uppercase tracking-widest">CODION Basic Line</div>
              <h2 className="text-4xl font-black text-navy-900 leading-tight">네이비 테일러드 가디건</h2>
              <div className="flex gap-2 mt-4">
                 <Badge variant="slate">가을</Badge>
                 <Badge variant="slate">사계절</Badge>
                 <Badge variant="slate">면혼방</Badge>
              </div>
           </div>

           <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: '누적 착용', value: '24회', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50' },
                { label: '선호 지수', value: 'A+', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-50' },
                { label: '추천 빈도', value: '매우 높음', icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50' },
              ].map((stat, i) => (
                <div key={i} className={`${stat.bg} p-6 rounded-3xl border border-white shadow-sm`}>
                   <stat.icon size={20} className={stat.color} />
                   <div className="mt-4">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
                      <div className="text-xl font-black text-navy-900">{stat.value}</div>
                   </div>
                </div>
              ))}
           </div>

           <Card title="AI 스타일 분석" subtitle="최근 추천 데이터를 기반으로 분석한 리포트">
              <div className="space-y-6">
                 <p className="text-sm text-slate-500 leading-relaxed font-medium">
                   이 아이템은 주로 **섭씨 15~18도** 사이의 맑은 날씨에 '화이트 셔츠' 및 '베이지 치노 팬츠'와 함께 추천되었을 때 사용자 수락률이 가장 높았습니다. 레이어드가 용이한 두께감으로 간절기 필수 아이템으로 분류됩니다.
                 </p>
                 <div className="space-y-4 pt-4 border-t border-slate-50">
                    <div className="flex items-center justify-between">
                       <span className="text-xs font-bold text-slate-700">관리 권장 주기</span>
                       <span className="text-xs font-black text-navy-900">30일 (드라이클리닝)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-orange-500 w-[80%]"></div>
                    </div>
                 </div>
              </div>
           </Card>

           <div className="space-y-4">
              <h4 className="text-lg font-bold text-navy-900">최근 코디 조합</h4>
              <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                 {[1,2,3,4].map(i => (
                    <div key={i} className="min-w-[120px] aspect-square bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative group cursor-pointer">
                       <img src={`https://picsum.photos/200/200?random=${i + 10}`} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="Style" />
                       <div className="absolute inset-0 bg-navy-900/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-[10px] font-black uppercase tracking-widest">View Look</span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailPage;
