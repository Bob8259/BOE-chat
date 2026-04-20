'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getModelById } from '@/app/lib/models';
import { SESSIONS_KEY } from '@/app/lib/config';
import { ChatInput } from '@/app/components/ChatInput';
import { ChatMessage } from '@/app/components/ChatMessage';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatSession {
  id: string;
  botId: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export default function ChatPage() {
  const params = useParams();
  const botId = params.botId as string;
  const bot = getModelById(botId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize or load session
  useEffect(() => {
    const id = Date.now().toString();
    setSessionId(id);
    setMessages([]);
  }, [botId]);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Save session to localStorage
  const saveSession = (msgs: Message[]) => {
    if (msgs.length === 0) return;
    const saved = localStorage.getItem(SESSIONS_KEY);
    let sessions: ChatSession[] = saved ? JSON.parse(saved) : [];

    const existingIdx = sessions.findIndex(s => s.id === sessionId);
    const title = msgs[0]?.content.slice(0, 30) + (msgs[0]?.content.length > 30 ? '...' : '');

    const session: ChatSession = {
      id: sessionId,
      botId,
      title,
      messages: msgs,
      createdAt: existingIdx >= 0 ? sessions[existingIdx].createdAt : Date.now(),
    };

    if (existingIdx >= 0) {
      sessions[existingIdx] = session;
    } else {
      sessions = [session, ...sessions];
    }

    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    window.dispatchEvent(new Event('sessions-updated'));
  };

  const handleSend = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      if (bot?.capabilities.stream) {
        // Streaming response
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newMessages,
            model: botId,
            stream: true,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || '请求失败');
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let assistantContent = '';

        setMessages([...newMessages, { role: 'assistant', content: '' }]);

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') break;
                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices?.[0]?.delta?.content;
                  if (delta) {
                    assistantContent += delta;
                    setMessages([...newMessages, { role: 'assistant', content: assistantContent }]);
                  }
                } catch {}
              }
            }
          }
        }

        const finalMessages = [...newMessages, { role: 'assistant' as const, content: assistantContent }];
        setMessages(finalMessages);
        saveSession(finalMessages);
      } else {
        // Non-streaming response
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newMessages,
            model: botId,
            stream: false,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || '请求失败');
        }

        const data = await res.json();
        const assistantContent = data.choices?.[0]?.message?.content || '无回复';
        const finalMessages = [...newMessages, { role: 'assistant' as const, content: assistantContent }];
        setMessages(finalMessages);
        saveSession(finalMessages);
      }
    } catch (error: any) {
      const errorMsg = [...newMessages, { role: 'assistant' as const, content: `错误: ${error.message}` }];
      setMessages(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!bot) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#6B6B6B]">
        未找到该 AI 模型
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <header className="h-15 flex items-center px-6 border-b border-[#E5E5E5] bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
            style={{ backgroundColor: `${bot.color}15` }}
          >
            {bot.icon}
          </div>
          <div>
            <h1 className="text-base font-semibold text-[#1A1A1A]">{bot.name}</h1>
            <p className="text-xs text-[#6B6B6B]">{bot.description}</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full min-h-100 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4"
                style={{ backgroundColor: `${bot.color}15` }}
              >
                {bot.icon}
              </div>
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-1">{bot.name}</h2>
              <p className="text-sm text-[#6B6B6B] max-w-md">{bot.description}</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} botIcon={bot.icon} botColor={bot.color} />
          ))}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                style={{ backgroundColor: `${bot.color}15` }}
              >
                {bot.icon}
              </div>
              <div className="bg-[#F7F7F8] rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-[#ABABAB] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-[#ABABAB] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-[#ABABAB] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
