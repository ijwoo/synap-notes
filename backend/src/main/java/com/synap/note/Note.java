package com.synap.note;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * 노트 엔티티.
 *
 * <p>{@code embedding vector(1536)} 컬럼은 JPA 가 다루는 타입이 아니므로 엔티티에 매핑하지 않고
 * {@link NoteRepository} 의 native 쿼리로 읽고 쓴다. (ddl-auto=validate 는 매핑되지 않은
 * 추가 컬럼을 문제 삼지 않는다.)</p>
 */
@Entity
@Table(name = "note")
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String body;

    @Column
    private String topic;

    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false)
    private String visibility = "private";

    @Column(name = "space_id")
    private Long spaceId;

    @Column(name = "source_note_id")
    private Long sourceNoteId;

    @Column(name = "source_author_id")
    private Long sourceAuthorId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Note() {
    }

    public Note(Long userId, String title, String body, String topic, String visibility, Long spaceId) {
        this.userId = userId;
        this.title = title;
        this.body = body;
        this.topic = topic;
        this.visibility = visibility;
        this.spaceId = spaceId;
    }

    public void update(String title, String body, String topic, String visibility, Long spaceId) {
        this.title = title;
        this.body = body;
        this.topic = topic;
        this.visibility = visibility;
        this.spaceId = spaceId;
    }

    public Long getUserId() {
        return userId;
    }

    public String getVisibility() {
        return visibility;
    }

    public Long getSpaceId() {
        return spaceId;
    }

    public Long getSourceNoteId() {
        return sourceNoteId;
    }

    public Long getSourceAuthorId() {
        return sourceAuthorId;
    }

    public void markImportedFrom(Long sourceNoteId, Long sourceAuthorId) {
        this.sourceNoteId = sourceNoteId;
        this.sourceAuthorId = sourceAuthorId;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getBody() {
        return body;
    }

    public String getTopic() {
        return topic;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
