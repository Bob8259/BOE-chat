'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/app/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await login(email, password);
    if (success) {
      router.push('/chat');
    } else {
      setError('邮箱或密码错误');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F7F8]">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-[#6C5CE7] rounded-xl flex items-center justify-center">
              <span className="text-white text-lg font-bold">B</span>
            </div>
            <span className="text-2xl font-bold text-[#1A1A1A]">BOE Chat</span>
          </div>
          <p className="text-[#6B6B6B] text-sm">与最优秀的 AI 模型对话</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E5E5] p-8">
          <h2 className="text-xl font-semibold text-[#1A1A1A] mb-6">登录</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                邮箱
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="输入你的邮箱"
                className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] bg-white text-[#1A1A1A] placeholder-[#ABABAB] focus:outline-none focus:border-[#6C5CE7] focus:ring-1 focus:ring-[#6C5CE7] transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入你的密码"
                className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] bg-white text-[#1A1A1A] placeholder-[#ABABAB] focus:outline-none focus:border-[#6C5CE7] focus:ring-1 focus:ring-[#6C5CE7] transition-colors"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#6C5CE7] text-white font-medium rounded-xl hover:bg-[#5B4BD5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
