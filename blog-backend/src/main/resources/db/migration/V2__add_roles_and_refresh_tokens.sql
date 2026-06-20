-- Role-based access control: add a role to every user
ALTER TABLE users
  ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'USER';

-- Refresh tokens (DB-backed so they can be rotated and revoked)
CREATE TABLE refresh_tokens (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  token VARCHAR(255) NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_refresh_user ON refresh_tokens (user_id);

-- Performance indexes for the posts listing
CREATE INDEX idx_posts_created_at ON posts (created_at);
CREATE INDEX idx_posts_user ON posts (user_id);
