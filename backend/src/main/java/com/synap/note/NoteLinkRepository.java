package com.synap.note;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NoteLinkRepository extends JpaRepository<NoteLink, NoteLinkId> {

    /** 이 노트가 한쪽 끝인 모든 링크 삭제(양방향). 링크 재생성 전에 호출. */
    @Modifying
    @Query(value = "DELETE FROM note_link WHERE note_id = :id OR related_id = :id", nativeQuery = true)
    void deleteAllInvolving(@Param("id") long noteId);

    /** 단일 방향 링크 upsert. */
    @Modifying
    @Query(value = """
            INSERT INTO note_link (note_id, related_id, similarity)
            VALUES (:noteId, :relatedId, :similarity)
            ON CONFLICT (note_id, related_id) DO UPDATE SET similarity = EXCLUDED.similarity
            """, nativeQuery = true)
    void upsert(@Param("noteId") long noteId,
                @Param("relatedId") long relatedId,
                @Param("similarity") float similarity);

    /** related 엔드포인트: 해당 노트와 연결된 노트들을 유사도 내림차순으로. */
    @Query(value = """
            SELECT n.id AS id, n.title AS title, n.topic AS topic, l.similarity AS similarity
            FROM note_link l
            JOIN note n ON n.id = l.related_id
            WHERE l.note_id = :id
            ORDER BY l.similarity DESC
            """, nativeQuery = true)
    List<RelatedNoteProjection> findRelated(@Param("id") long noteId);
}
