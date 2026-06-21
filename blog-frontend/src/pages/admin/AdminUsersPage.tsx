import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  fetchAdminUsers,
  banUser,
  unbanUser,
  suspendUser,
  promoteToAuthor,
  updateUserRole,
} from "../../adminServices";
import type { AdminUser } from "../../types";
import AdminLayout from "../../components/AdminLayout";

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  BANNED: "danger",
};

const ROLE_BADGE: Record<string, string> = {
  USER: "secondary",
  AUTHOR: "primary",
  ADMIN: "warning",
};

function UserStatusBadge({ status }: { status: string }) {
  return <span className={`badge text-bg-${STATUS_BADGE[status] ?? "secondary"}`}>{status}</span>;
}

function UserRoleBadge({ role }: { role: string }) {
  return <span className={`badge text-bg-${ROLE_BADGE[role] ?? "secondary"}`}>{role}</span>;
}

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [banTarget, setBanTarget] = useState<AdminUser | null>(null);
  const [banReason, setBanReason] = useState("");
  const [hideContent, setHideContent] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", page, search, roleFilter, statusFilter],
    queryFn: () =>
      fetchAdminUsers({ page, search, role: roleFilter as any, status: statusFilter }),
    placeholderData: (prev) => prev,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin"] });

  const doBan = useMutation({
    mutationFn: (u: AdminUser) => banUser(u.id, banReason, hideContent),
    onSuccess: () => { toast.success("User banned"); setBanTarget(null); setBanReason(""); invalidate(); },
    onError: () => toast.error("Failed to ban user"),
  });

  const doUnban = useMutation({
    mutationFn: (id: number) => unbanUser(id),
    onSuccess: () => { toast.success("User unbanned"); invalidate(); },
    onError: () => toast.error("Failed to unban"),
  });

  const doSuspend = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => suspendUser(id, reason),
    onSuccess: () => { toast.success("User suspended"); invalidate(); },
    onError: () => toast.error("Failed to suspend"),
  });

  const doPromote = useMutation({
    mutationFn: (id: number) => promoteToAuthor(id),
    onSuccess: () => { toast.success("Promoted to Author"); invalidate(); },
    onError: () => toast.error("Failed to promote"),
  });

  const doDemote = useMutation({
    mutationFn: (id: number) => updateUserRole(id, "USER"),
    onSuccess: () => { toast.success("Demoted to User"); invalidate(); },
    onError: () => toast.error("Failed to demote"),
  });

  return (
    <AdminLayout>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h4 className="fw-bold mb-0">Users</h4>
        <span className="text-muted small">
          {data ? `${data.totalElements.toLocaleString()} total` : ""}
        </span>
      </div>

      {/* Filters */}
      <div className="row g-2 mb-3">
        <div className="col-md-5">
          <input
            className="form-control"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}
          >
            <option value="">All Roles</option>
            <option value="USER">User</option>
            <option value="AUTHOR">Author</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="BANNED">Banned</option>
          </select>
        </div>
      </div>

      {isLoading && <div className="text-muted">Loading...</div>}

      {data && (
        <>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Name / Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Posts</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="fw-semibold">{u.name || "—"}</div>
                      <div className="text-muted small">{u.email}</div>
                    </td>
                    <td><UserRoleBadge role={u.role} /></td>
                    <td>
                      <UserStatusBadge status={u.status} />
                      {u.banReason && (
                        <div className="text-muted small mt-1" title={u.banReason}>
                          {u.banReason.length > 30 ? u.banReason.slice(0, 30) + "…" : u.banReason}
                        </div>
                      )}
                    </td>
                    <td>{u.postCount}</td>
                    <td className="text-nowrap small">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="d-flex gap-1 flex-wrap">
                        {u.role === "USER" && (
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => doPromote.mutate(u.id)}
                          >
                            Promote
                          </button>
                        )}
                        {u.role === "AUTHOR" && (
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => doDemote.mutate(u.id)}
                          >
                            Demote
                          </button>
                        )}
                        {u.status === "ACTIVE" && (
                          <>
                            <button
                              className="btn btn-sm btn-outline-warning"
                              onClick={() =>
                                doSuspend.mutate({ id: u.id, reason: "Suspended by admin" })
                              }
                            >
                              Suspend
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => { setBanTarget(u); setBanReason(""); }}
                            >
                              Ban
                            </button>
                          </>
                        )}
                        {(u.status === "BANNED" || u.status === "SUSPENDED") && (
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => doUnban.mutate(u.id)}
                          >
                            Unban
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {data.content.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="d-flex justify-content-between align-items-center mt-2">
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={data.first}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <span className="small text-muted">
              Page {data.page + 1} of {data.totalPages}
            </span>
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={data.last}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Ban modal */}
      {banTarget && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Ban {banTarget.name || banTarget.email}</h5>
                <button className="btn-close" onClick={() => setBanTarget(null)} />
              </div>
              <div className="modal-body">
                <label className="form-label">Reason</label>
                <input
                  className="form-control mb-3"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Enter ban reason..."
                />
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="hideContent"
                    checked={hideContent}
                    onChange={(e) => setHideContent(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="hideContent">
                    Hide this user's posts and comments from public
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setBanTarget(null)}>
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  disabled={!banReason.trim() || doBan.isPending}
                  onClick={() => doBan.mutate(banTarget)}
                >
                  {doBan.isPending ? "Banning..." : "Confirm Ban"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
