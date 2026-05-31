import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AccountChrome } from "../components/AccountChrome";
import { useAuth } from "../context/AuthContext";
import { getBoutiqueOrders, getOrderClient, rateOrderClient, ORDER_STATUS, ORDER_STATUS_LABELS, updateOrderStatus } from "../api/orders";
import { getMyMerchant } from "../api/merchants";
import { reportUser } from "../api/reports";
import { BASKET_TYPES, createDeal, deleteDeal, getMyDeals, updateDeal } from "../api/deals";
import { useT } from "../i18n";

const CLEANED_ORDERS_KEY = "vertigo:merchant:cleanedOrders";

export function RestaurantOrdersPage() {
  const t = useT();
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const [boutique, setBoutique] = useState(null);
  const [checkingBoutique, setCheckingBoutique] = useState(true);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState("");
  const [clientOrderId, setClientOrderId] = useState(null);
  // Orders the merchant has cleared from their list. Kept locally so the record
  // (and the statistics on the dashboard) stays intact — only the view is tidied.
  const [cleanedIds, setCleanedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(CLEANED_ORDERS_KEY) || "[]")); }
    catch { return new Set(); }
  });

  const cleanOrder = (id) => {
    setCleanedIds((prev) => {
      const next = new Set(prev).add(id);
      try { localStorage.setItem(CLEANED_ORDERS_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  };

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
      setError(t("restaurantOrders.couldntLoadOrders"));
    } finally {
      setLoadingOrders(false);
    }
  }, [navigate, setUser, t]);

  useEffect(() => {
    if (boutique?.valide) loadOrders();
  }, [boutique, loadOrders]);

  const advance = async (id, status) => {
    try {
      await updateOrderStatus(id, status);
      await loadOrders();
    } catch (err) {
      alert(err.data?.message || t("restaurantOrders.couldntUpdateOrder"));
    }
  };

  const handleReport = async (clientId) => {
    const reason = window.prompt(t("restaurantOrders.reportPrompt"));
    if (reason === null) return;
    try {
      await reportUser(clientId, reason);
      alert(t("restaurantOrders.reportThanks"));
    } catch {
      alert(t("restaurantOrders.reportFailed"));
    }
  };

  return (
    <AccountChrome
      eyebrow={t("restaurantOrders.yourRestaurant")}
      title={boutique?.nomBoutique || t("restaurantOrders.merchantDashboard")}
      breadcrumbs={[{ label: t("common.nav.home"), to: "/profile" }, { label: t("restaurantOrders.merchantDashboard") }]}
    >
      <div className="mx-auto max-w-5xl">

        {checkingBoutique && <p className="mt-6 text-sm text-eco-green/60">{t("common.loading")}</p>}

        {!checkingBoutique && !boutique && <NoBoutiqueState />}

        {!checkingBoutique && boutique && !boutique.valide && <PendingState boutique={boutique} />}

        {!checkingBoutique && boutique?.valide && (
          <>
            <MyBasketsSection />

            <div className="mt-10">
              <h2 className="font-heading text-xl font-bold text-eco-green md:text-2xl">
                {t("restaurantOrders.incomingOrders")}
              </h2>
              <p className="mt-1 text-sm text-eco-green/70">
                {t("restaurantOrders.incomingOrdersSubtitle")}
              </p>

              <div className="mt-4 space-y-3">
                {loadingOrders && <p className="text-sm text-eco-green/60">{t("restaurantOrders.loadingOrders")}</p>}
                {!loadingOrders && error && (
                  <div className="rounded-2xl border border-eco-coral/25 bg-eco-coral/10 p-4 text-sm text-eco-coral">
                    {error}
                  </div>
                )}
                {!loadingOrders && !error && orders.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-eco-green/20 bg-white/60 p-8 text-center">
                    <p className="font-heading text-lg font-semibold text-eco-green">{t("restaurantOrders.noIncomingOrders")}</p>
                    <p className="mt-1 text-sm text-eco-green/60">{t("restaurantOrders.noIncomingOrdersHint")}</p>
                  </div>
                )}
                {orders.filter((o) => !cleanedIds.has(o.id)).map((o) => (
                  <IncomingOrderRow
                    key={o.id}
                    order={o}
                    onAdvance={(s) => advance(o.id, s)}
                    onReport={() => handleReport(o.clientId)}
                    onOpenClient={() => setClientOrderId(o.id)}
                    onClean={() => cleanOrder(o.id)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {clientOrderId != null && (
        <ClientDetailModal orderId={clientOrderId} onClose={() => setClientOrderId(null)} />
      )}
    </AccountChrome>
  );
}

function NoBoutiqueState() {
  const t = useT();
  return (
    <div className="mt-6 rounded-2xl border border-eco-softYellow/40 bg-eco-softYellow/20 p-6">
      <p className="font-heading text-lg font-semibold text-eco-green">{t("restaurantOrders.becomeMerchantTitle")}</p>
      <p className="mt-1 text-sm text-eco-green/70">
        {t("restaurantOrders.becomeMerchantSubtitle")}
      </p>
      <Link
        to="/become-merchant"
        className="mt-4 inline-flex rounded-xl bg-eco-green px-4 py-2 text-sm font-bold text-white shadow-sm hover:brightness-[1.05] active:scale-[0.99]"
      >
        {t("restaurantOrders.applyNow")}
      </Link>
    </div>
  );
}

function PendingState({ boutique }) {
  const t = useT();
  return (
    <div className="mt-6 rounded-2xl border border-eco-softYellow/40 bg-eco-softYellow/20 p-6">
      <p className="font-heading text-lg font-semibold text-eco-green">{t("restaurantOrders.awaitingApproval")}</p>
      <p className="mt-1 text-sm text-eco-green/70">
        {t("restaurantOrders.pendingInfo", {
          date: new Date(boutique.dateCreation).toLocaleDateString(),
          registre: boutique.registre,
        })}
      </p>
    </div>
  );
}

function IncomingOrderRow({ order, onAdvance, onReport, onOpenClient, onClean }) {
  const t = useT();
  const date = new Date(order.dateDeCommande).toLocaleString(undefined, {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
  const canClean = order.status === ORDER_STATUS.Delivered || order.status === ORDER_STATUS.Cancelled;

  return (
    <article className="rounded-2xl border border-eco-green/10 bg-white p-4 shadow-sm transition hover:border-eco-green/25 hover:shadow-md">
      {/* Click the order to see the customer's details */}
      <button type="button" onClick={onOpenClient} className="flex w-full items-start gap-3 text-left">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-eco-beige/60">
          {order.panierImageUrl ? <img src={order.panierImageUrl} alt="" className="h-full w-full object-cover" /> : null}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="font-heading text-base font-bold text-eco-green">{order.panierName}</p>
            <StatusPill status={order.status} />
          </div>
          <p className="text-xs text-eco-green/60">
            {t("restaurantOrders.customerLabel")}: <span className="font-semibold text-eco-green">{order.clientName}</span> · {date}
          </p>
          <p className="mt-1 font-heading text-lg font-bold text-eco-coral">{Number(order.prix).toFixed(0)} {t("common.currency")}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-eco-green/55">
            <PersonIcon className="h-3 w-3" />
            {t("restaurantOrders.client.viewDetails")} →
          </p>
        </div>
      </button>

      <div className="mt-3 flex flex-1 flex-wrap items-center gap-2">
          {order.status === ORDER_STATUS.Pending && (
            <button onClick={() => onAdvance(ORDER_STATUS.Preparing)} className={btnPrimary}>{t("restaurantOrders.startPreparing")}</button>
          )}
          {order.status === ORDER_STATUS.Preparing && (
            <button onClick={() => onAdvance(ORDER_STATUS.OnTheWay)} className={btnPrimary}>{t("restaurantOrders.markOnTheWay")}</button>
          )}
          {order.status === ORDER_STATUS.OnTheWay && (
            <button onClick={() => onAdvance(ORDER_STATUS.Delivered)} className={btnPrimary}>{t("restaurantOrders.markDelivered")}</button>
          )}
          {![ORDER_STATUS.Delivered, ORDER_STATUS.Cancelled].includes(order.status) && (
            <button onClick={() => onAdvance(ORDER_STATUS.Cancelled)} className={btnGhost}>{t("restaurantOrders.cancel")}</button>
          )}
          <button onClick={onReport} className="rounded-xl border border-eco-coral/30 bg-white px-3 py-2 text-xs font-bold text-eco-coral hover:bg-eco-coral/10 active:scale-[0.99]">
            {t("restaurantOrders.reportCustomer")}
          </button>
          {canClean && (
            <button
              onClick={onClean}
              title={t("restaurantOrders.clearOrder")}
              className="ml-auto inline-flex items-center gap-1 rounded-xl border border-eco-green/20 bg-white px-3 py-2 text-xs font-bold text-eco-green/70 transition hover:bg-eco-beige/60 active:scale-[0.99]"
            >
              <XIcon className="h-3.5 w-3.5" />
              {t("restaurantOrders.clearOrder")}
            </button>
          )}
      </div>
    </article>
  );
}

function XIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

const btnPrimary = "rounded-xl bg-eco-green px-3 py-2 text-xs font-bold text-white shadow-sm hover:brightness-[1.05] active:scale-[0.99]";
const btnGhost = "rounded-xl border border-eco-green/20 bg-white px-3 py-2 text-xs font-bold text-eco-green hover:bg-eco-beige/60 active:scale-[0.99]";

/* ── Customer details modal (opens when a merchant clicks an order) ───────── */

function ClientDetailModal({ orderId, onClose }) {
  const t = useT();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    let alive = true;
    getOrderClient(orderId)
      .then((d) => {
        if (!alive) return;
        setData(d);
        if (d?.myClientRating) {
          setNote(d.myClientRating.note ?? 0);
          setComment(d.myClientRating.commentaire ?? "");
        }
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [orderId]);

  useEffect(() => load(), [load]);

  const submitRating = async () => {
    if (note < 1) return;
    setSaving(true);
    try {
      await rateOrderClient(orderId, note, comment);
      load();
    } catch (err) {
      alert(err.data?.message || "Couldn't save the rating.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const memberSince = data?.memberSince
    ? new Date(data.memberSince).toLocaleDateString(undefined, { year: "numeric", month: "long" })
    : null;
  const orderDate = data?.order?.date
    ? new Date(data.order.date).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-eco-green/10 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-eco-green/8 px-5 py-4">
          <h3 className="font-heading text-base font-bold text-eco-green">{t("restaurantOrders.client.title")}</h3>
          <button type="button" onClick={onClose} aria-label={t("restaurantOrders.client.close")} className="grid h-8 w-8 place-items-center rounded-full text-eco-green/50 transition hover:bg-eco-beige/60 hover:text-eco-green">✕</button>
        </div>

        {loading || !data ? (
          <p className="px-5 py-10 text-center text-sm text-eco-green/55">{t("restaurantOrders.client.loading")}</p>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto px-5 py-5">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-eco-green/10 font-heading text-lg font-bold text-eco-green">
                {(data.clientName || "C").charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="font-heading text-lg font-bold text-eco-green">{data.clientName}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Stars value={Math.round(data.customerRating?.average ?? 0)} />
                  <span className="text-[11px] font-semibold text-eco-green/55">
                    {data.customerRating?.count > 0 ? `${data.customerRating.average} (${data.customerRating.count})` : "—"}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {data.etudiant && <Tag tone="green">{t("restaurantOrders.client.student")}</Tag>}
                  {data.nbReport > 0 && <Tag tone="coral">{t("restaurantOrders.client.reports")}: {data.nbReport}</Tag>}
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2 rounded-2xl bg-eco-beige/20 p-4">
              <InfoRow label={t("restaurantOrders.client.phone")}>
                {data.phone
                  ? <a href={`tel:${data.phone}`} className="font-semibold text-eco-green hover:text-eco-coral">{data.phone}</a>
                  : <span className="text-eco-green/40">{t("restaurantOrders.client.noPhone")}</span>}
              </InfoRow>
              <InfoRow label={t("restaurantOrders.client.email")}><span className="text-eco-green/80">{data.email}</span></InfoRow>
              {memberSince && <InfoRow label={t("restaurantOrders.client.memberSince")}><span className="text-eco-green/80">{memberSince}</span></InfoRow>}
            </div>

            <div className="mt-3 rounded-2xl border border-eco-green/8 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-eco-green/45">{t("restaurantOrders.client.orderLabel")}</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="font-heading text-sm font-bold text-eco-green">{data.order.panierName}</p>
                <StatusPill status={data.order.status} />
              </div>
              {orderDate && <p className="mt-0.5 text-xs text-eco-green/55">{orderDate}</p>}
              <p className="mt-1 font-heading text-base font-bold text-eco-coral">{Number(data.order.prix).toFixed(0)} {t("common.currency")}</p>
              <div className="mt-2 flex gap-4 text-[11px] text-eco-green/55">
                <span>{t("restaurantOrders.client.historyHere")}: <b className="text-eco-green">{data.stats.totalOrders}</b></span>
                <span>{t("restaurantOrders.client.completedHere")}: <b className="text-eco-green">{data.stats.completed}</b></span>
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-eco-green/8 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-eco-green/45">{t("restaurantOrders.client.theirReview")}</p>
              {data.review ? (
                <>
                  <div className="mt-1.5"><Stars value={data.review.note} /></div>
                  {data.review.commentaire && <p className="mt-2 text-[13px] leading-relaxed text-eco-green/70">{data.review.commentaire}</p>}
                </>
              ) : (
                <p className="mt-1.5 text-sm text-eco-green/45">{t("restaurantOrders.client.noReview")}</p>
              )}
            </div>

            {/* Rate the customer — enabled once the order is delivered */}
            <div className="mt-3 rounded-2xl border border-eco-green/8 bg-eco-beige/15 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-eco-green/45">{t("restaurantOrders.client.rateTitle")}</p>
              {data.canRateClient ? (
                <>
                  <div className="mt-1.5"><StarRatingInput value={note} onChange={setNote} /></div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    maxLength={1000}
                    placeholder={t("restaurantOrders.client.ratePlaceholder")}
                    className="mt-2 w-full rounded-xl border border-eco-green/15 bg-white px-3 py-2 text-sm text-eco-green placeholder:text-eco-green/35 focus:border-eco-green/40 focus:outline-none focus:ring-2 focus:ring-eco-green/15"
                  />
                  <button
                    type="button"
                    onClick={submitRating}
                    disabled={saving || note < 1}
                    className="mt-2 w-full rounded-xl bg-eco-green px-4 py-2.5 font-heading text-[13px] font-bold text-white shadow-sm transition hover:brightness-[1.06] active:scale-[0.99] disabled:opacity-50"
                  >
                    {saving ? t("restaurantOrders.client.rating") : data.myClientRating ? t("restaurantOrders.client.rateUpdate") : t("restaurantOrders.client.rateSubmit")}
                  </button>
                </>
              ) : (
                <p className="mt-1.5 text-sm text-eco-green/45">{t("restaurantOrders.client.rateDeliveredOnly")}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-eco-green/45">{label}</span>
      <span className="min-w-0 truncate text-right">{children}</span>
    </div>
  );
}

function Tag({ tone, children }) {
  const cls = tone === "coral" ? "bg-eco-coral/12 text-eco-coral" : "bg-eco-green/10 text-eco-green";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cls}`}>{children}</span>;
}

function Stars({ value }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon key={i} className={`h-4 w-4 ${i <= value ? "text-eco-softYellow" : "text-eco-green/20"}`} filled={i <= value} />
      ))}
    </span>
  );
}

function StarRatingInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="inline-flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => {
        const active = i <= (hover || value);
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            onMouseEnter={() => setHover(i)}
            aria-label={`${i}`}
            className="transition active:scale-90"
          >
            <StarIcon className={`h-7 w-7 ${active ? "text-eco-softYellow" : "text-eco-green/20"}`} filled={active} />
          </button>
        );
      })}
    </div>
  );
}

function StarIcon({ className, filled }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} className={className} aria-hidden="true">
      <path d="M12 2.5l2.76 6.92 7.44.54-5.65 4.87 1.76 7.27L12 18.3l-6.31 3.8 1.76-7.27L1.8 9.96l7.44-.54L12 2.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function PersonIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MyBasketsSection() {
  const t = useT();
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
      setError(t("restaurantOrders.couldntLoadBaskets"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (payload, id) => {
    setSaving(true);
    try {
      if (id) await updateDeal(id, payload);
      else await createDeal(payload);
      setEditing(null);
      await load();
    } catch (err) {
      alert(err.data?.message || t("restaurantOrders.couldntSaveBasket"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t("restaurantOrders.confirmDeleteBasket"))) return;
    try {
      await deleteDeal(id);
      await load();
    } catch {
      alert(t("restaurantOrders.couldntDeleteBasket"));
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-eco-green md:text-2xl">{t("restaurantOrders.myBaskets")}</h2>
        {editing === null && (
          <button
            onClick={() => setEditing("new")}
            className="rounded-xl bg-eco-coral px-4 py-2 text-sm font-bold text-white shadow-md transition hover:brightness-[1.05] active:scale-[0.99]"
          >
            {t("restaurantOrders.addBasket")}
          </button>
        )}
      </div>
      <p className="mt-1 text-sm text-eco-green/70">
        {t("restaurantOrders.myBasketsSubtitle")}
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
        {loading && <p className="text-sm text-eco-green/60">{t("restaurantOrders.loadingBaskets")}</p>}
        {!loading && error && (
          <div className="col-span-full rounded-2xl border border-eco-coral/25 bg-eco-coral/10 p-4 text-sm text-eco-coral">
            {error}
          </div>
        )}
        {!loading && !error && deals.length === 0 && editing === null && (
          <div className="col-span-full rounded-2xl border border-dashed border-eco-green/20 bg-white/60 p-8 text-center">
            <p className="font-heading text-lg font-semibold text-eco-green">{t("restaurantOrders.noBasketsYet")}</p>
            <p className="mt-1 text-sm text-eco-green/60">{t("restaurantOrders.noBasketsHint")}</p>
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
  const t = useT();
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
            {deal.isActive ? t("restaurantOrders.basketActive") : t("restaurantOrders.basketInactive")}
          </span>
        </div>
        <p className="text-xs text-eco-green/60">{deal.types}</p>
        <p className="mt-1 line-clamp-1 text-xs text-eco-green/60">{deal.description}</p>

        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          <span className="font-heading text-lg font-bold text-eco-coral">{Number(deal.discountedPrice).toFixed(0)} {t("common.currency")}</span>
          {Number(deal.originalPrice) > 0 && (
            <span className="text-xs text-eco-green/45 line-through">{Number(deal.originalPrice).toFixed(0)} {t("common.currency")}</span>
          )}
          <span className="rounded-full bg-eco-coral/15 px-2 py-0.5 text-[10px] font-bold text-eco-coral">
            -{Math.round(Number(deal.discountPercentage))}%
          </span>
        </div>

        <p className="mt-1 text-[11px] text-eco-green/55">
          {t("restaurantOrders.qtyLabel", { n: deal.nBdispo })}{validUntil ? t("restaurantOrders.untilLabel", { date: validUntil }) : ""}
        </p>

        <div className="mt-3 flex gap-2">
          <button onClick={onEdit} className="rounded-xl border border-eco-green/20 bg-white px-3 py-1.5 text-xs font-bold text-eco-green hover:bg-eco-beige/60">
            {t("restaurantOrders.edit")}
          </button>
          <button onClick={onDelete} className="rounded-xl border border-eco-coral/30 bg-white px-3 py-1.5 text-xs font-bold text-eco-coral hover:bg-eco-coral/10">
            {t("restaurantOrders.delete")}
          </button>
        </div>
      </div>
    </article>
  );
}

function BasketForm({ initial, onSave, onCancel, saving }) {
  const t = useT();
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
        {initial ? t("restaurantOrders.editBasket") : t("restaurantOrders.newBasket")}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={t("restaurantOrders.fieldName")} value={form.name} onChange={set("name")} required />
        <SelectField label={t("restaurantOrders.fieldType")} value={form.types} onChange={set("types")} options={BASKET_TYPES} />
      </div>

      <TextareaField label={t("restaurantOrders.fieldDescription")} value={form.description} onChange={set("description")} required />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label={t("restaurantOrders.fieldOriginalPrice")} type="number" step="0.01" min="0" value={form.originalPrice} onChange={set("originalPrice")} required />
        <Field label={t("restaurantOrders.fieldDiscountPercent")} type="number" step="1" min="0" max="100" value={form.discountPercentage} onChange={set("discountPercentage")} required />
        <Field label={t("restaurantOrders.fieldQuantity")} type="number" step="1" min="0" value={form.nBdispo} onChange={set("nBdispo")} />
        <Field label={t("restaurantOrders.fieldValidUntil")} type="date" value={form.validUntil} onChange={set("validUntil")} />
      </div>

      <Field label={t("restaurantOrders.fieldImageUrl")} value={form.panierImagePath} onChange={set("panierImagePath")} placeholder={t("restaurantOrders.imagePlaceholder")} />

      {discounted !== null && Number(form.originalPrice) > 0 && (
        <p className="text-xs text-eco-green/70">
          {t("restaurantOrders.customerPays", { price: discounted })}
        </p>
      )}

      {initial && (
        <label className="flex items-center gap-2 text-sm text-eco-green/75">
          <input type="checkbox" checked={form.isActive} onChange={set("isActive")} className="h-4 w-4 rounded border-eco-green/25 text-eco-green focus:ring-eco-coral/30" />
          {t("restaurantOrders.activeVisible")}
        </label>
      )}

      <div className="mt-1 flex gap-2">
        <button type="submit" disabled={saving} className="rounded-xl bg-eco-green px-4 py-2 text-sm font-bold text-white shadow-sm hover:brightness-[1.05] active:scale-[0.99] disabled:opacity-60">
          {saving ? t("restaurantOrders.saving") : initial ? t("restaurantOrders.saveChanges") : t("restaurantOrders.createBasket")}
        </button>
        <button type="button" onClick={onCancel} disabled={saving} className="rounded-xl border border-eco-green/20 bg-white px-4 py-2 text-sm font-bold text-eco-green hover:bg-eco-beige/60 disabled:opacity-60">
          {t("restaurantOrders.cancelBtn")}
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
