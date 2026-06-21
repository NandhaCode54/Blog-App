import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchMyStats, fetchMyPosts } from "../authorServices";
import { useAuth } from "../context/AuthContext";

export default function AuthorDashboardPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);

  const { data: stats } = useQuery({
    queryKey: ["author", "me", "stats"],
    queryFn: fetchMyStats,
  });

  const { data: posts, isLoading } = useQuery({
    queryKey: ["author", "me", "posts", statusFilter, page],
    queryFn: () => fetchMyPosts(statusFilter || undefined, page),
    placeholderData: (prev) => prev,
  });

  return (
    <div className="container py-5">
      <h4 className="fw-bold mb-1">My Dashboard</h4>
      <p className="text-muted mb-4">Welcome back, {user?.name || user?.email}</p>

      {/* Stats */}
      {stats && (
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-4">
            <div className="card text-bg-success h-100">
              <div className="card-body">
                <div className="fs-3 fw-bold">{stats.publishedPosts}</div>
                <div className="small opacity-75">Published Posts</div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-4">
            <div className="card text-bg-secondary h-100">
              <div className="card-body">
                <div className="fs-3 fw-bold">{stats.draftPosts}</div>
                <div className="small opacity-75">Drafts</div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-4">
            <div className="card text-bg-info h-100">
              <div className="card-body">
                <div className="fs-3 fw-bold">{stats.totalComments}</div>
                <div className="small opacity-75">Comments Received</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Posts table */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h6 className="fw-semibold mb-0">My Posts</h6>
        <div className="d-flex gap-2">
          <select
            className="form-select form-select-sm"
            style={{ width: 150 }}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          >
            <option value="">All</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Drafts</option>
          </select>
          <Link to="/new" className="btn btn-sm btn-primary">
            + New Post
          </Link>
        </div>
      </div>

      {isLoading && <div className="text-muted">Loading...</div>}

      {posts && (
        <>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Category</th>
                  <th>Reading time</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {posts.content.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <Link to={`/posts/${post.id}`} className="text-decoration-none fw-semibold">
                        {post.title}
                      </Link>
                    </td>
                    <td>
                      <span
                        className={`badge text-bg-${
                          post.status === "PUBLISHED" ? "success" : "secondary"
                        }`}
                      >
                        {post.status}
                      </span>
                    </td>
                    <td className="text-muted small">{post.categoryName || "—"}</td>
                    <td className="text-muted small">{post.readingTime} min</td>
                    <td className="text-muted small text-nowrap">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <Link
                        to={`/edit/${post.id}`}
                        className="btn btn-sm btn-outline-secondary"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
                {posts.content.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      No posts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {posts.totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-2">
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
        </>
      )}
    </div>
  );
}
