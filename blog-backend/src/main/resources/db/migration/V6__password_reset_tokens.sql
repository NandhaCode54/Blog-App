-- ---------------------------------------------------------------------------
-- Password reset tokens: secure, single-use, time-limited (15 minutes)
-- ---------------------------------------------------------------------------
CREATE TABLE password_reset_tokens (
  id           BIGINT        PRIMARY KEY AUTO_INCREMENT,
  user_id      BIGINT        NOT NULL,
  token_hash   VARCHAR(64)   NOT NULL,
  expires_at   TIMESTAMP     NOT NULL,
  used         BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_prt_token_hash ON password_reset_tokens (token_hash);
CREATE INDEX idx_prt_expires_at ON password_reset_tokens (expires_at);
