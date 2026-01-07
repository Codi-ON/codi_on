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

        // 1. 사용자 메시지 추가
        const newMsgId = Date.now();
        setMessages(prev => [...prev, { id: newMsgId, role: 'user', text: userMsg }]);

        // 2. AI 응답 요청
        try {
            const response = await sendMessage(userMsg);
            // 3. 봇 응답 추가
            setMessages(prev => [...prev, { id: Date.now(), role: 'bot', text: response }]);
        } catch (error) {
            setMessages(prev => [...prev, { id: Date.now(), role: 'bot', text: "죄송합니다. 오류가 발생했습니다." }]);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
            handleSend();
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
            </div>
        </div>
    );
};