
import React, { useState } from 'react';
import { Card, Button, Input, Badge, SectionHeader } from '../../app/DesignSystem';
import { Search, Monitor, ShieldCheck, Palette, Layers, X, ExternalLink, Info } from 'lucide-react';

// Previews
import LandingPage from '../landing/LandingPage';
import AuthPage from '../auth/AuthPage';
import TodayPage from '../user/TodayPage';
import ClosetPage from '../user/ClosetPage';
import ClosetAddItemPage from '../user/ClosetAddItemPage';
import ItemDetailPage from '../user/ItemDetailPage';
import RecommendationPage from '../user/RecommendationPage';
import ChecklistPage from '../user/ChecklistPage';
import HistoryPage from '../user/HistoryPage';
import CalendarPage from '../user/CalendarPage';
import SettingsPage from '../user/SettingsPage';
import HelpFaqPage from '../user/HelpFaqPage';
import MyPage from '../user/MyPage';
import UserDashboardPage from '../user/UserDashboardPage';

import AdminDashboardPage from '../admin/AdminDashboardPage';
import AdminUsersPage from '../admin/AdminUsersPage';
import AdminDataPage from '../admin/AdminDataPage';
import AdminRecoFunnelPage from '../admin/AdminRecoFunnelPage';
import AdminSettingsPage from '../admin/AdminSettingsPage';

import UiKitPage from './UiKitPage';

const ShowcaseHubPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'user' | 'admin' | 'kit' | 'overlay'>('all');
  const [previewComponent, setPreviewComponent] = useState<React.ReactNode | null>(null);

  const pages = [
    { id: 'landing', title: '랜딩 페이지', cat: 'user', comp: <LandingPage onNavigate={() => {}} />, desc: '마케팅 및 서비스 소개' },
    { id: 'auth', title: '인증 페이지', cat: 'user', comp: <AuthPage onNavigate={() => {}} />, desc: '로그인 및 회원가입' },
    { id: 'today', title: '오늘의 코디', cat: 'user', comp: <TodayPage />, desc: '날씨 기반 데일리 요약' },
    { id: 'closet', title: '나의 옷장', cat: 'user', comp: <ClosetPage />, desc: '보유 아이템 그리드 뷰' },
    { id: 'add-item', title: '옷 등록', cat: 'user', comp: <ClosetAddItemPage onBack={() => setPreviewComponent(null)} />, desc: '새 아이템 추가 폼' },
    { id: 'item-detail', title: '아이템 상세', cat: 'user', comp: <ItemDetailPage onBack={() => setPreviewComponent(null)} />, desc: '아이템 정보 및 통계' },
    { id: 'reco', title: '스타일 추천', cat: 'user', comp: <RecommendationPage onNavigate={() => {}} />, desc: 'AI 코디 제안' },
    { id: 'checklist', title: '체크리스트', cat: 'user', comp: <ChecklistPage />, desc: '활동 정보 입력' },
    { id: 'history', title: '코디 히스토리', cat: 'user', comp: <HistoryPage />, desc: '과거 코디 기록 (리스트)' },
    { id: 'calendar', title: 'OOTD 캘린더', cat: 'user', comp: <CalendarPage />, desc: '월간 코디 현황' },
    { id: 'settings', title: '설정', cat: 'user', comp: <SettingsPage />, desc: '사용자 환경 설정' },
    { id: 'mypage', title: '마이페이지', cat: 'user', comp: <MyPage />, desc: '프로필 및 계정 관리' },
    { id: 'help', title: '고객지원', cat: 'user', comp: <HelpFaqPage />, desc: 'FAQ 및 문의하기' },
    { id: 'user-dash', title: '사용자 통계', cat: 'user', comp: <UserDashboardPage />, desc: '개인 스타일 데이터' },
    
    { id: 'admin-dash', title: '관리자 대시보드', cat: 'admin', comp: <AdminDashboardPage />, desc: '전체 시스템 KPI' },
    { id: 'admin-users', title: '사용자 관리', cat: 'admin', comp: <AdminUsersPage />, desc: '회원 목록 및 상태 관리' },
    { id: 'admin-data', title: '데이터 인사이트', cat: 'admin', comp: <AdminDataPage />, desc: '옷장 데이터 분석' },
    { id: 'admin-funnel', title: '추천 퍼널', cat: 'admin', comp: <AdminRecoFunnelPage />, desc: '전환율 분석' },
    { id: 'admin-settings', title: '시스템 설정', cat: 'admin', comp: <AdminSettingsPage />, desc: '전역 환경 설정' },

    { id: 'uikit', title: 'UI Kit', cat: 'kit', comp: <UiKitPage />, desc: '컴포넌트 라이브러리' },
  ];

  const filteredPages = pages.filter(p => 
    (activeTab === 'all' || p.cat === activeTab) &&
    (p.title.toLowerCase().includes(search.toLowerCase()) || p.desc.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hub Header */}
      <div className="bg-navy-900 text-white pt-16 pb-24 px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <Badge variant="orange">Developer Hub</Badge>
          <h1 className="text-4xl font-black mt-4 mb-2 tracking-tighter">CODION 쇼케이스 허브</h1>
          <p className="text-slate-400 max-w-2xl font-medium">
            CODION의 모든 화면과 UI 컴포넌트를 한눈에 확인하고 테스트할 수 있는 공간입니다. 
            상태값 변화나 레이아웃 일관성을 실시간으로 검증하세요.
          </p>

          <div className="mt-12 flex flex-col md:flex-row gap-4 items-center max-w-3xl">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="화면 이름 또는 설명 검색..."
                className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-white placeholder:text-slate-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5 w-full md:w-auto">
              {[
                { id: 'all', label: '전체', icon: Monitor },
                { id: 'user', label: '사용자', icon: Layers },
                { id: 'admin', label: '관리자', icon: ShieldCheck },
                { id: 'kit', label: 'Kit', icon: Palette },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === tab.id ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 p-20 opacity-10 pointer-events-none">
          <Monitor size={300} strokeWidth={1} />
        </div>
      </div>

      {/* Guide Section */}
      <div className="max-w-7xl mx-auto px-8 -mt-12 mb-16 relative z-20">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl flex flex-col md:flex-row gap-8 items-center">
          <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 flex-shrink-0">
             <Info size={32} />
          </div>
          <div className="flex-1">
             <h4 className="text-lg font-bold text-navy-900 mb-1">허브 사용 가이드</h4>
             <ul className="grid md:grid-cols-2 gap-2 text-sm text-slate-500">
               <li className="flex items-center gap-2">● 각 카드의 '미리보기' 버튼을 누르면 해당 페이지가 렌더링됩니다.</li>
               <li className="flex items-center gap-2">● 모든 페이지는 실제 레이아웃 구조를 그대로 반영합니다.</li>
               <li className="flex items-center gap-2">● 'UserLayout'과 'AdminLayout' 중복 여부를 체크하세요.</li>
               <li className="flex items-center gap-2">● UI Kit 섹션에서 디자인 시스템 요소를 확인할 수 있습니다.</li>
             </ul>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="max-w-7xl mx-auto px-8 pb-32">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPages.map(page => (
            <Card key={page.id} className="group hover:border-orange-500/30 transition-all cursor-default">
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <Badge variant={page.cat === 'admin' ? 'navy' : page.cat === 'kit' ? 'orange' : 'slate'}>
                    {page.cat.toUpperCase()}
                  </Badge>
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:text-orange-500 transition-colors">
                    <Monitor size={16} />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-navy-900 mb-1">{page.title}</h3>
                <p className="text-sm text-slate-400 mb-6 flex-1">{page.desc}</p>
                <div className="flex gap-2 mt-auto">
                   <Button 
                    className="w-full gap-2 text-xs" 
                    variant="primary" 
                    size="sm"
                    onClick={() => setPreviewComponent(page.comp)}
                   >
                     <ExternalLink size={14} /> 미리보기
                   </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredPages.length === 0 && (
          <div className="text-center py-24 bg-white rounded-3xl border border-slate-100">
             <div className="text-4xl mb-4 grayscale">🔍</div>
             <h3 className="text-xl font-bold text-navy-900">검색 결과가 없습니다</h3>
             <p className="text-slate-400 text-sm mt-1">다른 검색어를 입력하거나 필터를 변경해 보세요.</p>
          </div>
        )}
      </div>

      {/* Full Screen Preview Overlay */}
      {previewComponent && (
        <div className="fixed inset-0 z-[100] bg-white overflow-y-auto">
          <div className="sticky top-0 z-[110] bg-navy-900/90 backdrop-blur-md text-white px-6 py-3 flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-3">
               <div className="text-xl font-black tracking-tighter">CODION <span className="text-orange-500 text-xs ml-1 uppercase">Live Preview</span></div>
               <div className="h-4 w-px bg-white/20 mx-2"></div>
               <div className="text-sm font-medium text-slate-300">현재 화면을 확인 중입니다.</div>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              className="gap-2"
              onClick={() => setPreviewComponent(null)}
            >
              <X size={16} /> 미리보기 닫기 (ESC)
            </Button>
          </div>
          <div className="relative">
            {previewComponent}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowcaseHubPage;
