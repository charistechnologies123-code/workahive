import { useEffect, useState } from "react";

export default function AdminTokenPlans() {
  const [plans, setPlans] = useState([]);
  const [newTokens, setNewTokens] = useState("");
  const [newPrice, setNewPrice] = useState("");

  const fetchPlans = async () => {
    const res = await fetch("/api/token-plans");
    const data = await res.json();
    setPlans(data);
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleAdd = async () => {
    if (!newTokens || !newPrice) return;
    await fetch("/api/token-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json", role: "ADMIN" },
      body: JSON.stringify({ tokens: parseInt(newTokens), price: parseInt(newPrice) }),
    });
    setNewTokens(""); setNewPrice("");
    fetchPlans();
  };

  const handleUpdate = async (plan) => {
    const updatedTokens = prompt("Tokens", plan.tokens);
    const updatedPrice = prompt("Price", plan.price);
    if (!updatedTokens || !updatedPrice) return;

    await fetch("/api/token-plans", {
      method: "PUT",
      headers: { "Content-Type": "application/json", role: "ADMIN" },
      body: JSON.stringify({
        id: plan.id,
        tokens: parseInt(updatedTokens),
        price: parseInt(updatedPrice),
        isActive: plan.isActive,
      }),
    });
    fetchPlans();
  };

  const handleToggleActive = async (plan) => {
    await fetch("/api/token-plans", {
      method: "PUT",
      headers: { "Content-Type": "application/json", role: "ADMIN" },
      body: JSON.stringify({
        id: plan.id,
        tokens: plan.tokens,
        price: plan.price,
        isActive: !plan.isActive,
      }),
    });
    fetchPlans();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this plan?")) return;
    await fetch("/api/token-plans", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", role: "ADMIN" },
      body: JSON.stringify({ id }),
    });
    fetchPlans();
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">Admin Token Plans</h1>

      <div className="mb-4 flex gap-2">
        <input
          type="number"
          placeholder="Tokens"
          value={newTokens}
          onChange={(e) => setNewTokens(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="number"
          placeholder="Price"
          value={newPrice}
          onChange={(e) => setNewPrice(e.target.value)}
          className="border p-2 rounded"
        />
        <button onClick={handleAdd} className="bg-purple-600 text-white p-2 rounded">
          Add Plan
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className="border p-3 rounded bg-white flex flex-col gap-2">
            <div>
              🪙 {plan.tokens} Tokens — ₦{plan.price.toLocaleString()}
            </div>
            <div>Status: {plan.isActive ? "Active" : "Inactive"}</div>
            <div className="flex gap-2">
              <button onClick={() => handleUpdate(plan)} className="bg-blue-500 text-white p-1 rounded">
                Edit
              </button>
              <button onClick={() => handleToggleActive(plan)} className="bg-yellow-500 text-white p-1 rounded">
                {plan.isActive ? "Disable" : "Enable"}
              </button>
              <button onClick={() => handleDelete(plan.id)} className="bg-red-600 text-white p-1 rounded">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}