import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";

export default function SupportPage() {
  const { user } = useAuth();
  const isEmployer = user?.role === "EMPLOYER";

  const [plans, setPlans] = useState([]);
  const [tokens, setTokens] = useState(null);
  const [note, setNote] = useState("");

  const whatsappNumber = "2348012345678";

  // Fetch token plans dynamically
  useEffect(() => {
    if (isEmployer) {
      fetch("/api/token-plans")
        .then((res) => res.json())
        .then((data) => {
          setPlans(data);
          if (data.length) setTokens(data[0].tokens); // select first plan by default
        });
    }
  }, [isEmployer]);

  const handleBuyTokens = () => {
    const selectedPlan = plans.find((p) => p.tokens === tokens);
    const priceText = selectedPlan ? `₦${selectedPlan.price.toLocaleString()}` : "";
    const message = encodeURIComponent(
      `Hello WorkaHive Support,\n\nI want to purchase tokens.\n\nToken Plan: ${tokens} Tokens (${priceText})\nNote: ${note}`
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white w-full max-w-2xl p-8 rounded-2xl shadow-md text-center space-y-6">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold">Support</h1>
          <p className="text-gray-600 mt-2">We're here to help. Reach out to us anytime.</p>
        </div>

        {/* WHATSAPP */}
        <button
          onClick={() =>
            window.open(`https://wa.me/${whatsappNumber}?text=Hello WorkaHive Support`, "_blank")
          }
          className="w-full flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold transition"
        >
          <svg width="20" height="20" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.967-.94 1.164-.173.198-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.148-.174.198-.298.297-.497.099-.198.05-.372-.025-.52-.075-.149-.67-1.611-.916-2.207-.242-.579-.487-.5-.67-.51l-.57-.01c-.198 0-.52.074-.792.372-.273.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.695.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          </svg>
          Chat with us on WhatsApp
        </button>

        {/* EMAIL (NOT LINK) */}
        <div className="w-full border rounded-xl p-4 bg-gray-50 flex items-center justify-center gap-3">
          <svg width="20" height="20" fill="currentColor">
            <path d="M2 4h16v12H2z" fill="none" stroke="currentColor"/>
            <path d="M2 4l8 6 8-6" />
          </svg>
          <span className="font-medium">support@workahive.com</span>
        </div>

        {/* EMPLOYER TOKEN PURCHASE */}
        {isEmployer && (
          <div className="text-left mt-6 border-t pt-6 space-y-4">
            <h2 className="text-lg font-semibold text-center">Buy Tokens</h2>

            {/* TOKEN PLANS */}
            <div className="grid grid-cols-2 gap-3">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setTokens(plan.tokens)}
                  className={`border rounded-lg p-3 text-center ${
                    tokens === plan.tokens ? "border-purple-600 bg-purple-50" : ""
                  }`}
                >
                  <div className="font-semibold">🪙 {plan.tokens} Tokens</div>
                  <div className="text-sm text-gray-600">₦{plan.price.toLocaleString()}</div>
                </button>
              ))}
            </div>

            {/* NOTE */}
            <textarea
              placeholder="Add a note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border p-3 rounded-lg"
            />

            {/* BUY BUTTON */}
            <button
              onClick={handleBuyTokens}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold"
            >
              Continue on WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  );
}