import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import RichTextEditor from "../../components/RichTextEditor";
import { useConfirmDialog } from "../../components/ConfirmDialog";
import { formatWorkaHiveDateTime } from "../../lib/date-format";

const emptyForm = {
  id: null,
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  status: "PUBLISHED",
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [commentsByPost, setCommentsByPost] = useState({});
  const [loadingCommentsForPost, setLoadingCommentsForPost] = useState(null);
  const { confirm, dialog } = useConfirmDialog();

  const load = async () => {
    const res = await fetch("/api/blog?includeDrafts=true", { credentials: "include" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed to load blog posts");
      return;
    }
    setPosts(Array.isArray(data.posts) ? data.posts : []);
  };

  useEffect(() => {
    load();
  }, []);

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("postId", form.id || "draft");

    const res = await fetch("/api/admin/blog-upload", {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed to upload image");
      return null;
    }
    toast.success("Image uploaded.");
    return data.imageUrl;
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);

    const endpoint = form.id ? `/api/blog/${form.id}` : "/api/blog";
    const method = form.id ? "PATCH" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt,
        content: form.content,
        published: form.status === "PUBLISHED",
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Failed to save post");
      setSaving(false);
      return;
    }

    toast.success(form.id ? "Post updated." : "Post created.");
    setForm(emptyForm);
    setSaving(false);
    load();
  };

  const deletePost = (post) => {
    confirm({
      title: "Delete announcement",
      message: `Delete "${post.title}"?`,
      confirmText: "Delete",
      onConfirm: async () => {
        const res = await fetch(`/api/blog/${post.id}`, {
          method: "DELETE",
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to delete post");
          return;
        }
        toast.success("Post deleted.");
        if (form.id === post.id) setForm(emptyForm);
        load();
      },
    });
  };

  const loadComments = async (postId) => {
    setLoadingCommentsForPost(postId);
    const res = await fetch(`/api/blog/comments?postId=${postId}`, { credentials: "include" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed to load comments");
      setLoadingCommentsForPost(null);
      return;
    }
    setCommentsByPost((prev) => ({
      ...prev,
      [postId]: Array.isArray(data.comments) ? data.comments : [],
    }));
    setLoadingCommentsForPost(null);
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
    toast.success("Comment deleted.");
    await loadComments(postId);
  };

  return (
    <div className="page">
      <div className="page-head">
        <h1>Admin Blog</h1>
        <p className="muted">Create promotions and announcements. Draft posts stay hidden from the public blog page.</p>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>{form.id ? "Edit announcement" : "New announcement"}</h2>
        </div>

        <form className="form" onSubmit={save}>
          <div className="field">
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Slug</label>
              <input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} placeholder="optional-custom-slug" />
            </div>
            <div className="field">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Excerpt</label>
            <textarea rows={3} value={form.excerpt} onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))} />
          </div>
          <div className="field">
            <label>Content</label>
            <RichTextEditor
              value={form.content}
              onChange={(value) => setForm((p) => ({ ...p, content: value }))}
              placeholder="Write the blog post content here..."
              onImageUpload={uploadImage}
            />
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save announcement"}</button>
            <button type="button" className="btn-soft" onClick={() => setForm(emptyForm)}>Clear</button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Existing announcements</h2>
        </div>

        {posts.length === 0 ? (
          <p className="muted">No announcements yet.</p>
        ) : (
          <div className="job-list">
            {posts.map((post) => (
              <div key={post.id} className="job-item">
                <div>
                  <p className="job-title">{post.title}</p>
                  <p className="muted small">
                    {post.published ? "Published" : "Draft"} • {post.slug}
                  </p>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Posted: <b>{formatWorkaHiveDateTime(post.publishedAt || post.createdAt)}</b>
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn-soft"
                    onClick={() =>
                      setForm({
                        id: post.id,
                        title: post.title || "",
                        slug: post.slug || "",
                        excerpt: post.excerpt || "",
                        content: post.content || "",
                        status: post.published ? "PUBLISHED" : "DRAFT",
                      })
                    }
                  >
                    Edit
                  </button>
                  <button type="button" className="btn-danger" onClick={() => deletePost(post)}>
                    Delete
                  </button>
                  <button
                    type="button"
                    className="btn-soft"
                    onClick={() => loadComments(post.id)}
                    disabled={loadingCommentsForPost === post.id}
                  >
                    {loadingCommentsForPost === post.id
                      ? "Loading comments..."
                      : `View comments (${Number(post._count?.comments || 0)})`}
                  </button>
                </div>

                {Array.isArray(commentsByPost[post.id]) && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #e5e7eb" }}>
                    {commentsByPost[post.id].length === 0 ? (
                      <p className="muted small" style={{ margin: 0 }}>
                        No comments for this post yet.
                      </p>
                    ) : (
                      <div style={{ display: "grid", gap: 12 }}>
                        {commentsByPost[post.id].map((comment) => (
                          <div key={comment.id} style={{ padding: 12, borderRadius: 14, border: "1px solid #e5e7eb", background: "#fafafa" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                              <p style={{ margin: 0, fontWeight: 800 }}>
                                {String(comment.displayName || "").trim().toLowerCase() !== "anonymous" && comment.displayName
                                  ? comment.displayName
                                  : comment.user?.name || "Anonymous"}
                              </p>
                              <button
                                type="button"
                                className="btn-soft"
                                onClick={() => deleteComment(post.id, comment.id)}
                              >
                                Delete
                              </button>
                            </div>
                            <p className="muted small" style={{ margin: "4px 0 8px" }}>
                              {formatWorkaHiveDateTime(comment.createdAt)}
                            </p>
                            <p style={{ margin: 0 }}>{comment.body}</p>
                            {Array.isArray(comment.replies) && comment.replies.length > 0 && (
                              <div style={{ marginTop: 10, paddingLeft: 12, borderLeft: "2px solid #e5e7eb" }}>
                                {comment.replies.map((reply) => (
                                  <div key={reply.id} style={{ marginTop: 8 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                                      <p style={{ margin: 0, fontWeight: 800, fontSize: 14 }}>
                                        {String(reply.displayName || "").trim().toLowerCase() !== "anonymous" && reply.displayName
                                          ? reply.displayName
                                          : reply.user?.name || "Admin"}
                                      </p>
                                      <button
                                        type="button"
                                        className="btn-soft"
                                        onClick={() => deleteComment(post.id, reply.id)}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                    <p className="muted small" style={{ margin: "4px 0 0" }}>
                                      {formatWorkaHiveDateTime(reply.createdAt)}
                                    </p>
                                    <p style={{ margin: "4px 0 0" }}>{reply.body}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {dialog}
    </div>
  );
}

