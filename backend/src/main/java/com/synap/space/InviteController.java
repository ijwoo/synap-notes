package com.synap.space;

import com.synap.auth.CurrentUser;
import com.synap.space.dto.SpaceDtos.InviteDto;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/invites")
public class InviteController {

    private final SpaceService spaceService;

    public InviteController(SpaceService spaceService) {
        this.spaceService = spaceService;
    }

    @GetMapping
    public List<InviteDto> myInvites() {
        return spaceService.listInvites(CurrentUser.id());
    }

    @PostMapping("/{id}/accept")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void accept(@PathVariable long id) {
        spaceService.respondInvite(CurrentUser.id(), id, true);
    }

    @PostMapping("/{id}/decline")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void decline(@PathVariable long id) {
        spaceService.respondInvite(CurrentUser.id(), id, false);
    }
}
