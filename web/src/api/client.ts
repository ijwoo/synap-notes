import { useAuthStore } from '../store/useAuthStore';

const BASE = import.meta.env.VITE_API_BASE ?? '';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(init?.headers as Record<string, string>) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(BASE + path, { ...init, headers });

  // 로그인된 상태에서의 401 = 토큰 만료 → 로그아웃. (로그인 시도의 401은 자격 오류로 그대로 표면화)
  if (res.status === 401 && useAuthStore.getState().token) {
    useAuthStore.getState().logout();
    throw new ApiError(401, '세션이 만료되었어요. 다시 로그인해주세요.');
  }

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? body.message ?? detail;
      // 검증 에러: 여러 개면 첫 항목만, "field: 메시지" 접두어 제거
      detail = detail.split('; ')[0].replace(/^[a-zA-Z]+: /, '');
    } catch {
      /* non-json error body */
    }
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: (path: string) => request<void>(path, { method: 'DELETE' }),
};
