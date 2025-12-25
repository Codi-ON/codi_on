
import React, { useState } from 'react';
import { SectionHeader, Button, Badge, Card, Input, Modal, Stepper, cn } from '../../app/DesignSystem';
import { ToastSuccess, ToastError, ToastWarning } from '../../shared/ui/feedback/Toasts';
import { CardSkeleton, ListSkeleton } from '../../shared/ui/feedback/Skeletons';
import { EmptyState, ErrorState, OfflineState } from '../../shared/ui/feedback/States';
import { LineChartPlaceholder, BarChartPlaceholder } from '../../shared/ui/charts/ChartPlaceholders';
import { Layers, MousePointer2, AlertCircle, BarChart3, Clock, Layout, Search, Grid, List, Filter, Share2, MoreHorizontal } from 'lucide-react';

const UiKitPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="max-w-6xl mx-auto space-y-24 py-16 animate-in fade-in duration-1000">
      <SectionHeader 
        title="디자인 시스템 & 패턴 허브" 
        subtitle="CODION SaaS의 시각적 일관성과 사용자 경험을 정의하는 핵심 컴포넌트와 인터랙션 가이드입니다." 
      />

      {/* 1. Journey Stepper Pattern */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-navy-900 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-navy-900/20"><Clock size={24}/></div>
           <h3 className="text-2xl font-black text-navy-900 tracking-tighter">1. User Journey Pattern</h3>
        </div>
        <Card subtitle="단계별 진행 상황을 시각화하여 사용자의 이탈을 방지합니다.">
           <Stepper steps={["날씨 분석", "활동 체크", "스타일 생성", "최종 제안"]} currentStep={2} />
        </Card>
      </section>

      {/* 2. Action Toolbar Pattern */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/20"><Layout size={24}/></div>
           <h3 className="text-2xl font-black text-navy-900 tracking-tighter">2. Intelligence Toolbar</h3>
        </div>
        <Card padding="none" className="bg-slate-50 border-slate-100 overflow-visible">
           <div className="p-4 flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative group">
                 <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                 <input type="text" placeholder="아이템 이름, 색상, 소재로 검색..." className="w-full pl-16 pr-6 py-5 bg-white rounded-[24px] border-2 border-transparent focus:border-navy-900 outline-none shadow-xl shadow-navy-900/[0.02] text-sm font-bold" />
              </div>
              <div className="flex gap-2">
                 <Button variant="outline" size="md" icon={Filter}>고급 필터</Button>
                 <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                    <button className="p-3 bg-navy-900 text-white rounded-xl shadow-lg"><Grid size={20}/></button>
                    <button className="p-3 text-slate-300 hover:text-navy-900 transition-colors"><List size={20}/></button>
                 </div>
              </div>
           </div>
           <div className="px-8 pb-6 flex gap-2 overflow-x-auto no-scrollbar">
              {['전체', '상의', '하의', '아우터', '신발', '즐겨찾기'].map(cat => (
                 <Badge key={cat} variant={cat === '상의' ? 'navy' : 'slate'}>{cat}</Badge>
              ))}
           </div>
        </Card>
      </section>

      {/* 3. Feedback & Alert Pattern */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20"><AlertCircle size={24}/></div>
           <h3 className="text-2xl font-black text-navy-900 tracking-tighter">3. Semantic Feedback</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
           <div className="space-y-4">
              <ToastSuccess message="스타일이 히스토리에 저장되었습니다." />
              <ToastError message="이미지 업로드 용량이 초과되었습니다 (10MB)." />
              <ToastWarning message="위치 정보 접근 권한이 필요합니다." />
           </div>
           <Card className="flex flex-col items-center justify-center py-12 text-center bg-slate-50/50">
              <OfflineState />
              <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-xl mb-6"><Share2 size={24} className="text-navy-900" /></div>
              <h4 className="text-lg font-black text-navy-900">공유 준비 완료</h4>
              <p className="text-xs text-slate-400 mt-2 font-medium">오늘의 룩을 친구들에게 공유해보세요.</p>
              <Button variant="secondary" size="sm" className="mt-6">링크 복사하기</Button>
           </Card>
        </div>
      </section>

      {/* 4. Stat & Analytics Pattern */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-slate-100 text-navy-900 rounded-2xl flex items-center justify-center border border-slate-200"><BarChart3 size={24}/></div>
           <h3 className="text-2xl font-black text-navy-900 tracking-tighter">4. Intelligence Cards</h3>
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
           <Card padding="none">
              <EmptyState title="등록된 옷이 없습니다" description="나의 옷장에서 첫 번째 아이템을 등록해보세요." />
              <div className="p-8 border-t border-slate-50"><Button variant="primary" className="w-full" icon={Grid}>옷장으로 이동</Button></div>
           </Card>
           <div className="space-y-6">
              <CardSkeleton />
              <ListSkeleton />
           </div>
           <Card title="시스템 자원 사용량" subtitle="실시간 모니터링">
              <div className="space-y-6">
                 {[
                   { l: 'CPU Cluster A', v: 42 },
                   { l: 'Database I/O', v: 78 },
                   { l: 'Asset Storage', v: 24 }
                 ].map(s => (
                   <div key={s.l} className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         <span>{s.l}</span>
                         <span>{s.v}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                         {/* Added cn to the imports from DesignSystem to fix the 'Cannot find name cn' error */}
                         <div className={cn("h-full rounded-full transition-all duration-1000", s.v > 70 ? "bg-red-500" : "bg-navy-900")} style={{ width: `${s.v}%` }} />
                      </div>
                   </div>
                 ))}
              </div>
           </Card>
        </div>
      </section>

      {/* Buttons Showcase */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center"><MousePointer2 size={24}/></div>
           <h3 className="text-2xl font-black text-navy-900 tracking-tighter">5. Atom: Buttons</h3>
        </div>
        <Card>
           <div className="flex flex-wrap gap-4 items-center">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="primary" isLoading>Loading</Button>
              <Button variant="outline" icon={Share2}>With Icon</Button>
           </div>
        </Card>
      </section>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="패턴 미리보기">
        <div className="space-y-4">
           <p className="text-sm text-slate-500 font-medium leading-relaxed">디자인 시스템 모달입니다. 고해상도 그림자와 부드러운 여백을 사용하여 SaaS 서비스의 신뢰감을 높입니다.</p>
           <Button className="w-full" onClick={() => setIsModalOpen(false)}>확인</Button>
        </div>
      </Modal>
      <Button variant="outline" onClick={() => setIsModalOpen(true)} className="fixed bottom-10 right-10 shadow-2xl z-50">Modal 실행</Button>
    </div>
  );
};

export default UiKitPage;
