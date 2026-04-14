import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useConfirmDialog } from "../../components/ConfirmDialog";

export default function AdminTokenPlans() {
  const { user } = useAuth();
  const { confirm, dialog } = useConfirmDialog();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states
  const [newTokens, setNewTokens] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit states
  const [editingId, setEditingId] = useState(null);
  const [editTokens, setEditTokens] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 3000);
  };

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(""), 5000);
  };

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/token-plans", {
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 403) throw new Error("Admin access required");
        throw new Error("Failed to fetch plans");
      }
      const data = await res.json();
      setPlans(data);
    } catch (err) {
      showError(err.message || "Failed to load token plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchPlans();
    }
  }, [user]);

  const validatePlan = (tokens, price) => {
    if (!tokens || tokens < 1) return "Tokens must be at least 1";
    if (!price || price < 1) return "Price must be at least ₦1";
    if (price > 1000000) return "Price cannot exceed ₦1,000,000";
    return null;
  };

  const handleAdd = async () => {
    const validationError = validatePlan(newTokens, newPrice);
    if (validationError) {
      showError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/token-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tokens: parseInt(newTokens),
          price: parseInt(newPrice),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add plan");
      }

      setNewTokens("");
      setNewPrice("");
      fetchPlans();
      showSuccess("Token plan added successfully!");
    } catch (err) {
      showError(err.message || "Failed to add token plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (plan) => {
    setEditingId(plan.id);
    setEditTokens(plan.tokens.toString());
    setEditPrice(plan.price.toString());
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTokens("");
    setEditPrice("");
  };

  const handleUpdate = async () => {
    const validationError = validatePlan(editTokens, editPrice);
    if (validationError) {
      showError(validationError);
      return;
    }

    try {
      const res = await fetch("/api/token-plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: editingId,
          tokens: parseInt(editTokens),
          price: parseInt(editPrice),
          isActive: plans.find((p) => p.id === editingId)?.isActive ?? true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update plan");
      }

      cancelEdit();
      fetchPlans();
      showSuccess("Token plan updated successfully!");
    } catch (err) {
      showError(err.message || "Failed to update token plan");
    }
  };

  const handleToggleActive = async (plan) => {
    try {
      const res = await fetch("/api/token-plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: plan.id,
          tokens: plan.tokens,
          price: plan.price,
          isActive: !plan.isActive,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to toggle plan status");
      }

      fetchPlans();
      showSuccess(`Plan ${!plan.isActive ? "activated" : "deactivated"} successfully!`);
    } catch (err) {
      showError(err.message || "Failed to update plan status");
    }
  };

  const handleDelete = async (id) => {
    confirm({
      title: "Delete token plan",
      message: "Are you sure you want to delete this token plan? This action cannot be undone.",
      confirmText: "Delete plan",
      onConfirm: async () => {
        try {
          const res = await fetch("/api/token-plans", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ id }),
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Failed to delete plan");
          }

          fetchPlans();
          showSuccess("Token plan deleted successfully!");
        } catch (err) {
          showError(err.message || "Failed to delete token plan");
        }
      },
    });
  };

  if (user?.role !== "ADMIN") {
    return (
      <div className="page">
        <div className="alert alert-error">
          Access denied. Admin privileges required.
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="admin-header">
        <h1 className="admin-title">Token Plans Management</h1>
        <p className="admin-subtitle">
          Manage token packages that employers can purchase
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Add New Plan Form */}
      <div className="card">
        <h2 className="card-title">Add New Token Plan</h2>
        <div className="form">
          <div className="field">
            <label>Number of Tokens</label>
            <input
              type="number"
              min="1"
              placeholder="e.g., 10"
              value={newTokens}
              onChange={(e) => setNewTokens(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="field">
            <label>Price (₦)</label>
            <input
              type="number"
              min="1"
              placeholder="e.g., 5000"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={isSubmitting || !newTokens || !newPrice}
            className="btn-primary"
          >
            {isSubmitting ? "Adding..." : "Add Plan"}
          </button>
        </div>
      </div>

      {/* Existing Plans */}
      <div className="card">
        <h2 className="card-title">Existing Token Plans</h2>

        {loading ? (
          <div className="loading-state">
            <div>Loading token plans...</div>
          </div>
        ) : plans.length === 0 ? (
          <div className="empty-state">
            <div>No token plans found. Add your first plan above.</div>
          </div>
        ) : (
          <div className="plans-grid">
            {plans.map((plan) => (
              <div key={plan.id} className={`plan-card ${!plan.isActive ? 'inactive' : ''}`}>
                {editingId === plan.id ? (
                  // Edit Mode
                  <div className="plan-edit">
                    <div className="field">
                      <label>Tokens</label>
                      <input
                        type="number"
                        min="1"
                        value={editTokens}
                        onChange={(e) => setEditTokens(e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Price (₦)</label>
                      <input
                        type="number"
                        min="1"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                      />
                    </div>
                    <div className="plan-actions">
                      <button onClick={handleUpdate} className="btn-primary btn-small">
                        Save
                      </button>
                      <button onClick={cancelEdit} className="btn-soft btn-small">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="plan-content">
                    <div className="plan-header">
                      <div className="plan-tokens">
                        <span className="token-icon">🪙</span>
                        <span className="token-count">{plan.tokens}</span>
                        <span className="token-label">tokens</span>
                      </div>
                      <div className={`status-pill ${plan.isActive ? 'status-active' : 'status-inactive'}`}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>

                    <div className="plan-price">
                      ₦{plan.price.toLocaleString()}
                    </div>

                    <div className="plan-per-token">
                      ₦{(plan.price / plan.tokens).toFixed(0)} per token
                    </div>

                    <div className="plan-actions">
                      <button onClick={() => startEdit(plan)} className="btn-soft btn-small">
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(plan)}
                        className={`btn-small ${plan.isActive ? 'btn-warning' : 'btn-success'}`}
                      >
                        {plan.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button onClick={() => handleDelete(plan.id)} className="btn-danger btn-small">
                        Delete
                      </button>
                    </div>
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
