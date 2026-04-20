'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { logout } from '@/app/lib/auth';
import { getModelById } from '@/app/lib/models';
import { SESSIONS_KEY } from '@/app/lib/config';

interface ChatSession {
  id: string;
  botId: string;
  title: string;
  createdAt: number;
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(SESSIONS_KEY);
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch {}
    }

    // Listen for storage changes
    const handleStorage = () => {
      const s = localStorage.getItem(SESSIONS_KEY);
      if (s) setSessions(JSON.parse(s));
    };
    window.addEventListener('sessions-updated', handleStorage);
    return () => window.removeEventListener('sessions-updated', handleStorage);
  }, []);

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('sessions-updated'));
  };

  return (
    <aside
      className={`h-full bg-[#F7F7F8] border-r border-[#E5E5E5] flex flex-col sidebar-transition ${
        collapsed ? 'w-0 overflow-hidden' : 'w-65'
      }`}
    >
      {/* Header */}
      <div className="h-15 flex items-center px-4 border-b border-[#E5E5E5]">
        <Link href="/chat" className="flex items-center gap-2 no-underline">
          <div className="w-8 h-8 bg-[#6C5CE7] rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">B</span>
          </div>
          <span className="text-lg font-semibold text-[#1A1A1A]">BOE Chat</span>
        </Link>
      </div>

      {/* New Chat Button */}
      <div className="px-3 py-3">
        <Link
          href="/chat"
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-[#E5E5E5] hover:border-[#6C5CE7] text-[#1A1A1A] text-sm font-medium no-underline transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          新对话
        </Link>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-0.5">
        {sessions.map((session) => {
          const bot = getModelById(session.botId);
          const isActive = pathname === `/chat/${session.botId}`;
          return (
            <Link
              key={session.id}
              href={`/chat/${session.botId}?session=${session.id}`}
              className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm no-underline transition-colors ${
                isActive
                  ? 'bg-white border border-[#E5E5E5] text-[#1A1A1A]'
                  : 'text-[#4A4A4A] hover:bg-[#EEEEEE]'
              }`}
            >
              <span className="text-base shrink-0">{bot?.icon || '💬'}</span>
              <span className="truncate flex-1">{session.title}</span>
              <button
                onClick={(e) => deleteSession(session.id, e)}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-[#ABABAB] hover:text-red-500 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-[#E5E5E5]">
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm text-[#6B6B6B] hover:bg-[#EEEEEE] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          退出登录
        </button>
      </div>
    </aside>
  );
}
