import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchMyStats, fetchMyPosts, fetchMyProfile, updateMyProfile } from "../authorServices";
import { submitPostForReview } from "../adminServices";
import { useAuth } from "../context/AuthContext";
import MediaUpload from "../components/MediaUpload";
import type { PostStatus } from "../types";

const STATUS_BADGE: Record<PostStatus, string> = {
  PUBLISHED:    "text-bg-success",
  DRAFT:        "text-bg-secondary",
  UNDER_REVIEW: "text-bg-info",
  REJECTED:     "text-bg-danger",
};

export default function AuthorDashboardPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ bio: "", avatarUrl: "", website: "", twitter: "", linkedin: "" });

  const { data: profile } = useQuery({
    queryKey: ["author", "me", "profile"],
    queryFn: fetchMyProfile,
  });

  useEffect(() => {
    if (profile) {
      setProfileForm({
        bio: profile.bio ?? "",
        avatarUrl: profile.avatarUrl ?? "",
        website: profile.website ?? "",
        twitter: profile.twitter ?? "",
        linkedin: profile.linkedin ?? "",
      });
    }
  }, [profile]);

  const doSaveProfile = useMutation({
    mutationFn: () => updateMyProfile(profileForm),
    onSuccess: () => { toast.success("Profile saved"); qc.invalidateQueries({ queryKey: ["author", "me", "profile"] }); },
    onError: () => toast.error("Failed to save profile"),
  });

  const doSubmit = useMutation({
    mutationFn: (id: number) => submitPostForReview(id),
    onSuccess: () => {
      toast.success("Submitted for review!");
      qc.invalidateQueries({ queryKey: ["author", "me", "posts"] });
    },
    onError: () => toast.error("Submit failed"),
  });

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

      {/* Profile editor */}
      <div className="mb-4">
        <button
          className="btn btn-outline-secondary btn-sm mb-3"
          onClick={() => setShowProfile((v) => !v)}
        >
          <i className={`bi bi-chevron-${showProfile ? "up" : "down"} me-1`} />
          Edit My Profile
        </button>
        {showProfile && (
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-12">
                  <MediaUpload
                    label="Avatar"
                    value={profileForm.avatarUrl}
                    onChange={(url) => setProfileForm((f) => ({ ...f, avatarUrl: url }))}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label small">Bio</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm((f) => ({ ...f, bio: e.target.value }))}
                    placeholder="Tell readers about yourself…"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small">Website</label>
                  <input className="form-control" value={profileForm.website} onChange={(e) => setProfileForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://…" />
                </div>
                <div className="col-md-4">
                  <label className="form-label small">Twitter handle</label>
                  <input className="form-control" value={profileForm.twitter} onChange={(e) => setProfileForm((f) => ({ ...f, twitter: e.target.value }))} placeholder="@handle" />
                </div>
                <div className="col-md-4">
                  <label className="form-label small">LinkedIn URL</label>
                  <input className="form-control" value={profileForm.linkedin} onChange={(e) => setProfileForm((f) => ({ ...f, linkedin: e.target.value }))} placeholder="https://linkedin.com/in/…" />
                </div>
                <div className="col-12">
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={doSaveProfile.isPending}
                    onClick={() => doSaveProfile.mutate()}
                  >
                    {doSaveProfile.isPending ? "Saving…" : "Save Profile"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Posts table */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h6 className="fw-semibold mb-0">My Posts</h6>
        <div className="d-flex gap-2">
          <select
            className="form-select form-select-sm"
            style={{ width: 160 }}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          >
            <option value="">All</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Drafts</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="REJECTED">Rejected</option>
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
                      <span className={`badge ${STATUS_BADGE[post.status as PostStatus] ?? "text-bg-secondary"}`}>
                        {post.status.replace("_", " ")}
                      </span>
                      {post.status === "REJECTED" && post.rejectReason && (
                        <div className="text-danger small mt-1" title={post.rejectReason}>
                          <i className="bi bi-exclamation-circle me-1" />
                          {post.rejectReason.substring(0, 60)}{post.rejectReason.length > 60 ? "…" : ""}
                        </div>
                      )}
                    </td>
                    <td className="text-muted small">{post.categoryName || "—"}</td>
                    <td className="text-muted small">{post.readingTime} min</td>
                    <td className="text-muted small text-nowrap">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td className="text-end">
                      <div className="d-flex gap-1 justify-content-end">
                        {(post.status === "DRAFT" || post.status === "REJECTED") && (
                          <button
                            className="btn btn-sm btn-outline-primary"
                            disabled={doSubmit.isPending}
                            title="Submit for admin review"
                            onClick={() => {
                              if (window.confirm("Submit this post for review?")) doSubmit.mutate(post.id);
                            }}
                          >
                            <i className="bi bi-send" />
                          </button>
                        )}
                        <Link to={`/edit/${post.id}`} className="btn btn-sm btn-outline-secondary">
                          Edit
                        </Link>
                      </div>
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
