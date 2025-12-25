
import React from 'react';
import { Card, Button, Input, SectionHeader } from '../../app/DesignSystem';
import { Camera, ChevronLeft, Trash2, Info } from 'lucide-react';

interface ClosetAddItemPageProps {
  onBack?: () => void;
}

const ClosetAddItemPage: React.FC<ClosetAddItemPageProps> = ({ onBack }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        {onBack && (
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
            <ChevronLeft size={24} />
          </button>
        )}
        <SectionHeader 
          title="옷 등록하기" 
          subtitle="새로운 아이템을 추가하고 AI의 스타일링 분석을 받아보세요." 
        />
      </div>

      <div className="grid md:grid-cols-12 gap-10">
        {/* Left: Image Upload */}
        <div className="md:col-span-5 space-y-6">
           <div className="aspect-[3/4] bg-slate-100 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 gap-4 cursor-pointer hover:bg-slate-50 transition-all group overflow-hidden relative">
              <Camera size={48} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
              <div className="text-center">
                 <p className="font-bold text-slate-600">사진 업로드</p>
                 <p className="text-xs mt-1">PNG, JPG up to 10MB</p>
              </div>
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
           </div>
           <Card className="bg-orange-50 border-orange-100">
              <div className="flex gap-3">
                 <Info size={18} className="text-orange-500 shrink-0" />
                 <p className="text-xs text-orange-800 leading-relaxed font-medium">
                   배경이 깔끔한 곳에서 촬영할수록 AI가 의상의 소재와 디테일을 더 정확하게 파악할 수 있습니다.
                 </p>
              </div>
           </Card>
        </div>

        {/* Right: Form */}
        <div className="md:col-span-7 space-y-6">
           <Card className="space-y-6">
              <Input label="아이템 이름" placeholder="예: 화이트 린넨 셔츠" />
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">카테고리</label>
                    <select className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-navy-900/5 focus:border-navy-900 outline-none transition-all">
                       <option>상의</option>
                       <option>하의</option>
                       <option>아우터</option>
                       <option>신발</option>
                       <option>액세서리</option>
                    </select>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">시즌</label>
                    <select className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-navy-900/5 focus:border-navy-900 outline-none transition-all">
                       <option>사계절</option>
                       <option>봄</option>
                       <option>여름</option>
                       <option>가을</option>
                       <option>겨울</option>
                    </select>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">주요 소재</label>
                    <select className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-navy-900/5 focus:border-navy-900 outline-none transition-all">
                       <option>면 (Cotton)</option>
                       <option>린넨 (Linen)</option>
                       <option>울 (Wool)</option>
                       <option>데님 (Denim)</option>
                       <option>가죽 (Leather)</option>
                       <option>기타</option>
                    </select>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">두께감</label>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                       <button className="flex-1 py-1.5 text-xs font-bold bg-white shadow-sm rounded-md">얇음</button>
                       <button className="flex-1 py-1.5 text-xs font-bold text-slate-400">보통</button>
                       <button className="flex-1 py-1.5 text-xs font-bold text-slate-400">두꺼움</button>
                    </div>
                 </div>
              </div>

              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-500 uppercase ml-1">활용 장소</label>
                 <div className="flex gap-2">
                    {['실내', '야외', '공용'].map(tag => (
                       <button key={tag} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:border-orange-500 hover:text-orange-500 hover:bg-orange-50 transition-all">
                          {tag}
                       </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-500 uppercase ml-1">메모</label>
                 <textarea 
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-navy-900/5 focus:border-navy-900 outline-none transition-all h-24 resize-none"
                  placeholder="아이템에 대한 추가 정보나 브랜드를 기록하세요."
                 ></textarea>
              </div>
           </Card>

           <div className="flex gap-4">
              <Button variant="outline" className="flex-1" size="lg" onClick={onBack}>취소</Button>
              <Button variant="primary" className="flex-1" size="lg" onClick={onBack}>아이템 저장하기</Button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ClosetAddItemPage;
