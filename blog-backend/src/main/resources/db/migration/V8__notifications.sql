CREATE TABLE notifications (
  id         BIGINT        PRIMARY KEY AUTO_INCREMENT,
  user_id    BIGINT        NOT NULL,
  type       VARCHAR(50)   NOT NULL,
  title      VARCHAR(255)  NOT NULL,
  body       TEXT          NULL,
  link       VARCHAR(500)  NULL,
  is_read    BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notif_user_unread ON notifications (user_id, is_read);
