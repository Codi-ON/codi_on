/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { Card, Button, Input, Chip, SectionTitle } from './DesignSystem';
import { 
  User, MapPin, Bell, Shield, LogOut, Edit2, Palette, 
  CheckCircle2, Plus, Calendar as CalendarIcon, Search, 
  ChevronDown, HelpCircle, Mail, Phone, Moon, Sun, CloudRain,
  Sliders
} from 'lucide-react';

// --- 1. SETTINGS ---
export const ScreenSettings = () => (
  <div className="p-8 max-w-5xl mx-auto font-sans">
    <div className="mb-12">
      <h1 className="text-3xl font-extrabold text-slate-900">설정</h1>
      <p className="text-slate-500 mt-1">계정 환경설정 및 알림 관리</p>
    </div>

    <div className="grid grid-cols-12 gap-8">
      {/* Sidebar Navigation */}
      <div className="col-span-3">
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="p-2 space-y-1">
                {[
                    {l: "일반", i: User, a: true},
                    {l: "위치 및 날씨", i: MapPin, a: false},
                    {l: "알림", i: Bell, a: false},
                    {l: "개인정보 및 보안", i: Shield, a: false},
                ].map((item, i) => (
                    <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors ${item.a ? 'bg-slate-900 text-white font-bold shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>
                        <item.i size={18} />
                        <span>{item.l}</span>
                    </div>
                ))}
            </div>
            <div className="p-2 border-t border-slate-100 mt-2">
                 <div className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-red-500 hover:bg-red-50 transition-colors font-medium">
                    <LogOut size={18} />
                    <span>로그아웃</span>
                </div>
            </div>
          </div>
      </div>

      {/* Content Area */}
      <div className="col-span-9 space-y-6">
        <Card className="p-8">
            <SectionTitle>프로필 정보</SectionTitle>
            <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-full bg-slate-200 border-4 border-white shadow-sm flex items-center justify-center text-slate-400">
                    <User size={32}/>
                </div>
                <div>
                    <Button variant="secondary" className="!w-auto !py-2.5 px-6 text-sm">프로필 사진 변경</Button>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">이름</label>
                    <Input placeholder="이름" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">성</label>
                    <Input placeholder="성" />
                </div>
                <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">이메일 주소</label>
                    <Input placeholder="user@example.com" />
                </div>
            </div>
        </Card>

        <Card className="p-8">
            <SectionTitle>환경설정</SectionTitle>
             <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-white rounded-lg border border-slate-200"><Moon size={20}/></div>
                        <div>
                            <p className="font-bold text-slate-900">다크 모드</p>
                            <p className="text-xs text-slate-500">어두운 테마로 전환합니다</p>
                        </div>
                    </div>
                    <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer"><div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm"></div></div>
                </div>
                 <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-white rounded-lg border border-slate-200"><Bell size={20}/></div>
                        <div>
                            <p className="font-bold text-slate-900">이메일 알림</p>
                            <p className="text-xs text-slate-500">주간 코디 요약 리포트 수신</p>
                        </div>
                    </div>
                    <div className="w-12 h-6 bg-brand-primary rounded-full relative cursor-pointer"><div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm"></div></div>
                </div>
             </div>
        </Card>
      </div>
    </div>
  </div>
);

// --- 2. MY PROFILE ---
export const ScreenProfile = () => (
    <div className="p-8 max-w-6xl mx-auto font-sans">
        {/* Header */}
        <div className="relative h-64 bg-slate-900 rounded-[40px] mb-20 shadow-xl overflow-hidden">
             <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"></div>
             <div className="absolute top-0 right-0 p-12 opacity-10"><Palette size={200} className="text-white"/></div>
             
             <div className="absolute -bottom-16 left-12 flex items-end gap-8">
                 <div className="w-40 h-40 rounded-[32px] bg-white p-2 shadow-2xl rotate-3">
                     <div className="w-full h-full rounded-[24px] bg-slate-200 overflow-hidden">
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                             <User size={64} />
                        </div>
                     </div>
                 </div>
                 <div className="mb-20 text-white">
                     <h1 className="text-4xl font-extrabold tracking-tight mb-2">Alex Kim</h1>
                     <p className="opacity-80 text-lg">Premium Member • Since 2023</p>
                 </div>
             </div>
             <div className="absolute bottom-6 right-8">
                 <Button variant="secondary" className="!w-auto !py-3 px-6 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md gap-2"><Edit2 size={16}/> 프로필 수정</Button>
             </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
            <div className="col-span-1 space-y-6">
                <Card className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-900 text-lg">활동 통계</h3>
                    </div>
                    <div className="space-y-6">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                            <span className="text-slate-500 text-sm font-medium">생성한 코디</span>
                            <span className="font-bold text-slate-900 text-xl">142</span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                            <span className="text-slate-500 text-sm font-medium">보유 아이템</span>
                            <span className="font-bold text-slate-900 text-xl">58</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 text-sm font-medium">스타일 점수</span>
                            <span className="font-bold text-brand-primary text-xl">98</span>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="col-span-2 space-y-6">
                 <Card className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <SectionTitle>스타일 선호도</SectionTitle>
                        <button className="text-slate-400 hover:text-slate-900"><Sliders size={20}/></button>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 mb-8">
                        <Chip active>미니멀리스트</Chip>
                        <Chip active>어반 캐주얼</Chip>
                        <Chip>빈티지</Chip>
                        <Chip>오피스룩</Chip>
                    </div>
                    
                    <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-4">선호 색상</h4>
                    <div className="flex gap-4">
                        {[
                            'bg-slate-900', 'bg-neutral-200', 'bg-blue-900', 'bg-amber-700'
                        ].map((c, i) => (
                             <div key={i} className={`w-12 h-12 rounded-full ${c} border-2 border-white shadow-md hover:scale-110 transition-transform cursor-pointer`}></div>
                        ))}
                        <button className="w-12 h-12 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-brand-primary hover:text-brand-primary transition-colors"><Plus size={20}/></button>
                    </div>
                 </Card>

                 <Card className="p-8">
                    <SectionTitle>최근 활동</SectionTitle>
                    <div className="space-y-2">
                        {[1,2,3].map(i => (
                            <div key={i} className="flex gap-5 items-center p-4 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer group">
                                <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 group-hover:border-brand-primary/30 transition-colors"></div>
                                <div>
                                    <p className="font-bold text-slate-900 text-sm group-hover:text-brand-primary transition-colors">"여름 휴가 룩" 저장됨</p>
                                    <p className="text-xs text-slate-400 mt-1">2시간 전</p>
                                </div>
                            </div>
                        ))}
                    </div>
                 </Card>
            </div>
        </div>
    </div>
);

// --- 3. STYLE PREFS ONBOARDING ---
export const ScreenStylePrefs = () => (
    <div className="p-12 max-w-4xl mx-auto flex flex-col items-center font-sans">
        <div className="text-center mb-16 max-w-2xl">
            <h1 className="text-4xl font-extrabold text-slate-900 mb-4">나만의 스타일 정의하기</h1>
            <p className="text-lg text-slate-500">AI가 당신의 취향을 완벽하게 파악할 수 있도록 도와주세요.</p>
        </div>

        <Card className="w-full mb-12 p-10">
            <SectionTitle>선호하는 분위기</SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                {[
                    {l: "미니멀", c: "bg-slate-50"},
                    {l: "캐주얼", c: "bg-blue-50"},
                    {l: "스포티", c: "bg-orange-50"},
                    {l: "포멀", c: "bg-purple-50"},
                ].map((item, i) => (
                    <div key={i} className={`aspect-square rounded-3xl ${item.c} flex flex-col items-center justify-center gap-4 cursor-pointer border-2 transition-all group relative ${i === 1 ? 'border-brand-primary shadow-lg shadow-brand-primary/20' : 'border-transparent hover:border-slate-200'}`}>
                        {i === 1 && <div className="absolute top-4 right-4 text-brand-primary"><CheckCircle2 size={24} fill="currentColor" className="text-white"/></div>}
                        <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-2xl">👕</div>
                        <span className={`font-bold text-lg ${i === 1 ? 'text-brand-primary' : 'text-slate-700'}`}>{item.l}</span>
                    </div>
                ))}
            </div>

            <SectionTitle>선호 색상 팔레트</SectionTitle>
            <div className="flex flex-wrap gap-6 justify-center mb-6">
                 {[
                     'bg-slate-900', 'bg-white border-slate-200', 'bg-red-500', 'bg-orange-500', 
                     'bg-yellow-400', 'bg-green-600', 'bg-blue-600', 'bg-purple-600', 'bg-pink-400'
                 ].map((c, i) => (
                    <div key={i} className={`w-14 h-14 rounded-full ${c} border-4 border-white shadow-lg cursor-pointer hover:scale-110 hover:-translate-y-1 transition-all`}></div>
                 ))}
            </div>
        </Card>

        <Button className="max-w-xs text-lg py-4 shadow-xl shadow-brand-primary/30">저장하고 계속하기</Button>
    </div>
);

// --- 4. OUTFIT BUILDER ---
export const ScreenBuilder = () => (
    <div className="flex h-full bg-slate-50 font-sans">
        {/* Left: Wardrobe */}
        <div className="w-80 bg-white border-r border-slate-200 p-6 flex flex-col">
            <h2 className="text-xl font-bold text-slate-900 mb-6 px-2">내 옷장</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar px-2">
                <Chip active>전체</Chip>
                <Chip>상의</Chip>
                <Chip>하의</Chip>
            </div>
            <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-4 p-2">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="aspect-square bg-white border border-slate-200 rounded-2xl flex items-center justify-center cursor-grab hover:shadow-lg hover:border-brand-primary transition-all group">
                        <span className="text-xs font-bold text-slate-300 group-hover:text-brand-primary">아이템 {i+1}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 p-8 flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900">코디 빌더</h1>
                <div className="flex gap-3">
                    <Button variant="secondary" className="!w-auto !py-2.5 px-6">초기화</Button>
                    <Button className="!w-auto !py-2.5 px-6">코디 저장</Button>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-[40px] border-2 border-dashed border-slate-200 relative flex items-center justify-center overflow-hidden shadow-sm">
                 <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-50 pointer-events-none"></div>
                 <p className="text-slate-400 font-medium bg-white px-4 py-2 rounded-full shadow-sm z-10">아이템을 드래그하여 코디를 완성하세요</p>
                 
                 {/* Simulated Dropped Item */}
                 <div className="absolute top-1/4 left-1/3 w-40 h-48 bg-blue-50 rounded-2xl shadow-xl border border-blue-100 flex items-center justify-center rotate-[-6deg] cursor-move hover:scale-105 transition-transform">
                    <span className="text-sm font-bold text-blue-800">데님 자켓</span>
                 </div>
                 <div className="absolute bottom-1/4 right-1/3 w-32 h-48 bg-slate-100 rounded-2xl shadow-xl border border-slate-200 flex items-center justify-center rotate-[3deg] cursor-move hover:scale-105 transition-transform">
                    <span className="text-sm font-bold text-slate-800">치노 팬츠</span>
                 </div>
            </div>
        </div>

        {/* Right: AI Analysis */}
        <div className="w-80 bg-white border-l border-slate-200 p-6">
             <SectionTitle>AI 분석</SectionTitle>
             <Card className="bg-slate-900 border-none text-white mb-8 p-6 text-center shadow-lg shadow-slate-900/20">
                 <div className="text-center">
                     <span className="text-5xl font-extrabold text-brand-primary tracking-tighter">92%</span>
                     <p className="text-xs font-bold text-slate-400 uppercase mt-2 tracking-widest">매칭 점수</p>
                 </div>
             </Card>

             <div className="space-y-4">
                 <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                     <p className="text-xs font-bold text-green-800 uppercase mb-2">날씨 적합도</p>
                     <div className="flex items-center gap-2 text-sm text-green-700 font-bold">
                         <CheckCircle2 size={18}/> 18°C에 완벽해요
                     </div>
                 </div>
                 <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                     <p className="text-xs font-bold text-blue-800 uppercase mb-2">색상 조합</p>
                     <div className="flex items-center gap-2 text-sm text-blue-700 font-bold">
                         <CheckCircle2 size={18}/> 안정적인 톤온톤
                     </div>
                 </div>
             </div>
        </div>
    </div>
);

// --- 5. CALENDAR / HISTORY ---
export const ScreenCalendar = () => (
    <div className="p-10 h-full flex flex-col bg-slate-50 font-sans">
         <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900">OOTD 캘린더</h1>
            <div className="flex gap-3">
                <Button variant="secondary" className="!w-auto !py-2.5 px-5 bg-white shadow-sm border-transparent"><ChevronDown size={16}/> 2023년 12월</Button>
                <Button className="!w-auto !py-2.5 px-5 shadow-lg"><Plus size={18}/> 코디 기록</Button>
            </div>
        </div>

        <div className="flex-1 bg-white rounded-3xl shadow-soft border border-slate-200 p-8 overflow-hidden flex flex-col">
            <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 rounded-2xl overflow-hidden flex-1 shadow-inner">
                {['월', '화', '수', '목', '금', '토', '일'].map(d => (
                    <div key={d} className="bg-white p-4 text-center text-sm font-bold text-slate-400">{d}</div>
                ))}
                
                {[...Array(35)].map((_, i) => {
                    const day = i - 2; // Offset for demo
                    const isToday = day === 12;
                    const hasOutfit = [3, 4, 5, 8, 9, 10, 11, 12].includes(day);
                    
                    return (
                    <div key={i} className={`bg-white min-h-[120px] p-3 relative group hover:bg-slate-50 transition-colors ${day <= 0 ? 'bg-slate-50/50' : ''}`}>
                        {day > 0 && day <= 31 && (
                            <>
                                <span className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full mb-2 ${isToday ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-700'}`}>{day}</span>
                                {hasOutfit && (
                                    <div className="bg-white rounded-xl p-2 border border-slate-200 cursor-pointer hover:border-brand-primary hover:shadow-md transition-all shadow-sm">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-1 text-blue-500 font-bold text-[10px] bg-blue-50 px-1.5 py-0.5 rounded">
                                                <CloudRain size={10}/> 14°
                                            </div>
                                        </div>
                                        <div className="w-full h-10 bg-slate-100 rounded-lg"></div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )})}
            </div>
        </div>
    </div>
);

// --- 6. HELP / FAQ ---
export const ScreenHelp = () => (
    <div className="max-w-5xl mx-auto p-12 font-sans">
        <div className="bg-slate-900 rounded-[40px] p-16 text-center text-white mb-16 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-16 opacity-10"><HelpCircle size={200} /></div>
            <h1 className="text-4xl font-extrabold mb-6">무엇을 도와드릴까요?</h1>
            <div className="max-w-lg mx-auto relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                <input type="text" placeholder="질문 키워드 검색 (예: 추천, 계정)" className="w-full pl-14 pr-6 py-5 rounded-2xl text-slate-900 focus:outline-none shadow-xl placeholder:text-slate-400 font-medium" />
            </div>
        </div>

        <div className="grid grid-cols-3 gap-12">
            <div className="col-span-2 space-y-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">자주 묻는 질문</h3>
                {[
                    "AI 추천은 어떤 방식으로 작동하나요?",
                    "내 옷장 사진을 일괄 업로드할 수 있나요?",
                    "비밀번호를 재설정하고 싶어요.",
                    "위치 정보는 안전하게 보호되나요?"
                ].map((q, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 flex justify-between items-center cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group">
                        <span className="font-bold text-slate-700 group-hover:text-slate-900">{q}</span>
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all"><Plus size={16}/></div>
                    </div>
                ))}
            </div>

            <div className="col-span-1 space-y-8">
                <Card className="p-8 border-none shadow-xl bg-gradient-to-br from-white to-slate-50">
                    <SectionTitle>고객 지원</SectionTitle>
                    <p className="text-sm text-slate-500 mb-8 leading-relaxed">원하시는 답변을 찾지 못하셨나요? 언제든 문의해주세요.</p>
                    
                    <div className="space-y-4">
                        <Button variant="secondary" className="justify-start h-14 bg-white hover:border-brand-primary text-slate-600"><Mail size={20} className="mr-2"/> 이메일 문의</Button>
                        <Button variant="secondary" className="justify-start h-14 bg-white hover:border-brand-primary text-slate-600"><Phone size={20} className="mr-2"/> 전화 상담</Button>
                    </div>
                </Card>
            </div>
        </div>
    </div>
);
 // === wrapper (기존 Screen* 코드는 그대로 둠) ===
export default function WebScreens() {
  // 지금은 디자인 확인용으로 한 화면만 렌더
  // 필요하면 router/path에 따라 바꿔도 됨
  return <ScreenSettings />;
}