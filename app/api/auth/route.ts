import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '@/app/lib/token';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const validEmail = process.env.AUTH_EMAIL;
  const validPassword = process.env.AUTH_PASSWORD;

  if (!validEmail || !validPassword) {
    return NextResponse.json(
      { error: '服务器未配置认证凭据' },
      { status: 500 }
    );
  }

  if (email === validEmail && password === validPassword) {
    const token = await generateToken(email);
    return NextResponse.json({ token, success: true });
  }

  return NextResponse.json(
    { error: '邮箱或密码错误' },
    { status: 401 }
  );
}
