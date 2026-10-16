import { useEffect, useMemo, useRef, useState } from 'react';
import { select } from 'd3-selection';
import { zoom, type D3ZoomEvent } from 'd3-zoom';
import type { Graph } from '../../types';
import { useElementSize } from '../../lib/useElementSize';
import { useForceLayout, type SimNode } from '../../lib/forceLayout';
import { buildGraphView } from '../../lib/graphView';
import { curveControl, edgeOpacity, edgeWidth } from '../../lib/edgePath';
import { nodeRadius } from '../../lib/topics';
import { buildClusters, clusterLabels, lighten, NEUTRAL } from '../../lib/clusters';
import { useUiStore } from '../../store/useUiStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useThemeStore } from '../../store/useThemeStore';
import './Graph.css';

interface Transform {
  x: number;
  y: number;
  k: number;
}

const TWO_PI = Math.PI * 2;

export default function GraphCanvas({ graph }: { graph: Graph }) {
  const { ref, width, height } = useElementSize<HTMLDivElement>();
  const viewThreshold = useSettingsStore((s) => s.viewThreshold);
  const autoConnect = useSettingsStore((s) => s.autoConnect);
  const selectedId = useUiStore((s) => s.selectedNodeId);
  const selectNode = useUiStore((s) => s.selectNode);
  const clearSelection = useUiStore((s) => s.clearSelection);
  const theme = useThemeStore((s) => s.theme); // 테마 바뀌면 리렌더 → 재드로우

  const view = useMemo(
    () => buildGraphView(graph, viewThreshold, autoConnect),
    [graph, viewThreshold, autoConnect],
  );

  const { simNodes, drag } = useForceLayout(view.nodes, view.edges, width, height);
  const posById = useMemo(() => {
    const m = new Map<number, SimNode>();
    for (const n of simNodes) m.set(n.id, n);
    return m;
  }, [simNodes]);

  const { colorOf, groups } = useMemo(() => buildClusters(view.nodes, view.edges), [view]);
  const groupLabels = useMemo(
    () => clusterLabels(groups, new Map(view.nodes.map((n) => [n.id, n.title]))),
    [groups, view.nodes],
  );
  const nodeColor = (id: number) => colorOf.get(id) ?? NEUTRAL;
  void theme; // 구독만으로 테마 토글 시 재드로우 유발

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 0 });
  const dragState = useRef<{ id: number; sx: number; sy: number; moved: boolean } | null>(null);
  const downPos = useRef<{ x: number; y: number } | null>(null);
  const simNodesRef = useRef(simNodes);
  simNodesRef.current = simNodes;

  const [tf, setTf] = useState<Transform>({ x: 0, y: 0, k: 1 });
  const tfRef = useRef(tf);
  tfRef.current = tf;

  const toGraph = (clientX: number, clientY: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const { x, y, k } = tfRef.current;
    return { x: (clientX - rect.left - x) / k, y: (clientY - rect.top - y) / k };
  };

  const hitNode = (clientX: number, clientY: number): SimNode | null => {
    const { x: gx, y: gy } = toGraph(clientX, clientY);
    let best: SimNode | null = null;
    let bestD = Infinity;
    for (const n of simNodesRef.current) {
      const r = nodeRadius(n.degree) + 5;
      const d = Math.hypot((n.x ?? 0) - gx, (n.y ?? 0) - gy);
      if (d < r && d < bestD) {
        bestD = d;
        best = n;
      }
    }
    return best;
  };

  // pan/zoom: 노드에서 시작한 제스처는 제외(드래그는 직접 처리)
  useEffect(() => {
    if (!canvasRef.current) return;
    const sel = select(canvasRef.current);
    const behavior = zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.4, 3])
      .filter((event: Event) => {
        if (event.type === 'wheel') return true;
        const te = event as unknown as { touches?: TouchList; clientX?: number; clientY?: number };
        if ((event as MouseEvent).button) return false;
        const pt = te.touches && te.touches.length ? te.touches[0] : te;
        const cx = pt.clientX;
        const cy = pt.clientY;
        if (cx == null || cy == null) return true;
        return !hitNode(cx, cy);
      })
      .on('zoom', (event: D3ZoomEvent<HTMLCanvasElement, unknown>) => {
        const { x, y, k } = event.transform;
        setTf({ x, y, k });
      });
    sel.call(behavior);
    return () => {
      sel.on('.zoom', null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    downPos.current = { x: e.clientX, y: e.clientY };
    const hit = hitNode(e.clientX, e.clientY);
    if (!hit) return; // 빈 곳 → d3-zoom 이 팬 처리
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = toGraph(e.clientX, e.clientY);
    dragState.current = { id: hit.id, sx: e.clientX, sy: e.clientY, moved: false };
    drag.start(hit.id, x, y);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const ds = dragState.current;
    if (!ds) return;
    if (Math.hypot(e.clientX - ds.sx, e.clientY - ds.sy) > 4) ds.moved = true;
    const { x, y } = toGraph(e.clientX, e.clientY);
    drag.move(ds.id, x, y);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const ds = dragState.current;
    if (ds) {
      drag.end(ds.id);
      if (!ds.moved) selectNode(ds.id);
      dragState.current = null;
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    }
  };
  const onClick = (e: React.MouseEvent) => {
    const d = downPos.current;
    if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5) return; // 팬/드래그였음
    if (!hitNode(e.clientX, e.clientY)) clearSelection();
  };

  const neighbors = view.neighbors;
  const isLit = (id: number) =>
    selectedId === null || selectedId === id || !!neighbors.get(selectedId)?.has(id);
  const edgeLit = (s: number, t: number) =>
    selectedId === null || s === selectedId || t === selectedId;

  // ---- 렌더(canvas). 매 렌더(=시뮬 tick/팬줌/선택/테마)마다 다시 그림 ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !width || !height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (sizeRef.current.w !== width || sizeRef.current.h !== height || sizeRef.current.dpr !== dpr) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      sizeRef.current = { w: width, h: height, dpr };
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const css = getComputedStyle(document.documentElement);
    const cvar = (n: string) => `hsl(${css.getPropertyValue(n).trim()})`;
    const bg = cvar('--graph-bg');
    const labelColor = cvar('--graph-label');
    const ringColor = cvar('--graph-ring');
    const edgeColor = cvar('--graph-edge');

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
    ctx.translate(tf.x, tf.y);
    ctx.scale(tf.k, tf.k);
    ctx.lineCap = 'round';

    // edges
    for (const e of view.edges) {
      const a = posById.get(e.source);
      const b = posById.get(e.target);
      if (!a || !b) continue;
      const { cx, cy } = curveControl(a.x!, a.y!, b.x!, b.y!);
      const same = colorOf.get(e.source) === colorOf.get(e.target);
      ctx.beginPath();
      ctx.moveTo(a.x!, a.y!);
      ctx.quadraticCurveTo(cx, cy, b.x!, b.y!);
      ctx.strokeStyle = same ? colorOf.get(e.source) ?? edgeColor : edgeColor;
      ctx.globalAlpha = edgeLit(e.source, e.target) ? edgeOpacity(e.similarity) : 0.05;
      ctx.lineWidth = edgeWidth(e.similarity);
      ctx.setLineDash(e.cross ? [1.5, 7] : []);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);

    // cluster labels (노드 뒤, 은은)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 24px Pretendard, system-ui, sans-serif';
    ctx.globalAlpha = selectedId != null ? 0.05 : 0.16;
    groups.forEach((g, i) => {
      const label = groupLabels[i];
      if (!label) return;
      let sx = 0;
      let sy = 0;
      let cnt = 0;
      for (const id of g.ids) {
        const p = posById.get(id);
        if (p) {
          sx += p.x ?? 0;
          sy += p.y ?? 0;
          cnt++;
        }
      }
      if (cnt === 0) return;
      ctx.fillStyle = g.color;
      ctx.fillText(label, sx / cnt, sy / cnt);
    });
    ctx.globalAlpha = 1;

    // nodes
    for (const n of simNodes) {
      const nx = n.x ?? 0;
      const ny = n.y ?? 0;
      const baseR = nodeRadius(n.degree);
      const selected = selectedId === n.id;
      const r = selected ? baseR * 1.16 : baseR;
      const color = nodeColor(n.id);
      const alpha = isLit(n.id) ? 1 : 0.14;

      if (selected) {
        ctx.globalAlpha = alpha * 0.2;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(nx, ny, r + 6, 0, TWO_PI);
        ctx.fill();
      }

      ctx.globalAlpha = alpha;
      ctx.save();
      ctx.shadowColor = 'rgba(20,26,36,0.20)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 1.5;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(nx, ny, r, 0, TWO_PI);
      ctx.fill();
      ctx.restore();

      // 구체 하이라이트
      ctx.globalAlpha = alpha * 0.55;
      ctx.fillStyle = lighten(color, 0.5);
      ctx.beginPath();
      ctx.arc(nx - r * 0.28, ny - r * 0.32, r * 0.6, 0, TWO_PI);
      ctx.fill();

      // ring
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 2;
      ctx.strokeStyle = ringColor;
      ctx.beginPath();
      ctx.arc(nx, ny, r, 0, TWO_PI);
      ctx.stroke();

      // label
      ctx.fillStyle = labelColor;
      ctx.font = '600 11px Pretendard, system-ui, sans-serif';
      ctx.fillText(truncate(n.title), nx, ny + r + 13);

      // owner badge (다른 사람)
      if (n.mine === false) {
        const bx = nx + baseR * 0.72;
        const by = ny - baseR * 0.72;
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.arc(bx, by, 8.5, 0, TWO_PI);
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = color;
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.font = '700 9px Pretendard, system-ui, sans-serif';
        ctx.fillText(n.ownerInitial ?? '?', bx, by + 0.5);
      }
      ctx.globalAlpha = 1;
    }
  });

  return (
    <div className="graph-wrap" ref={ref}>
      <canvas
        ref={canvasRef}
        className="graph-canvas"
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onClick}
      />
    </div>
  );
}

function truncate(s: string, n = 9) {
  return s.length > n ? s.slice(0, n) + '…' : s;
}
