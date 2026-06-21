import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { uploadMedia } from "../adminServices";

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
}

export default function MediaUpload({ value, onChange, label = "Image", hint }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadMedia(file);
      onChange(result.url);
      toast.success("Image uploaded");
    } catch {
      toast.error("Upload failed — max 5 MB, images only");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      {label && <label className="form-label">{label}</label>}
      {hint && <div className="text-muted small mb-2">{hint}</div>}

      {value && (
        <div className="mb-2 position-relative d-inline-block">
          <img
            src={value}
            alt="preview"
            className="rounded"
            style={{ maxHeight: 120, maxWidth: 240, objectFit: "cover", display: "block" }}
          />
          <button
            type="button"
            className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 p-0 lh-1"
            style={{ width: 22, height: 22, fontSize: 14 }}
            onClick={() => onChange("")}
            title="Remove"
          >
            &times;
          </button>
        </div>
      )}

      <div className="d-flex gap-2 align-items-center">
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="Paste image URL or upload below"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary text-nowrap"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <span className="spinner-border spinner-border-sm" />
          ) : (
            "Upload"
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="d-none"
          onChange={handleFile}
        />
      </div>
    </div>
  );
}
