import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  deletePost,
  fetchCategories,
  fetchPosts,
  fetchTags,
} from "../services";
import { apiErrorMessage } from "../api";
import { useAuth } from "../context/AuthContext";
import type { Post } from "../types";

const PAGE_SIZE = 9;

export default function PostsPage() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState<number | "">("");
  const [tag, setTag] = useState("");
  const [page, setPage] = useState(0);

  // Debounce the search box so we don't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(0);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const tagsQuery = useQuery({ queryKey: ["tags"], queryFn: fetchTags });

  const postsQuery = useQuery({
    queryKey: ["posts", { q: debounced, category, tag, page }],
    queryFn: () =>
      fetchPosts({ q: debounced, category: category || null, tag: tag || null, page, size: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePost(id),
    onSuccess: () => {
      toast.success("Post deleted");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Delete failed")),
  });

  const canManage = (post: Post) =>
    !!user && (user.id === post.authorId || isAdmin);

  const data = postsQuery.data;

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <h1 className="h3 mb-0">Latest Posts</h1>
      </div>

      {/* Filters */}
      <div className="row g-2 mb-4">
        <div className="col-12 col-md">
          <input
            className="form-control"
            placeholder="🔍 Search posts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-12 col-md-auto">
          <select
            className="form-select"
            value={category}
            onChange={(e) => { setCategory(e.target.value ? Number(e.target.value) : ""); setPage(0); }}
          >
            <option value="">All categories</option>
            {categoriesQuery.data?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="col-12 col-md-auto">
          <select
            className="form-select"
            value={tag}
            onChange={(e) => { setTag(e.target.value); setPage(0); }}
          >
            <option value="">All tags</option>
            {tagsQuery.data?.map((t) => (
              <option key={t.id} value={t.slug}>#{t.name}</option>
            ))}
          </select>
        </div>
        {(search || category || tag) && (
          <div className="col-12 col-md-auto">
            <button
              className="btn btn-outline-secondary"
              onClick={() => { setSearch(""); setCategory(""); setTag(""); setPage(0); }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {postsQuery.isLoading ? (
        <SkeletonGrid />
      ) : postsQuery.isError ? (
        <div className="alert alert-danger">
          Could not load posts: {apiErrorMessage(postsQuery.error)}
        </div>
      ) : !data || data.content.length === 0 ? (
        <div className="text-center text-muted py-5">
          <p className="mb-1 fs-5">No posts found</p>
          <p className="small">Try a different search or category.</p>
        </div>
      ) : (
        <>
          <div className="row g-4">
            {data.content.map((p) => (
              <div className="col-12 col-sm-6 col-lg-4" key={p.id}>
                <div className="card h-100 shadow-sm">
                  {p.coverImageUrl && (
                    <img
                      src={p.coverImageUrl}
                      alt={p.title}
                      className="card-img-top object-fit-cover"
                      style={{ height: 160 }}
                    />
                  )}
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex gap-2 mb-2 flex-wrap">
                      {p.categoryName && (
                        <span className="badge text-bg-info">{p.categoryName}</span>
                      )}
                      <span className="badge text-bg-light border">{p.readingTime} min read</span>
                    </div>
                    <h5 className="card-title">
                      <Link to={`/posts/${p.id}`} className="stretched-link text-decoration-none">
                        {p.title}
                      </Link>
                    </h5>
                    <p className="card-text text-muted small flex-grow-1">{p.excerpt}</p>
                    <div className="d-flex flex-wrap gap-1 mt-2">
                      {p.tags.map((t) => (
                        <span key={t} className="badge rounded-pill text-bg-secondary">#{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="card-footer d-flex justify-content-between align-items-center small text-muted">
                    <span>{p.authorName} · {new Date(p.createdAt).toLocaleDateString()}</span>
                    {canManage(p) && (
                      <span className="d-flex gap-2 position-relative" style={{ zIndex: 2 }}>
                        <Link className="btn btn-sm btn-outline-primary" to={`/edit/${p.id}`}>
                          Edit
                        </Link>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (window.confirm(`Delete "${p.title}"?`)) deleteMutation.mutate(p.id);
                          }}
                        >
                          Delete
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <nav className="d-flex justify-content-center mt-4">
              <ul className="pagination mb-0">
                <li className={`page-item ${data.first ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setPage((p) => Math.max(0, p - 1))}>
                    Previous
                  </button>
                </li>
                <li className="page-item disabled">
                  <span className="page-link">
                    Page {data.page + 1} of {data.totalPages}
                  </span>
                </li>
                <li className={`page-item ${data.last ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setPage((p) => p + 1)}>
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="row g-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div className="col-12 col-sm-6 col-lg-4" key={i}>
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <div className="placeholder-glow">
                <span className="placeholder col-4 mb-2"></span>
                <span className="placeholder col-9"></span>
                <span className="placeholder col-12"></span>
                <span className="placeholder col-7"></span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
