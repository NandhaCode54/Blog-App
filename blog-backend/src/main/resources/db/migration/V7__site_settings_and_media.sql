-- ---------------------------------------------------------------------------
-- Site settings: key-value store for blog-wide configuration
-- ---------------------------------------------------------------------------
CREATE TABLE site_settings (
  `key`       VARCHAR(100) PRIMARY KEY,
  value       TEXT         NULL,
  description VARCHAR(255) NULL,
  updated_by  BIGINT       NULL,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ss_admin FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Default settings
INSERT INTO site_settings (`key`, value, description) VALUES
  ('blog.title',              'BlogHub',          'Public name of the blog'),
  ('blog.description',        'A place to read and share stories.', 'Blog subtitle / tagline'),
  ('blog.logo_url',           '',                 'URL of the blog logo image'),
  ('registration.open',       'true',             'Allow new user registrations'),
  ('comments.enabled',        'true',             'Enable/disable comments globally'),
  ('posts.per_page',          '10',               'Default number of posts per page');

-- ---------------------------------------------------------------------------
-- Media files: tracks every uploaded file
-- ---------------------------------------------------------------------------
CREATE TABLE media_files (
  id           BIGINT        PRIMARY KEY AUTO_INCREMENT,
  filename     VARCHAR(255)  NOT NULL UNIQUE,
  original_name VARCHAR(255) NOT NULL,
  content_type VARCHAR(100)  NOT NULL,
  size_bytes   BIGINT        NOT NULL,
  url          VARCHAR(500)  NOT NULL,
  uploaded_by  BIGINT        NOT NULL,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_media_user FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_media_uploader ON media_files (uploaded_by);
