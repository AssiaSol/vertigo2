import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthedHeader } from "../components/AuthedHeader";
import { useAuth } from "../context/AuthContext";
import { getMyOrders, ORDER_STATUS, ORDER_STATUS_LABELS, updateOrderStatus } from "../api/orders";
import { reportBoutique } from "../api/reports";

export function MyOrdersPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyOrders();
      setOrders(data ?? []);
    } catch (err) {
      if (err.status === 401) {
        setUser(null);
        navigate("/login", { replace: true });
        return;
      }
      setError("Couldn't load your orders.");
    } finally {
      setLoading(false);
    }
  }, [navigate, setUser]);

  useEffect(() => { load(); }, [load]);

  const advance = async (id, status) => {
    try {
      await updateOrderStatus(id, status);
      await load();
    } catch (err) {
      alert(err.data?.message || "Couldn't update the order.");
    }
  };

  const handleReport = async (boutiqueId) => {
    const reason = window.prompt("Why are you reporting this restaurant?");
    if (reason === null) return;
    try {
      await reportBoutique(boutiqueId, reason);
      alert("Thanks — the restaurant has been reported.");
    } catch {
      alert("Couldn't submit the report.");
    }
  };

  return (
    <div className="min-h-screen bg-eco-beige/40 font-body text-eco-green">
      <AuthedHeader />
      <main className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-10">
        <p className="font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-eco-coral">Your activity</p>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-eco-green md:text-4xl">My orders</h1>
        <p className="mt-2 text-sm text-eco-green/70 md:text-base">
          Track each order as the restaurant prepares and sends it.
        </p>

        <div className="mt-6 space-y-3">
          {loading && <p className="text-sm text-eco-green/60">Loading…</p>}
          {!loading && error && (
            <div className="rounded-2xl border border-eco-coral/25 bg-eco-coral/10 p-4 text-sm text-eco-coral">{error}</div>
          )}
          {!loading && !error && orders.length === 0 && (
            <div className="rounded-2xl border border-dashed border-eco-green/20 bg-white/60 p-8 text-center">
              <p className="font-heading text-lg font-semibold text-eco-green">No orders yet</p>
              <p className="mt-1 text-sm text-eco-green/60">Browse deals and place your first order.</p>
            </div>
          )}
          {orders.map((o) => (
            <OrderRow
              key={o.id}
              order={o}
              onReceived={() => advance(o.id, ORDER_STATUS.Delivered)}
              onCancel={() => advance(o.id, ORDER_STATUS.Cancelled)}
              onReport={() => handleReport(o.boutiqueId)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

function OrderRow({ order, onReceived, onCancel, onReport }) {
  const date = new Date(order.dateDeCommande).toLocaleString(undefined, {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
  const canCancel = order.status === ORDER_STATUS.Pending;
  const canMarkReceived = order.status === ORDER_STATUS.OnTheWay;

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-eco-green/10 bg-white p-4 shadow-sm sm:flex-row sm:items-start">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-eco-beige/60">
        {order.panierImageUrl ? <img src={order.panierImageUrl} alt="" className="h-full w-full object-cover" /> : null}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="font-heading text-base font-bold text-eco-green">{order.panierName}</p>
          <StatusPill status={order.status} />
        </div>
        <p className="text-xs text-eco-green/60">From {order.boutiqueName} · {date}</p>
        <p className="mt-1 font-heading text-lg font-bold text-eco-coral">{Number(order.prix).toFixed(0)} DA</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {canMarkReceived && (
            <button onClick={onReceived} className="rounded-xl bg-eco-green px-3 py-2 text-xs font-bold text-white shadow-sm hover:brightness-[1.05] active:scale-[0.99]">
              Mark received
            </button>
          )}
          {canCancel && (
            <button onClick={onCancel} className="rounded-xl border border-eco-green/20 bg-white px-3 py-2 text-xs font-bold text-eco-green hover:bg-eco-beige/60 active:scale-[0.99]">
              Cancel
            </button>
          )}
          <button onClick={onReport} className="rounded-xl border border-eco-coral/30 bg-white px-3 py-2 text-xs font-bold text-eco-coral hover:bg-eco-coral/10 active:scale-[0.99]">
            Report restaurant
          </button>
        </div>
      </div>
    </article>
  );
}

function StatusPill({ status }) {
  const style = {
    Pending: "bg-eco-beige/60 text-eco-green/80",
    Preparing: "bg-eco-softYellow/40 text-eco-green",
    OnTheWay: "bg-eco-coral/20 text-eco-coral",
    Delivered: "bg-eco-green/15 text-eco-green",
    Cancelled: "bg-red-100 text-red-600",
  }[status] ?? "bg-eco-beige/60 text-eco-green/80";
  return (
    <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${style}`}>
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}
