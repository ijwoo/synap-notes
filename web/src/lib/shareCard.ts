// "내 생각 지도" 공유 카드(PNG) 생성 — 그래프 데이터를 받아 오프스크린에서
// 레이아웃(d3-force)·렌더까지 직접 하므로 그래프 화면이 아니어도(설정 등) 동작.
import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation, type SimulationNodeDatum } from 'd3-force';
import { synap } from '../api/synap';
import type { Graph } from '../types';
import { buildClusters, lighten, NEUTRAL } from './clusters';
import { nodeRadius } from './topics';
import { curveControl } from './edgePath';

const FONT = "Pretendard, -apple-system, system-ui, sans-serif";
const TWO_PI = Math.PI * 2;

interface LN extends SimulationNodeDatum {
  id: number;
  title: string;
  degree: number;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 패널 영역(px,py,pw,ph) 안에 그래프를 레이아웃해 그린다. */
function drawGraph(ctx: CanvasRenderingContext2D, graph: Graph, px: number, py: number, pw: number, ph: number) {
  const colorOf = buildClusters(graph.nodes, graph.edges).colorOf;
  const nodes: LN[] = graph.nodes.map((n) => ({ id: n.id, title: n.title, degree: n.degree }));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const links = graph.edges
    .filter((e) => byId.has(e.source) && byId.has(e.target))
    .map((e) => ({ source: e.source, target: e.target, similarity: e.similarity }));

  const sim = forceSimulation(nodes)
    .force('charge', forceManyBody().strength(-260))
    .force('center', forceCenter(0, 0))
    .force('collide', forceCollide<LN>((d) => nodeRadius(d.degree) + 10))
    .force('link', forceLink<LN, { source: number; target: number; similarity: number }>(links)
      .id((d) => d.id)
      .distance((l) => 40 + (1 - l.similarity) * 120)
      .strength((l) => 0.15 + l.similarity * 0.6))
    .stop();
  for (let i = 0; i < 320; i++) sim.tick();

  // 노드 좌표 bounds → 패널에 맞춰 스케일/평행이동
  const pad = 70;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.x!); maxX = Math.max(maxX, n.x!);
    minY = Math.min(minY, n.y!); maxY = Math.max(maxY, n.y!);
  }
  const spanX = Math.max(maxX - minX, 1);
  const spanY = Math.max(maxY - minY, 1);
  const scale = Math.min((pw - pad * 2) / spanX, (ph - pad * 2) / spanY, 3.2);
  const ox = px + pw / 2 - ((minX + maxX) / 2) * scale;
  const oy = py + ph / 2 - ((minY + maxY) / 2) * scale;
  const X = (x: number) => ox + x * scale;
  const Y = (y: number) => oy + y * scale;

  ctx.save();
  roundRect(ctx, px, py, pw, ph, 36);
  ctx.clip();
  ctx.lineCap = 'round';

  // edges
  for (const e of graph.edges) {
    const a = byId.get(e.source);
    const b = byId.get(e.target);
    if (!a || !b) continue;
    const same = colorOf.get(e.source) === colorOf.get(e.target);
    const { cx, cy } = curveControl(X(a.x!), Y(a.y!), X(b.x!), Y(b.y!));
    ctx.beginPath();
    ctx.moveTo(X(a.x!), Y(a.y!));
    ctx.quadraticCurveTo(cx, cy, X(b.x!), Y(b.y!));
    ctx.strokeStyle = same ? colorOf.get(e.source) ?? '#c4ccd6' : '#cbd3dd';
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 2 + e.similarity * 3;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // nodes + labels
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const n of nodes) {
    const r = Math.max(nodeRadius(n.degree) * scale * 0.9, 9);
    const nx = X(n.x!);
    const ny = Y(n.y!);
    const color = colorOf.get(n.id) ?? NEUTRAL;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(nx, ny, r, 0, TWO_PI);
    ctx.fill();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = lighten(color, 0.5);
    ctx.beginPath();
    ctx.arc(nx - r * 0.28, ny - r * 0.32, r * 0.6, 0, TWO_PI);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(nx, ny, r, 0, TWO_PI);
    ctx.stroke();
    ctx.fillStyle = '#3a414c';
    ctx.font = `600 19px ${FONT}`;
    ctx.fillText(truncate(n.title), nx, ny + r + 18);
  }
  ctx.restore();
}

function truncate(s: string, n = 10) {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

export function buildShareCard(graph: Graph, name: string): Promise<Blob> {
  const W = 1080;
  const H = 1440;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#eaf1ff');
  bg.addColorStop(1, '#ffffff');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#3182F6';
  ctx.font = `800 46px ${FONT}`;
  ctx.fillText('Synap', 72, 124);
  ctx.fillStyle = '#191f28';
  ctx.font = `800 66px ${FONT}`;
  ctx.fillText(`${name}님의 생각 지도`, 72, 212);

  const px = 72, py = 268, pw = W - 144, ph = 936;
  ctx.save();
  ctx.shadowColor = 'rgba(49,130,246,0.18)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 16;
  roundRect(ctx, px, py, pw, ph, 36);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();

  if (graph.nodes.length > 0) {
    drawGraph(ctx, graph, px, py, pw, ph);
  } else {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#8b95a1';
    ctx.font = `500 32px ${FONT}`;
    ctx.fillText('아직 노트가 없어요', W / 2, py + ph / 2);
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#3182F6';
  ctx.font = `800 40px ${FONT}`;
  ctx.fillText(`${graph.nodes.length}개의 생각이 의미로 연결됐어요`, W / 2, py + ph + 96);
  ctx.fillStyle = '#8b95a1';
  ctx.font = `500 30px ${FONT}`;
  ctx.fillText('메모가 의미로 연결되는 노트 · Synap', W / 2, py + ph + 148);

  return new Promise((resolve) => c.toBlob((b) => resolve(b!), 'image/png', 0.95));
}

/** 그래프를 가져와 카드 생성 후 Web Share(모바일) 또는 다운로드. */
export async function shareMindMap(name: string): Promise<'shared' | 'downloaded'> {
  const graph = await synap.getGraph();
  const blob = await buildShareCard(graph, name);
  const file = new File([blob], 'synap-mindmap.png', { type: 'image/png' });

  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: '내 생각 지도', text: '내 머릿속을 Synap으로 그려봤어요 🧠' });
    } catch {
      /* 사용자 취소 */
    }
    return 'shared';
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'synap-mindmap.png';
  a.click();
  URL.revokeObjectURL(url);
  return 'downloaded';
}
