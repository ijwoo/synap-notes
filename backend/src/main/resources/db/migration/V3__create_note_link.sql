CREATE TABLE note_link (
    note_id    BIGINT NOT NULL REFERENCES note(id) ON DELETE CASCADE,
    related_id BIGINT NOT NULL REFERENCES note(id) ON DELETE CASCADE,
    similarity REAL   NOT NULL,
    PRIMARY KEY (note_id, related_id)
);

CREATE INDEX idx_note_link_note_id ON note_link (note_id);
CREATE INDEX idx_note_link_related_id ON note_link (related_id);
