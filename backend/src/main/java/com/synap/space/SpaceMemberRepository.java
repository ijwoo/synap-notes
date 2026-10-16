package com.synap.space;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SpaceMemberRepository extends JpaRepository<SpaceMember, SpaceMember.Id> {

    boolean existsByIdSpaceIdAndIdUserId(Long spaceId, Long userId);

    @Modifying
    @Query("DELETE FROM SpaceMember m WHERE m.id.spaceId = :spaceId AND m.id.userId = :userId")
    void deleteMember(@Param("spaceId") long spaceId, @Param("userId") long userId);

    @Query("SELECT m.id.spaceId FROM SpaceMember m WHERE m.id.userId = :userId")
    List<Long> findSpaceIdsByUserId(@Param("userId") Long userId);

    @Query("SELECT m.id.userId FROM SpaceMember m WHERE m.id.spaceId = :spaceId")
    List<Long> findUserIdsBySpaceId(@Param("spaceId") Long spaceId);
}
