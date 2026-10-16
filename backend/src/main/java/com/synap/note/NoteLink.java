package com.synap.note;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/** 두 노트 간 의미적 연결. 양방향으로 두 row(A→B, B→A) 저장된다. */
@Entity
@Table(name = "note_link")
public class NoteLink {

    @EmbeddedId
    private NoteLinkId id;

    @Column(nullable = false)
    private float similarity;

    protected NoteLink() {
    }

    public NoteLink(long noteId, long relatedId, float similarity) {
        this.id = new NoteLinkId(noteId, relatedId);
        this.similarity = similarity;
    }

    public NoteLinkId getId() {
        return id;
    }

    public float getSimilarity() {
        return similarity;
    }
}
