// 본문에서 "발견된 개념" 칩을 뽑는 클라이언트 휴리스틱(빈도 기반).
// 백엔드 개념 추출이 없으므로 대략적인 키워드를 보여주는 용도.

const STOPWORDS = new Set([
  '그리고', '하지만', '그래서', '또한', '이것', '저것', '그것', '있다', '없다', '한다',
  '하는', '하고', '위해', '통해', '대한', '가장', '매우', '에서', '으로', '에게', '까지',
  '부터', '보다', '처럼', '같은', '같이', '되는', '된다', '이다', '이며', '하면', '때문',
  'the', 'and', 'for', 'with', 'that', 'this', 'are', 'was', 'from', 'have',
]);

// 흔한 한국어 조사(긴 것 우선) — 칩을 깔끔하게 보이도록 끝의 조사를 떼어낸다.
const JOSA = ['으로', '에서', '에게', '한테', '까지', '부터', '처럼', '보다', '라고', '로', '를', '을', '가', '이', '는', '은', '에', '의', '와', '과', '도'];

function stripJosa(w: string): string {
  for (const j of JOSA) {
    if (w.length > j.length + 1 && w.endsWith(j)) return w.slice(0, -j.length);
  }
  return w;
}

/** 텍스트 → 정제된 토큰(소문자, 조사 제거, 불용어/단문/숫자 제외) */
export function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{Nd}\s]+/gu, ' ')
    .split(/\s+/)
    .map(stripJosa)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t) && !/^\d+$/.test(t));
}

export function extractConcepts(text: string, max = 6): string[] {
  const tokens = tokenize(text);

  const freq = new Map<string, number>();
  for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1);

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, max)
    .map(([w]) => w);
}
