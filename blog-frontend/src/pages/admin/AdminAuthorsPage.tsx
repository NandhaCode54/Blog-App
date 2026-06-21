import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { fetchAuthors, upsertAuthorProfile, type AuthorProfileInput } from "../../adminServices";
import type { AuthorProfile } from "../../types";
import AdminLayout from "../../components/AdminLayout";

const EMPTY_FORM: AuthorProfileInput = {
  bio: "",
  avatarUrl: "",
  website: "",
  twitter: "",
  linkedin: "",
};

export default function AdminAuthorsPage() {
  const qc = useQueryClient();
  const [editTarget, setEditTarget] = useState<AuthorProfile | null>(null);
  const [form, setForm] = useState<AuthorProfileInput>(EMPTY_FORM);

  const { data: authors, isLoading } = useQuery({
    queryKey: ["admin", "authors"],
    queryFn: fetchAuthors,
  });

  const doSave = useMutation({
    mutationFn: () => upsertAuthorProfile(editTarget!.userId, form),
    onSuccess: () => {
      toast.success("Profile saved");
      setEditTarget(null);
      qc.invalidateQueries({ queryKey: ["admin", "authors"] });
    },
    onError: () => toast.error("Failed to save profile"),
  });

  const openEdit = (a: AuthorProfile) => {
    setEditTarget(a);
    setForm({
      bio: a.bio ?? "",
      avatarUrl: a.avatarUrl ?? "",
      website: a.website ?? "",
      twitter: a.twitter ?? "",
      linkedin: a.linkedin ?? "",
    });
  };

  return (
    <AdminLayout>
      <h4 className="fw-bold mb-4">Authors</h4>

      {isLoading && <div className="text-muted">Loading...</div>}

      <div className="row g-3">
        {authors?.map((a) => (
          <div key={a.userId} className="col-md-6 col-lg-4">
            <div className="card h-100">
              <div className="card-body">
                <div className="d-flex align-items-start gap-3 mb-2">
                  {a.avatarUrl ? (
                    <img
                      src={a.avatarUrl}
                      alt={a.name}
                      className="rounded-circle"
                      style={{ width: 48, height: 48, objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center fw-bold"
                      style={{ width: 48, height: 48, fontSize: 20 }}
                    >
                      {(a.name || a.email)[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-grow-1 min-w-0">
                    <div className="fw-semibold text-truncate">{a.name || "—"}</div>
                    <div className="text-muted small text-truncate">{a.email}</div>
                    <span
                      className={`badge text-bg-${a.role === "ADMIN" ? "warning" : "primary"} mt-1`}
                    >
                      {a.role}
                    </span>
                  </div>
                </div>

                {a.bio && <p className="small text-muted mb-2">{a.bio}</p>}

                <div className="d-flex gap-2 flex-wrap small mb-2">
                  {a.website && (
                    <a href={a.website} target="_blank" rel="noreferrer" className="text-decoration-none">
                      Website
                    </a>
                  )}
                  {a.twitter && (
                    <a href={`https://twitter.com/${a.twitter}`} target="_blank" rel="noreferrer">
                      @{a.twitter}
                    </a>
                  )}
                </div>

                <div className="text-muted small mb-3">{a.postCount} posts</div>

                <button
                  className="btn btn-sm btn-outline-primary w-100"
                  onClick={() => openEdit(a)}
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        ))}

        {authors?.length === 0 && (
          <div className="col-12 text-muted">
            No authors yet. Promote a user to Author from the Users page.
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editTarget && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Edit Profile — {editTarget.name || editTarget.email}
                </h5>
                <button className="btn-close" onClick={() => setEditTarget(null)} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Bio</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Avatar URL</label>
                  <input
                    className="form-control"
                    value={form.avatarUrl}
                    onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Website</label>
                  <input
                    className="form-control"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="row g-2">
                  <div className="col">
                    <label className="form-label">Twitter handle</label>
                    <div className="input-group">
                      <span className="input-group-text">@</span>
                      <input
                        className="form-control"
                        value={form.twitter}
                        onChange={(e) => setForm({ ...form, twitter: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col">
                    <label className="form-label">LinkedIn</label>
                    <input
                      className="form-control"
                      value={form.linkedin}
                      onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                      placeholder="username"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setEditTarget(null)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  disabled={doSave.isPending}
                  onClick={() => doSave.mutate()}
                >
                  {doSave.isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
