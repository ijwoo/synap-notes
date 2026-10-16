ALTER TABLE note ADD COLUMN source_note_id   BIGINT REFERENCES note(id) ON DELETE SET NULL;
ALTER TABLE note ADD COLUMN source_author_id BIGINT REFERENCES app_user(id) ON DELETE SET NULL;

CREATE INDEX idx_note_source_author ON note (source_author_id);
