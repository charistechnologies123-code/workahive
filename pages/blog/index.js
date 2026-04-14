import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

function stripHtml(value) {
  return String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export default function BlogPage() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/blog");
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load blog");
        return;
      }
      setPosts(Array.isArray(data.posts) ? data.posts : []);
    };

    load();
  }, []);

  return (
    <div className="page">
      <div className="page-head">
        <h1>Announcements</h1>
        <p className="muted">Promotions, updates, and special opportunities from WorkaHive.</p>
      </div>

      {posts.length === 0 ? (
        <div className="card"><p className="muted">No announcements published yet.</p></div>
      ) : (
        <div className="blog-grid">
          {posts.map((post) => (
            <article key={post.id} className="blog-card">
              <p className="muted small">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ""}</p>
              <h2>{post.title}</h2>
              <p>{post.excerpt || `${stripHtml(post.content).slice(0, 180)}${stripHtml(post.content).length > 180 ? "..." : ""}`}</p>
              <div className="job-richtext" dangerouslySetInnerHTML={{ __html: post.content || "" }} />
              <p className="muted small">By {post.author?.name || "Admin"}</p>
            </article>
          ))}
        </div>
      )}

      <div style={{ marginTop: 18 }}>
        <Link href="/" className="btn-soft">Back to Jobs</Link>
      </div>
    </div>
  );
}
