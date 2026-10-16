package com.synap.space;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SpaceRepository extends JpaRepository<Space, Long> {

    @Query("""
            SELECT s FROM Space s
            WHERE s.id IN (SELECT m.id.spaceId FROM SpaceMember m WHERE m.id.userId = :userId)
            ORDER BY s.id
            """)
    List<Space> findByMember(@Param("userId") Long userId);
}
