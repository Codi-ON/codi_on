/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { Button, Input, Card, Chip, SectionTitle } from './DesignSystem';
import { 
  Sun, CloudRain, Wind, Thermometer, User, Mail, Lock, 
  Camera, Plus, Heart, Share2, AlertCircle, CheckCircle2, 
  Calendar, Layers, Settings, Home, Grid, PlusCircle, Bookmark,
  Search, ChevronLeft, ShoppingBag, Bell, Menu, Umbrella, ArrowRight
} from 'lucide-react';

// --- SHARED WEB HEADER ---
const WebHeader = ({ active = 'home' }: { active?: string }) => (
    <div className="w-full bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-12">
            <div className="text-2xl font-extrabold tracking-tighter text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white text-lg font-bold">C</div>
                CODION
            </div>
            <nav className="hidden md:flex gap-8">
                {[
                    { id: 'home', label: '홈' },
                    { id: 'wardrobe', label: '내 옷장' },
                    { id: 'results', label: '추천 코디' },
                    { id: 'saved', label: '북마크' },
                ].map((item) => (
                    <button 
                        key={item.id} 
                        className={`text-sm font-bold transition-colors ${active === item.id ? 'text-brand-primary' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        {item.label}
                    </button>
                ))}
            </nav>
        </div>
        <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-300">
                 <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-500"><User size={16} /></div>
            </div>
        </div>
    </div>
);

// --- 1. ONBOARDING (WEB LANDING) ---
export const ScreenOnboarding = () => (
  <div className="h-full flex flex-col bg-slate-50 relative overflow-hidden">
    <div className="flex justify-between items-center p-8 max-w-7xl mx-auto w-full z-10">
        <span className="text-2xl font-extrabold text-slate-900">CODION</span>
        <div className="flex gap-4">
            <button className="text-sm font-bold text-slate-500 hover:text-slate-900">로그인</button>
            <Button className="!w-auto !py-2 px-6 text-sm">무료로 시작하기</Button>
        </div>
    </div>

    <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
                 <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 mb-6 leading-tight">
                    나만의 AI <span className="text-brand-primary">스타일리스트</span>
                </h1>
                <p className="text-lg text-slate-500 mb-8 leading-relaxed max-w-lg">
                    오늘 뭐 입을지 고민하지 마세요. 코디온이 날씨와 당신의 옷장을 분석하여 
                    완벽한 하루를 위한 스타일을 제안합니다.
                </p>
                <div className="flex gap-4">
                     <Button className="!w-auto px-8 text-lg">지금 시작하기</Button>
                     <Button variant="secondary" className="!w-auto px-8 text-lg">더 알아보기</Button>
                </div>
                <div className="mt-12 flex gap-8">
                    <div>
                        <p className="text-3xl font-bold text-slate-900">10k+</p>
                        <p className="text-sm text-slate-500">유저 리뷰</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-slate-900">98%</p>
                        <p className="text-sm text-slate-500">만족도</p>
                    </div>
                </div>
            </div>
            
            <div className="relative">
                <div className="absolute -inset-4 bg-brand-primary/20 rounded-full blur-3xl opacity-50"></div>
                <div className="bg-white rounded-[40px] shadow-2xl p-8 border border-slate-100 relative transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
                     <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-500"><CloudRain /></div>
                        <div>
                            <p className="font-bold text-slate-900">비 오는 날 코디</p>
                            <p className="text-xs text-slate-500">서울, 18°C</p>
                        </div>
                     </div>
                     <div className="aspect-[4/3] bg-brand-accent-bg/30 rounded-2xl mb-6"></div>
                     <div className="flex gap-2">
                        <Chip active>방수</Chip>
                        <Chip active>트렌치코트</Chip>
                     </div>
                </div>
            </div>
        </div>
    </div>
  </div>
);

// --- 2. LOGIN (WEB AUTH) ---
export const ScreenLogin = () => (
  <div className="h-full flex items-center justify-center bg-slate-50 p-6">
    <div className="bg-white rounded-3xl p-12 shadow-xl border border-slate-100 max-w-md w-full">
        <div className="text-center mb-10">
             <div className="w-12 h-12 bg-brand-primary rounded-xl mx-auto mb-6 flex items-center justify-center text-white text-xl font-bold">C</div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">환영합니다!</h2>
            <p className="text-slate-500">코디온 계정으로 로그인하세요.</p>
        </div>
        
        <div className="space-y-5 mb-8">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">이메일</label>
                <Input icon={Mail} placeholder="name@example.com" />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">비밀번호</label>
                <Input icon={Lock} placeholder="••••••••" />
            </div>
            <div className="flex justify-between items-center text-sm">
                 <label className="flex items-center gap-2 cursor-pointer">
                     <input type="checkbox" className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary" />
                     <span className="text-slate-500">로그인 유지</span>
                 </label>
                <button className="font-bold text-brand-primary hover:text-brand-primary-dark">비밀번호 찾기</button>
            </div>
        </div>

        <Button className="mb-6 py-4 text-base">로그인</Button>
        
        <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-xs uppercase font-bold tracking-wider"><span className="bg-white px-4 text-slate-400">소셜 로그인</span></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <Button variant="secondary" className="text-sm">Google</Button>
            <Button variant="secondary" className="text-sm">Apple</Button>
        </div>
    </div>
  </div>
);

// --- 3. MAIN HOME (WEB DASHBOARD) ---
export const ScreenHome = () => (
  <div className="h-full bg-slate-50 flex flex-col overflow-hidden font-sans">
    <WebHeader active="home" />
    
    <div className="flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="max-w-7xl mx-auto space-y-12">
            
            {/* Hero / Weather Section */}
            <div className="flex flex-col md:flex-row gap-8 items-stretch">
                <div className="flex-1">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-2">안녕하세요, Alex님! 👋</h1>
                    <p className="text-slate-500 mb-8">오늘 서울은 비가 올 예정이에요. 우산을 챙기세요.</p>
                    
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-32">
                             <div className="flex justify-between text-slate-500 text-sm font-bold"><span>기온</span> <Thermometer size={18}/></div>
                             <span className="text-3xl font-extrabold text-slate-900">18°C</span>
                        </div>
                         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-32">
                             <div className="flex justify-between text-slate-500 text-sm font-bold"><span>강수확률</span> <CloudRain size={18}/></div>
                             <span className="text-3xl font-extrabold text-blue-500">82%</span>
                        </div>
                         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-32">
                             <div className="flex justify-between text-slate-500 text-sm font-bold"><span>풍속</span> <Wind size={18}/></div>
                             <span className="text-3xl font-extrabold text-slate-900">12km/h</span>
                        </div>
                    </div>
                </div>

                <div className="md:w-1/3 bg-gradient-to-br from-brand-primary to-orange-500 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col justify-between shadow-lg">
                    <div className="absolute top-0 right-0 p-8 opacity-20"><CloudRain size={160} /></div>
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold mb-1">오늘의 날씨 팁</h3>
                        <p className="text-white/80 text-sm leading-relaxed">
                            오후 3시부터 강한 비가 예상됩니다. <br/>
                            방수 기능이 있는 트렌치 코트를 추천해요.
                        </p>
                    </div>
                    <Button variant="secondary" className="relative z-10 !w-auto self-start mt-6 bg-white/20 border-transparent text-white hover:bg-white/30 backdrop-blur-md">자세히 보기</Button>
                </div>
            </div>

            {/* Recommendations */}
            <div>
                <SectionTitle action="모두 보기">오늘의 추천 스타일</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer group">
                             <div className="h-64 bg-slate-100 relative overflow-hidden">
                                 <div className="absolute inset-0 flex items-center justify-center text-slate-300 group-hover:scale-105 transition-transform duration-500">이미지</div>
                                 <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-slate-900 shadow-sm flex items-center gap-1">
                                    <Heart size={12} className="text-brand-primary fill-brand-primary" /> 98% 매칭
                                </div>
                             </div>
                             <div className="p-6">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-lg font-bold text-slate-900">어반 캐주얼 레이어드</h4>
                                    <div className="p-2 hover:bg-brand-accent-bg rounded-full text-slate-400 hover:text-brand-primary"><Bookmark size={20}/></div>
                                </div>
                                <p className="text-sm text-slate-500 mb-4">트렌치 코트 • 데님 • 워커</p>
                                <div className="flex gap-2">
                                    <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold">방수</span>
                                    <span className="text-xs bg-brand-accent-bg text-brand-primary px-3 py-1 rounded-full font-bold">보온성</span>
                                </div>
                             </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Wardrobe Quick Access */}
            <div>
                 <SectionTitle>내 옷장 요약</SectionTitle>
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {['아우터', '상의', '하의', '신발', '가방', '액세서리'].map((cat, i) => (
                        <div key={i} className="aspect-square bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center gap-3 hover:border-brand-primary cursor-pointer transition-colors group">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-brand-accent-bg group-hover:text-brand-primary transition-colors">
                                <ShoppingBag size={20} />
                            </div>
                            <span className="font-bold text-slate-700">{cat}</span>
                        </div>
                    ))}
                 </div>
            </div>

        </div>
    </div>
  </div>
);

// --- 4. WARDROBE LIST (WEB GRID) ---
export const ScreenWardrobe = () => (
    <div className="h-full bg-slate-50 flex flex-col overflow-hidden font-sans">
        <WebHeader active="wardrobe" />
        <div className="flex-1 overflow-hidden flex">
            
            {/* Sidebar Filters */}
            <div className="w-72 bg-white border-r border-slate-200 p-8 hidden lg:block overflow-y-auto">
                <h3 className="font-bold text-lg text-slate-900 mb-6">필터</h3>
                
                <div className="space-y-8">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase mb-3">카테고리</p>
                        <div className="space-y-2">
                            {['전체 보기', '아우터', '상의', '하의', '원피스', '신발', '가방'].map((item, i) => (
                                <div key={i} className={`flex justify-between items-center px-3 py-2 rounded-lg cursor-pointer ${i === 1 ? 'bg-brand-accent-bg text-brand-primary font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                                    <span>{item}</span>
                                    <span className="text-xs text-slate-400">24</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase mb-3">계절</p>
                        <div className="flex flex-wrap gap-2">
                            <Chip active>봄/가을</Chip>
                            <Chip>여름</Chip>
                            <Chip>겨울</Chip>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-8 border-b border-slate-200 bg-white flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">아우터</h2>
                        <p className="text-slate-500 text-sm">총 24개의 아이템</p>
                    </div>
                    <div className="flex gap-3">
                         <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input className="w-full pl-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" placeholder="아이템 검색..." />
                        </div>
                        <Button className="!w-auto px-6 text-sm gap-2"><Plus size={18}/> 아이템 추가</Button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                            <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all group cursor-pointer">
                                <div className="aspect-[4/5] bg-slate-100 relative flex items-center justify-center">
                                     <div className="text-slate-300">이미지</div>
                                     <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500">
                                        <Heart size={16} />
                                     </button>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-slate-900 truncate pr-2">베이지 트렌치 코트</h4>
                                        <span className="text-xs font-bold text-slate-400">M</span>
                                    </div>
                                    <p className="text-xs text-slate-500">버버리 • 2023 가을</p>
                                    <div className="mt-3 flex gap-1">
                                        <span className="w-3 h-3 rounded-full bg-[#D2B48C] border border-slate-200"></span>
                                        <span className="w-3 h-3 rounded-full bg-slate-800 border border-slate-200"></span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// --- 5. ADD CLOTHING (WEB MODAL/PAGE) ---
export const ScreenAdd = () => (
    <div className="h-full bg-slate-50 flex items-center justify-center p-8 font-sans">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col md:flex-row h-[600px]">
            {/* Left: Upload Area */}
            <div className="md:w-1/2 bg-slate-50 border-r border-slate-200 p-8 flex flex-col items-center justify-center text-center">
                <div className="w-full max-w-sm aspect-[4/5] rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-slate-100 transition-colors group">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-slate-400 group-hover:text-brand-primary shadow-sm">
                        <Camera size={32} />
                    </div>
                    <div>
                        <p className="font-bold text-slate-700">사진 업로드</p>
                        <p className="text-xs text-slate-400 mt-1">또는 파일을 여기에 드래그하세요</p>
                    </div>
                </div>
            </div>

            {/* Right: Form */}
            <div className="md:w-1/2 p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">새 아이템 추가</h2>
                    <button className="text-slate-400 hover:text-slate-600"><ChevronLeft className="rotate-180" /></button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">카테고리</label>
                        <div className="flex flex-wrap gap-2">
                            <Chip>상의</Chip>
                            <Chip active>아우터</Chip>
                            <Chip>하의</Chip>
                            <Chip>신발</Chip>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">기본 정보</label>
                        <div className="space-y-3">
                            <Input placeholder="아이템 이름 (예: 블루 데님 자켓)" />
                            <div className="grid grid-cols-2 gap-3">
                                <Input placeholder="브랜드" />
                                <Input placeholder="사이즈" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">속성 태그</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            <Chip active>방수</Chip>
                            <Chip>방풍</Chip>
                            <Chip>기모</Chip>
                            <button className="px-3 py-1 rounded-full text-xs font-bold border border-dashed border-slate-300 text-slate-400 hover:border-brand-primary hover:text-brand-primary transition-colors flex items-center gap-1">
                                <Plus size={12}/> 태그 추가
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex gap-4">
                    <Button variant="secondary">취소</Button>
                    <Button>저장하기</Button>
                </div>
            </div>
        </div>
    </div>
);

// --- 6. OUTFIT DETAIL (WEB PRODUCT PAGE) ---
export const ScreenDetail = () => (
    <div className="h-full bg-slate-50 flex flex-col overflow-hidden font-sans">
        <WebHeader active="results" />
        
        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
            <div className="max-w-6xl mx-auto bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden flex flex-col lg:flex-row">
                
                {/* Visual Side */}
                <div className="lg:w-1/2 bg-slate-100 relative min-h-[500px]">
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-bold text-xl">코디 이미지</div>
                    <div className="absolute top-8 left-8">
                         <Button variant="secondary" className="!w-auto !py-2 px-4 gap-2 bg-white/80 backdrop-blur border-none shadow-sm"><ChevronLeft size={16}/> 뒤로가기</Button>
                    </div>
                    <div className="absolute bottom-8 right-8 flex gap-3">
                        <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:text-red-500 transition-colors"><Heart size={24}/></button>
                        <button className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-slate-800 transition-colors"><Share2 size={24}/></button>
                    </div>
                </div>

                {/* Details Side */}
                <div className="lg:w-1/2 p-10 lg:p-16">
                    <div className="flex items-center gap-2 mb-4">
                         <span className="px-3 py-1 bg-brand-accent-bg text-brand-primary font-bold rounded-full text-xs">AI 추천</span>
                         <span className="px-3 py-1 bg-slate-100 text-slate-600 font-bold rounded-full text-xs">98% 매칭</span>
                    </div>
                    
                    <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-2">어반 익스플로러</h1>
                    <p className="text-slate-500 mb-8">비 오는 날, 도심 속에서도 스타일을 잃지 않는 완벽한 룩.</p>

                    <div className="grid grid-cols-2 gap-4 mb-10">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                             <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase mb-1"><Thermometer size={14}/> 추천 기온</div>
                             <span className="font-bold text-slate-900">12°C - 18°C</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                             <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase mb-1"><CloudRain size={14}/> 날씨</div>
                             <span className="font-bold text-slate-900">비/흐림</span>
                        </div>
                    </div>

                    <SectionTitle>포함된 아이템</SectionTitle>
                    <div className="space-y-4 mb-10">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group">
                                <div className="w-16 h-16 bg-slate-100 rounded-lg border border-slate-200"></div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-brand-primary transition-colors">클래식 베이지 트렌치 코트</h4>
                                    <p className="text-xs text-slate-500">버버리 • 아우터</p>
                                </div>
                                <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ChevronLeft size={16} className="rotate-180"/>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                        <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                            <AlertCircle size={18}/> 스타일링 팁
                        </h4>
                        <p className="text-sm text-blue-700 leading-relaxed">
                            트렌치 코트의 허리 벨트를 묶어 실루엣을 강조해보세요. 
                            부츠는 바지 밑단을 살짝 롤업해서 매치하면 더 세련되어 보입니다.
                        </p>
                    </div>

                    <div className="mt-10">
                        <Button className="text-lg py-4">이 코디로 결정하기</Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// --- 7. CHECKLIST (WEB WIDGET/CARD) ---
export const ScreenChecklist = () => (
    <div className="h-full bg-slate-50 flex items-center justify-center p-8 font-sans">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-lg w-full overflow-hidden">
            <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold mb-1">외출 전 체크리스트</h2>
                    <p className="text-slate-400 text-sm">완벽한 하루를 위해 준비하셨나요?</p>
                </div>
                <div className="absolute top-0 right-0 p-6 opacity-10"><CheckCircle2 size={120}/></div>
            </div>

            <div className="p-8">
                 <div className="mb-6 bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-brand-primary font-bold">75%</div>
                    <div className="flex-1">
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-primary w-3/4"></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 font-medium">3/4 완료</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                    {[
                        { l: "일기 예보 확인하기", c: true },
                        { l: "우산 챙기기 (강수확률 80%)", c: true },
                        { l: "방수 신발 착용", c: true },
                        { l: "보조 배터리 충전", c: false },
                    ].map((item, i) => (
                        <div key={i} className={`flex items-center gap-4 p-3 rounded-xl transition-all cursor-pointer ${item.c ? 'bg-slate-50' : 'hover:bg-slate-50'}`}>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${item.c ? 'bg-brand-primary border-brand-primary' : 'border-slate-300'}`}>
                                {item.c && <CheckCircle2 size={14} className="text-white" />}
                            </div>
                            <span className={`text-sm font-bold ${item.c ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{item.l}</span>
                        </div>
                    ))}
                 </div>

                 <div className="mt-8 pt-6 border-t border-slate-100 flex gap-4">
                     <Button variant="secondary">나중에 알림</Button>
                     <Button>완료 확인</Button>
                 </div>
            </div>
        </div>
    </div>
);

// --- 8. RESULTS (WEB GALLERY) ---
export const ScreenResults = () => (
    <div className="h-full bg-slate-50 flex flex-col overflow-hidden font-sans">
        <WebHeader active="results" />
        <div className="p-8 border-b border-slate-200 bg-white sticky top-[73px] z-20 shadow-sm">
             <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">AI 추천 코디</h2>
                    <p className="text-slate-500 text-sm">당신의 스타일과 오늘의 날씨를 분석했습니다.</p>
                </div>
                <div className="flex gap-2">
                    <Chip active>편안함</Chip>
                    <Chip>오피스룩</Chip>
                    <Chip>데이트</Chip>
                    <Button variant="secondary" className="!w-auto px-4 ml-4"><Settings size={16}/> 설정</Button>
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {[1,2,3,4,5,6,7,8].map(i => (
                     <div key={i} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                        <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden">
                            <div className="absolute top-4 left-4 bg-black/70 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full">9{9-i}% 매칭</div>
                            <div className="absolute inset-0 flex items-center justify-center text-slate-300 group-hover:scale-105 transition-transform">코디 {i}</div>
                            
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button className="!w-auto px-6 bg-white text-slate-900 hover:bg-slate-100">상세 보기</Button>
                            </div>
                        </div>
                        <div className="p-5">
                             <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-lg text-slate-900">스타일 #{i}</span>
                                <button className="text-slate-400 hover:text-brand-primary transition-colors"><PlusCircle size={22} /></button>
                             </div>
                             <p className="text-sm text-slate-500">캐주얼 • 미니멀</p>
                        </div>
                     </div>
                ))}
            </div>
        </div>
    </div>
);

// --- 9. SAVED LOOKS (WEB COLLECTION) ---
export const ScreenSaved = () => (
     <div className="h-full bg-slate-50 flex flex-col overflow-hidden font-sans">
        <WebHeader active="saved" />
        
        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">북마크 & 컬렉션</h2>
                        <p className="text-slate-500">저장한 스타일을 관리하세요.</p>
                    </div>
                    <Button className="!w-auto px-6 gap-2"><Plus size={18}/> 새 컬렉션</Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <div className="bg-gradient-to-br from-brand-primary to-orange-500 rounded-2xl p-6 text-white shadow-lg cursor-pointer transform hover:scale-[1.02] transition-transform">
                        <div className="flex justify-between items-start mb-8">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><Heart size={20} fill="white"/></div>
                            <span className="font-bold text-2xl">24</span>
                        </div>
                        <h3 className="font-bold text-lg">즐겨찾기</h3>
                        <p className="text-white/80 text-sm">모든 찜한 아이템</p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm cursor-pointer hover:border-brand-primary transition-colors group">
                        <div className="flex justify-between items-start mb-8">
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center"><Calendar size={20}/></div>
                            <span className="font-bold text-2xl text-slate-900">5</span>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 group-hover:text-brand-primary transition-colors">이번 주 계획</h3>
                        <p className="text-slate-500 text-sm">캘린더 일정</p>
                    </div>
                </div>

                <SectionTitle>내 컬렉션</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1,2,3].map(i => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-lg transition-shadow cursor-pointer">
                            <div className="grid grid-cols-2 gap-2 mb-4 h-48">
                                <div className="bg-slate-100 rounded-tl-xl rounded-bl-xl h-full"></div>
                                <div className="grid grid-rows-2 gap-2 h-full">
                                    <div className="bg-slate-100 rounded-tr-xl"></div>
                                    <div className="bg-slate-100 rounded-br-xl"></div>
                                </div>
                            </div>
                            <div className="px-2 pb-2">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className="font-bold text-lg text-slate-900">겨울 오피스 룩</h4>
                                    <button className="text-slate-400 hover:text-slate-900"><MoreHorizontal size={20}/></button>
                                </div>
                                <p className="text-sm text-slate-500">12개 아이템 • 3일 전 업데이트</p>
                            </div>
                        </div>
                    ))}
                    
                    {/* Add New Placeholder */}
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center h-full min-h-[300px] text-slate-400 hover:border-brand-primary hover:text-brand-primary hover:bg-brand-accent-bg transition-all cursor-pointer">
                        <Plus size={48} className="mb-4 opacity-50"/>
                        <span className="font-bold">컬렉션 만들기</span>
                    </div>
                </div>
            </div>
        </div>
     </div>
);

// Helper for collection card
import { MoreHorizontal } from 'lucide-react';