import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { verifyToken } from '@/app/lib/token';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    // 验证 token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未提供认证凭据' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const verification = await verifyToken(token);
    if (!verification.valid) {
      return NextResponse.json({ error: verification.error }, { status: 401 });
    }

    // 解析请求
    const { messages, model, stream = false } = await req.json();

    // 从环境变量读取 API 配置
    const apiKey = process.env.API_KEY;
    const baseUrl = process.env.API_BASE_URL || 'https://api.openai.com/v1';

    if (!apiKey) {
      return NextResponse.json(
        { error: '服务器未配置 API Key' },
        { status: 500 }
      );
    }

    const cleanUrl = baseUrl.replace(/\/$/, '');

    const response = await axios.post(
      `${cleanUrl}/chat/completions`,
      {
        model,
        messages,
        stream,
        ...(stream ? { stream_options: { include_usage: true } } : {}),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        responseType: stream ? 'stream' : 'json',
        adapter: 'fetch',
      }
    );

    if (stream) {
      return new Response(response.data, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    } else {
      return NextResponse.json(response.data);
    }
  } catch (error: any) {
    console.error('Chat error:', error);

    let errorMessage = '服务器内部错误';
    let status = 500;

    if (error.response) {
      status = error.response.status || 500;
      errorMessage = error.response.data?.error?.message || error.response.statusText || errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status });
  }
}
