import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import MDEditor from "@uiw/react-md-editor";
import { createPost, fetchCategories, fetchPost, updatePost, type PostInput } from "../services";
import { apiErrorMessage } from "../api";
import MediaUpload from "../components/MediaUpload";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title is too long"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().max(500, "Excerpt is too long").optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  categoryId: z.string().optional(),
  tags: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewPostPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const postId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [coverImageUrl, setCoverImageUrl] = useState("");

  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const postQuery = useQuery({
    queryKey: ["post", postId],
    queryFn: () => fetchPost(postId),
    enabled: isEdit && Number.isFinite(postId),
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: "PUBLISHED" },
  });

  useEffect(() => {
    if (isEdit && postQuery.data) {
      const p = postQuery.data;
      reset({
        title: p.title,
        content: p.content,
        excerpt: p.excerpt ?? "",
        status: (p.status === "PUBLISHED" || p.status === "DRAFT") ? p.status : "DRAFT",
        categoryId: p.categoryId ? String(p.categoryId) : "",
        tags: p.tags.join(", "),
      });
      setCoverImageUrl(p.coverImageUrl ?? "");
    }
  }, [isEdit, postQuery.data, reset]);

  const toInput = (values: FormValues): PostInput => ({
    title: values.title,
    content: values.content,
    excerpt: values.excerpt || undefined,
    status: values.status,
    categoryId: values.categoryId ? Number(values.categoryId) : null,
    tags: values.tags ? values.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    coverImageUrl: coverImageUrl || null,
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      isEdit ? updatePost(postId, toInput(values)) : createPost(toInput(values)),
    onSuccess: (post) => {
      toast.success(isEdit ? "Post updated" : "Post created");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", post.id] });
      navigate(`/posts/${post.id}`);
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Could not save post")),
  });

  if (isEdit && postQuery.isLoading) {
    return <div className="container py-5"><p className="text-muted">Loading…</p></div>;
  }

  return (
    <div className="container py-4" style={{ maxWidth: 800 }}>
      <h1 className="h3 mb-4">{isEdit ? "Edit Post" : "Create Post"}</h1>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
        {/* Title */}
        <div className="mb-3">
          <label className="form-label">Title</label>
          <input className={`form-control ${errors.title ? "is-invalid" : ""}`} {...register("title")} />
          {errors.title && <div className="invalid-feedback">{errors.title.message}</div>}
        </div>

        {/* Category / Status row */}
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label className="form-label">Category</label>
            <select className="form-select" {...register("categoryId")}>
              <option value="">— None —</option>
              {categoriesQuery.data?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Status</label>
            <select className="form-select" {...register("status")}>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>
        </div>

        {/* Tags */}
        <div className="mb-3">
          <label className="form-label">Tags <span className="text-muted small">(comma-separated)</span></label>
          <input className="form-control" placeholder="java, spring, react" {...register("tags")} />
        </div>

        {/* Cover image */}
        <div className="mb-3">
          <MediaUpload
            label="Cover Image"
            hint="Shown at the top of the post and in listing cards"
            value={coverImageUrl}
            onChange={setCoverImageUrl}
          />
        </div>

        {/* Excerpt */}
        <div className="mb-3">
          <label className="form-label">Excerpt <span className="text-muted small">(optional — auto-generated if blank)</span></label>
          <textarea
            className={`form-control ${errors.excerpt ? "is-invalid" : ""}`}
            rows={2}
            placeholder="Short summary shown in listings…"
            {...register("excerpt")}
          />
          {errors.excerpt && <div className="invalid-feedback">{errors.excerpt.message}</div>}
        </div>

        {/* Markdown content editor */}
        <div className="mb-4">
          <label className="form-label">Content</label>
          {errors.content && (
            <div className="text-danger small mb-1">{errors.content.message}</div>
          )}
          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <div data-color-mode="light">
                <MDEditor
                  value={field.value}
                  onChange={(val) => field.onChange(val ?? "")}
                  height={400}
                  preview="edit"
                />
              </div>
            )}
          />
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-primary" disabled={isSubmitting || mutation.isPending}>
            {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create"}
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
