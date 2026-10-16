package com.synap.graph;

import com.synap.config.LinkingProperties;
import com.synap.space.SpaceService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class MultiUserGraphService {

    private final GraphQueryRepository graphQueries;
    private final SpaceService spaceService;
    private final LinkingProperties linking;

    public MultiUserGraphService(GraphQueryRepository graphQueries, SpaceService spaceService,
                                 LinkingProperties linking) {
        this.graphQueries = graphQueries;
        this.spaceService = spaceService;
        this.linking = linking;
    }

    @Transactional(readOnly = true)
    public MultiGraph spaceGraph(long uid, long spaceId) {
        spaceService.requireMember(spaceId, uid);
        return assemble(graphQueries.spaceNoteIds(spaceId), uid);
    }

    @Transactional(readOnly = true)
    public MultiGraph communityGraph(long uid) {
        List<Long> mine = graphQueries.myPublicIds(uid);
        Set<Long> ids = new LinkedHashSet<>(mine);
        if (!mine.isEmpty()) {
            ids.addAll(graphQueries.communityNeighborIds(mine, linking.threshold()));
        }
        return assemble(List.copyOf(ids), uid);
    }

    private MultiGraph assemble(List<Long> ids, long uid) {
        if (ids.isEmpty()) {
            return new MultiGraph(List.of(), List.of());
        }
        double th = linking.threshold();
        var edgeRows = graphQueries.pairwiseEdges(ids, th);

        Map<Long, Long> degree = new HashMap<>();
        var nodeRows = graphQueries.nodesByIds(ids);
        Map<Long, Long> ownerOf = new HashMap<>();
        for (var n : nodeRows) {
            ownerOf.put(n.getId(), n.getOwnerId());
            degree.put(n.getId(), 0L);
        }

        var edges = edgeRows.stream().map(e -> {
            degree.merge(e.getSource(), 1L, Long::sum);
            degree.merge(e.getTarget(), 1L, Long::sum);
            boolean cross = !java.util.Objects.equals(ownerOf.get(e.getSource()), ownerOf.get(e.getTarget()));
            return new MultiGraph.Edge(e.getSource(), e.getTarget(), clamp(e.getSimilarity()), cross);
        }).toList();

        var nodes = nodeRows.stream().map(n -> new MultiGraph.Node(
                n.getId(), n.getTitle(), n.getTopic(), n.getOwnerId(), n.getOwnerName(),
                java.util.Objects.equals(n.getOwnerId(), uid), degree.getOrDefault(n.getId(), 0L))).toList();

        return new MultiGraph(nodes, edges);
    }

    private static double clamp(double v) {
        if (v < 0.0) return 0.0;
        return Math.min(v, 1.0);
    }
}
