import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import toast from "react-hot-toast";
import { formatWorkaHiveDateTime } from "../../lib/date-format";
import { getBlogExcerpt, getBlogPreviewImage } from "../../lib/blog";

function getCommentAuthor(comment) {
  return comment?.displayName || comment?.user?.name || "Anonymous";
}

export default function BlogPostPage() {
  const router = useRouter();
  const slug = String(router.query.slug || "");
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentBody, setCommentBody] = useState("");
  const [replyInputByComment, setReplyInputByComment] = useState({});
  const [busyLike, setBusyLike] = useState(false);

  const loadComments = async (postId) => {
    const res = await fetch(`/api/blog/comments?postId=${postId}`);
    const data = await res.json();
    if (!res.ok) return;
    setComments(Array.isArray(data.comments) ? data.comments : []);
  };

  useEffect(() => {
    const load = async () => {
      if (!router.isReady) return;
      setLoading(true);

      const [postsRes, meRes] = await Promise.all([
        fetch("/api/blog"),
        fetch("/api/auth/me", { credentials: "include" }),
      ]);

      const postsData = await postsRes.json();
      if (!postsRes.ok) {
        toast.error(postsData.error || "Failed to load blog");
        return;
      }

      const found = (Array.isArray(postsData.posts) ? postsData.posts : []).find((item) => item.slug === slug);
      setPost(found || null);

      const meData = await meRes.json();
      setMe(meData?.user || null);

      if (found) {
        await loadComments(found.id);
      }
      setLoading(false);
    };

    load();
  }, [router.isReady, slug]);

  const toggleLike = async () => {
    if (!post) return;
    if (!me) {
      toast.error("Please log in to like posts.");
      return;
    }

    setBusyLike(true);
    const res = await fetch("/api/blog/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ postId: post.id }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed to update like");
      setBusyLike(false);
      return;
    }

    setPost((prev) =>
      prev
        ? {
            ...prev,
            likesCount: Number(data.likesCount ?? prev.likesCount ?? 0),
            likedByMe: Boolean(data.likedByMe),
          }
        : prev
    );
    setBusyLike(false);
  };

  const submitComment = async () => {
    if (!post) return;
    const body = String(commentBody || "").trim();
    if (!body) return;

    const res = await fetch("/api/blog/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ postId: post.id, body }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed to post comment");
      return;
    }

    setCommentBody("");
    await loadComments(post.id);
  };

  const submitReply = async (parentId) => {
    if (!post) return;
    const body = String(replyInputByComment[parentId] || "").trim();
    if (!body) return;

    const res = await fetch("/api/blog/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ postId: post.id, parentId, body }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed to reply");
      return;
    }

    setReplyInputByComment((prev) => ({ ...prev, [parentId]: "" }));
    await loadComments(post.id);
  };

  const deleteComment = async (commentId) => {
    if (!post) return;
    const res = await fetch(`/api/blog/comments?id=${commentId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed to delete comment");
      return;
    }
    await loadComments(post.id);
  };

  if (loading) {
    return (
      <div className="page">
        <div className="card">
          <p className="muted">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="page">
        <div className="card">
          <p className="muted">Blog post not found.</p>
          <div style={{ marginTop: 12 }}>
            <Link href="/blog" className="btn-soft">
              Back to Blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const previewImage = getBlogPreviewImage(post);
  const fallbackExcerpt = getBlogExcerpt(post, 220);
  const postedAt = formatWorkaHiveDateTime(post.publishedAt || post.createdAt);

  return (
    <div className="page">
      <div style={{ marginBottom: 18 }}>
        <Link href="/blog" className="btn-soft">
          Back to Blog
        </Link>
      </div>

      <article className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            height: 320,
            background: "linear-gradient(135deg, #e0ecff 0%, #f8fafc 100%)",
          }}
        >
          {previewImage ? (
            <img
              src={previewImage}
              alt={post.title}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "rgba(17,24,39,0.55)", padding: 24, textAlign: "center" }}>
              {post.title}
            </div>
          )}
        </div>

        <div style={{ padding: 22 }}>
          <p className="muted small" style={{ margin: 0 }}>
            Posted: {postedAt}
          </p>
          <h1 style={{ margin: "6px 0 0", fontSize: 30, lineHeight: 1.2 }}>{post.title}</h1>
          <p style={{ margin: "10px 0 0", fontSize: 16, fontWeight: 800, color: "var(--text)" }}>
            By {post.author?.name || "Admin"}
          </p>
          <p style={{ margin: "12px 0 0", color: "var(--muted)", lineHeight: 1.75 }}>
            {post.excerpt || fallbackExcerpt}
          </p>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <button
              type="button"
              className="btn-soft"
              onClick={toggleLike}
              disabled={busyLike}
              style={{ minWidth: 130, display: "inline-flex", justifyContent: "center", gap: 8 }}
            >
              <span>{post.likedByMe ? "Unlike" : "Like"}</span>
              <strong>{Number(post.likesCount || 0)}</strong>
            </button>
          </div>

          <div className="job-richtext" style={{ marginTop: 24 }} dangerouslySetInnerHTML={{ __html: post.content || "" }} />

          <div style={{ marginTop: 26 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <h3 style={{ margin: 0 }}>Comments</h3>
              <span className="muted small">{comments.length} comment{comments.length === 1 ? "" : "s"}</span>
            </div>

            {comments.length === 0 ? (
              <p className="muted small">No comments yet.</p>
            ) : (
              <div style={{ display: "grid", gap: 14, marginTop: 12 }}>
                {comments.map((comment) => (
                  <div key={comment.id} style={{ borderTop: "1px solid #e5e7eb", paddingTop: 14 }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <p style={{ margin: 0, fontWeight: 800, fontSize: 15 }}>
                        {getCommentAuthor(comment)}
                        <span className="muted small" style={{ fontWeight: 500, marginLeft: 8 }}>
                          {formatWorkaHiveDateTime(comment.createdAt)}
                        </span>
                      </p>
                      {me?.role === "ADMIN" && (
                        <button type="button" className="btn-soft" onClick={() => deleteComment(comment.id)}>
                          Delete
                        </button>
                      )}
                    </div>
                    <p style={{ margin: "8px 0 0", lineHeight: 1.75 }}>{comment.body}</p>

                    {me?.role === "ADMIN" && (
                      <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <input
                          value={replyInputByComment[comment.id] || ""}
                          onChange={(event) =>
                            setReplyInputByComment((prev) => ({ ...prev, [comment.id]: event.target.value }))
                          }
                          placeholder="Reply as admin"
                          style={{
                            flex: "1 1 240px",
                            minWidth: 0,
                            border: "1px solid #d1d5db",
                            borderRadius: 12,
                            padding: "10px 12px",
                            background: "#fff",
                          }}
                        />
                        <button type="button" className="btn-primary" onClick={() => submitReply(comment.id)}>
                          Reply
                        </button>
                      </div>
                    )}

                    {(comment.replies || []).map((reply) => (
                      <div
                        key={reply.id}
                        style={{
                          marginTop: 10,
                          marginLeft: 16,
                          paddingLeft: 12,
                          borderLeft: "2px solid #e5e7eb",
                        }}
                      >
                        <p style={{ margin: 0, fontWeight: 800, fontSize: 14 }}>
                          {getCommentAuthor(reply)}
                          <span className="muted small" style={{ fontWeight: 500, marginLeft: 8 }}>
                            {formatWorkaHiveDateTime(reply.createdAt)}
                          </span>
                        </p>
                        <p style={{ margin: "6px 0 0", lineHeight: 1.65 }}>{reply.body}</p>
                        {me?.role === "ADMIN" && (
                          <div style={{ marginTop: 6 }}>
                            <button type="button" className="btn-soft" onClick={() => deleteComment(reply.id)}>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                marginTop: 18,
                padding: 16,
                borderRadius: 16,
                border: "1px solid #e5e7eb",
                background: "#f8fafc",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
                <p style={{ margin: 0, fontWeight: 800, color: "var(--text)" }}>
                  Posting as{" "}
                  <span style={{ fontSize: 15 }}>
                    {me?.name || "Anonymous"}
                  </span>
                </p>
                <span className="muted small">Logged-in names show automatically. Guests post as Anonymous.</span>
              </div>

              <textarea
                value={commentBody}
                onChange={(event) => setCommentBody(event.target.value)}
                placeholder={me?.name ? `Write a comment as ${me.name}` : "Write a comment as Anonymous"}
                rows={4}
                style={{
                  width: "100%",
                  resize: "vertical",
                  borderRadius: 14,
                  border: "1px solid #d1d5db",
                  padding: "12px 14px",
                  background: "#fff",
                  color: "var(--text)",
                  fontSize: 14,
                  outline: "none",
                  minHeight: 110,
                }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                <button type="button" className="btn-primary" onClick={submitComment}>
                  Post Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
