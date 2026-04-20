'use client';

import { Markdown } from '@/app/components/Markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatMessageProps {
  message: Message;
  botIcon: string;
  botColor: string;
}

export function ChatMessage({ message, botIcon, botColor }: ChatMessageProps) {
  if (message.role === 'user') {
    return (
      <div className="flex gap-3 justify-end">
        <div className="bg-[#6C5CE7] text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
          <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 mt-0.5"
        style={{ backgroundColor: `${botColor}15` }}
      >
        {botIcon}
      </div>
      <div className="bg-[#F7F7F8] rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%] overflow-hidden">
        <Markdown content={message.content} role="assistant" />
      </div>
    </div>
  );
}
