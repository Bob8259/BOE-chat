import { NextRequest, NextResponse } from 'next/server';
import { AUTH_CREDENTIALS } from '@/app/lib/config';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (email === AUTH_CREDENTIALS.email && password === AUTH_CREDENTIALS.password) {
    // 简单 token，实际生产环境应使用 JWT
    const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');
    return NextResponse.json({ token, success: true });
  }

  return NextResponse.json(
    { error: '邮箱或密码错误' },
    { status: 401 }
  );
}
