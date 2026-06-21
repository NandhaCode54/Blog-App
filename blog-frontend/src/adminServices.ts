import api from "./api";
import type { AdminStats, AdminUser, AuthorProfile, Page, Role } from "./types";

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
