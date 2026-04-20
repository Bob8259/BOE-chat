'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/app/lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace('/chat');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-[#6B6B6B]">加载中...</div>
    </div>
  );
}
