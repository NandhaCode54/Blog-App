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

// ---- Public author types ----

export interface PublicAuthor {
  id: number;
  name: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  website: string | null;
  twitter: string | null;
  linkedin: string | null;
  postCount: number;
}

export interface AuthorDashboardStats {
  publishedPosts: number;
  draftPosts: number;
  totalComments: number;
}

export type UpgradeRequestStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

// ---- Admin types ----

export type UserStatus = "ACTIVE" | "SUSPENDED" | "BANNED";

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  bannedAt: string | null;
  banReason: string | null;
  hideContent: boolean;
  postCount: number;
}

export interface AuthorProfile {
  userId: number;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  bio: string | null;
  avatarUrl: string | null;
  website: string | null;
  twitter: string | null;
  linkedin: string | null;
  postCount: number;
}

export interface AdminStats {
  totalUsers: number;
  totalAuthors: number;
  totalAdmins: number;
  bannedUsers: number;
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalComments: number;
  totalCategories: number;
  totalTags: number;
}
