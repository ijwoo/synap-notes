package com.synap.space;

import com.synap.auth.CurrentUser;
import com.synap.graph.MultiGraph;
import com.synap.graph.MultiUserGraphService;
import com.synap.space.dto.SpaceDtos.CreateSpaceRequest;
import com.synap.space.dto.SpaceDtos.InviteRequest;
import com.synap.space.dto.SpaceDtos.MemberDto;
import com.synap.space.dto.SpaceDtos.SpaceDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/spaces")
public class SpaceController {

    private final SpaceService spaceService;
    private final MultiUserGraphService graphService;

    public SpaceController(SpaceService spaceService, MultiUserGraphService graphService) {
        this.spaceService = spaceService;
        this.graphService = graphService;
    }

    @GetMapping
    public List<SpaceDto> mySpaces() {
        return spaceService.listMine(CurrentUser.id());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SpaceDto create(@Valid @RequestBody CreateSpaceRequest req) {
        return spaceService.create(CurrentUser.id(), req.name(), req.icon());
    }

    @PostMapping("/{id}/invite")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void invite(@PathVariable long id, @Valid @RequestBody InviteRequest req) {
        spaceService.invite(CurrentUser.id(), id, req.email());
    }

    @GetMapping("/{id}/members")
    public List<MemberDto> members(@PathVariable long id) {
        return spaceService.members(CurrentUser.id(), id);
    }

    @GetMapping("/{id}/graph")
    public MultiGraph graph(@PathVariable long id) {
        return graphService.spaceGraph(CurrentUser.id(), id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long id) {
        spaceService.deleteSpace(CurrentUser.id(), id);
    }

    @PostMapping("/{id}/leave")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void leave(@PathVariable long id) {
        spaceService.leaveSpace(CurrentUser.id(), id);
    }
}
