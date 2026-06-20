import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  createComment,
  deleteComment,
  fetchComments,
  fetchPost,
} from "../services";
import { apiErrorMessage } from "../api";
import { useAuth } from "../context/AuthContext";

export default function PostDetailPage() {
  const { id } = useParams();
  const postId = Number(id);
  const { user, isAuthenticated, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");

  const postQuery = useQuery({
    queryKey: ["post", postId],
    queryFn: () => fetchPost(postId),
    enabled: Number.isFinite(postId),
  });

  const commentsQuery = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => fetchComments(postId),
    enabled: Number.isFinite(postId),
  });

  const addComment = useMutation({
    mutationFn: (content: string) => createComment(postId, content),
    onSuccess: () => {
      setComment("");
      toast.success("Comment added");
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Could not add comment")),
  });

  const removeComment = useMutation({
    mutationFn: (commentId: number) => deleteComment(commentId),
    onSuccess: () => {
      toast.success("Comment deleted");
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Could not delete comment")),
  });

  if (postQuery.isLoading) {
    return <div className="container py-5"><p className="text-muted">Loading…</p></div>;
  }
  if (postQuery.isError || !postQuery.data) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{apiErrorMessage(postQuery.error, "Post not found")}</div>
        <Link to="/" className="btn btn-outline-secondary">← Back to posts</Link>
      </div>
    );
  }

  const post = postQuery.data;

  return (
    <div className="container py-4" style={{ maxWidth: 760 }}>
      <Link to="/" className="btn btn-sm btn-outline-secondary mb-3">← Back</Link>

      <article>
        <div className="d-flex gap-2 mb-2 flex-wrap">
          {post.categoryName && <span className="badge text-bg-info">{post.categoryName}</span>}
          <span className="badge text-bg-light border">{post.readingTime} min read</span>
          {post.status === "DRAFT" && <span className="badge text-bg-warning">Draft</span>}
        </div>
        <h1 className="mb-2">{post.title}</h1>
        <p className="text-muted small">
          By {post.authorName} · {new Date(post.createdAt).toLocaleDateString()}
          {post.updatedAt && <> · edited {new Date(post.updatedAt).toLocaleDateString()}</>}
        </p>

        <div className="d-flex flex-wrap gap-1 mb-4">
          {post.tags.map((t) => (
            <span key={t} className="badge rounded-pill text-bg-secondary">#{t}</span>
          ))}
        </div>

        <div style={{ whiteSpace: "pre-wrap" }} className="fs-5 lh-base">
          {post.content}
        </div>
      </article>

      <hr className="my-5" />

      {/* Comments */}
      <section>
        <h2 className="h5 mb-3">
          Comments {commentsQuery.data ? `(${commentsQuery.data.length})` : ""}
        </h2>

        {isAuthenticated ? (
          <form
            className="mb-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (comment.trim()) addComment.mutate(comment.trim());
            }}
          >
            <textarea
              className="form-control mb-2"
              rows={3}
              placeholder="Share your thoughts…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button className="btn btn-primary btn-sm" disabled={addComment.isPending || !comment.trim()}>
              {addComment.isPending ? "Posting…" : "Post comment"}
            </button>
          </form>
        ) : (
          <p className="text-muted">
            <Link to="/login">Log in</Link> to join the conversation.
          </p>
        )}

        {commentsQuery.isLoading ? (
          <p className="text-muted">Loading comments…</p>
        ) : commentsQuery.data && commentsQuery.data.length > 0 ? (
          <ul className="list-group">
            {commentsQuery.data.map((c) => (
              <li key={c.id} className="list-group-item">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <strong>{c.authorName}</strong>
                    <span className="text-muted small ms-2">
                      {new Date(c.createdAt).toLocaleString()}
                    </span>
                    <p className="mb-0 mt-1">{c.content}</p>
                  </div>
                  {user && (user.id === c.authorId || isAdmin) && (
                    <button
                      className="btn btn-sm btn-link text-danger"
                      disabled={removeComment.isPending}
                      onClick={() => removeComment.mutate(c.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">No comments yet. Be the first!</p>
        )}
      </section>
    </div>
  );
}
