import { useCallback, useEffect, useState } from 'react';
import { synap } from '../../api/synap';
import type { Graph } from '../../types';

export function useGraph() {
  const [graph, setGraph] = useState<Graph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setGraph(await synap.getGraph());
    } catch (e) {
      setError(e instanceof Error ? e.message : '그래프를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { graph, loading, error, reload };
}
