package com.synap.space;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SpaceInviteRepository extends JpaRepository<SpaceInvite, Long> {
    List<SpaceInvite> findByInviteeIdAndStatusOrderByIdDesc(Long inviteeId, String status);

    Optional<SpaceInvite> findBySpaceIdAndInviteeId(Long spaceId, Long inviteeId);

    long countByInviteeIdAndStatus(Long inviteeId, String status);
}
