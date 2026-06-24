import api from "./api";
import type { AdminStats, AdminUser, AuthorProfile, Category, Comment, Page, Post, Role, Tag } from "./types";

// ---- Stats ----

export async function fetchAdminStats(): Promise<AdminStats> {
  const { data } = await api.get<AdminStats>("/admin/stats");
  return data;
}

// ---- Users ----

export interface AdminUserQuery {
  role?: Role | "";
  status?: string;
  search?: string;
  page?: number;
  size?: number;
}

export async function fetchAdminUsers(params: AdminUserQuery): Promise<Page<AdminUser>> {
  const { data } = await api.get<Page<AdminUser>>("/admin/users", {
    params: {
      role: params.role || undefined,
      status: params.status || undefined,
      search: params.search || undefined,
      page: params.page ?? 0,
      size: params.size ?? 20,
    },
  });
  return data;
}

export async function fetchAdminUser(id: number): Promise<AdminUser> {
  const { data } = await api.get<AdminUser>(`/admin/users/${id}`);
  return data;
}

export async function updateUserRole(id: number, role: Role): Promise<AdminUser> {
  const { data } = await api.put<AdminUser>(`/admin/users/${id}/role`, { role });
  return data;
}

export async function banUser(id: number, reason: string, hideContent: boolean): Promise<AdminUser> {
  const { data } = await api.put<AdminUser>(`/admin/users/${id}/ban`, { reason, hideContent });
  return data;
}

export async function unbanUser(id: number): Promise<AdminUser> {
  const { data } = await api.put<AdminUser>(`/admin/users/${id}/unban`);
  return data;
}

export async function suspendUser(id: number, reason: string): Promise<AdminUser> {
  const { data } = await api.put<AdminUser>(`/admin/users/${id}/suspend`, {
    reason,
    hideContent: false,
  });
  return data;
}

export async function promoteToAuthor(id: number): Promise<AdminUser> {
  const { data } = await api.put<AdminUser>(`/admin/users/${id}/promote-author`);
  return data;
}

// ---- Authors ----

export async function fetchAuthors(): Promise<AuthorProfile[]> {
  const { data } = await api.get<AuthorProfile[]>("/admin/authors");
  return data;
}

export async function fetchAuthor(id: number): Promise<AuthorProfile> {
  const { data } = await api.get<AuthorProfile>(`/admin/authors/${id}`);
  return data;
}

export interface AuthorProfileInput {
  bio?: string;
  avatarUrl?: string;
  website?: string;
  twitter?: string;
  linkedin?: string;
}

export async function upsertAuthorProfile(id: number, input: AuthorProfileInput): Promise<AuthorProfile> {
  const { data } = await api.put<AuthorProfile>(`/admin/authors/${id}/profile`, input);
  return data;
}

// ---- Upgrade requests ----

export interface UpgradeRequest {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  message: string | null;
  status: string;
  rejectReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export async function fetchUpgradeRequests(): Promise<UpgradeRequest[]> {
  const { data } = await api.get<UpgradeRequest[]>("/admin/upgrade-requests");
  return data;
}

export async function approveUpgradeRequest(id: number): Promise<void> {
  await api.put(`/admin/upgrade-requests/${id}/approve`);
}

export async function rejectUpgradeRequest(id: number, reason: string): Promise<void> {
  await api.put(`/admin/upgrade-requests/${id}/reject`, { reason });
}

// ---- Site Settings ----

export async function fetchSettings(): Promise<Record<string, string>> {
  const { data } = await api.get<Record<string, string>>("/settings");
  return data;
}

export async function updateSettings(updates: Record<string, string>): Promise<Record<string, string>> {
  const { data } = await api.put<Record<string, string>>("/admin/settings", updates);
  return data;
}

// ---- Media ----

export interface MediaUploadResult {
  url: string;
  filename: string;
}

export async function uploadMedia(file: File): Promise<MediaUploadResult> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<MediaUploadResult>("/media/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteMedia(id: number): Promise<void> {
  await api.delete(`/media/${id}`);
}

// ---- Post Moderation ----

export async function fetchPostsUnderReview(page = 0, size = 20): Promise<Page<Post>> {
  const { data } = await api.get<Page<Post>>("/admin/posts/moderation", { params: { page, size } });
  return data;
}

export async function approvePost(id: number): Promise<Post> {
  const { data } = await api.put<Post>(`/admin/posts/${id}/approve`);
  return data;
}

export async function rejectPost(id: number, reason: string): Promise<Post> {
  const { data } = await api.put<Post>(`/admin/posts/${id}/reject`, { reason });
  return data;
}

export async function submitPostForReview(id: number): Promise<Post> {
  const { data } = await api.put<Post>(`/posts/${id}/submit-for-review`);
  return data;
}

// ---- Comments Moderation ----

export async function fetchAdminComments(search?: string, page = 0, size = 20): Promise<Page<Comment>> {
  const { data } = await api.get<Page<Comment>>("/admin/comments", {
    params: { search: search || undefined, page, size },
  });
  return data;
}

export async function adminDeleteComment(id: number): Promise<void> {
  await api.delete(`/admin/comments/${id}`);
}

// ---- Categories admin ----

export async function createCategory(name: string, description?: string): Promise<Category> {
  const { data } = await api.post<Category>("/categories", { name, description });
  return data;
}

export async function updateCategory(id: number, name: string, description?: string): Promise<Category> {
  const { data } = await api.put<Category>(`/categories/${id}`, { name, description });
  return data;
}

export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/categories/${id}`);
}

// ---- Tags admin ----

export async function adminDeleteTag(id: number): Promise<void> {
  await api.delete(`/tags/${id}`);
}

// re-export Tag so pages can import from one place
export type { Tag };
