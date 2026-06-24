import api from "./api";
import type { AuthorDashboardStats, Page, Post, PublicAuthor, UpgradeRequestStatus } from "./types";

// ---- Public ----

export async function fetchPublicAuthors(): Promise<PublicAuthor[]> {
  const { data } = await api.get<PublicAuthor[]>("/authors");
  return data;
}

export async function fetchPublicAuthor(id: number): Promise<PublicAuthor> {
  const { data } = await api.get<PublicAuthor>(`/authors/${id}`);
  return data;
}

export async function fetchAuthorPosts(
  authorId: number,
  page = 0,
  size = 10
): Promise<Page<Post>> {
  const { data } = await api.get<Page<Post>>(`/authors/${authorId}/posts`, {
    params: { page, size },
  });
  return data;
}

// ---- Authenticated author ----

export async function fetchMyStats(): Promise<AuthorDashboardStats> {
  const { data } = await api.get<AuthorDashboardStats>("/author/me/stats");
  return data;
}

export async function fetchMyPosts(
  status?: string,
  page = 0,
  size = 10
): Promise<Page<Post>> {
  const { data } = await api.get<Page<Post>>("/author/me/posts", {
    params: { status: status || undefined, page, size },
  });
  return data;
}

export async function requestAuthorUpgrade(message?: string): Promise<void> {
  await api.post("/author/request-upgrade", { message });
}

export async function fetchUpgradeStatus(): Promise<UpgradeRequestStatus> {
  const { data } = await api.get<{ status: UpgradeRequestStatus }>(
    "/author/request-upgrade/status"
  );
  return data.status;
}

// ---- Profile self-edit ----

export interface ProfileInput {
  bio?: string;
  avatarUrl?: string;
  website?: string;
  twitter?: string;
  linkedin?: string;
}

export async function fetchMyProfile(): Promise<PublicAuthor> {
  const { data } = await api.get<PublicAuthor>("/author/me/profile");
  return data;
}

export async function updateMyProfile(input: ProfileInput): Promise<PublicAuthor> {
  const { data } = await api.put<PublicAuthor>("/author/me/profile", input);
  return data;
}
