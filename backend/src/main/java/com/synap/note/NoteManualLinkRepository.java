package com.synap.note;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NoteManualLinkRepository extends JpaRepository<NoteManualLink, Long> {

    /** 노트의 수동 연결(양방향) → 상대 노트 {id,title}. */
    @Query(value = """
            SELECT n.id AS id, n.title AS title
            FROM note_manual_link m
            JOIN note n ON n.id = (CASE WHEN m.note_id = :id THEN m.target_id ELSE m.note_id END)
            WHERE m.note_id = :id OR m.target_id = :id
            ORDER BY m.id DESC
            """, nativeQuery = true)
    List<LinkedNote> findLinked(@Param("id") long id);

    @Query(value = """
            SELECT count(*) > 0 FROM note_manual_link
            WHERE (note_id = :a AND target_id = :b) OR (note_id = :b AND target_id = :a)
            """, nativeQuery = true)
    boolean existsEitherWay(@Param("a") long a, @Param("b") long b);

    @Modifying
    @Query(value = """
            DELETE FROM note_manual_link
            WHERE (note_id = :a AND target_id = :b) OR (note_id = :b AND target_id = :a)
            """, nativeQuery = true)
    void deleteEitherWay(@Param("a") long a, @Param("b") long b);

    interface LinkedNote {
        Long getId();

        String getTitle();
    }
}
