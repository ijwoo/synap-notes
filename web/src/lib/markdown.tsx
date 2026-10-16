import { type ReactNode } from 'react';

// 의존성 없는 경량 마크다운 → React 노드 렌더.
// 모든 텍스트는 React children 으로 들어가 자동 이스케이프되고, 링크 url 만 화이트리스트로 안전 처리.

function safeUrl(u: string): string | null {
  const t = u.trim();
  return /^(https?:\/\/|mailto:)/i.test(t) ? t : null;
}

const INLINE = /\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)|\*(.+?)\*/g;

function inline(text: string, k: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  INLINE.lastIndex = 0;
  while ((m = INLINE.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      out.push(<strong key={`${k}b${i}`}>{m[1]}</strong>);
    } else if (m[2] !== undefined) {
      out.push(
        <code key={`${k}c${i}`} className="rounded bg-secondary px-1.5 py-0.5 text-[0.85em]">
          {m[2]}
        </code>,
      );
    } else if (m[3] !== undefined) {
      const url = safeUrl(m[4]);
      out.push(
        url ? (
          <a key={`${k}a${i}`} href={url} target="_blank" rel="noreferrer noopener" className="text-primary underline underline-offset-2">
            {m[3]}
          </a>
        ) : (
          m[0]
        ),
      );
    } else if (m[5] !== undefined) {
      out.push(<em key={`${k}i${i}`}>{m[5]}</em>);
    }
    last = INLINE.lastIndex;
    i++;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const SPECIAL = /^(#{1,3}\s|>|[-*]\s|\d+\.\s|```|-{3,}$|_{3,}$|\*{3,}$)/;

export function Markdown({ text }: { text: string }) {
  const lines = (text ?? '').replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (/^```/.test(line)) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      blocks.push(
        <pre key={key++} className="my-2 overflow-x-auto rounded-lg bg-secondary p-3 text-[13px]">
          <code>{buf.join('\n')}</code>
        </pre>,
      );
      continue;
    }

    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      const lvl = h[1].length;
      const cls =
        lvl === 1 ? 'mt-4 mb-2 text-[20px] font-bold' : lvl === 2 ? 'mt-3 mb-1.5 text-[17px] font-bold' : 'mt-3 mb-1 text-[15px] font-semibold';
      blocks.push(<p key={key++} className={cls}>{inline(h[2], `h${key}`)}</p>);
      i++;
      continue;
    }

    if (/^(-{3,}|_{3,}|\*{3,})$/.test(line.trim())) {
      blocks.push(<hr key={key++} className="my-3 border-border" />);
      i++;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      blocks.push(
        <blockquote key={key++} className="my-2 border-l-2 border-border pl-3 text-muted-foreground">
          {inline(buf.join(' '), `q${key}`)}
        </blockquote>,
      );
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) items.push(lines[i++].replace(/^[-*]\s+/, ''));
      blocks.push(
        <ul key={key++} className="my-2 list-disc space-y-1 pl-5">
          {items.map((it, j) => (
            <li key={j}>{inline(it, `ul${key}_${j}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) items.push(lines[i++].replace(/^\d+\.\s+/, ''));
      blocks.push(
        <ol key={key++} className="my-2 list-decimal space-y-1 pl-5">
          {items.map((it, j) => (
            <li key={j}>{inline(it, `ol${key}_${j}`)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    if (line.trim() === '') {
      i++;
      continue;
    }

    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() !== '' && !SPECIAL.test(lines[i])) buf.push(lines[i++]);
    blocks.push(
      <p key={key++} className="my-1.5 leading-relaxed">
        {buf.flatMap((b, j) => (j === 0 ? inline(b, `p${key}_${j}`) : [<br key={`br${j}`} />, ...inline(b, `p${key}_${j}`)]))}
      </p>,
    );
  }

  return <div className="text-base">{blocks}</div>;
}
