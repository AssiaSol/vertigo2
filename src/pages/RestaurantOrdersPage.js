import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthedHeader } from "../components/AuthedHeader";
import { useAuth } from "../context/AuthContext";
import { getBoutiqueOrders, ORDER_STATUS, ORDER_STATUS_LABELS, updateOrderStatus } from "../api/orders";
import { getMyMerchant } from "../api/merchants";
import { reportUser } from "../api/reports";
import { BASKET_TYPES, createDeal, deleteDeal, getMyDeals, updateDeal } from "../api/deals";

export function RestaurantOrdersPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const [boutique, setBoutique] = useState(null);
  const [checkingBoutique, setCheckingBoutique] = useState(true);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyMerchant()
      .then((b) => setBoutique(b))
      .catch((err) => {
        if (err.status === 401) {
          setUser(null);
          navigate("/login", { replace: true });
        }
      })
      .finally(() => setCheckingBoutique(false));
  }, [navigate, setUser]);

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    setError("");
    try {
      const data = await getBoutiqueOrders();
      setOrders(data ?? []);
    } catch (err) {
      if (err.status === 401) {
        setUser(null);
        navigate("/login", { replace: true });
        return;
      }
      setError("Couldn't load incoming orders.");
    } finally {
      setLoadingOrders(false);
    }
  }, [navigate, setUser]);

  useEffect(() => {
    if (boutique?.valide) loadOrders();
  }, [boutique, loadOrders]);

  const advance = async (id, status) => {
    try {
      await updateOrderStatus(id, status);
      await loadOrders();
    } catch (err) {
      alert(err.data?.message || "Couldn't update the order.");
    }
  };

  const handleReport = async (clientId) => {
    const reason = window.prompt("Why are you reporting this customer?");
    if (reason === null) return;
    try {
      await reportUser(clientId, reason);
      alert("Thanks — the customer has been reported.");
    } catch {
      alert("Couldn't submit the report.");
    }
  };

  return (
    <div className="min-h-screen bg-eco-beige/40 font-body text-eco-green">
      <AuthedHeader />
      <main className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-10">
        <p className="font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-eco-coral">
          Your restaurant
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-eco-green md:text-4xl">
          {boutique?.nomBoutique || "Merchant dashboard"}
        </h1>

        {checkingBoutique && <p className="mt-6 text-sm text-eco-green/60">Loading…</p>}

        {!checkingBoutique && !boutique && <NoBoutiqueState />}

        {!checkingBoutique && boutique && !boutique.valide && <PendingState boutique={boutique} />}

        {!checkingBoutique && boutique?.valide && (
          <>
            <MyBasketsSection />

            <div className="mt-10">
              <h2 className="font-heading text-xl font-bold text-eco-green md:text-2xl">
                Incoming orders
              </h2>
              <p className="mt-1 text-sm text-eco-green/70">
                Update status so customers know what's happening.
              </p>

              <div className="mt-4 space-y-3">
                {loadingOrders && <p className="text-sm text-eco-green/60">Loading orders…</p>}
                {!loadingOrders && error && (
                  <div className="rounded-2xl border border-eco-coral/25 bg-eco-coral/10 p-4 text-sm text-eco-coral">
                    {error}
                  </div>
                )}
                {!loadingOrders && !error && orders.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-eco-green/20 bg-white/60 p-8 text-center">
                    <p className="font-heading text-lg font-semibold text-eco-green">No incoming orders</p>
                    <p className="mt-1 text-sm text-eco-green/60">Orders from customers will show up here.</p>
                  </div>
                )}
                {orders.map((o) => (
                  <IncomingOrderRow
                    key={o.id}
                    order={o}
                    onAdvance={(s) => advance(o.id, s)}
                    onReport={() => handleReport(o.clientId)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function NoBoutiqueState() {
  return (
    <div className="mt-6 rounded-2xl border border-eco-softYellow/40 bg-eco-softYellow/20 p-6">
      <p className="font-heading text-lg font-semibold text-eco-green">Become a merchant</p>
      <p className="mt-1 text-sm text-eco-green/70">
        Apply with your Registre de Commerce to start accepting orders.
      </p>
      <Link
        to="/become-merchant"
        className="mt-4 inline-flex rounded-xl bg-eco-green px-4 py-2 text-sm font-bold text-white shadow-sm hover:brightness-[1.05] active:scale-[0.99]"
      >
        Apply now
      </Link>
    </div>
  );
}

function PendingState({ boutique }) {
  return (
    <div className="mt-6 rounded-2xl border border-eco-softYellow/40 bg-eco-softYellow/20 p-6">
      <p className="font-heading text-lg font-semibold text-eco-green">Awaiting approval</p>
      <p className="mt-1 text-sm text-eco-green/70">
        Submitted on {new Date(boutique.dateCreation).toLocaleDateString()} · Registre {boutique.registre}.
        You'll be able to accept orders once an admin approves your application.
      </p>
    </div>
  );
}

function IncomingOrderRow({ order, onAdvance, onReport }) {
  const date = new Date(order.dateDeCommande).toLocaleString(undefined, {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });

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
        <p className="text-xs text-eco-green/60">
          Customer: <span className="font-semibold text-eco-green">{order.clientName}</span> · {date}
        </p>
        <p className="mt-1 font-heading text-lg font-bold text-eco-coral">{Number(order.prix).toFixed(0)} DA</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {order.status === ORDER_STATUS.Pending && (
            <button onClick={() => onAdvance(ORDER_STATUS.Preparing)} className={btnPrimary}>Start preparing</button>
          )}
          {order.status === ORDER_STATUS.Preparing && (
            <button onClick={() => onAdvance(ORDER_STATUS.OnTheWay)} className={btnPrimary}>Mark on the way</button>
          )}
          {order.status === ORDER_STATUS.OnTheWay && (
            <button onClick={() => onAdvance(ORDER_STATUS.Delivered)} className={btnPrimary}>Mark delivered</button>
          )}
          {![ORDER_STATUS.Delivered, ORDER_STATUS.Cancelled].includes(order.status) && (
            <button onClick={() => onAdvance(ORDER_STATUS.Cancelled)} className={btnGhost}>Cancel</button>
          )}
          <button onClick={onReport} className="rounded-xl border border-eco-coral/30 bg-white px-3 py-2 text-xs font-bold text-eco-coral hover:bg-eco-coral/10 active:scale-[0.99]">
            Report customer
          </button>
        </div>
      </div>
    </article>
  );
}

const btnPrimary = "rounded-xl bg-eco-green px-3 py-2 text-xs font-bold text-white shadow-sm hover:brightness-[1.05] active:scale-[0.99]";
const btnGhost = "rounded-xl border border-eco-green/20 bg-white px-3 py-2 text-xs font-bold text-eco-green hover:bg-eco-beige/60 active:scale-[0.99]";

function MyBasketsSection() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // null | 'new' | deal object
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyDeals();
      setDeals(data ?? []);
    } catch {
      setError("Couldn't load your baskets.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (payload, id) => {
    setSaving(true);
    try {
      if (id) await updateDeal(id, payload);
      else await createDeal(payload);
      setEditing(null);
      await load();
    } catch (err) {
      alert(err.data?.message || "Couldn't save the basket.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this basket? If it has orders, it will be deactivated instead.")) return;
    try {
      await deleteDeal(id);
      await load();
    } catch {
      alert("Couldn't delete the basket.");
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-eco-green md:text-2xl">My baskets</h2>
        {editing === null && (
          <button
            onClick={() => setEditing("new")}
            className="rounded-xl bg-eco-coral px-4 py-2 text-sm font-bold text-white shadow-md transition hover:brightness-[1.05] active:scale-[0.99]"
          >
            + Add basket
          </button>
        )}
      </div>
      <p className="mt-1 text-sm text-eco-green/70">
        Create discounted surplus-food baskets your customers can order.
      </p>

      {editing !== null && (
        <BasketForm
          initial={editing === "new" ? null : editing}
          saving={saving}
          onCancel={() => setEditing(null)}
          onSave={(payload) => handleSave(payload, editing === "new" ? null : editing.id)}
        />
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {loading && <p className="text-sm text-eco-green/60">Loading baskets…</p>}
        {!loading && error && (
          <div className="col-span-full rounded-2xl border border-eco-coral/25 bg-eco-coral/10 p-4 text-sm text-eco-coral">
            {error}
          </div>
        )}
        {!loading && !error && deals.length === 0 && editing === null && (
          <div className="col-span-full rounded-2xl border border-dashed border-eco-green/20 bg-white/60 p-8 text-center">
            <p className="font-heading text-lg font-semibold text-eco-green">No baskets yet</p>
            <p className="mt-1 text-sm text-eco-green/60">Click "Add basket" to create your first deal.</p>
          </div>
        )}
        {deals.map((d) => (
          <BasketCard key={d.id} deal={d} onEdit={() => setEditing(d)} onDelete={() => handleDelete(d.id)} />
        ))}
      </div>
    </div>
  );
}

function BasketCard({ deal, onEdit, onDelete }) {
  const validUntil = deal.validUntil
    ? new Date(deal.validUntil).toLocaleDateString(undefined, { day: "numeric", month: "short" })
    : null;
  return (
    <article className="flex gap-3 rounded-2xl border border-eco-green/10 bg-white p-4 shadow-sm">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-eco-beige/60">
        {deal.panierImagePath ? <img src={deal.panierImagePath} alt="" className="h-full w-full object-cover" /> : null}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-heading text-base font-bold text-eco-green">{deal.name}</p>
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${deal.isActive ? "bg-eco-green/10 text-eco-green" : "bg-eco-coral/15 text-eco-coral"}`}>
            {deal.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <p className="text-xs text-eco-green/60">{deal.types}</p>
        <p className="mt-1 line-clamp-1 text-xs text-eco-green/60">{deal.description}</p>

        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          <span className="font-heading text-lg font-bold text-eco-coral">{Number(deal.discountedPrice).toFixed(0)} DA</span>
          {Number(deal.originalPrice) > 0 && (
            <span className="text-xs text-eco-green/45 line-through">{Number(deal.originalPrice).toFixed(0)} DA</span>
          )}
          <span className="rounded-full bg-eco-coral/15 px-2 py-0.5 text-[10px] font-bold text-eco-coral">
            -{Math.round(Number(deal.discountPercentage))}%
          </span>
        </div>

        <p className="mt-1 text-[11px] text-eco-green/55">
          Qty {deal.nBdispo}{validUntil ? ` · until ${validUntil}` : ""}
        </p>

        <div className="mt-3 flex gap-2">
          <button onClick={onEdit} className="rounded-xl border border-eco-green/20 bg-white px-3 py-1.5 text-xs font-bold text-eco-green hover:bg-eco-beige/60">
            Edit
          </button>
          <button onClick={onDelete} className="rounded-xl border border-eco-coral/30 bg-white px-3 py-1.5 text-xs font-bold text-eco-coral hover:bg-eco-coral/10">
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

function BasketForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(() => ({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    types: initial?.types || BASKET_TYPES[0],
    originalPrice: initial?.originalPrice ?? "",
    discountPercentage: initial?.discountPercentage ?? "",
    nBdispo: initial?.nBdispo ?? 1,
    validUntil: initial?.validUntil ? toDateInputValue(initial.validUntil) : "",
    panierImagePath: initial?.panierImagePath ?? "",
    isActive: initial?.isActive ?? true,
  }));

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      Name: form.name,
      Description: form.description,
      Types: form.types,
      OriginalPrice: Number(form.originalPrice),
      DiscountPercentage: Number(form.discountPercentage),
      NBdispo: Number(form.nBdispo),
      ValidUntil: form.validUntil ? new Date(form.validUntil).toISOString() : null,
      PanierImagePath: form.panierImagePath || null,
      IsActive: form.isActive,
    });
  };

  const discounted = (() => {
    const orig = Number(form.originalPrice);
    const pct = Number(form.discountPercentage);
    if (!Number.isFinite(orig) || !Number.isFinite(pct)) return null;
    return Math.max(0, Math.round(orig * (1 - pct / 100)));
  })();

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 rounded-2xl border border-eco-green/10 bg-white p-5 shadow-sm">
      <p className="font-heading text-sm font-bold text-eco-green">
        {initial ? "Edit basket" : "New basket"}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Name (3–20 chars)" value={form.name} onChange={set("name")} required />
        <SelectField label="Type" value={form.types} onChange={set("types")} options={BASKET_TYPES} />
      </div>

      <TextareaField label="Description" value={form.description} onChange={set("description")} required />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Original price (DA)" type="number" step="0.01" min="0" value={form.originalPrice} onChange={set("originalPrice")} required />
        <Field label="Discount %" type="number" step="1" min="0" max="100" value={form.discountPercentage} onChange={set("discountPercentage")} required />
        <Field label="Quantity available" type="number" step="1" min="0" value={form.nBdispo} onChange={set("nBdispo")} />
        <Field label="Valid until" type="date" value={form.validUntil} onChange={set("validUntil")} />
      </div>

      <Field label="Image URL (optional)" value={form.panierImagePath} onChange={set("panierImagePath")} placeholder="https://…" />

      {discounted !== null && Number(form.originalPrice) > 0 && (
        <p className="text-xs text-eco-green/70">
          Customer pays <span className="font-bold text-eco-coral">{discounted} DA</span>
        </p>
      )}

      {initial && (
        <label className="flex items-center gap-2 text-sm text-eco-green/75">
          <input type="checkbox" checked={form.isActive} onChange={set("isActive")} className="h-4 w-4 rounded border-eco-green/25 text-eco-green focus:ring-eco-coral/30" />
          Active (visible to customers)
        </label>
      )}

      <div className="mt-1 flex gap-2">
        <button type="submit" disabled={saving} className="rounded-xl bg-eco-green px-4 py-2 text-sm font-bold text-white shadow-sm hover:brightness-[1.05] active:scale-[0.99] disabled:opacity-60">
          {saving ? "Saving…" : initial ? "Save changes" : "Create basket"}
        </button>
        <button type="button" onClick={onCancel} disabled={saving} className="rounded-xl border border-eco-green/20 bg-white px-4 py-2 text-sm font-bold text-eco-green hover:bg-eco-beige/60 disabled:opacity-60">
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({ label, value, onChange, type = "text", required, placeholder, step, min, max }) {
  return (
    <div className="space-y-1">
      <label className="block text-[10px] font-bold uppercase tracking-wide text-eco-green/55">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        step={step}
        min={min}
        max={max}
        className="w-full rounded-xl border border-eco-green/15 bg-eco-beige/30 px-3 py-2 text-sm text-eco-green placeholder:text-eco-green/35 focus:border-eco-coral/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-eco-coral/20"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div className="space-y-1">
      <label className="block text-[10px] font-bold uppercase tracking-wide text-eco-green/55">{label}</label>
      <select value={value} onChange={onChange} className="w-full rounded-xl border border-eco-green/15 bg-white px-3 py-2 text-sm text-eco-green focus:border-eco-coral/60 focus:outline-none focus:ring-2 focus:ring-eco-coral/20">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function TextareaField({ label, value, onChange, required }) {
  return (
    <div className="space-y-1">
      <label className="block text-[10px] font-bold uppercase tracking-wide text-eco-green/55">{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        required={required}
        rows={2}
        className="w-full resize-none rounded-xl border border-eco-green/15 bg-eco-beige/30 px-3 py-2 text-sm text-eco-green placeholder:text-eco-green/35 focus:border-eco-coral/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-eco-coral/20"
      />
    </div>
  );
}

function toDateInputValue(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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
