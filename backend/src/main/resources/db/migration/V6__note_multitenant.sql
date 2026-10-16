ALTER TABLE note ADD COLUMN user_id    BIGINT REFERENCES app_user(id);
ALTER TABLE note ADD COLUMN visibility TEXT NOT NULL DEFAULT 'private';
ALTER TABLE note ADD COLUMN space_id   BIGINT REFERENCES space(id);

CREATE INDEX idx_note_user ON note (user_id);
CREATE INDEX idx_note_visibility ON note (visibility);
CREATE INDEX idx_note_space ON note (space_id);
