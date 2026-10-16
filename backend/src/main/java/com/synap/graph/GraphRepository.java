package com.synap.graph;

import com.synap.note.Note;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GraphRepository extends Repository<Note, Long> {

    /** 내 노드: 노트 + degree(연결 수). 양방향 저장이므로 note_id 기준 count 가 곧 연결 수. */
    @Query(value = """
            SELECT n.id AS id, n.title AS title, n.topic AS topic,
                   COUNT(l.note_id) AS degree
            FROM note n
            LEFT JOIN note_link l ON l.note_id = n.id
            WHERE n.user_id = :userId
            GROUP BY n.id, n.title, n.topic
            ORDER BY n.id
            """, nativeQuery = true)
    List<NodeProjection> findNodes(@Param("userId") long userId);

    /** 내 엣지: 자동(note_link) + 수동(note_manual_link, 유사도 1.0). source < target 로 중복 제거. */
    @Query(value = """
            SELECT l.note_id AS source, l.related_id AS target, l.similarity AS similarity
            FROM note_link l
            JOIN note n ON n.id = l.note_id
            WHERE l.note_id < l.related_id
              AND n.user_id = :userId
            UNION
            SELECT LEAST(m.note_id, m.target_id) AS source, GREATEST(m.note_id, m.target_id) AS target, 1.0 AS similarity
            FROM note_manual_link m
            JOIN note n ON n.id = m.note_id
            WHERE n.user_id = :userId
              AND NOT EXISTS (
                SELECT 1 FROM note_link l2
                WHERE l2.note_id = LEAST(m.note_id, m.target_id)
                  AND l2.related_id = GREATEST(m.note_id, m.target_id)
              )
            ORDER BY 1, 2
            """, nativeQuery = true)
    List<EdgeProjection> findEdges(@Param("userId") long userId);

    interface NodeProjection {
        Long getId();

        String getTitle();

        String getTopic();

        long getDegree();
    }

    interface EdgeProjection {
        Long getSource();

        Long getTarget();

        double getSimilarity();
    }
}
