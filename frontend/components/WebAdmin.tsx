/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { Button, Input, Chip, SectionTitle } from './DesignSystem';
import { 
  Users, TrendingUp, ShoppingBag, Calendar, BarChart2, 
  Download, Filter, MoreHorizontal, Search, Menu, 
  Shirt, Sun, CloudRain, Settings, ChevronDown, 
  ArrowUpRight, ArrowDownRight, CheckCircle2, AlertCircle,
  LayoutGrid, Bell
} from 'lucide-react';

// --- SHARED COMPONENTS ---

const AdminSidebar = ({ active = 'overview' }: { active?: string }) => {
  const navItems = [
    { id: 'overview', label: '대시보드', icon: LayoutGrid },
    { id: 'users', label: '사용자 관리', icon: Users },
    { id: 'wardrobe', label: '옷장 데이터', icon: Shirt },
    { id: 'outfits', label: '추천 엔진', icon: ShoppingBag },
    { id: 'weather', label: '날씨 분석', icon: Sun },
    { id: 'settings', label: '설정', icon: Settings },
  ];

  return (
    <div className="w-72 bg-slate-900 text-white flex flex-col h-full shrink-0 font-sans border-r border-slate-800">
        <div className="h-20 flex items-center px-8 border-b border-slate-800/50">
            <div className="w-6 h-6 bg-brand-primary rounded-md mr-3"></div>
            <span className="font-bold text-lg tracking-tight">Codion<span className="text-slate-500 font-normal ml-1">Admin</span></span>
        </div>

        <div className="px-6 py-8 flex-1 overflow-y-auto">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-3">메인 메뉴</p>
            <div className="space-y-1">
                {navItems.map((item) => (
                    <div 
                        key={item.id} 
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all duration-200 group ${
                            active === item.id 
                            ? 'bg-slate-800 text-white' 
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                    >
                        <item.icon size={18} className={active === item.id ? 'text-brand-primary' : 'text-slate-500 group-hover:text-slate-300'} />
                        <span className="text-sm font-medium tracking-wide">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>

        <div className="p-6 border-t border-slate-800/50">
            <div className="flex items-center gap-4 p-2 rounded-xl hover:bg-slate-800/50 cursor-pointer transition-colors">
                <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold">AD</div>
                <div>
                    <p className="text-sm font-bold text-white">관리자</p>
                    <p className="text-xs text-slate-500">super_admin</p>
                </div>
            </div>
        </div>
    </div>
  );
};

const PageHeader = ({ title, action, subtitle }: any) => (
    <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-20 px-10 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
                {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
            </div>
            {action}
        </div>
    </div>
);

const KPICard = ({ title, value, trend, trendUp, icon: Icon }: any) => (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded-lg bg-slate-50 text-slate-400">
                <Icon size={20} strokeWidth={1.5} />
            </div>
            {trend && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${trendUp ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {trendUp ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                    {trend}
                </span>
            )}
        </div>
        <div>
            <p className="text-3xl font-bold text-slate-900 tracking-tight mb-1">{value}</p>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{title}</p>
        </div>
    </div>
);

// --- 1. ADMIN OVERVIEW ---
export const WebOverview = () => (
  <div className="flex h-full bg-slate-50/50 font-sans">
    <AdminSidebar active="overview" />
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <PageHeader 
            title="대시보드" 
            subtitle="플랫폼 주요 지표 및 현황"
            action={
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:border-slate-300 transition-colors shadow-sm">
                        <Calendar size={16} className="text-slate-400"/>
                        <span>10월 1일 - 10월 31일</span>
                        <ChevronDown size={14} className="text-slate-300"/>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10">
                        <Download size={16}/> <span>리포트 다운로드</span>
                    </button>
                </div>
            }
        />

        <div className="flex-1 overflow-y-auto px-10 py-10">
            <div className="max-w-7xl mx-auto space-y-10">
                {/* KPI Grid */}
                <div className="grid grid-cols-4 gap-8">
                    <KPICard title="총 사용자" value="24,592" trend="12.5%" trendUp={true} icon={Users} />
                    <KPICard title="생성된 코디" value="1,204" trend="5.2%" trendUp={true} icon={ShoppingBag} />
                    <KPICard title="등록된 아이템" value="142.4k" trend="8.1%" trendUp={true} icon={Shirt} />
                    <KPICard title="활성 세션" value="843" trend="2.4%" trendUp={false} icon={TrendingUp} />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-3 gap-8">
                    <div className="col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 tracking-tight">사용자 성장 추이</h3>
                                <p className="text-sm text-slate-500">일간 활성 사용자 (DAU)</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-slate-900"></span>
                                    <span className="text-xs font-medium text-slate-600">금년</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-slate-200"></span>
                                    <span className="text-xs font-medium text-slate-400">작년</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Elegant Line Chart Placeholder */}
                        <div className="h-72 w-full flex items-end justify-between gap-1 relative px-2">
                             {/* Grid Lines */}
                             <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                <div className="w-full h-px bg-slate-50"></div>
                                <div className="w-full h-px bg-slate-50"></div>
                                <div className="w-full h-px bg-slate-50"></div>
                                <div className="w-full h-px bg-slate-50"></div>
                                <div className="w-full h-px bg-slate-50"></div>
                             </div>

                             {[35, 42, 45, 40, 55, 60, 58, 65, 72, 68, 80, 85, 82, 90, 95, 88, 92, 100, 110, 105, 115, 120, 118, 125].map((h, i) => (
                                 <div key={i} className="flex-1 bg-slate-900 rounded-t-sm opacity-90 hover:opacity-100 transition-opacity relative group" style={{height: `${h * 0.5}%`}}>
                                     <div className="absolute bottom-0 inset-x-0 h-full bg-gradient-to-t from-white/10 to-transparent"></div>
                                 </div>
                             ))}
                        </div>
                    </div>

                    <div className="col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col">
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-2">인기 카테고리</h3>
                        <p className="text-sm text-slate-500 mb-8">가장 많이 등록된 아이템</p>
                        
                        <div className="space-y-6 flex-1">
                            {[
                                {l: '아우터', v: 45, c: 'bg-slate-900'},
                                {l: '신발', v: 30, c: 'bg-brand-primary'},
                                {l: '액세서리', v: 15, c: 'bg-slate-400'},
                                {l: '상의', v: 10, c: 'bg-slate-200'},
                            ].map((item, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="font-medium text-slate-700">{item.l}</span>
                                        <span className="font-bold text-slate-900">{item.v}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${item.c}`} style={{width: `${item.v}%`}}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <button className="w-full py-3 mt-4 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                            전체 리포트 보기
                        </button>
                    </div>
                </div>
                
                {/* Recent Transactions Table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">최근 활동</h3>
                        <button className="text-sm font-medium text-brand-primary hover:text-brand-primary-dark transition-colors">모두 보기</button>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">사용자</th>
                                <th className="px-8 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">활동 내용</th>
                                <th className="px-8 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">날짜</th>
                                <th className="px-8 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">상태</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {[1,2,3,4,5].map(i => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">U{i}</div>
                                            <span className="font-medium text-slate-900">User_{1000+i}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-sm text-slate-600">"겨울 코디" 생성 요청 (5건)</td>
                                    <td className="px-8 py-5 text-sm text-slate-500 font-mono">10월 {20+i}일, 2023</td>
                                    <td className="px-8 py-5">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> 완료
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
  </div>
);

// --- 2. USERS PAGE ---
export const WebUsers = () => (
    <div className="flex h-full bg-slate-50/50">
      <AdminSidebar active="users" />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <PageHeader 
            title="사용자 관리" 
            subtitle="사용자 계정 및 권한 설정"
            action={<Button className="!w-auto !py-2.5 px-5 text-sm font-medium shadow-lg">+ 사용자 추가</Button>}
        />
        <div className="flex-1 overflow-y-auto px-10 py-10">
            <div className="max-w-7xl mx-auto bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-6 border-b border-slate-100 flex gap-4 bg-white">
                     <div className="relative flex-1 max-w-lg">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input className="w-full pl-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-all placeholder:text-slate-400" placeholder="이름, 이메일, ID 검색..." />
                     </div>
                     <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                            <Filter size={16}/> 필터
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                            <Download size={16}/> 내보내기
                        </button>
                     </div>
                </div>

                {/* Table */}
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-8 py-4 w-12"><input type="checkbox" className="rounded border-slate-300 text-slate-900 focus:ring-0"/></th>
                            <th className="px-8 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">사용자 정보</th>
                            <th className="px-8 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">스타일 선호</th>
                            <th className="px-8 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">지역</th>
                            <th className="px-8 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">상태</th>
                            <th className="px-8 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {[1,2,3,4,5,6].map(i => (
                            <tr key={i} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="px-8 py-5"><input type="checkbox" className="rounded border-slate-300 text-slate-900 focus:ring-0"/></td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500">김</div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">김민지</p>
                                            <p className="text-xs text-slate-500">minji.k@example.com</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">미니멀리즘</span>
                                </td>
                                <td className="px-8 py-5 text-sm text-slate-600">서울, 대한민국</td>
                                <td className="px-8 py-5">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> 활성
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-colors"><MoreHorizontal size={18}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="p-6 border-t border-slate-100 flex justify-between items-center text-sm text-slate-500 bg-slate-50/50">
                    <span>전체 1,234명 중 1-10명 표시</span>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 transition-colors bg-white">이전</button>
                        <button className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 transition-colors bg-white">다음</button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
);

// --- 3. WARDROBE ITEMS ---
export const WebWardrobe = () => (
    <div className="flex h-full bg-slate-50/50">
      <AdminSidebar active="wardrobe" />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <PageHeader title="옷장 데이터" subtitle="사용자 업로드 및 시스템 아이템 관리" />
        <div className="flex-1 overflow-y-auto px-10 py-10">
            <div className="max-w-7xl mx-auto bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                 <div className="p-6 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
                     <div className="flex gap-2">
                         {['전체', '미분류', '신고됨'].map((l, i) => (
                             <button key={i} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${i === 0 ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                                 {l}
                             </button>
                         ))}
                     </div>
                     <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input className="w-full pl-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-300" placeholder="아이템 검색..." />
                     </div>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-8 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">아이템</th>
                            <th className="px-8 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">상세 정보</th>
                            <th className="px-8 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">카테고리</th>
                            <th className="px-8 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">태그</th>
                            <th className="px-8 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">소유자</th>
                            <th className="px-8 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">업로드 일시</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {[1,2,3,4,5].map(i => (
                            <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-8 py-5">
                                    <div className="w-16 h-16 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center">
                                        <Shirt size={24} className="text-slate-300"/>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <p className="font-bold text-slate-900 text-sm">빈티지 데님 자켓</p>
                                    <p className="text-xs text-slate-500 mt-1">Levi's • M 사이즈</p>
                                </td>
                                <td className="px-8 py-5">
                                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-semibold border border-slate-200">아우터</span>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex gap-1 flex-wrap">
                                        <span className="text-[10px] font-bold text-slate-400 border border-slate-200 px-1.5 rounded">캐주얼</span>
                                        <span className="text-[10px] font-bold text-slate-400 border border-slate-200 px-1.5 rounded">블루</span>
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-sm text-slate-600">User_{420+i}</td>
                                <td className="px-8 py-5 text-sm text-slate-500 font-mono">10월 {20+i}일</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
);

// --- 4. OUTFIT RECOMMENDATIONS ---
export const WebOutfits = () => (
    <div className="flex h-full bg-slate-50/50">
      <AdminSidebar active="outfits" />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <PageHeader title="추천 엔진" subtitle="실시간 코디 생성 현황 및 품질 지표" />
        <div className="flex-1 overflow-y-auto px-10 py-10">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-3 gap-8 mb-10">
                     <KPICard title="생성 성공률" value="98.2%" trend="0.4%" trendUp={true} icon={CheckCircle2} />
                     <KPICard title="평균 매칭 점수" value="89/100" trend="1.2%" trendUp={true} icon={TrendingUp} />
                     <KPICard title="저품질 경고" value="23" trend="5%" trendUp={false} icon={AlertCircle} />
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">실시간 피드</h3>
                        <div className="flex gap-2">
                             <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><LayoutGrid size={20}/></button>
                             <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><Menu size={20}/></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-8">
                        {[1,2,3,4,5,6,7,8].map(i => (
                            <div key={i} className="group cursor-pointer">
                                <div className="aspect-[3/4] bg-slate-50 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden border border-slate-100 group-hover:shadow-md transition-all duration-300">
                                    <span className="text-xs text-slate-300 font-bold uppercase tracking-widest">미리보기</span>
                                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-slate-900 text-[10px] font-bold px-2 py-1 rounded border border-slate-100 shadow-sm">9{9-i}%</div>
                                </div>
                                <h4 className="font-bold text-sm text-slate-900 truncate">어반 윈터 스타일 #{i}</h4>
                                <div className="flex justify-between items-center mt-2">
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                        <CloudRain size={12}/>
                                        <span>비옴</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-400">ID: 8F3K{i}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
);

// --- 5. WEATHER IMPACT ---
export const WebWeather = () => (
    <div className="flex h-full bg-slate-50/50">
      <AdminSidebar active="weather" />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <PageHeader title="날씨 분석" subtitle="기상 조건에 따른 사용자 선호도 변화" />
        <div className="flex-1 overflow-y-auto px-10 py-10">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="grid grid-cols-2 gap-8">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-6">기온 vs 레이어드 수</h3>
                        <div className="h-72 w-full border-l border-b border-slate-100 relative bg-slate-50/30">
                            {/* Refined Scatter Plot */}
                             {[...Array(25)].map((_, i) => (
                                 <div key={i} 
                                    className="w-2.5 h-2.5 rounded-full border-2 border-slate-900 bg-white absolute hover:scale-150 transition-transform cursor-crosshair" 
                                    style={{
                                        left: `${Math.random() * 90 + 5}%`, 
                                        bottom: `${Math.random() * 80 + 10}%`
                                    }}
                                 ></div>
                             ))}
                             <div className="absolute bottom-2 right-4 text-xs font-bold text-slate-400 uppercase">기온 (°C)</div>
                             <div className="absolute top-4 left-2 text-xs font-bold text-slate-400 uppercase writing-mode-vertical">옷 겹 수</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-6">날씨 상태 분포</h3>
                        <div className="space-y-6">
                            {[
                                {l: '맑음 / 화창', v: 45, i: Sun},
                                {l: '비', v: 30, i: CloudRain},
                                {l: '흐림', v: 15, i: CloudRain},
                                {l: '눈', v: 10, i: CloudRain},
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-5">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500"><item.i size={20}/></div>
                                    <div className="flex-1">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="font-bold text-slate-700">{item.l}</span>
                                            <span className="font-bold text-slate-900">{item.v}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full bg-slate-900" style={{width: `${item.v}%`}}></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-6">글로벌 날씨 요청 맵</h3>
                    <div className="bg-slate-50 rounded-xl h-96 flex items-center justify-center border border-slate-100 border-dashed">
                        <span className="text-slate-400 font-bold text-sm uppercase tracking-widest">인터랙티브 맵 영역</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
);

// --- 6. ADMIN SETTINGS ---
export const WebAdminSettings = () => (
    <div className="flex h-full bg-slate-50/50">
      <AdminSidebar active="settings" />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <PageHeader title="플랫폼 설정" subtitle="시스템 파라미터 및 API 키 관리" />
        <div className="flex-1 overflow-y-auto px-10 py-10">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-6 pb-4 border-b border-slate-100">일반 설정</h3>
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">플랫폼 이름</label>
                            <Input placeholder="Codion AI" className="!bg-slate-50 !border-slate-200" />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">고객지원 이메일</label>
                            <Input placeholder="support@codion.ai" className="!bg-slate-50 !border-slate-200" />
                        </div>
                        <div className="col-span-2">
                             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">점검 모드</label>
                             <div className="flex items-center justify-between p-5 border border-slate-200 rounded-xl bg-slate-50/50">
                                 <div>
                                     <p className="font-bold text-slate-900 text-sm">점검 모드 활성화</p>
                                     <p className="text-xs text-slate-500 mt-1">업데이트 중 사용자의 앱 접속을 제한합니다.</p>
                                 </div>
                                 <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer transition-colors hover:bg-slate-300">
                                     <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm"></div>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-6 pb-4 border-b border-slate-100">AI 모델 설정</h3>
                    <div className="space-y-6">
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">추천 엔진 버전</label>
                            <div className="relative">
                                <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900/10 appearance-none cursor-pointer">
                                    <option>v2.4.0 (Stable)</option>
                                    <option>v2.5.0-beta (Experimental)</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16}/>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                             <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Weather API 키</label>
                                <Input placeholder="••••••••••••••••" type="password" className="!bg-slate-50 !border-slate-200" />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Vision API 키</label>
                                <Input placeholder="••••••••••••••••" type="password" className="!bg-slate-50 !border-slate-200" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button className="px-8 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">취소</button>
                    <button className="px-8 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 shadow-lg shadow-slate-900/10 transition-colors">변경사항 저장</button>
                </div>
            </div>
        </div>
      </div>
    </div>
);