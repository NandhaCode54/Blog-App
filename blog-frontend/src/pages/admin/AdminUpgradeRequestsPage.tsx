import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  fetchUpgradeRequests,
  approveUpgradeRequest,
  rejectUpgradeRequest,
  type UpgradeRequest,
} from "../../adminServices";
import AdminLayout from "../../components/AdminLayout";

export default function AdminUpgradeRequestsPage() {
  const qc = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState<UpgradeRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin", "upgrade-requests"],
    queryFn: fetchUpgradeRequests,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "upgrade-requests"] });

  const doApprove = useMutation({
    mutationFn: (id: number) => approveUpgradeRequest(id),
    onSuccess: () => { toast.success("Request approved — user is now an Author"); invalidate(); },
    onError: () => toast.error("Failed to approve"),
  });

  const doReject = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      rejectUpgradeRequest(id, reason),
    onSuccess: () => {
      toast.success("Request rejected");
      setRejectTarget(null);
      setRejectReason("");
      invalidate();
    },
    onError: () => toast.error("Failed to reject"),
  });

  return (
    <AdminLayout>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h4 className="fw-bold mb-0">Author Upgrade Requests</h4>
        {requests && (
          <span className="badge text-bg-warning fs-6">{requests.length} pending</span>
        )}
      </div>

      {isLoading && <div className="text-muted">Loading...</div>}

      {requests?.length === 0 && (
        <div className="text-muted">No pending requests.</div>
      )}

      <div className="d-flex flex-column gap-3">
        {requests?.map((r) => (
          <div key={r.id} className="card border-0 shadow-sm">
            <div className="card-body d-flex align-items-start gap-3">
              <div
                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                style={{ width: 44, height: 44 }}
              >
                {(r.userName || r.userEmail)[0].toUpperCase()}
              </div>
              <div className="flex-grow-1 min-w-0">
                <div className="fw-semibold">{r.userName || "—"}</div>
                <div className="text-muted small">{r.userEmail}</div>
                {r.message && (
                  <p className="mt-2 mb-0 small fst-italic text-body-secondary">
                    "{r.message}"
                  </p>
                )}
                <div className="text-muted small mt-1">
                  Submitted {new Date(r.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="d-flex gap-2 flex-shrink-0">
                <button
                  className="btn btn-sm btn-success"
                  disabled={doApprove.isPending}
                  onClick={() => doApprove.mutate(r.id)}
                >
                  Approve
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => { setRejectTarget(r); setRejectReason(""); }}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reject modal */}
      {rejectTarget && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Reject request from {rejectTarget.userName || rejectTarget.userEmail}
                </h5>
                <button className="btn-close" onClick={() => setRejectTarget(null)} />
              </div>
              <div className="modal-body">
                <label className="form-label">Reason (optional)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Let the user know why..."
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setRejectTarget(null)}>
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  disabled={doReject.isPending}
                  onClick={() => doReject.mutate({ id: rejectTarget.id, reason: rejectReason })}
                >
                  {doReject.isPending ? "Rejecting..." : "Confirm Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
