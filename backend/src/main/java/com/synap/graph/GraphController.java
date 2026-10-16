package com.synap.graph;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/graph")
public class GraphController {

    private final GraphRepository graphRepository;

    public GraphController(GraphRepository graphRepository) {
        this.graphRepository = graphRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public GraphResponse graph() {
        long uid = com.synap.auth.CurrentUser.id();
        var nodes = graphRepository.findNodes(uid).stream()
                .map(n -> new GraphResponse.Node(n.getId(), n.getTitle(), n.getTopic(), n.getDegree()))
                .toList();
        var edges = graphRepository.findEdges(uid).stream()
                .map(e -> new GraphResponse.Edge(e.getSource(), e.getTarget(), clamp(e.getSimilarity())))
                .toList();
        return new GraphResponse(nodes, edges);
    }

    private static double clamp(double v) {
        if (v < 0.0) {
            return 0.0;
        }
        return Math.min(v, 1.0);
    }
}
