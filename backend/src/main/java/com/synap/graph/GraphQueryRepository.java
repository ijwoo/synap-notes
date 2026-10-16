package com.synap.graph;

import com.synap.note.Note;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;

/** 멀티유저 그래프용 native 쿼리 (노드 집합 + 라이브 pairwise 엣지). */
public interface GraphQueryRepository extends Repository<Note, Long> {

    /** 스페이스에 공유된 노트 id (visibility=space). */
    @Query(value = "SELECT id FROM note WHERE space_id = :spaceId AND visibility = 'space'", nativeQuery = true)
    List<Long> spaceNoteIds(@Param("spaceId") long spaceId);

    /** 내 공개 노트 id. */
    @Query(value = "SELECT id FROM note WHERE user_id = :userId AND visibility = 'public'", nativeQuery = true)
    List<Long> myPublicIds(@Param("userId") long userId);

    /** 내 공개 노트와 임계값 이상 가까운 '남의' 공개 노트 id (1홉 이웃). */
    @Query(value = """
            SELECT DISTINCT b.id
            FROM note a JOIN note b ON a.user_id <> b.user_id
            WHERE a.id IN (:myIds)
              AND b.visibility = 'public'
              AND a.embedding IS NOT NULL AND b.embedding IS NOT NULL
              AND 1 - (a.embedding <=> b.embedding) >= :th
            """, nativeQuery = true)
    List<Long> communityNeighborIds(@Param("myIds") List<Long> myIds, @Param("th") double threshold);

    /** 노드 정보(소유자 포함). */
    @Query(value = """
            SELECT n.id AS id, n.title AS title, n.topic AS topic,
                   n.user_id AS ownerId, u.display_name AS ownerName
            FROM note n JOIN app_user u ON u.id = n.user_id
            WHERE n.id IN (:ids)
            """, nativeQuery = true)
    List<NodeRow> nodesByIds(@Param("ids") List<Long> ids);

    /** 노드 집합 내 라이브 pairwise 엣지 (sim >= th, source<target). */
    @Query(value = """
            SELECT a.id AS source, b.id AS target,
                   1 - (a.embedding <=> b.embedding) AS similarity
            FROM note a JOIN note b ON a.id < b.id
            WHERE a.id IN (:ids) AND b.id IN (:ids)
              AND a.embedding IS NOT NULL AND b.embedding IS NOT NULL
              AND 1 - (a.embedding <=> b.embedding) >= :th
            """, nativeQuery = true)
    List<EdgeRow> pairwiseEdges(@Param("ids") List<Long> ids, @Param("th") double threshold);

    interface NodeRow {
        Long getId();

        String getTitle();

        String getTopic();

        Long getOwnerId();

        String getOwnerName();
    }

    interface EdgeRow {
        Long getSource();

        Long getTarget();

        double getSimilarity();
    }
}
