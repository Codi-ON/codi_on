// src/shared/ui/widgets/ChatWidget.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useAiService } from '@/lib/hooks/useAiService'; // 경로 확인 필요

interface Message {
    id: number;
    role: 'user' | 'bot';
    text: string;
}

interface ChatWidgetProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ isOpen, onClose }) => {
    const { sendMessage, loading } = useAiService();
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, role: 'bot', text: '안녕하세요! 김코디님, 무엇을 도와드릴까요? 오늘 날씨나 코디 추천에 대해 물어보세요.' }
    ]);
    const [isResetPending, setIsResetPending] = useState(false);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 새 메시지가 오면 스크롤을 맨 아래로 이동
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg = input;
        setInput(''); // 입력창 비우기

        setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: userMsg }]);

        const sendWithLocation = async (lat?: number, lon?: number) => {
            try {
                // useAiService -> aiApi -> n8n 순서로 위치 정보(lat, lon) 전달
                const response = await sendMessage(userMsg, lat, lon);
                setMessages(prev => [...prev, { id: Date.now(), role: 'bot', text: response }]);
            } catch (error) {
                setMessages(prev => [...prev, { id: Date.now(), role: 'bot', text: "죄송합니다. 오류가 발생했습니다." }]);
            }
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // 위치 허용 시: 실제 좌표와 함께 전송
                    const { latitude, longitude } = position.coords;
                    console.log("📍 위치 정보 전송:", latitude, longitude);
                    sendWithLocation(latitude, longitude);
                },
                (error) => {
                    // 차단/에러 시: 서울 좌표(기본값)로 전송
                    console.warn("위치 정보 실패(기본값 사용):", error.message);
                    sendWithLocation(37.5665, 126.9780);
                }
            );
        } else {
            // GPS 미지원 브라우저: 서울 좌표(기본값)로 전송
            sendWithLocation(37.5665, 126.9780);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
            handleSend();
        }
    };

    const handleReset = () => {
        if (messages.length <= 1) return;

        if (isResetPending) {
            setMessages([{ id: Date.now(), role: 'bot', text: '대화가 초기화되었습니다. ✨' }]);
            setIsResetPending(false); // 상태 복귀
        } else {
            // [1단계] 처음 눌렀다 -> "진짜요?" 상태로 변경
            setIsResetPending(true);

            // (옵션) 3초 뒤에 안 누르면 다시 원래대로 복귀 (사용자 실수 방지)
            setTimeout(() => setIsResetPending(false), 3000);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-20 right-4 w-80 md:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col z-50 overflow-hidden font-sans animate-fade-in-up">
            {/* 헤더 */}
            <div className="bg-navy-900 p-4 flex justify-between items-center text-white bg-slate-800">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🤖</span>
                    <h3 className="font-bold">CodiON AI Chat</h3>
                </div>
                <button onClick={onClose} className="text-slate-300 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>

            {/* 메시지 목록 (Body) */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                            msg.role === 'user'
                                ? 'bg-orange-500 text-white rounded-tr-none'
                                : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* 입력창 (Footer) */}
            <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="메시지를 입력하세요..."
                    className="flex-1 px-4 py-2 bg-slate-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    disabled={loading}
                />
                <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 disabled:bg-slate-300 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                </button>
                <button
                    onClick={handleReset}
                    disabled={loading || messages.length <= 1}
                    className={`
                        p-2 rounded-full transition-all duration-200 flex items-center gap-1
                        ${isResetPending
                        ? 'bg-red-500 text-white w-24 justify-center hover:bg-red-600' // 확인 모드일 때 (빨강, 넓게)
                        : 'text-slate-400 hover:text-red-500 hover:bg-red-50' // 평소 (회색 아이콘)
                    }
                    `}
                    title="대화 초기화"
                >
                    {isResetPending ? (
                        // 확인 모드일 때 보여줄 텍스트
                        <span className="text-xs font-bold whitespace-nowrap">초기화</span>
                    ) : (
                        // 평소에 보여줄 아이콘
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
};