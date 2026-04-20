'use client';

import { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-[#E5E5E5] bg-white px-4 py-4">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="relative flex items-end gap-2 bg-[#F7F7F8] rounded-2xl border border-[#E5E5E5] focus-within:border-[#6C5CE7] transition-colors px-4 py-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-[#1A1A1A] placeholder-[#ABABAB] max-h-50 leading-relaxed"
          />
          <button
            type="submit"
            disabled={disabled || !input.trim()}
            className="shrink-0 w-8 h-8 rounded-lg bg-[#6C5CE7] text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#5B4BD5] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-[#ABABAB] text-center mt-2">
          按 Enter 发送，Shift + Enter 换行
        </p>
      </form>
    </div>
  );
}
