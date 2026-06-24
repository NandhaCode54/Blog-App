-- Add moderation fields to posts
ALTER TABLE posts
  ADD COLUMN reject_reason TEXT        NULL,
  ADD COLUMN reviewed_by   BIGINT      NULL,
  ADD COLUMN reviewed_at   TIMESTAMP   NULL,
  ADD CONSTRAINT fk_post_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;

-- UNDER_REVIEW is a new valid status value; MySQL ENUMs require an ALTER
-- We use VARCHAR for status in this project so no structural change needed.
