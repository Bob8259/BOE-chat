import { AUTH_TOKEN_KEY } from './config';

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(AUTH_TOKEN_KEY);
}

export async function login(email: string, password: string): Promise<boolean> {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (res.ok) {
    const data = await res.json();
    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    return true;
  }
  return false;
}

export function logout(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  window.location.href = '/login';
}
