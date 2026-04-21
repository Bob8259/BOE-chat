// 服务端 Token 工具 - 使用 Web Crypto API (Edge Runtime 兼容)

const TOKEN_EXPIRY_DAYS = 30;

async function getKey(salt: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(salt),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function toBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function generateToken(email: string): Promise<string> {
  const salt = process.env.SALT_VALUE;
  if (!salt) throw new Error('SALT_VALUE not configured');

  const exp = Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${email}:${exp}`;

  const key = await getKey(salt);
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const sig = toBase64Url(signature);

  // Token format: base64url(JSON({ email, exp, sig }))
  const tokenData = JSON.stringify({ email, exp, sig });
  return btoa(tokenData).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export interface TokenVerifyResult {
  valid: boolean;
  error?: string;
  email?: string;
}

export async function verifyToken(token: string): Promise<TokenVerifyResult> {
  const salt = process.env.SALT_VALUE;
  if (!salt) return { valid: false, error: '服务器未配置 SALT_VALUE' };

  try {
    // Decode token
    const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    const tokenData = JSON.parse(atob(padded));

    const { email, exp, sig } = tokenData;
    if (!email || !exp || !sig) {
      return { valid: false, error: 'Token 格式无效' };
    }

    // Check expiry
    if (Date.now() > exp) {
      return { valid: false, error: 'Token 已过期，请重新登录' };
    }

    // Verify signature
    const payload = `${email}:${exp}`;
    const key = await getKey(salt);
    const encoder = new TextEncoder();
    const expectedSig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const expectedSigStr = toBase64Url(expectedSig);

    if (sig !== expectedSigStr) {
      return { valid: false, error: 'Token 签名无效' };
    }

    // Verify email matches configured email
    const validEmail = process.env.AUTH_EMAIL;
    if (email !== validEmail) {
      return { valid: false, error: '用户无效' };
    }

    return { valid: true, email };
  } catch {
    return { valid: false, error: 'Token 解析失败' };
  }
}
