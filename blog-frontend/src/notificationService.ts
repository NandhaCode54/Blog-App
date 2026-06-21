import api from "./api";
import type { Notification } from "./types";

export async function fetchNotifications(): Promise<Notification[]> {
  const { data } = await api.get<Notification[]>("/notifications");
  return data;
}

export async function fetchUnreadCount(): Promise<number> {
  const { data } = await api.get<{ count: number }>("/notifications/unread-count");
  return data.count;
}

export async function markRead(id: number): Promise<Notification> {
  const { data } = await api.put<Notification>(`/notifications/${id}/read`);
  return data;
}

export async function markAllRead(): Promise<void> {
  await api.put("/notifications/read-all");
}
