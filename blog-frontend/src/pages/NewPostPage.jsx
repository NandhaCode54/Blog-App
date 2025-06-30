import { useState } from "react";
import api from "../api.js";
import { useNavigate } from "react-router-dom";

export default function NewPostPage() {
  const [title, setTitle]   = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState(null);   // ✅ add error state

  const navigate = useNavigate();               // keep one name

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);                               // clear previous error

    try {
      await api.post("/posts", { title, content });
      console.log("title"+{ title, content }); // log the post data
      navigate("/");                            // go back to list
    } catch (e) {
      console.error(e);
      setErr("Could not save post: " +
             (e.response?.data?.message || e.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="mx-auto" style={{ maxWidth: 600 }}>
        <h1 className="h3 mb-4">Create Post</h1>

        {err && <div className="alert alert-danger">{err}</div>} {/* show error */}

        <form onSubmit={submit}>
          <div className="mb-3">
            <label className="form-label">Title</label>
            <input
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label">Content</label>
            <textarea
              className="form-control"
              style={{ minHeight: 120 }}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            ></textarea>
          </div>

          <button className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Create"}
          </button>
        </form>
      </div>
    </div>
  );
}
