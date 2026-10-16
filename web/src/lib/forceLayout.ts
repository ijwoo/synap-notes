import { useEffect, useMemo, useReducer, useRef } from 'react';
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type ForceLink,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force';
import type { GraphEdge, GraphNode } from '../types';
import { nodeRadius } from './topics';

export interface SimNode extends GraphNode, SimulationNodeDatum {}
type SimLink = SimulationLinkDatum<SimNode> & { similarity: number };

export interface DragHandlers {
  start: (id: number, x: number, y: number) => void;
  move: (id: number, x: number, y: number) => void;
  end: (id: number) => void;
}

/**
 * d3-force 로 좌표만 계산. 렌더는 호출부(SVG)가 담당.
 * - 노드 좌표는 시뮬레이션 객체에 in-place 로 갱신되고, tick 마다 리렌더를 유발한다.
 * - 엣지(임계값 필터 결과)가 바뀌면 link force 만 교체 후 가볍게 reheat.
 */
export function useForceLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number,
) {
  const nodesByIdRef = useRef<Map<number, SimNode>>(new Map());
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const sizeRef = useRef({ width, height });
  sizeRef.current = { width, height };
  const [, bump] = useReducer((c: number) => c + 1, 0);

  // 노드 객체를 id 기준으로 유지(좌표 보존), 들어오고 나간 노드 동기화
  const simNodes = useMemo(() => {
    const map = nodesByIdRef.current;
    const { width: w, height: h } = sizeRef.current;
    const next = nodes.map((n) => {
      const existing = map.get(n.id);
      if (existing) {
        existing.title = n.title;
        existing.topic = n.topic;
        existing.degree = n.degree;
        return existing;
      }
      const created: SimNode = {
        ...n,
        x: w / 2 + (Math.random() - 0.5) * 60,
        y: h / 2 + (Math.random() - 0.5) * 60,
      };
      map.set(n.id, created);
      return created;
    });
    const ids = new Set(nodes.map((n) => n.id));
    for (const key of [...map.keys()]) if (!ids.has(key)) map.delete(key);
    return next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes]);

  // 시뮬레이션 생성 (노드/사이즈 변경 시)
  useEffect(() => {
    if (!width || !height || simNodes.length === 0) return;
    // 현재 노드 집합에 양끝이 모두 있는 엣지만 (stale 엣지 → d3 "missing node" 크래시 방지)
    const ids = new Set(simNodes.map((n) => n.id));
    const links: SimLink[] = edges
      .filter((e) => ids.has(e.source as number) && ids.has(e.target as number))
      .map((e) => ({ ...e }));
    const sim = forceSimulation<SimNode>(simNodes)
      .force('charge', forceManyBody().strength(-230))
      .force('center', forceCenter(width / 2, height / 2))
      .force('x', forceX(width / 2).strength(0.05))
      .force('y', forceY(height / 2).strength(0.07))
      .force('collide', forceCollide<SimNode>((d) => nodeRadius(d.degree) + 9))
      .force(
        'link',
        forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance((l) => 50 + (1 - l.similarity) * 130)
          .strength((l) => 0.12 + l.similarity * 0.6),
      )
      .on('tick', bump);
    simRef.current = sim;
    return () => {
      sim.stop();
      simRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simNodes, width, height]);

  // 엣지(임계값 필터) 변경 → link force 교체 + reheat
  useEffect(() => {
    const sim = simRef.current;
    if (!sim) return;
    const has = nodesByIdRef.current;
    const link = sim.force('link') as ForceLink<SimNode, SimLink>;
    link.links(edges.filter((e) => has.has(e.source as number) && has.has(e.target as number)).map((e) => ({ ...e })));
    sim.alpha(0.5).restart();
  }, [edges]);

  const drag: DragHandlers = useMemo(
    () => ({
      start: (id, x, y) => {
        const n = nodesByIdRef.current.get(id);
        if (!n) return;
        n.fx = x;
        n.fy = y;
        simRef.current?.alphaTarget(0.25).restart();
      },
      move: (id, x, y) => {
        const n = nodesByIdRef.current.get(id);
        if (!n) return;
        n.fx = x;
        n.fy = y;
      },
      end: (id) => {
        const n = nodesByIdRef.current.get(id);
        if (n) {
          n.fx = null;
          n.fy = null;
        }
        simRef.current?.alphaTarget(0);
      },
    }),
    [],
  );

  return { simNodes, drag };
}
