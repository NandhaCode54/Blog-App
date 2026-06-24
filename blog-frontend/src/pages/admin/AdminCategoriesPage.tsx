import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";
import { fetchCategories } from "../../services";
import { createCategory, updateCategory, deleteCategory } from "../../adminServices";
import type { Category } from "../../types";

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", description: "" });
  const [editing, setEditing] = useState<Category | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["categories"] });

  const doCreate = useMutation({
    mutationFn: () => createCategory(form.name.trim(), form.description.trim() || undefined),
    onSuccess: () => { toast.success("Category created"); setForm({ name: "", description: "" }); invalidate(); },
    onError: () => toast.error("Name already exists or invalid"),
  });

  const doUpdate = useMutation({
    mutationFn: () => updateCategory(editing!.id, form.name.trim(), form.description.trim() || undefined),
    onSuccess: () => { toast.success("Category updated"); setEditing(null); setForm({ name: "", description: "" }); invalidate(); },
    onError: () => toast.error("Update failed"),
  });

  const doDelete = useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => { toast.success("Category deleted"); invalidate(); },
    onError: () => toast.error("Delete failed — category may be in use"),
  });

  const startEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description ?? "" });
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({ name: "", description: "" });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    editing ? doUpdate.mutate() : doCreate.mutate();
  };

  return (
    <AdminLayout>
      <h4 className="fw-bold mb-4">Categories</h4>

      <div className="row g-4">
        {/* Form */}
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="fw-semibold mb-3">{editing ? "Edit Category" : "New Category"}</h6>
              <form onSubmit={submit}>
                <div className="mb-3">
                  <label className="form-label small">Name *</label>
                  <input
                    className="form-control"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Technology"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label small">Description</label>
                  <input
                    className="form-control"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={doCreate.isPending || doUpdate.isPending}
                  >
                    {editing ? "Save" : "Create"}
                  </button>
                  {editing && (
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={cancelEdit}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="col-12 col-md-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              {isLoading ? (
                <div className="p-4 text-muted">Loading…</div>
              ) : categories.length === 0 ? (
                <div className="p-4 text-center text-muted">No categories yet.</div>
              ) : (
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Name</th>
                      <th>Slug</th>
                      <th>Description</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((c) => (
                      <tr key={c.id} className={editing?.id === c.id ? "table-primary" : ""}>
                        <td className="fw-semibold">{c.name}</td>
                        <td className="text-muted small font-monospace">{c.slug}</td>
                        <td className="text-muted small">{c.description || "—"}</td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-secondary me-1"
                            onClick={() => startEdit(c)}
                          >
                            <i className="bi bi-pencil" />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            disabled={doDelete.isPending}
                            onClick={() => {
                              if (window.confirm(`Delete "${c.name}"?`)) doDelete.mutate(c.id);
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
        </div>
      </div>
    </AdminLayout>
  );
}
