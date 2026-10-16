package com.synap.note;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NoteRepository extends JpaRepository<Note, Long> {

    List<Note> findByUserIdOrderByUpdatedAtDesc(Long userId);

    List<Note> findByUserIdAndVisibilityOrderByUpdatedAtDesc(Long userId, String visibility);

    long countBySpaceIdAndVisibility(Long spaceId, String visibility);

    /** 스페이스 해체 시: 그 스페이스에 공유된 노트를 전부 개인(private)으로 되돌림. */
    @Modifying
    @Query(value = "UPDATE note SET visibility = 'private', space_id = NULL WHERE space_id = :spaceId", nativeQuery = true)
    void detachSpace(@Param("spaceId") long spaceId);

    /** 스페이스 나가기 시: 내가 그 스페이스에 공유한 노트만 개인으로 되돌림. */
    @Modifying
    @Query(value = "UPDATE note SET visibility = 'private', space_id = NULL WHERE space_id = :spaceId AND user_id = :userId", nativeQuery = true)
    void detachUserFromSpace(@Param("spaceId") long spaceId, @Param("userId") long userId);

    /** 멀티테넌트 전환 전 주인 없는 노트를 주어진 유저로 귀속(데이터 보존). */
    @Modifying
    @Query(value = "UPDATE note SET user_id = :userId WHERE user_id IS NULL", nativeQuery = true)
    int assignOrphans(@Param("userId") long userId);

    /** 임베딩 컬럼을 native 로 갱신 (vector 타입은 JPA 미지원). */
    @Modifying
    @Query(value = "UPDATE note SET embedding = CAST(:vec AS vector), updated_at = now() WHERE id = :id",
            nativeQuery = true)
    void updateEmbedding(@Param("id") long id, @Param("vec") String vectorLiteral);

    /** 같은 소유자의 노트 중 자기 제외 최근접 이웃 top-K (개인 자동 링크용). */
    @Query(value = """
            SELECT id AS id,
                   1 - (embedding <=> CAST(:vec AS vector)) AS similarity
            FROM note
            WHERE user_id = :userId
              AND id <> :selfId
              AND embedding IS NOT NULL
            ORDER BY embedding <=> CAST(:vec AS vector)
            LIMIT :k
            """, nativeQuery = true)
    List<SimilarityProjection> findNearestForUser(@Param("vec") String vectorLiteral,
                                                  @Param("userId") long userId,
                                                  @Param("selfId") long selfId,
                                                  @Param("k") int k);

    /** 검색(내 노트). */
    @Query(value = """
            SELECT n.id AS id, n.title AS title, n.topic AS topic,
                   1 - (n.embedding <=> CAST(:vec AS vector)) AS similarity,
                   n.user_id AS ownerId, u.display_name AS ownerName
            FROM note n JOIN app_user u ON u.id = n.user_id
            WHERE n.user_id = :userId AND n.embedding IS NOT NULL
            ORDER BY n.embedding <=> CAST(:vec AS vector)
            LIMIT :k
            """, nativeQuery = true)
    List<SearchRow> searchMine(@Param("vec") String vec, @Param("userId") long userId, @Param("k") int k);

    /** 검색(내가 속한 스페이스에 공유된 노트). */
    @Query(value = """
            SELECT n.id AS id, n.title AS title, n.topic AS topic,
                   1 - (n.embedding <=> CAST(:vec AS vector)) AS similarity,
                   n.user_id AS ownerId, u.display_name AS ownerName
            FROM note n JOIN app_user u ON u.id = n.user_id
            WHERE n.visibility = 'space' AND n.embedding IS NOT NULL
              AND n.space_id IN (SELECT space_id FROM space_member WHERE user_id = :userId)
            ORDER BY n.embedding <=> CAST(:vec AS vector)
            LIMIT :k
            """, nativeQuery = true)
    List<SearchRow> searchSpaces(@Param("vec") String vec, @Param("userId") long userId, @Param("k") int k);

    /** 검색(공개 노트 전체). */
    @Query(value = """
            SELECT n.id AS id, n.title AS title, n.topic AS topic,
                   1 - (n.embedding <=> CAST(:vec AS vector)) AS similarity,
                   n.user_id AS ownerId, u.display_name AS ownerName
            FROM note n JOIN app_user u ON u.id = n.user_id
            WHERE n.visibility = 'public' AND n.embedding IS NOT NULL
            ORDER BY n.embedding <=> CAST(:vec AS vector)
            LIMIT :k
            """, nativeQuery = true)
    List<SearchRow> searchPublic(@Param("vec") String vec, @Param("k") int k);
}
