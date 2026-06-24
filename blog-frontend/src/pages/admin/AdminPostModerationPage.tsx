import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";
import { fetchPostsUnderReview, approvePost, rejectPost } from "../../adminServices";
import type { Post } from "../../types";

export default function AdminPostModerationPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [rejectTarget, setRejectTarget] = useState<Post | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "posts", "moderation", page],
    queryFn: () => fetchPostsUnderReview(page),
    placeholderData: (prev) => prev,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "posts", "moderation"] });

  const doApprove = useMutation({
    mutationFn: (id: number) => approvePost(id),
    onSuccess: () => { toast.success("Post published"); invalidate(); },
    onError: () => toast.error("Approve failed"),
  });

  const doReject = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => rejectPost(id, reason),
    onSuccess: () => {
      toast.success("Post returned to author");
      setRejectTarget(null);
      setRejectReason("");
      invalidate();
    },
    onError: () => toast.error("Reject failed"),
  });

  return (
    <AdminLayout>
      <h4 className="fw-bold mb-4">Post Moderation</h4>

      {isLoading && <div className="text-muted">Loading…</div>}

      {data && data.content.length === 0 && (
        <div className="text-center text-muted py-5">
          <i className="bi bi-check-circle display-4 d-block mb-2 text-success" />
          No posts waiting for review.
        </div>
      )}

      {data && data.content.length > 0 && (
        <>
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Category</th>
                    <th>Submitted</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((post) => (
                    <tr key={post.id}>
                      <td>
                        <div className="fw-semibold">{post.title}</div>
                        <div className="text-muted small">{post.readingTime} min read</div>
                      </td>
                      <td className="small">{post.authorName}</td>
                      <td className="small text-muted">{post.categoryName || "—"}</td>
                      <td className="small text-muted text-nowrap">
                        {new Date(post.updatedAt ?? post.createdAt).toLocaleDateString()}
                      </td>
                      <td className="text-end">
                        <a
                          href={`/posts/${post.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-outline-secondary me-1"
                          title="Preview"
                        >
                          <i className="bi bi-eye" />
                        </a>
                        <button
                          className="btn btn-sm btn-success me-1"
                          disabled={doApprove.isPending}
                          onClick={() => {
                            if (window.confirm(`Publish "${post.title}"?`)) doApprove.mutate(post.id);
                          }}
                        >
                          <i className="bi bi-check-lg" /> Approve
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => { setRejectTarget(post); setRejectReason(""); }}
                        >
                          <i className="bi bi-x-lg" /> Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {data.totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <button className="btn btn-sm btn-outline-secondary" disabled={data.first} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <span className="small text-muted">Page {data.page + 1} of {data.totalPages}</span>
              <button className="btn btn-sm btn-outline-secondary" disabled={data.last} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reject Post</h5>
                <button className="btn-close" onClick={() => setRejectTarget(null)} />
              </div>
              <div className="modal-body">
                <p className="text-muted small mb-2">
                  Returning <strong>{rejectTarget.title}</strong> to the author. Provide feedback so they can improve it.
                </p>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Reason for rejection (required)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={() => setRejectTarget(null)}>
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  disabled={!rejectReason.trim() || doReject.isPending}
                  onClick={() => doReject.mutate({ id: rejectTarget.id, reason: rejectReason })}
                >
                  {doReject.isPending ? "Rejecting…" : "Reject & Notify Author"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
