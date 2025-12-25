
import React, { useState } from 'react';
import { UserLayout } from '../shared/ui/layouts/UserLayout';
import { AdminLayout } from '../app/layouts/AdminLayout';
import LandingPage from '../pages/landing/LandingPage';
import AuthPage from '../pages/auth/AuthPage';
import TodayPage from '../pages/user/TodayPage';
import ClosetPage from '../pages/user/ClosetPage';
import ClosetAddItemPage from '../pages/user/ClosetAddItemPage';
import ItemDetailPage from '../pages/user/ItemDetailPage';
import ChecklistPage from '../pages/user/ChecklistPage';
import HistoryPage from '../pages/user/HistoryPage';
import CalendarPage from '../pages/user/CalendarPage';
import MyPage from '../pages/user/MyPage';
import HelpFaqPage from '../pages/user/HelpFaqPage';
import UserDashboardPage from '../pages/user/UserDashboardPage';
import SettingsPage from '../pages/user/SettingsPage';
import RecommendationPage from '../pages/user/RecommendationPage';

import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminDataPage from '../pages/admin/AdminDataPage';
import AdminRecoFunnelPage from '../pages/admin/AdminRecoFunnelPage';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage';

import ShowcaseHubPage from '../pages/kit/ShowcaseHubPage';
import UiKitPage from '../pages/kit/UiKitPage';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('landing');

  const renderPageContent = () => {
    switch (currentPage) {
      case 'landing': return <LandingPage onNavigate={setCurrentPage} />;
      case 'auth': return <AuthPage onNavigate={setCurrentPage} />;
      case 'today': return <TodayPage />;
      case 'closet': return <ClosetPage />;
      case 'add-item': return <ClosetAddItemPage onBack={() => setCurrentPage('closet')} />;
      case 'item-detail': return <ItemDetailPage onBack={() => setCurrentPage('closet')} />;
      case 'checklist': return <ChecklistPage />;
      case 'reco': return <RecommendationPage onNavigate={setCurrentPage} />;
      case 'history': return <HistoryPage />;
      case 'calendar': return <CalendarPage />;
      case 'dashboard': return <UserDashboardPage />;
      case 'mypage': return <MyPage />;
      case 'settings': return <SettingsPage />;
      case 'help': return <HelpFaqPage />;
      case 'admin-dashboard': return <AdminDashboardPage />;
      case 'admin-users': return <AdminUsersPage />;
      case 'admin-data': return <AdminDataPage />;
      case 'admin-funnel': return <AdminRecoFunnelPage />;
      case 'admin-settings': return <AdminSettingsPage />;
      case 'showcase': return <ShowcaseHubPage />;
      case 'uikit': return <UiKitPage />;
      default: return <LandingPage onNavigate={setCurrentPage} />;
    }
  };

  const isAdminView = currentPage.startsWith('admin');
  const isPlainView = ['landing', 'auth', 'showcase'].includes(currentPage);

  if (isPlainView) {
    return renderPageContent();
  }

  if (isAdminView) {
    return (
      <AdminLayout activePage={currentPage} onNavigate={setCurrentPage}>
        {renderPageContent()}
      </AdminLayout>
    );
  }

  return (
    <UserLayout activePage={currentPage} onNavigate={setCurrentPage}>
      {renderPageContent()}
    </UserLayout>
  );
};

export default App;
