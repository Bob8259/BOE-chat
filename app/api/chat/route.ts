import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { messages, model, baseUrl, apiKey, stream = false } = await req.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key is required.' },
        { status: 400 }
      );
    }

    const cleanUrl = (baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');

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
