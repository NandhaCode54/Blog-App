-- ---------------------------------------------------------------------------
-- Password reset OTPs: hashed 6-digit code, 10-min expiry, max 5 attempts
-- ---------------------------------------------------------------------------
CREATE TABLE password_reset_tokens (
  id         BIGINT       PRIMARY KEY AUTO_INCREMENT,
  user_id    BIGINT       NOT NULL,
  otp_hash   VARCHAR(64)  NOT NULL,
  attempts   INT          NOT NULL DEFAULT 0,
  expires_at TIMESTAMP    NOT NULL,
  used       BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_prt_user_id    ON password_reset_tokens (user_id);
CREATE INDEX idx_prt_expires_at ON password_reset_tokens (expires_at);
