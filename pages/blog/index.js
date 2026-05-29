import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { formatWorkaHiveDateTime } from "../../lib/date-format";
import { getBlogExcerpt, getBlogPreviewImage } from "../../lib/blog";

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
        <div className="card">
          <p className="muted">No announcements published yet.</p>
        </div>
      ) : (
        <div className="blog-grid">
          {posts.map((post) => {
            const previewImage = getBlogPreviewImage(post);
            const excerpt = getBlogExcerpt(post, 190);

            return (
              <article key={post.id} className="blog-card">
                <div
                  style={{
                    borderRadius: 18,
                    overflow: "hidden",
                    background: "linear-gradient(135deg, #e0ecff 0%, #f8fafc 100%)",
                    height: 200,
                    marginBottom: 16,
                  }}
                >
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt={post.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "rgba(17,24,39,0.55)",
                        fontWeight: 800,
                        fontSize: 18,
                        letterSpacing: "-0.02em",
                        padding: 18,
                        textAlign: "center",
                      }}
                    >
                      {post.title}
                    </div>
                  )}
                </div>

                <p className="muted small" style={{ margin: 0 }}>
                  Posted: {formatWorkaHiveDateTime(post.publishedAt || post.createdAt)}
                </p>
                <p style={{ margin: "6px 0 0", fontSize: 18, fontWeight: 800, color: "var(--text)" }}>
                  {post.title}
                </p>
                <p style={{ margin: "8px 0 0", color: "var(--muted)", lineHeight: 1.7 }}>
                  {excerpt || "Read the full post to see all the details."}
                </p>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
                  <span className="muted small">
                    By <strong style={{ color: "var(--text)", fontSize: 15 }}>{post.author?.name || "Admin"}</strong>
                  </span>
                  <Link href={`/blog/${post.slug}`} className="btn-primary" style={{ display: "inline-flex", alignItems: "center" }}>
                    Read More
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 18 }}>
        <Link href="/" className="btn-soft">
          Back to Jobs
        </Link>
      </div>
    </div>
  );
}
