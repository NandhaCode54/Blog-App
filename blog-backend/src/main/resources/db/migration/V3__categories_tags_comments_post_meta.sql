-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
CREATE TABLE categories (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(120) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- Tags + post/tag join table
-- ---------------------------------------------------------------------------
CREATE TABLE tags (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(60) NOT NULL UNIQUE,
  slug VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE post_tags (
  post_id BIGINT NOT NULL,
  tag_id BIGINT NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  CONSTRAINT fk_pt_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_pt_tag  FOREIGN KEY (tag_id)  REFERENCES tags(id)  ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- Post metadata: slug, excerpt, status, reading time, updated_at, category
-- ---------------------------------------------------------------------------
ALTER TABLE posts
  ADD COLUMN slug VARCHAR(280) NULL,
  ADD COLUMN excerpt VARCHAR(500) NULL,
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED',
  ADD COLUMN reading_time INT NOT NULL DEFAULT 1,
  ADD COLUMN updated_at TIMESTAMP NULL,
  ADD COLUMN category_id BIGINT NULL;

-- Backfill slugs for existing rows, then enforce NOT NULL + uniqueness
UPDATE posts SET slug = CONCAT('post-', id) WHERE slug IS NULL;
ALTER TABLE posts MODIFY slug VARCHAR(280) NOT NULL;
ALTER TABLE posts ADD CONSTRAINT uq_posts_slug UNIQUE (slug);

ALTER TABLE posts
  ADD CONSTRAINT fk_post_category FOREIGN KEY (category_id)
  REFERENCES categories(id) ON DELETE SET NULL;

CREATE INDEX idx_posts_status ON posts (status);

-- ---------------------------------------------------------------------------
-- Comments (flat)
-- ---------------------------------------------------------------------------
CREATE TABLE comments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  post_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  content VARCHAR(2000) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comment_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_comment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_comment_post ON comments (post_id);
