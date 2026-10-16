package com.synap.graph;

import java.util.List;

public record GraphResponse(List<Node> nodes, List<Edge> edges) {

    public record Node(Long id, String title, String topic, long degree) {
    }

    public record Edge(Long source, Long target, double similarity) {
    }
}
