import api from "./api";
import type { Category, Comment, Page, Post, Tag } from "./types";

export interface PostQuery {
  q?: string;
  category?: number | null;
  tag?: string | null;
  page?: number;
  size?: number;
  sort?: string;
}

export interface PostInput {
  title: string;
  content: string;
  excerpt?: string;
  status?: "DRAFT" | "PUBLISHED";
  categoryId?: number | null;
  tags?: string[];
  coverImageUrl?: string | null;
}

export async function fetchPosts(params: PostQuery): Promise<Page<Post>> {
  const { data } = await api.get<Page<Post>>("/posts", {
    params: {
      q: params.q || undefined,
      category: params.category || undefined,
      tag: params.tag || undefined,
      page: params.page ?? 0,
      size: params.size ?? 9,
      sort: params.sort || "createdAt,desc",
    },
  });
  return data;
}

export async function fetchPost(id: number): Promise<Post> {
  const { data } = await api.get<Post>(`/posts/${id}`);
  return data;
}

export async function createPost(input: PostInput): Promise<Post> {
  const { data } = await api.post<Post>("/posts", input);
  return data;
}

export async function updatePost(id: number, input: PostInput): Promise<Post> {
  const { data } = await api.put<Post>(`/posts/${id}`, input);
  return data;
}

export async function deletePost(id: number): Promise<void> {
  await api.delete(`/posts/${id}`);
}

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await api.get<Category[]>("/categories");
  return data;
}

export async function fetchTags(): Promise<Tag[]> {
  const { data } = await api.get<Tag[]>("/tags");
  return data;
}

export async function fetchComments(postId: number): Promise<Comment[]> {
  const { data } = await api.get<Comment[]>(`/posts/${postId}/comments`);
  return data;
}

export async function createComment(postId: number, content: string): Promise<Comment> {
  const { data } = await api.post<Comment>(`/posts/${postId}/comments`, { content });
  return data;
}

export async function deleteComment(commentId: number): Promise<void> {
  await api.delete(`/comments/${commentId}`);
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post("/auth/forgot-password", { email });
}

export async function resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
  await api.post("/auth/reset-password", { email, otp, newPassword });
}
