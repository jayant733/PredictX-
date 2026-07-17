import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ChatMessagesList } from './AIChatbotWidget/ChatMessagesList';
import { streamChatResponse, suggestionChips } from './AIChatbotWidget/chatbotHelpers';

interface AIChatbotWidgetProps {
    marketId: string;
}

interface Message {
    role: 'user' | 'model';
    content: string;
}

export const AIChatbotWidget: React.FC<AIChatbotWidgetProps> = ({ marketId }) => {
    const { isLoggedIn, session } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', content: "Hello! I am your PredictX AI Advisor. How can I help you evaluate this prediction market today?" }
    ]);
    const [inputVal, setInputVal] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const chatEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (isOpen) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    const handleSend = useCallback(async (messageText: string) => {
        if (!messageText.trim() || isStreaming) return;

        setMessages(prev => [...prev, { role: 'user', content: messageText }, { role: 'model', content: "" }]);
        setInputVal("");
        setIsStreaming(true);

        try {
            const chatHistory = messages.slice(1).map(msg => ({ role: msg.role, content: msg.content }));
            await streamChatResponse(marketId, chatHistory, messageText, session?.access_token || '', (text) => {
                setMessages(prev => {
                    const updated = [...prev];
                    if (updated.length > 0) updated[updated.length - 1] = { role: 'model', content: text };
                    return updated;
                });
            });
        } catch (err) {
            console.error("Error streaming chatbot response:", err);
            setMessages(prev => {
                const updated = [...prev];
                if (updated.length > 0) {
                    updated[updated.length - 1] = {
                        role: 'model',
                        content: "I apologize, but I encountered an error retrieving live market news. Please try again. (NFA)"
                    };
                }
                return updated;
            });
        } finally {
            setIsStreaming(false);
        }
    }, [messages, session, isStreaming, marketId]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSend(inputVal);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {isOpen && (
                <div className="w-[380px] h-[520px] mb-4 glass-panel rounded-2xl border border-outline-variant/30 bg-[#0A0B0D]/90 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,242,255,0.15)] flex flex-col overflow-hidden transition-all duration-300">
                    <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant/20 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#00f2ff] animate-pulse shadow-[0_0_8px_#00f2ff]"></div>
                            <span className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">AI Trading Advisor</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setMessages([{ role: 'model', content: "Hello! I am your PredictX AI Advisor. How can I help you evaluate this prediction market today?" }])}
                                className="text-on-surface-variant hover:text-primary transition-colors p-1 cursor-pointer"
                                title="Clear Chat"
                            >
                                <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                            <button onClick={() => setIsOpen(false)} className="text-on-surface-variant hover:text-primary transition-colors p-1 cursor-pointer">
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                    </div>

                    <ChatMessagesList messages={messages} suggestionChips={suggestionChips} onSend={handleSend} chatEndRef={chatEndRef} />

                    <div className="p-3 bg-surface-container-low border-t border-outline-variant/20">
                        {isLoggedIn ? (
                            <form onSubmit={handleFormSubmit} className="flex gap-2">
                                <input 
                                    type="text" 
                                    className="flex-1 bg-surface-container border border-outline-variant/20 rounded-xl px-4 py-2 text-xs text-on-surface focus:outline-none focus:border-[#00f2ff]/40 transition-colors" 
                                    placeholder={isStreaming ? "Advisor typing..." : "Ask a trading query..."}
                                    value={inputVal}
                                    onChange={(e) => setInputVal(e.target.value)}
                                    disabled={isStreaming}
                                />
                                <button 
                                    type="submit" 
                                    className="bg-primary-container text-on-primary-container w-8 h-8 rounded-xl flex items-center justify-center border border-[#00f2ff]/30 hover:brightness-110 disabled:opacity-50 transition-all active:scale-95 cursor-pointer"
                                    disabled={!inputVal.trim() || isStreaming}
                                >
                                    <span className="material-symbols-outlined text-sm">send</span>
                                </button>
                            </form>
                        ) : (
                            <div className="text-center py-2 text-[10px] font-bold text-on-surface-variant/80 font-data-mono">
                                🔒 CONNECT WALLET TO ASK ADVISOR
                            </div>
                        )}
                    </div>
                </div>
            )}

            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_0_20px_rgba(0,242,255,0.25)] hover:shadow-[0_0_30px_rgba(0,242,255,0.45)] hover:scale-105 active:scale-95 cursor-pointer ${
                    isOpen ? 'bg-[#ff0055] text-white border border-[#ff0055]/30' : 'bg-[#00f2ff] text-[#0A0B0D] border border-[#00f2ff]/40'
                }`}
            >
                <span className="material-symbols-outlined text-2xl font-bold">{isOpen ? 'close' : 'psychology'}</span>
            </button>
        </div>
    );
};
