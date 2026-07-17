import React from 'react';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface ChatMessagesListProps {
  messages: Message[];
  suggestionChips: { label: string; text: string }[];
  onSend: (text: string) => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}

export const ChatMessagesList: React.FC<ChatMessagesListProps> = ({
  messages,
  suggestionChips,
  onSend,
  chatEndRef
}) => {
  return (
    <>
      {/* Messages Container */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-surface-variant animate-fade-in">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary-container text-on-primary-container border border-[#00f2ff]/20 rounded-tr-none'
                  : 'bg-surface-container-high text-[#e3e2e5] border border-outline-variant/10 rounded-tl-none'
              }`}
            >
              <div className="whitespace-pre-line font-body-md">
                {msg.content || (
                  <div className="flex gap-1.5 py-1 items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length === 1 && (
        <div className="px-4 py-2 flex flex-wrap gap-2 border-t border-outline-variant/10 bg-surface-container-low/20">
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => onSend(chip.text)}
              className="px-2.5 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/20 hover:border-[#00f2ff]/50 text-[10px] text-on-surface-variant hover:text-primary transition-all duration-200 cursor-pointer"
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
};
