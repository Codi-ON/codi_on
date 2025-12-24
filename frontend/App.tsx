/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { PhoneFrame, BrowserFrame } from './components/DesignSystem';
import { 
  ScreenOnboarding, ScreenLogin, ScreenHome, ScreenWardrobe, 
  ScreenAdd, ScreenDetail, ScreenChecklist, ScreenResults, ScreenSaved 
} from './components/MobileScreens';
import { 
  ScreenSettings, ScreenProfile, ScreenStylePrefs, 
  ScreenBuilder, ScreenCalendar, ScreenHelp 
} from './components/WebScreens';
import { ScreenOverlays } from './components/Overlays';
import { 
  WebOverview, WebUsers, WebWardrobe, WebOutfits, 
  WebWeather, WebAdminSettings 
} from './components/WebAdmin';
import { WebComponentKit } from './components/WebComponentKit';
import { Smartphone, Monitor, AlertTriangle, Bell, Info } from 'lucide-react';

const App = () => {
  const [activeScreen, setActiveScreen] = useState('m_home');
  const [showToast, setShowToast] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const screens: any = {
    // --- WEB APP MAIN SCREENS ---
    m_onboard: { comp: ScreenOnboarding, type: 'web', title: 'Landing Page' },
    m_login: { comp: ScreenLogin, type: 'web', title: 'Authentication' },
    m_home: { comp: ScreenHome, type: 'web', title: 'User Dashboard' },
    m_wardrobe: { comp: ScreenWardrobe, type: 'web', title: 'Wardrobe Grid' },
    m_add: { comp: ScreenAdd, type: 'web', title: 'Add Item Modal' },
    m_detail: { comp: ScreenDetail, type: 'web', title: 'Product Detail' },
    m_check: { comp: ScreenChecklist, type: 'web', title: 'Checklist Widget' },
    m_results: { comp: ScreenResults, type: 'web', title: 'Recommendation Gallery' },
    m_saved: { comp: ScreenSaved, type: 'web', title: 'Collections' },
    
    // --- WEB APP TOOLS ---
    w_profile: { comp: ScreenProfile, type: 'web', title: 'My Profile' },
    w_settings: { comp: ScreenSettings, type: 'web', title: 'Settings' },
    w_prefs: { comp: ScreenStylePrefs, type: 'web', title: 'Style Onboarding' },
    w_builder: { comp: ScreenBuilder, type: 'web', title: 'Outfit Builder' },
    w_calendar: { comp: ScreenCalendar, type: 'web', title: 'Calendar' },
    w_help: { comp: ScreenHelp, type: 'web', title: 'Help & FAQ' },

    // --- SYSTEM & ADMIN ---
    ui_kit_main: { comp: WebComponentKit, type: 'web', title: 'Component Kit' },
    ui_overlays: { comp: ScreenOverlays, type: 'web', title: 'Overlays & Alerts' },
    a_overview: { comp: WebOverview, type: 'web', title: 'Admin Overview' },
    a_users: { comp: WebUsers, type: 'web', title: 'Admin Users' },
    a_wardrobe: { comp: WebWardrobe, type: 'web', title: 'Admin Wardrobe' },
    a_outfits: { comp: WebOutfits, type: 'web', title: 'Admin Outfits' },
    a_weather: { comp: WebWeather, type: 'web', title: 'Weather Analytics' },
    a_settings: { comp: WebAdminSettings, type: 'web', title: 'Admin Settings' },
  };

  const CurrentScreen = screens[activeScreen].comp;
  const screenType = screens[activeScreen].type;

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-slate-900 text-white p-6 flex flex-col fixed h-full overflow-y-auto z-50">
        <h1 className="text-xl font-bold mb-8 tracking-wider text-brand-primary">CODION<span className="text-white text-sm font-normal opacity-50 block">UI Kit Viewer</span></h1>
        
        <div className="space-y-8 pb-12">
            <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest">Web App (Main)</p>
                <div className="space-y-1">
                    {Object.entries(screens).filter(([k,v]: any) => k.startsWith('m_')).map(([key, val]: any) => (
                    <NavButton key={key} active={activeScreen === key} onClick={() => setActiveScreen(key)} label={val.title} />
                    ))}
                </div>
            </div>

            <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest">Web App (Tools)</p>
                <div className="space-y-1">
                    {Object.entries(screens).filter(([k,v]: any) => k.startsWith('w_')).map(([key, val]: any) => (
                    <NavButton key={key} active={activeScreen === key} onClick={() => setActiveScreen(key)} label={val.title} />
                    ))}
                </div>
            </div>

            <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest">Design System</p>
                <div className="space-y-1">
                    <NavButton active={activeScreen === 'ui_kit_main'} onClick={() => setActiveScreen('ui_kit_main')} label="Component Kit" />
                    <NavButton active={activeScreen === 'ui_overlays'} onClick={() => setActiveScreen('ui_overlays')} label="Overlays & Alerts" />
                </div>
            </div>

            <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest">Admin Dashboard</p>
                <div className="space-y-1">
                    {Object.entries(screens).filter(([k,v]: any) => k.startsWith('a_')).map(([key, val]: any) => (
                    <NavButton key={key} active={activeScreen === key} onClick={() => setActiveScreen(key)} label={val.title} />
                    ))}
                </div>
            </div>
            
            <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest">Interactive Demo</p>
                 <button onClick={() => setShowToast(!showToast)} className="w-full text-left px-4 py-2 text-slate-400 hover:text-white text-sm rounded-lg hover:bg-slate-800 transition-colors">Toggle Alert Toast</button>
                <button onClick={() => setShowModal(!showModal)} className="w-full text-left px-4 py-2 text-slate-400 hover:text-white text-sm rounded-lg hover:bg-slate-800 transition-colors">Toggle Modal</button>
            </div>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 ml-64 p-12 flex items-center justify-center min-h-screen relative bg-slate-200/50">
        {screenType === 'mobile' ? (
          <PhoneFrame title={screens[activeScreen].title}>
             <CurrentScreen />
             {showToast && <ToastDemo onClose={() => setShowToast(false)} />}
             {showModal && <ModalDemo onClose={() => setShowModal(false)} />}
          </PhoneFrame>
        ) : (
          <BrowserFrame title={screens[activeScreen].title}>
             <CurrentScreen />
             {/* Overlays for Web Demo */}
             {showToast && <ToastDemo onClose={() => setShowToast(false)} />}
             {showModal && <ModalDemo onClose={() => setShowModal(false)} />}
          </BrowserFrame>
        )}
      </div>
    </div>
  );
};

const NavButton = ({ active, onClick, label }: any) => (
    <button 
        onClick={onClick}
        className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all ${active ? 'bg-brand-primary text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
    >
        {label}
    </button>
);

const ToastDemo = ({ onClose }: { onClose: () => void }) => (
    <div className="absolute top-4 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-slate-800 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-4 z-50">
        <div className="p-2 bg-brand-primary rounded-full"><AlertTriangle size={16}/></div>
        <div className="flex-1">
            <p className="font-bold text-sm">30분 뒤 비 예보 🌧️</p>
            <p className="text-xs text-slate-300">방수 의류로 변경하시겠습니까?</p>
        </div>
        <button onClick={onClose} className="text-xs font-bold text-brand-primary">확인</button>
    </div>
);

const ModalDemo = ({ onClose }: { onClose: () => void }) => (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in">
        <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="w-16 h-16 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell size={32} />
            </div>
            <h3 className="font-bold text-xl text-slate-800 mb-2">체크리스트 알림</h3>
            <p className="text-slate-500 text-sm mb-6">내일 아침 준비물을 미리 확인하시겠습니까?</p>
            <div className="grid grid-cols-2 gap-3">
                <button onClick={onClose} className="py-3 rounded-xl border border-slate-200 font-bold text-slate-600 text-sm hover:bg-slate-50">나중에</button>
                <button onClick={onClose} className="py-3 rounded-xl bg-brand-primary text-white font-bold text-sm hover:bg-brand-primary-dark">지금 확인</button>
            </div>
        </div>
    </div>
);

export default App;