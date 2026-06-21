import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotifications,
  fetchUnreadCount,
  markRead,
  markAllRead,
} from "../notificationService";
import type { Notification } from "../types";

const TYPE_ICON: Record<string, string> = {
  WELCOME:         "bi-stars text-warning",
  COMMENT:         "bi-chat-left-text text-primary",
  UPGRADE_REQUEST: "bi-person-check text-info",
  UPGRADE_APPROVED:"bi-patch-check-fill text-success",
  UPGRADE_REJECTED:"bi-x-circle text-danger",
};

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: count = 0 } = useQuery({
    queryKey: ["notif-count"],
    queryFn: fetchUnreadCount,
    refetchInterval: 30_000,
  });

  const { data: items = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    enabled: open,
  });

  const doRead = useMutation({
    mutationFn: markRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notif-count"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const doReadAll = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notif-count"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleClick = (n: Notification) => {
    if (!n.read) doRead.mutate(n.id);
    if (n.link) {
      setOpen(false);
      navigate(n.link);
    }
  };

  return (
    <div className="position-relative" ref={panelRef}>
      <button
        className="btn btn-link nav-link px-2 py-0 position-relative text-reset"
        onClick={() => setOpen((v) => !v)}
        title="Notifications"
        style={{ fontSize: 20 }}
      >
        <i className="bi bi-bell" />
        {count > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: 10, padding: "2px 5px" }}
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div
          className="dropdown-menu dropdown-menu-end show shadow"
          style={{ width: 340, maxHeight: 420, overflowY: "auto", right: 0, left: "auto" }}
        >
          <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
            <span className="fw-semibold small">Notifications</span>
            {count > 0 && (
              <button
                className="btn btn-link btn-sm p-0 text-muted small"
                onClick={() => doReadAll.mutate()}
              >
                Mark all read
              </button>
            )}
          </div>

          {items.length === 0 && (
            <div className="text-muted text-center py-4 small">No notifications yet</div>
          )}

          {items.map((n) => (
            <button
              key={n.id}
              className={`dropdown-item d-flex align-items-start gap-2 py-2 px-3 text-start border-bottom${!n.read ? " bg-light" : ""}`}
              style={{ whiteSpace: "normal" }}
              onClick={() => handleClick(n)}
            >
              <i className={`bi ${TYPE_ICON[n.type] ?? "bi-bell"} mt-1 flex-shrink-0`} />
              <div className="flex-grow-1 overflow-hidden">
                <div className="small fw-semibold text-truncate">{n.title}</div>
                {n.body && (
                  <div className="text-muted" style={{ fontSize: 12, whiteSpace: "pre-wrap", overflow: "hidden", maxHeight: 40 }}>
                    {n.body}
                  </div>
                )}
                <div className="text-muted" style={{ fontSize: 11 }}>{timeAgo(n.createdAt)}</div>
              </div>
              {!n.read && (
                <span
                  className="rounded-circle bg-primary flex-shrink-0"
                  style={{ width: 8, height: 8, marginTop: 6 }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
