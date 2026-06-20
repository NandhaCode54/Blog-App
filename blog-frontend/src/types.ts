export type Role = "USER" | "AUTHOR" | "ADMIN";

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
}

export interface AuthResponse extends User {
  accessToken: string;
  refreshToken: string;
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export type PostStatus = "DRAFT" | "PUBLISHED";

export interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  status: PostStatus;
  readingTime: number;
  authorId: number;
  authorName: string;
  authorEmail: string;
  categoryId: number | null;
  categoryName: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface Comment {
  id: number;
  postId: number;
  content: string;
  authorId: number;
  authorName: string;
  createdAt: string;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors?: Record<string, string> | null;
}
