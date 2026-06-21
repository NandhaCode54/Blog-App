-- ---------------------------------------------------------------------------
-- User status: ACTIVE, BANNED, SUSPENDED (admin decides per ban)
-- ---------------------------------------------------------------------------
ALTER TABLE users
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN banned_at TIMESTAMP NULL,
  ADD COLUMN ban_reason VARCHAR(255) NULL,
  ADD COLUMN hide_content BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_users_status ON users (status);
CREATE INDEX idx_users_role   ON users (role);

-- ---------------------------------------------------------------------------
-- Author profiles (1-to-1 with users who have AUTHOR or ADMIN role)
-- ---------------------------------------------------------------------------
CREATE TABLE author_profiles (
  user_id     BIGINT       PRIMARY KEY,
  bio         TEXT         NULL,
  avatar_url  VARCHAR(500) NULL,
  website     VARCHAR(255) NULL,
  twitter     VARCHAR(100) NULL,
  linkedin    VARCHAR(100) NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NULL,
  CONSTRAINT fk_ap_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- Admin audit log: tracks every admin action
-- ---------------------------------------------------------------------------
CREATE TABLE admin_audit_log (
  id           BIGINT       PRIMARY KEY AUTO_INCREMENT,
  admin_id     BIGINT       NOT NULL,
  action       VARCHAR(80)  NOT NULL,
  target_type  VARCHAR(40)  NOT NULL,
  target_id    BIGINT       NOT NULL,
  detail       VARCHAR(500) NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_admin FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_audit_admin  ON admin_audit_log (admin_id);
CREATE INDEX idx_audit_target ON admin_audit_log (target_type, target_id);
