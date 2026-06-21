import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchPublicAuthor, fetchAuthorPosts } from "../authorServices";

export default function AuthorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const authorId = Number(id);
  const [page, setPage] = useState(0);

  const { data: author, isLoading: loadingAuthor } = useQuery({
    queryKey: ["author", authorId],
    queryFn: () => fetchPublicAuthor(authorId),
    enabled: !!authorId,
  });

  const { data: posts } = useQuery({
    queryKey: ["author", authorId, "posts", page],
    queryFn: () => fetchAuthorPosts(authorId, page),
    enabled: !!authorId,
  });

  if (loadingAuthor) return <div className="container py-5 text-muted">Loading...</div>;
  if (!author) return <div className="container py-5">Author not found.</div>;

  return (
    <div className="container py-5" style={{ maxWidth: 760 }}>
      {/* Profile header */}
      <div className="d-flex gap-4 align-items-start mb-4">
        {author.avatarUrl ? (
          <img
            src={author.avatarUrl}
            alt={author.name}
            className="rounded-circle flex-shrink-0"
            style={{ width: 80, height: 80, objectFit: "cover" }}
          />
        ) : (
          <div
            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
            style={{ width: 80, height: 80, fontSize: 30 }}
          >
            {(author.name || author.email)[0].toUpperCase()}
          </div>
        )}
        <div>
          <h2 className="fw-bold mb-1">{author.name || author.email}</h2>
          {author.bio && <p className="text-muted mb-2">{author.bio}</p>}
          <div className="d-flex gap-3 flex-wrap small">
            {author.website && (
              <a href={author.website} target="_blank" rel="noreferrer">
                Website
              </a>
            )}
            {author.twitter && (
              <a
                href={`https://twitter.com/${author.twitter}`}
                target="_blank"
                rel="noreferrer"
              >
                @{author.twitter}
              </a>
            )}
            {author.linkedin && (
              <a
                href={`https://linkedin.com/in/${author.linkedin}`}
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>
            )}
          </div>
          <div className="text-muted small mt-2">{author.postCount} published posts</div>
        </div>
      </div>

      <hr />

      {/* Posts */}
      <h5 className="fw-semibold mb-3">Posts by {author.name || "this author"}</h5>

      {posts?.content.map((post) => (
        <div key={post.id} className="mb-4 pb-3 border-bottom">
          <Link to={`/posts/${post.id}`} className="text-decoration-none">
            <h6 className="fw-semibold text-body mb-1">{post.title}</h6>
          </Link>
          {post.excerpt && <p className="text-muted small mb-1">{post.excerpt}</p>}
          <span className="text-muted small">
            {new Date(post.createdAt).toLocaleDateString()} · {post.readingTime} min read
          </span>
        </div>
      ))}

      {posts?.content.length === 0 && (
        <div className="text-muted">No published posts yet.</div>
      )}

      {/* Pagination */}
      {posts && posts.totalPages > 1 && (
        <div className="d-flex justify-content-between mt-3">
          <button
            className="btn btn-sm btn-outline-secondary"
            disabled={posts.first}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className="small text-muted">
            Page {posts.page + 1} of {posts.totalPages}
          </span>
          <button
            className="btn btn-sm btn-outline-secondary"
            disabled={posts.last}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
