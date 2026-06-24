import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";
import { fetchTags } from "../../services";
import { adminDeleteTag } from "../../adminServices";

export default function AdminTagsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ["tags"],
    queryFn: fetchTags,
  });

  const doDelete = useMutation({
    mutationFn: (id: number) => adminDeleteTag(id),
    onSuccess: () => { toast.success("Tag deleted"); qc.invalidateQueries({ queryKey: ["tags"] }); },
    onError: () => toast.error("Delete failed"),
  });

  const filtered = tags.filter(
    (t) => !search || t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h4 className="fw-bold mb-0">Tags</h4>
        <span className="badge text-bg-secondary">{tags.length} total</span>
      </div>

      <p className="text-muted small mb-3">
        Tags are created automatically when authors add them to posts. Delete unused ones here.
      </p>

      <input
        className="form-control mb-3"
        style={{ maxWidth: 300 }}
        placeholder="Search tags…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="p-4 text-muted">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center text-muted">No tags found.</div>
          ) : (
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <span className="badge rounded-pill text-bg-secondary fs-6 fw-normal">
                        #{t.name}
                      </span>
                    </td>
                    <td className="text-muted small font-monospace">{t.slug}</td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-danger"
                        disabled={doDelete.isPending}
                        onClick={() => {
                          if (window.confirm(`Delete tag "#${t.name}"? Posts using it won't be deleted.`))
                            doDelete.mutate(t.id);
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
    </AdminLayout>
  );
}
