// 임베딩 유사도 그래프를 모듈러리티(Louvain local-moving)로 군집화하고
// 각 군집에 TF-IDF 대표 키워드 라벨을 붙인다. topic 같은 수동 분류 없이 의미로 자동.
import { tokenize } from './concepts';

export const CLUSTER_PALETTE = [
  '#3182F6', '#13B083', '#8B7BF7', '#F2994A',
  '#EB5757', '#2D9CDB', '#EC68A6', '#F2C94C',
];
export const NEUTRAL = '#94A3B8';

export function lighten(hex: string, amt = 0.3): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amt);
  return `#${[mix(r), mix(g), mix(b)].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

interface NodeLike {
  id: number;
}
interface EdgeLike {
  source: number;
  target: number;
  similarity?: number;
}

/** 가중 Louvain의 local-moving 1레벨 — 연결돼 있어도 밀집 하위군집으로 분리. */
export function detectCommunities(nodes: NodeLike[], edges: EdgeLike[]): Map<number, number> {
  const ids = nodes.map((n) => n.id);
  const comm = new Map<number, number>();
  ids.forEach((id, i) => comm.set(id, i));

  const adj = new Map<number, Map<number, number>>();
  ids.forEach((id) => adj.set(id, new Map()));
  let m = 0;
  for (const e of edges) {
    if (!adj.has(e.source) || !adj.has(e.target) || e.source === e.target) continue;
    const w = e.similarity ?? 1;
    adj.get(e.source)!.set(e.target, (adj.get(e.source)!.get(e.target) ?? 0) + w);
    adj.get(e.target)!.set(e.source, (adj.get(e.target)!.get(e.source) ?? 0) + w);
    m += w;
  }
  if (m === 0) return comm;

  const k = new Map<number, number>();
  ids.forEach((id) => {
    let s = 0;
    for (const w of adj.get(id)!.values()) s += w;
    k.set(id, s);
  });
  const sigmaTot = new Map<number, number>();
  comm.forEach((c, id) => sigmaTot.set(c, (sigmaTot.get(c) ?? 0) + k.get(id)!));
  const twoM = 2 * m;

  let improved = true;
  let iter = 0;
  while (improved && iter++ < 100) {
    improved = false;
    for (const id of ids) {
      const ci = comm.get(id)!;
      const ki = k.get(id)!;
      const wTo = new Map<number, number>();
      for (const [nb, w] of adj.get(id)!) wTo.set(comm.get(nb)!, (wTo.get(comm.get(nb)!) ?? 0) + w);

      sigmaTot.set(ci, sigmaTot.get(ci)! - ki);
      const cand = new Set(wTo.keys());
      cand.add(ci);
      let best = ci;
      let bestGain = -Infinity;
      for (const c of cand) {
        const gain = (wTo.get(c) ?? 0) - (ki * (sigmaTot.get(c) ?? 0)) / twoM;
        if (gain > bestGain + 1e-9) {
          bestGain = gain;
          best = c;
        }
      }
      sigmaTot.set(best, (sigmaTot.get(best) ?? 0) + ki);
      if (best !== ci) {
        comm.set(id, best);
        improved = true;
      }
    }
  }
  return comm;
}

export interface ClusterGroup {
  ids: number[];
  color: string;
}

export interface ClusterResult {
  colorOf: Map<number, string>;
  groups: ClusterGroup[]; // 크기 2+ 군집만 (색 배정된)
}

export function buildClusters(nodes: NodeLike[], edges: EdgeLike[]): ClusterResult {
  const comm = detectCommunities(nodes, edges);
  const byComm = new Map<number, number[]>();
  for (const n of nodes) {
    const c = comm.get(n.id)!;
    if (!byComm.has(c)) byComm.set(c, []);
    byComm.get(c)!.push(n.id);
  }

  const multi = [...byComm.values()]
    .filter((c) => c.length >= 2)
    .sort((a, b) => b.length - a.length || Math.min(...a) - Math.min(...b));

  const colorOf = new Map<number, string>();
  const groups: ClusterGroup[] = multi.map((ids, i) => {
    const color = CLUSTER_PALETTE[i % CLUSTER_PALETTE.length];
    ids.forEach((id) => colorOf.set(id, color));
    return { ids, color };
  });
  for (const c of byComm.values()) {
    if (c.length < 2) c.forEach((id) => colorOf.set(id, NEUTRAL));
  }
  return { colorOf, groups };
}

/** 각 군집의 대표 키워드(TF-IDF). 군집끼리 겹치지 않는 distinct한 단어를 고른다. */
export function clusterLabels(groups: ClusterGroup[], titleById: Map<number, string>): string[] {
  const tokensPerGroup = groups.map((g) => g.ids.flatMap((id) => tokenize(titleById.get(id) ?? '')));
  const df = new Map<string, number>();
  tokensPerGroup.forEach((toks) => {
    new Set(toks).forEach((t) => df.set(t, (df.get(t) ?? 0) + 1));
  });
  const N = groups.length;
  return tokensPerGroup.map((toks) => {
    const tf = new Map<string, number>();
    toks.forEach((t) => tf.set(t, (tf.get(t) ?? 0) + 1));
    let best = '';
    let bestScore = -1;
    for (const [t, f] of tf) {
      const score = f * Math.log((N + 1) / (df.get(t) ?? 1));
      if (score > bestScore || (score === bestScore && t.length > best.length)) {
        bestScore = score;
        best = t;
      }
    }
    return best;
  });
}

// 하위호환: 색만 필요할 때
export function clusterColors(nodes: NodeLike[], edges: EdgeLike[]): Map<number, string> {
  return buildClusters(nodes, edges).colorOf;
}
