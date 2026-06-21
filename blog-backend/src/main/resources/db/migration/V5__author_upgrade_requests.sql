-- ---------------------------------------------------------------------------
-- Author upgrade requests: users ask admin to promote them to AUTHOR
-- ---------------------------------------------------------------------------
CREATE TABLE author_upgrade_requests (
  id           BIGINT       PRIMARY KEY AUTO_INCREMENT,
  user_id      BIGINT       NOT NULL,
  message      VARCHAR(500) NULL,
  status       VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
  reviewed_by  BIGINT       NULL,
  reviewed_at  TIMESTAMP    NULL,
  reject_reason VARCHAR(255) NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_aur_user     FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_aur_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT uq_aur_user     UNIQUE (user_id)
);

CREATE INDEX idx_aur_status ON author_upgrade_requests (status);
