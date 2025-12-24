/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { Button, SectionTitle, Card } from './DesignSystem';
import { 
  CheckCircle2, AlertCircle, Info, X, Bell, Save, 
  Folder, Plus, Trash2, WifiOff, CloudOff, Inbox, 
  Smartphone, ShieldAlert, XCircle, Share2
} from 'lucide-react';

export const ScreenOverlays = () => {
    return (
        <div className="p-8 md:p-12 max-w-[1600px] mx-auto min-h-full bg-slate-50 font-sans">
            <div className="mb-12">
                <h1 className="text-4xl font-extrabold text-slate-900 mb-2">알림 및 피드백 UI</h1>
                <p className="text-slate-500">사용자 피드백, 확인 창, 빈 상태(Empty States) 컴포넌트 모음</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-12">
                
                {/* --- GROUP 1: MOBILE PUSH NOTIFICATIONS --- */}
                <div className="space-y-8">
                    <SectionTitle>푸시 알림</SectionTitle>
                    
                    {/* iOS Style Stack */}
                    <div className="bg-slate-200 p-8 rounded-[40px] relative overflow-hidden border-4 border-slate-300 shadow-inner min-h-[400px]">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-300 rounded-b-xl"></div>
                        
                        <div className="space-y-3 mt-4">
                            {/* Notification 1 */}
                            <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-sm cursor-pointer active:scale-[0.98] transition-transform">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 bg-brand-coral rounded-md flex items-center justify-center">
                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">CODION</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400">방금 전</span>
                                </div>
                                <h4 className="font-bold text-sm text-slate-900">15분 뒤 비 예보 🌧️</h4>
                                <p className="text-xs text-slate-600">우산을 챙기세요! 곧 강한 비가 내릴 예정입니다.</p>
                            </div>

                            {/* Notification 2 */}
                            <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-sm opacity-90 scale-[0.98]">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 bg-brand-coral rounded-md flex items-center justify-center">
                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">CODION</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400">1시간 전</span>
                                </div>
                                <h4 className="font-bold text-sm text-slate-900">주간 스타일 리포트</h4>
                                <p className="text-xs text-slate-600">지난주 입었던 코디를 확인해보세요.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- GROUP 2: TOASTS & SNACKBARS --- */}
                <div className="space-y-8">
                    <SectionTitle>토스트 및 스낵바</SectionTitle>
                    
                    <div className="space-y-4">
                        {/* Success Toast */}
                        <div className="bg-white p-4 rounded-2xl shadow-soft border-l-4 border-green-500 flex items-center gap-3 hover:shadow-lg transition-shadow cursor-default">
                            <div className="p-1 bg-green-100 text-green-600 rounded-full"><CheckCircle2 size={18}/></div>
                            <div className="flex-1">
                                <h4 className="font-bold text-sm text-slate-900">저장 완료</h4>
                                <p className="text-xs text-slate-500">"겨울 컬렉션"에 추가되었습니다.</p>
                            </div>
                            <button className="text-slate-300 hover:text-slate-500"><X size={16}/></button>
                        </div>

                        {/* Error Toast */}
                        <div className="bg-white p-4 rounded-2xl shadow-soft border-l-4 border-red-500 flex items-center gap-3 hover:shadow-lg transition-shadow cursor-default">
                            <div className="p-1 bg-red-100 text-red-600 rounded-full"><XCircle size={18}/></div>
                            <div className="flex-1">
                                <h4 className="font-bold text-sm text-slate-900">연결 실패</h4>
                                <p className="text-xs text-slate-500">인터넷 연결을 확인해주세요.</p>
                            </div>
                            <button className="text-slate-300 hover:text-slate-500"><X size={16}/></button>
                        </div>

                        {/* Info Toast */}
                        <div className="bg-white p-4 rounded-2xl shadow-soft border-l-4 border-blue-500 flex items-center gap-3 hover:shadow-lg transition-shadow cursor-default">
                            <div className="p-1 bg-blue-100 text-blue-600 rounded-full"><Info size={18}/></div>
                            <div className="flex-1">
                                <h4 className="font-bold text-sm text-slate-900">새로운 기능</h4>
                                <p className="text-xs text-slate-500">새로워진 코디 빌더를 사용해보세요.</p>
                            </div>
                            <button className="text-slate-300 hover:text-slate-500"><X size={16}/></button>
                        </div>

                         {/* Dark Mode / Accent Toast */}
                         <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4">
                            <div className="flex-1">
                                <p className="font-bold text-sm">확인 필요</p>
                                <p className="text-xs text-slate-400">이메일 인증을 완료해주세요.</p>
                            </div>
                            <button className="px-3 py-1.5 bg-brand-coral text-white text-xs font-bold rounded-lg hover:bg-brand-coral-dark transition-colors">인증하기</button>
                         </div>
                    </div>
                </div>

                {/* --- GROUP 3: MODALS --- */}
                <div className="space-y-8">
                    <SectionTitle>다이얼로그 & 모달</SectionTitle>
                    
                    {/* Confirm Delete Modal */}
                    <div className="bg-white rounded-3xl p-6 shadow-soft border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
                        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                            <Trash2 size={24} />
                        </div>
                        <h3 className="font-bold text-lg text-slate-800 mb-2">정말 삭제하시겠습니까?</h3>
                        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                            이 작업은 되돌릴 수 없습니다. 해당 코디가 모든 컬렉션에서 제거됩니다.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="secondary" className="!py-2 text-sm">취소</Button>
                            <button className="w-full py-2 rounded-2xl font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors text-sm">삭제</button>
                        </div>
                    </div>
                </div>

                {/* --- GROUP 4: BOTTOM SHEETS --- */}
                <div className="space-y-8">
                    <SectionTitle>바텀 시트 (모바일)</SectionTitle>
                    
                    <div className="bg-slate-200 h-[320px] rounded-3xl relative overflow-hidden border border-slate-300 shadow-inner">
                        <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                             <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6"></div>
                             
                             <div className="space-y-2">
                                 <button className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors text-left group">
                                     <div className="w-10 h-10 rounded-full bg-brand-coral/10 text-brand-coral flex items-center justify-center group-hover:bg-brand-coral group-hover:text-white transition-colors">
                                         <Share2 size={20}/>
                                     </div>
                                     <div>
                                         <p className="font-bold text-slate-800 text-sm">공유하기</p>
                                         <p className="text-xs text-slate-400">친구에게 보내거나 SNS에 공유</p>
                                     </div>
                                 </button>

                                 <button className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors text-left group">
                                     <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                         <Folder size={20}/>
                                     </div>
                                      <div>
                                         <p className="font-bold text-slate-800 text-sm">컬렉션에 추가</p>
                                         <p className="text-xs text-slate-400">출근룩, 데이트룩 등 보관함 선택</p>
                                     </div>
                                 </button>
                             </div>
                        </div>
                    </div>
                </div>

                {/* --- GROUP 5: INLINE STATES (Empty, Error) --- */}
                <div className="space-y-8 lg:col-span-2">
                    <SectionTitle>인라인 상태 표시</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Empty State */}
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                                <Inbox size={32} />
                            </div>
                            <h4 className="font-bold text-slate-700 mb-1">코디가 없습니다</h4>
                            <p className="text-xs text-slate-400 mb-4">옷장에 아이템을 추가하여 시작하세요.</p>
                            <Button variant="secondary" className="!w-auto !py-2 px-6 text-xs">+ 아이템 추가</Button>
                        </div>

                         {/* Error State */}
                         <div className="bg-red-50 border border-red-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-red-500 mb-3 shadow-sm">
                                <WifiOff size={24} />
                            </div>
                            <h4 className="font-bold text-red-900 mb-1">오프라인 상태</h4>
                            <p className="text-xs text-red-700/80 mb-4">네트워크 연결을 확인해주세요.</p>
                            <button className="text-xs font-bold text-red-600 hover:text-red-800 underline">재시도</button>
                        </div>

                        {/* Success State */}
                        <div className="bg-green-50 border border-green-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-green-500 mb-4 shadow-sm relative">
                                <CheckCircle2 size={32} />
                                <div className="absolute inset-0 bg-green-400/20 rounded-full animate-ping"></div>
                            </div>
                            <h4 className="font-bold text-green-900 mb-1">준비 완료!</h4>
                            <p className="text-xs text-green-700/80">오늘의 외출 체크리스트를 모두 마쳤습니다.</p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};