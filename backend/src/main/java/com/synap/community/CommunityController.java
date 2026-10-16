package com.synap.community;

import com.synap.auth.CurrentUser;
import com.synap.graph.MultiGraph;
import com.synap.graph.MultiUserGraphService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/community")
public class CommunityController {

    private final MultiUserGraphService graphService;

    public CommunityController(MultiUserGraphService graphService) {
        this.graphService = graphService;
    }

    @GetMapping("/graph")
    public MultiGraph graph() {
        return graphService.communityGraph(CurrentUser.id());
    }
}
