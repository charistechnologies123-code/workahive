import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { formatWorkaHiveDateTime } from "../../lib/date-format";

function stripHtml(value) {
  return String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [me, setMe] = useState(null);
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentInputByPost, setCommentInputByPost] = useState({});
  const [replyInputByComment, setReplyInputByComment] = useState({});

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
        <div className="card"><p className="muted">No announcements published yet.</p></div>
      ) : (
        <div className="blog-grid">
          {posts.map((post) => {
            const comments = commentsByPost[post.id] || [];
            return (
              <article key={post.id} className="blog-card">
                <p className="muted small">
                  Posted: {formatWorkaHiveDateTime(post.publishedAt || post.createdAt)}
                </p>
                <h2>{post.title}</h2>
                <p>{post.excerpt || `${stripHtml(post.content).slice(0, 180)}${stripHtml(post.content).length > 180 ? "..." : ""}`}</p>
                <div className="job-richtext" dangerouslySetInnerHTML={{ __html: post.content || "" }} />
                <p className="muted small">By {post.author?.name || "Admin"}</p>

                <div style={{ marginTop: 14 }}>
                  <h3 style={{ margin: "0 0 10px" }}>Comments</h3>
                  {comments.length === 0 && <p className="muted small">No comments yet.</p>}
                  {comments.map((comment) => (
                    <div key={comment.id} style={{ borderTop: "1px solid #e5e7eb", paddingTop: 10, marginTop: 10 }}>
                      <p style={{ margin: "0 0 4px" }}>
                        <b>{comment.user?.name || "User"}</b> <span className="muted small">({formatWorkaHiveDateTime(comment.createdAt)})</span>
                      </p>
                      <p style={{ margin: 0 }}>{comment.body}</p>
                      {me?.role === "ADMIN" && (
                        <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <input
                            value={replyInputByComment[comment.id] || ""}
                            onChange={(event) => setReplyInputByComment((prev) => ({ ...prev, [comment.id]: event.target.value }))}
                            placeholder="Reply to comment"
                          />
                          <button type="button" className="btn-soft" onClick={() => submitReply(post.id, comment.id)}>Reply</button>
                          <button type="button" className="btn-soft" onClick={() => deleteComment(post.id, comment.id)}>Delete</button>
                        </div>
                      )}

                      {(comment.replies || []).map((reply) => (
                        <div key={reply.id} style={{ marginTop: 8, marginLeft: 12, paddingLeft: 10, borderLeft: "2px solid #e5e7eb" }}>
                          <p style={{ margin: "0 0 4px" }}>
                            <b>{reply.user?.name || "Admin"}</b> <span className="muted small">({formatWorkaHiveDateTime(reply.createdAt)})</span>
                          </p>
                          <p style={{ margin: 0 }}>{reply.body}</p>
                          {me?.role === "ADMIN" && (
                            <div style={{ marginTop: 6 }}>
                              <button type="button" className="btn-soft" onClick={() => deleteComment(post.id, reply.id)}>Delete</button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}

                  {me ? (
                    <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                      <input
                        value={commentInputByPost[post.id] || ""}
                        onChange={(event) => setCommentInputByPost((prev) => ({ ...prev, [post.id]: event.target.value }))}
                        placeholder="Write a comment"
                      />
                      <button type="button" className="btn-primary" onClick={() => submitComment(post.id)}>Post</button>
                    </div>
                  ) : (
                    <p className="muted small">Login to post a comment.</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 18 }}>
        <Link href="/" className="btn-soft">Back to Jobs</Link>
      </div>
    </div>
  );
}
