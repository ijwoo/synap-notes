import type { Graph, GraphEdge, GraphNode } from '../types';

export interface GraphView {
  nodes: GraphNode[];
  edges: GraphEdge[];
  neighbors: Map<number, Set<number>>;
}

/**
 * 뷰 임계값으로 엣지를 거르고, 표시용 degree 를 필터된 엣지로 재계산한다.
 * (백엔드 edge 는 source<target 한 방향만 오므로 양쪽 degree 를 더한다.)
 */
export function buildGraphView(graph: Graph, threshold: number, showEdges: boolean): GraphView {
  const edges = showEdges ? graph.edges.filter((e) => e.similarity >= threshold) : [];
  const degree = new Map<number, number>();
  const neighbors = new Map<number, Set<number>>();
  for (const n of graph.nodes) {
    degree.set(n.id, 0);
    neighbors.set(n.id, new Set());
  }
  for (const e of edges) {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
    neighbors.get(e.source)?.add(e.target);
    neighbors.get(e.target)?.add(e.source);
  }
  const nodes = graph.nodes.map((n) => ({ ...n, degree: degree.get(n.id) ?? 0 }));
  return { nodes, edges, neighbors };
}
