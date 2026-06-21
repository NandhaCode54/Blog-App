import { useQuery } from "@tanstack/react-query";
import { fetchAdminStats } from "../../adminServices";
import AdminLayout from "../../components/AdminLayout";

function StatCard({ label, value, variant }: { label: string; value: number; variant: string }) {
  return (
    <div className={`card text-bg-${variant} h-100`}>
      <div className="card-body">
        <div className="fs-2 fw-bold">{value.toLocaleString()}</div>
        <div className="small mt-1 opacity-75">{label}</div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: fetchAdminStats,
  });

  return (
    <AdminLayout>
      <h4 className="mb-4 fw-bold">Dashboard</h4>

      {isLoading && <div className="text-muted">Loading stats...</div>}
      {error && <div className="alert alert-danger">Failed to load stats.</div>}

      {stats && (
        <>
          <h6 className="text-muted mb-3">Users</h6>
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-3">
              <StatCard label="Total Users" value={stats.totalUsers} variant="primary" />
            </div>
            <div className="col-6 col-md-3">
              <StatCard label="Authors" value={stats.totalAuthors} variant="success" />
            </div>
            <div className="col-6 col-md-3">
              <StatCard label="Admins" value={stats.totalAdmins} variant="warning" />
            </div>
            <div className="col-6 col-md-3">
              <StatCard label="Banned" value={stats.bannedUsers} variant="danger" />
            </div>
          </div>

          <h6 className="text-muted mb-3">Content</h6>
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-3">
              <StatCard label="Total Posts" value={stats.totalPosts} variant="dark" />
            </div>
            <div className="col-6 col-md-3">
              <StatCard label="Published" value={stats.publishedPosts} variant="success" />
            </div>
            <div className="col-6 col-md-3">
              <StatCard label="Drafts" value={stats.draftPosts} variant="secondary" />
            </div>
            <div className="col-6 col-md-3">
              <StatCard label="Comments" value={stats.totalComments} variant="info" />
            </div>
          </div>

          <h6 className="text-muted mb-3">Taxonomy</h6>
          <div className="row g-3">
            <div className="col-6 col-md-3">
              <StatCard label="Categories" value={stats.totalCategories} variant="primary" />
            </div>
            <div className="col-6 col-md-3">
              <StatCard label="Tags" value={stats.totalTags} variant="secondary" />
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
