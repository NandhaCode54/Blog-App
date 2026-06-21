import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { fetchSettings, updateSettings } from "../../adminServices";
import AdminLayout from "../../components/AdminLayout";

const SETTING_META: Record<string, { label: string; description: string; type: "text" | "toggle" | "number" }> = {
  "blog.title":         { label: "Blog Title",           description: "Public name of the blog",              type: "text" },
  "blog.description":   { label: "Blog Description",     description: "Subtitle / tagline shown on the site", type: "text" },
  "blog.logo_url":      { label: "Logo URL",             description: "Full URL of the blog logo image",      type: "text" },
  "registration.open":  { label: "Open Registration",    description: "Allow new users to register",          type: "toggle" },
  "comments.enabled":   { label: "Comments Enabled",     description: "Enable/disable comments site-wide",    type: "toggle" },
  "posts.per_page":     { label: "Posts Per Page",       description: "Default number of posts per page",     type: "number" },
};

export default function AdminSettingsPage() {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  });

  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const doSave = useMutation({
    mutationFn: () => updateSettings(form),
    onSuccess: (data) => {
      toast.success("Settings saved");
      qc.setQueryData(["settings"], data);
    },
    onError: () => toast.error("Failed to save settings"),
  });

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <AdminLayout>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h4 className="fw-bold mb-0">Site Settings</h4>
        <button
          className="btn btn-primary"
          disabled={doSave.isPending || isLoading}
          onClick={() => doSave.mutate()}
        >
          {doSave.isPending ? "Saving…" : "Save changes"}
        </button>
      </div>

      {isLoading && <div className="text-muted">Loading settings…</div>}

      {!isLoading && (
        <div className="row g-4">
          {Object.entries(SETTING_META).map(([key, meta]) => (
            <div key={key} className="col-12 col-md-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <label className="form-label fw-semibold mb-1">{meta.label}</label>
                  <p className="text-muted small mb-2">{meta.description}</p>

                  {meta.type === "toggle" ? (
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id={key}
                        checked={form[key] === "true"}
                        onChange={(e) => set(key, e.target.checked ? "true" : "false")}
                      />
                      <label className="form-check-label" htmlFor={key}>
                        {form[key] === "true" ? "Enabled" : "Disabled"}
                      </label>
                    </div>
                  ) : meta.type === "number" ? (
                    <input
                      type="number"
                      className="form-control"
                      min={1}
                      max={100}
                      value={form[key] ?? ""}
                      onChange={(e) => set(key, e.target.value)}
                    />
                  ) : (
                    <input
                      type="text"
                      className="form-control"
                      value={form[key] ?? ""}
                      onChange={(e) => set(key, e.target.value)}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
