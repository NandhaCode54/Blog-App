import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { fetchAdminComments, adminDeleteComment } from "../../adminServices";

export default function AdminCommentsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(0); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "comments", debounced, page],
    queryFn: () => fetchAdminComments(debounced || undefined, page),
    placeholderData: (prev) => prev,
  });

  const doDelete = useMutation({
    mutationFn: (id: number) => adminDeleteComment(id),
    onSuccess: () => { toast.success("Comment deleted"); qc.invalidateQueries({ queryKey: ["admin", "comments"] }); },
    onError: () => toast.error("Delete failed"),
  });

  return (
    <AdminLayout>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h4 className="fw-bold mb-0">Comments</h4>
        {data && <span className="text-muted small">{data.totalElements} total</span>}
      </div>

      <input
        className="form-control mb-3"
        style={{ maxWidth: 400 }}
        placeholder="Search by content or author…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {isLoading && <div className="p-4 text-muted">Loading…</div>}

          {data && data.content.length === 0 && (
            <div className="p-4 text-center text-muted">No comments found.</div>
          )}

          {data && data.content.length > 0 && (
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Author</th>
                  <th>Comment</th>
                  <th>Post</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((c) => (
                  <tr key={c.id}>
                    <td className="small fw-semibold text-nowrap">{c.authorName}</td>
                    <td className="small text-muted" style={{ maxWidth: 320 }}>
                      <span className="d-block text-truncate">{c.content}</span>
                    </td>
                    <td className="small">
                      <Link to={`/posts/${c.postId}`} target="_blank" className="text-decoration-none">
                        #{c.postId} <i className="bi bi-box-arrow-up-right" style={{ fontSize: 11 }} />
                      </Link>
                    </td>
                    <td className="small text-muted text-nowrap">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-danger"
                        disabled={doDelete.isPending}
                        onClick={() => {
                          if (window.confirm("Delete this comment?")) doDelete.mutate(c.id);
                        }}
                      >
                        <i className="bi bi-trash" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {data && data.totalPages > 1 && (
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
    </AdminLayout>
  );
}
