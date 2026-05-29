import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { formatWorkaHiveDateTime } from "../../lib/date-format";

function stripHtml(value) {
  return String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function getCommentAuthor(comment) {
  return comment?.displayName || comment?.user?.name || "Anonymous";
}

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [me, setMe] = useState(null);
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentInputByPost, setCommentInputByPost] = useState({});
  const [replyInputByComment, setReplyInputByComment] = useState({});
  const [busyLikePostId, setBusyLikePostId] = useState(null);

  const loadComments = async (postId) => {
    const res = await fetch(`/api/blog/comments?postId=${postId}`);
    const data = await res.json();
    if (!res.ok) return;
    setCommentsByPost((prev) => ({ ...prev, [postId]: Array.isArray(data.comments) ? data.comments : [] }));
  };

  useEffect(() => {
    const load = async () => {
      const [postsRes, meRes] = await Promise.all([
        fetch("/api/blog"),
        fetch("/api/auth/me", { credentials: "include" }),
      ]);

      const postsData = await postsRes.json();
      if (!postsRes.ok) {
        toast.error(postsData.error || "Failed to load blog");
        return;
      }

      const rows = Array.isArray(postsData.posts) ? postsData.posts : [];
      setPosts(rows);

      const meData = await meRes.json();
      setMe(meData?.user || null);

      await Promise.all(rows.map((post) => loadComments(post.id)));
    };

    load();
  }, []);

  const syncPost = (postId, updater) => {
    setPosts((prev) => prev.map((post) => (post.id === postId ? updater(post) : post)));
  };

  const toggleLike = async (post) => {
    if (!me) {
      toast.error("Please log in to like posts.");
      return;
    }

    setBusyLikePostId(post.id);
    const res = await fetch("/api/blog/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ postId: post.id }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed to update like");
      setBusyLikePostId(null);
      return;
    }

    syncPost(post.id, (item) => ({
      ...item,
      likesCount: Number(data.likesCount ?? item.likesCount ?? 0),
      likedByMe: Boolean(data.likedByMe),
    }));
    setBusyLikePostId(null);
  };

  const submitComment = async (postId) => {
    const body = String(commentInputByPost[postId] || "").trim();
    if (!body) return;

    const res = await fetch("/api/blog/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ postId, body }),
    });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Failed to post comment");
      return;
    }

    setCommentInputByPost((prev) => ({ ...prev, [postId]: "" }));
    await loadComments(postId);
  };

  const submitReply = async (postId, parentId) => {
    const body = String(replyInputByComment[parentId] || "").trim();
    if (!body) return;

    const res = await fetch("/api/blog/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ postId, parentId, body }),
    });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Failed to reply");
      return;
    }

    setReplyInputByComment((prev) => ({ ...prev, [parentId]: "" }));
    await loadComments(postId);
  };

  const deleteComment = async (postId, commentId) => {
    const res = await fetch(`/api/blog/comments?id=${commentId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed to delete comment");
      return;
    }
    await loadComments(postId);
  };

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
            const comments = commentsByPost[post.id] || [];
            const displayContent = post.content || "";
            const authorName = post.author?.name || "Admin";
            const postedAt = formatWorkaHiveDateTime(post.publishedAt || post.createdAt);

            return (
              <article key={post.id} className="blog-card">
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <p className="muted small" style={{ margin: 0 }}>
                      Posted: {postedAt}
                    </p>
                    <p style={{ margin: "6px 0 0", fontSize: 16, fontWeight: 800, color: "var(--text)" }}>
                      By {authorName}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn-soft"
                    onClick={() => toggleLike(post)}
                    disabled={busyLikePostId === post.id}
                    style={{
                      minWidth: 120,
                      justifyContent: "center",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span>{post.likedByMe ? "Unlike" : "Like"}</span>
                    <strong>{Number(post.likesCount || 0)}</strong>
                  </button>
                </div>

                <div className="job-richtext" style={{ marginTop: 14 }} dangerouslySetInnerHTML={{ __html: displayContent }} />

                <div style={{ marginTop: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <h3 style={{ margin: 0 }}>Comments</h3>
                    <span className="muted small">{Number(post.commentsCount || 0)} comment{Number(post.commentsCount || 0) === 1 ? "" : "s"}</span>
                  </div>

                  {comments.length === 0 && <p className="muted small">No comments yet.</p>}

                  {comments.map((comment) => (
                    <div key={comment.id} style={{ borderTop: "1px solid #e5e7eb", paddingTop: 14, marginTop: 14 }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: 15 }}>
                          {getCommentAuthor(comment)}
                          <span className="muted small" style={{ fontWeight: 500, marginLeft: 8 }}>
                            {formatWorkaHiveDateTime(comment.createdAt)}
                          </span>
                        </p>
                        {me?.role === "ADMIN" && (
                          <button type="button" className="btn-soft" onClick={() => deleteComment(post.id, comment.id)}>
                            Delete
                          </button>
                        )}
                      </div>
                      <p style={{ margin: "8px 0 0", lineHeight: 1.7 }}>{comment.body}</p>

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
                          <button type="button" className="btn-primary" onClick={() => submitReply(post.id, comment.id)}>
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
                              <button type="button" className="btn-soft" onClick={() => deleteComment(post.id, reply.id)}>
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}

                  <div
                    style={{
                      marginTop: 16,
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
                      <span className="muted small">Be respectful. Admins may remove inappropriate comments.</span>
                    </div>
                    <textarea
                      value={commentInputByPost[post.id] || ""}
                      onChange={(event) => setCommentInputByPost((prev) => ({ ...prev, [post.id]: event.target.value }))}
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
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
                      <span className="muted small">Anonymous comments are allowed, but logged-in names will be shown when available.</span>
                      <button type="button" className="btn-primary" onClick={() => submitComment(post.id)}>
                        Post Comment
                      </button>
                    </div>
                  </div>
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
