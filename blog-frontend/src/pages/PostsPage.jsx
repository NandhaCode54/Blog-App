import { useEffect, useState } from 'react';
import api from '../api.js';
import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthCtx } from '../context/AuthContext.jsx';

export default function PostsPage() {
  const [posts, set] = useState([]);
  const { token } = useContext(AuthCtx);

  useEffect(() => {
    api.get('/posts').then(r => set(r.data));
  }, []);

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Blog Posts</h1>
        {token && (
          <Link to="/new" className="btn btn-sm btn-success">
            + New Post
          </Link>
        )}
      </div>

      {posts.length === 0 ? (
        <p className="text-muted">No posts yet.</p>
      ) : (
        <div className="row g-4">
          {posts.map(p => (
            <div className="col-md-6" key={p.id}>
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">{p.title}</h5>
                  <p className="card-text">{p.content}</p>
                </div>
                <div className="card-footer small text-muted">
                  {new Date(p.createdAt ?? Date.now()).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
