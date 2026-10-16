// 소셜 로그인 SDK 로더. 환경변수(빌드시 주입)가 없으면 해당 버튼은 숨긴다.
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY;

const GOOGLE_SRC = 'https://accounts.google.com/gsi/client';
const KAKAO_SRC = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js';

const loaded = new Map<string, Promise<void>>();
function loadScript(src: string): Promise<void> {
  if (!loaded.has(src)) {
    loaded.set(
      src,
      new Promise<void>((resolve, reject) => {
        const el = document.createElement('script');
        el.src = src;
        el.async = true;
        el.onload = () => resolve();
        el.onerror = () => reject(new Error(`스크립트 로드 실패: ${src}`));
        document.head.appendChild(el);
      }),
    );
  }
  return loaded.get(src)!;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function loadGoogle(): Promise<any> {
  await loadScript(GOOGLE_SRC);
  return (window as any).google;
}

/** 카카오 로그인 팝업 → access_token */
export async function loginWithKakao(): Promise<string> {
  await loadScript(KAKAO_SRC);
  const Kakao = (window as any).Kakao;
  if (!Kakao.isInitialized()) Kakao.init(KAKAO_JS_KEY);
  return new Promise<string>((resolve, reject) => {
    Kakao.Auth.login({
      scope: 'profile_nickname,account_email',
      success: (a: any) => resolve(a.access_token),
      fail: (e: any) => reject(new Error(e?.error_description || '카카오 로그인 실패')),
    });
  });
}
