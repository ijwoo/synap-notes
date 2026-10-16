package com.synap.graph;

import java.util.List;

/** 멀티유저(스페이스/커뮤니티) 그래프 응답 — 노드에 소유자 정보 포함. */
public record MultiGraph(List<Node> nodes, List<Edge> edges) {

    public record Node(Long id, String title, String topic, Long ownerId, String ownerName, boolean mine, long degree) {
    }

    public record Edge(Long source, Long target, double similarity, boolean cross) {
    }
}
