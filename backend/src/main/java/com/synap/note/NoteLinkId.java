package com.synap.note;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class NoteLinkId implements Serializable {

    @Column(name = "note_id")
    private Long noteId;

    @Column(name = "related_id")
    private Long relatedId;

    protected NoteLinkId() {
    }

    public NoteLinkId(Long noteId, Long relatedId) {
        this.noteId = noteId;
        this.relatedId = relatedId;
    }

    public Long getNoteId() {
        return noteId;
    }

    public Long getRelatedId() {
        return relatedId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof NoteLinkId that)) {
            return false;
        }
        return Objects.equals(noteId, that.noteId) && Objects.equals(relatedId, that.relatedId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(noteId, relatedId);
    }
}
