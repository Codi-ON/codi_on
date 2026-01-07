// src/shared/ui/layout/Topbar.tsx
import React, {useState} from 'react';
import { ChatWidget } from '../widgets/ChatWidget';

export const Topbar: React.FC<{ onMenuClick: () => void; type: 'user' | 'admin' }> = ({ onMenuClick, type }) => {
    // 챗봇 열림/닫힘 상태 관리
    const [isChatOpen, setIsChatOpen] = useState(false);

    return (
        <>
            <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onMenuClick} className="md:hidden p-2 hover:bg-slate-100 rounded-lg">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"/></svg>
                    </button>
                    <div className="hidden md:block text-slate-400 text-sm font-medium">
                        오늘도 스타일리시한 하루 되세요, <span className="text-navy-900 font-bold">김코디님</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* 👇 [추가] 챗봇 트리거 버튼 */}
                    <button
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        className={`p-2 rounded-full transition-colors relative ${isChatOpen ? 'bg-orange-100 text-orange-600' : 'text-slate-400 hover:text-navy-900 hover:bg-slate-100'}`}
                        title="AI 코디챗"
                    >
                        {/* 챗봇 아이콘 (Message Circle) */}
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>

                        {/* (선택) 읽지 않은 메시지가 있다면 뱃지 표시 가능 */}
                        {/* <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span> */}
                    </button>

                    {/* 기존 알림 버튼 */}
                    <button className="p-2 text-slate-400 hover:text-navy-900 relative hover:bg-slate-100 rounded-full transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"></span>
                    </button>

                    {/* 기존 아바타 */}
                    <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-orange-500 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" />
                    </div>
                </div>
            </header>

            {/* 👇 [추가] 챗봇 위젯 컴포넌트 (헤더 아래, 페이지 위에 둥둥 떠있음) */}
            <ChatWidget isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </>
    );
};
