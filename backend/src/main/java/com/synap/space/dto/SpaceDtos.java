package com.synap.space.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public final class SpaceDtos {

    public record CreateSpaceRequest(@NotBlank String name, String icon) {
    }

    public record InviteRequest(@Email @NotBlank String email) {
    }

    public record SpaceDto(
            Long id,
            String name,
            String icon,
            boolean owner,
            int memberCount,
            long noteCount
    ) {
    }

    public record MemberDto(Long id, String displayName, String email, boolean owner) {
    }

    public record InviteDto(Long id, Long spaceId, String spaceName, String spaceIcon, String inviterName) {
    }

    private SpaceDtos() {
    }
}
