import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchPublicAuthors } from "../authorServices";

export default function AuthorsPage() {
  const { data: authors, isLoading } = useQuery({
    queryKey: ["authors"],
    queryFn: fetchPublicAuthors,
  });

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-4">Our Authors</h2>

      {isLoading && <div className="text-muted">Loading authors...</div>}

      <div className="row g-4">
        {authors?.map((a) => (
          <div key={a.id} className="col-md-6 col-lg-4">
            <Link
              to={`/authors/${a.id}`}
              className="text-decoration-none"
            >
              <div className="card h-100 border-0 shadow-sm hover-shadow">
                <div className="card-body d-flex gap-3 align-items-start">
                  {a.avatarUrl ? (
                    <img
                      src={a.avatarUrl}
                      alt={a.name}
                      className="rounded-circle flex-shrink-0"
                      style={{ width: 56, height: 56, objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                      style={{ width: 56, height: 56, fontSize: 22 }}
                    >
                      {(a.name || a.email)[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="fw-semibold text-body">{a.name || a.email}</div>
                    {a.bio && (
                      <p className="text-muted small mb-1 mt-1">
                        {a.bio.length > 100 ? a.bio.slice(0, 100) + "…" : a.bio}
                      </p>
                    )}
                    <span className="small text-muted">{a.postCount} posts</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}

        {authors?.length === 0 && (
          <div className="col-12 text-muted">No authors yet.</div>
        )}
      </div>
    </div>
  );
}
