'use client';

import Link from 'next/link';
import { MODELS } from '@/app/lib/models';

export default function ChatHomePage() {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">选择一个 AI 开始对话</h1>
          <p className="text-[#6B6B6B] text-sm">探索不同的 AI 模型，找到最适合你的助手</p>
        </div>

        {/* Bot Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODELS.map((model) => (
            <Link
              key={model.id}
              href={`/chat/${model.id}`}
              className="group block p-5 rounded-2xl border border-[#E5E5E5] bg-white hover:border-[#6C5CE7] hover:shadow-md transition-all no-underline"
            >
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl mb-3"
                style={{ backgroundColor: `${model.color}15` }}
              >
                {model.icon}
              </div>

              {/* Name */}
              <h3 className="text-[#1A1A1A] font-semibold text-base mb-1 group-hover:text-[#6C5CE7] transition-colors">
                {model.name}
              </h3>

              {/* Description */}
              <p className="text-[#6B6B6B] text-sm leading-relaxed">
                {model.description}
              </p>

              {/* Capabilities */}
              <div className="flex gap-1.5 mt-3">
                {model.capabilities.images && (
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-[#F0F0F0] text-[#6B6B6B]">图片</span>
                )}
                {model.capabilities.files && (
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-[#F0F0F0] text-[#6B6B6B]">文件</span>
                )}
                {model.capabilities.stream && (
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-[#F0F0F0] text-[#6B6B6B]">流式</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
