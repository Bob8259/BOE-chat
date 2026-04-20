'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/app/lib/auth';
import { Sidebar } from '@/app/components/Sidebar';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-[#6B6B6B]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
