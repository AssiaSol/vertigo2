import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AccountChrome } from "../components/AccountChrome";
import { useAuth } from "../context/AuthContext";
import { cancelOrder, deleteOrder, getMyOrders, ORDER_STATUS, ORDER_STATUS_LABELS, updateOrderStatus } from "../api/orders";
import { reportBoutique } from "../api/reports";
import { useT } from "../i18n";

const ACTIVE_STATUSES = [ORDER_STATUS.Pending, ORDER_STATUS.Preparing, ORDER_STATUS.OnTheWay];

export function MyOrdersPage() {
  const t = useT();
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

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
      setError(t("orders.errors.load"));
    } finally {
      setLoading(false);
    }
  }, [navigate, setUser, t]);

  useEffect(() => { load(); }, [load]);

  const advance = async (id, status) => {
    try {
      await updateOrderStatus(id, status);
      await load();
    } catch (err) {
      alert(err.data?.message || t("orders.errors.update"));
    }
  };

  // Cancelling deletes the order server-side so the list stays clean,
  // then signals the notification bell to refresh and drop its notifs.
  const handleCancel = async (id) => {
    try {
      await cancelOrder(id);
      await load();
      window.dispatchEvent(new CustomEvent("vertigo:orders-changed"));
    } catch (err) {
      alert(err.data?.message || t("orders.errors.update"));
    }
  };

  // Simple cleaning: remove a cancelled order from the list (no restock).
  const handleClean = async (id) => {
    const prev = orders;
    setOrders((list) => list.filter((o) => o.id !== id));
    try {
      await deleteOrder(id);
      window.dispatchEvent(new CustomEvent("vertigo:orders-changed"));
    } catch {
      setOrders(prev);
    }
  };

  const handleReport = async (boutiqueId) => {
    const reason = window.prompt(t("orders.report.prompt"));
    if (reason === null) return;
    try {
      await reportBoutique(boutiqueId, reason);
      alert(t("orders.report.success"));
    } catch {
      alert(t("orders.errors.report"));
    }
  };

  const counts = orders.reduce(
    (acc, o) => {
      acc.total += 1;
      if (ACTIVE_STATUSES.includes(o.status)) acc.live += 1;
      if (o.status === ORDER_STATUS.Delivered) acc.done += 1;
      return acc;
    },
    { total: 0, live: 0, done: 0 }
  );

  const filtered = useMemo(() => {
    if (filter === "active") return orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
    if (filter === "done") return orders.filter((o) => o.status === ORDER_STATUS.Delivered);
    return orders;
  }, [orders, filter]);

  return (
    <AccountChrome
      eyebrow={t("orders.eyebrow")}
      title={t("orders.title")}
      breadcrumbs={[{ label: t("profile.dashboard.navDashboard"), to: "/profile" }, { label: t("orders.title") }]}
    >
      <div className="mx-auto max-w-4xl">
        <p className="max-w-xl text-sm text-eco-green/65 md:text-base">
          {t("orders.intro")}
        </p>

        {!loading && !error && counts.total > 0 && (
          <>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <StatTile label={t("orders.stats.total")} value={counts.total} tone="green" icon={<BagIcon className="h-4 w-4" />} />
              <StatTile label={t("orders.stats.live")} value={counts.live} tone="coral" icon={<PulseIcon className="h-4 w-4" />} />
              <StatTile label={t("orders.stats.done")} value={counts.done} tone="muted" icon={<CheckIcon className="h-4 w-4" />} />
            </div>

            <div className="mt-5 flex justify-center">
              <div className="inline-flex rounded-full border border-eco-green/10 bg-white p-1 shadow-sm">
                <FilterTab active={filter === "all"} onClick={() => setFilter("all")}>{t("orders.filters.all")}</FilterTab>
                <FilterTab active={filter === "active"} onClick={() => setFilter("active")}>{t("orders.filters.active")}</FilterTab>
                <FilterTab active={filter === "done"} onClick={() => setFilter("done")}>{t("orders.filters.done")}</FilterTab>
              </div>
            </div>
          </>
        )}

        <div className="mt-6 space-y-3">
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-3xl border border-eco-green/8 bg-white" />
              ))}
            </div>
          )}
          {!loading && error && (
            <div className="rounded-2xl border border-eco-coral/25 bg-eco-coral/5 p-4 text-sm text-eco-coral">{error}</div>
          )}
          {!loading && !error && orders.length === 0 && (
            <div className="rounded-3xl border border-eco-green/8 bg-white p-10 text-center shadow-[0_18px_44px_-28px_rgba(63,93,58,0.25)]">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-eco-coral/10 text-eco-coral ring-1 ring-eco-coral/15">
                <BagIcon className="h-5 w-5" />
              </div>
              <p className="mt-3 font-heading text-lg font-bold text-eco-green">{t("orders.empty.title")}</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-eco-green/55">
                {t("orders.empty.body")}
              </p>
            </div>
          )}
          {!loading && !error && orders.length > 0 && filtered.length === 0 && (
            <div className="rounded-3xl border border-eco-green/8 bg-white p-8 text-center text-sm text-eco-green/55 shadow-[0_18px_44px_-28px_rgba(63,93,58,0.25)]">
              {t("orders.empty.title")}
            </div>
          )}
          {!loading && !error && filtered.map((o) => (
            <OrderRow
              key={o.id}
              order={o}
              onReceived={() => advance(o.id, ORDER_STATUS.Delivered)}
              onCancel={() => handleCancel(o.id)}
              onReport={() => handleReport(o.boutiqueId)}
              onClean={() => handleClean(o.id)}
            />
          ))}
        </div>
      </div>
    </AccountChrome>
  );
}

function StatTile({ label, value, tone, icon }) {
  const tones = {
    green: "text-eco-green bg-eco-green/10 ring-eco-green/15",
    coral: "text-eco-coral bg-eco-coral/12 ring-eco-coral/20",
    muted: "text-eco-green/55 bg-white/55 ring-white/60",
  };
  const valueTone = {
    green: "text-eco-green",
    coral: "text-eco-coral",
    muted: "text-eco-green/70",
  }[tone] ?? "text-eco-green";
  return (
    <div className="rounded-3xl border border-eco-green/8 bg-white p-4 shadow-[0_2px_6px_rgba(63,93,58,0.04),0_18px_40px_-28px_rgba(63,93,58,0.3)]">
      <span className={`grid h-8 w-8 place-items-center rounded-xl ring-1 ${tones[tone] ?? tones.muted}`}>{icon}</span>
      <p className={`mt-3 font-heading text-2xl font-extrabold tabular-nums leading-none ${valueTone}`}>{value}</p>
      <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-eco-green/50">{label}</p>
    </div>
  );
}

function FilterTab({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full px-4 py-1.5 text-[12px] font-bold transition",
        active
          ? "bg-eco-green text-eco-beige shadow-[0_8px_18px_-10px_rgba(63,93,58,0.6)]"
          : "text-eco-green/60 hover:text-eco-green",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function OrderRow({ order, onReceived, onCancel, onReport, onClean }) {
  const t = useT();
  const date = new Date(order.dateDeCommande).toLocaleString(undefined, {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
  const canCancel = order.status === ORDER_STATUS.Pending;
  const canMarkReceived = order.status === ORDER_STATUS.OnTheWay;
  const isCancelled = order.status === ORDER_STATUS.Cancelled;

  return (
    <article className="overflow-hidden rounded-3xl border border-eco-green/8 bg-white shadow-[0_2px_6px_rgba(63,93,58,0.04),0_18px_44px_-26px_rgba(63,93,58,0.28)] transition hover:-translate-y-0.5 hover:border-eco-green/15 hover:shadow-[0_4px_10px_rgba(63,93,58,0.06),0_26px_56px_-26px_rgba(63,93,58,0.34)]">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-eco-beige/60 ring-1 ring-white/55">
          {order.panierImageUrl ? (
            <img src={order.panierImageUrl} alt={t("orders.basketImageAlt")} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-eco-green/35">
              <BagIcon className="h-6 w-6" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-heading text-[15px] font-bold leading-tight text-eco-green">
                {order.panierName}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-eco-green/55">
                <span className="font-semibold text-eco-green/70">{order.boutiqueName}</span>
                <span className="mx-1.5">·</span>
                {date}
              </p>
            </div>
            <StatusPill status={order.status} />
          </div>

          <p className="mt-1.5 inline-flex items-baseline gap-1">
            <span className="font-heading text-[18px] font-extrabold leading-none text-eco-coral tabular-nums">
              {Number(order.prix).toFixed(0)}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-eco-coral/70">{t("common.currency")}</span>
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {canMarkReceived && (
              <button onClick={onReceived} className="rounded-xl bg-gradient-to-b from-eco-green to-[#324a2d] px-3.5 py-2 text-xs font-bold text-white shadow-[0_8px_18px_-8px_rgba(63,93,58,0.55)] transition hover:brightness-[1.08] active:scale-[0.99]">
                {t("orders.actions.markReceived")}
              </button>
            )}
            {canCancel && (
              <button onClick={onCancel} className="rounded-xl border border-eco-green/15 bg-eco-green/[0.04] px-3.5 py-2 text-xs font-bold text-eco-green transition hover:bg-eco-green/10 active:scale-[0.99]">
                {t("orders.actions.cancel")}
              </button>
            )}
            <button onClick={onReport} className="rounded-xl border border-eco-coral/25 bg-eco-coral/[0.04] px-3.5 py-2 text-xs font-bold text-eco-coral transition hover:bg-eco-coral/10 active:scale-[0.99]">
              {t("orders.actions.report")}
            </button>
          </div>
        </div>
      </div>

      {isCancelled ? (
        <div className="flex items-center justify-between gap-2 border-t border-eco-green/8 bg-red-50/60 px-4 py-2.5">
          <span className="text-[11px] font-semibold text-red-500/80">{t("orders.cancelledNote")}</span>
          <button
            type="button"
            onClick={onClean}
            aria-label={t("orders.actions.clean")}
            title={t("orders.actions.clean")}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-red-400 transition hover:bg-red-100 hover:text-red-600 active:scale-90"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="border-t border-eco-green/8 bg-eco-beige/20 px-4 py-3.5">
          <OrderTimeline status={order.status} />
        </div>
      )}
    </article>
  );
}

const TIMELINE_STEPS = [
  { key: "orders.timeline.placed", status: ORDER_STATUS.Pending },
  { key: "orders.timeline.preparing", status: ORDER_STATUS.Preparing },
  { key: "orders.timeline.ready", status: ORDER_STATUS.OnTheWay },
  { key: "orders.timeline.delivered", status: ORDER_STATUS.Delivered },
];

const STATUS_INDEX = {
  [ORDER_STATUS.Pending]: 0,
  [ORDER_STATUS.Preparing]: 1,
  [ORDER_STATUS.OnTheWay]: 2,
  [ORDER_STATUS.Delivered]: 3,
};

function OrderTimeline({ status }) {
  const t = useT();
  const current = STATUS_INDEX[status] ?? 0;
  return (
    <div className="flex items-center">
      {TIMELINE_STEPS.map((step, i) => {
        const done = i <= current;
        const isLast = i === TIMELINE_STEPS.length - 1;
        return (
          <div key={step.key} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={[
                  "grid h-5 w-5 place-items-center rounded-full text-[10px] transition",
                  done ? "bg-eco-green text-white shadow-[0_4px_10px_-4px_rgba(63,93,58,0.6)]" : "bg-white text-eco-green/30 ring-1 ring-eco-green/15",
                ].join(" ")}
              >
                {done ? <CheckIcon className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
              </span>
              <span className={`hidden text-[9px] font-bold uppercase tracking-[0.1em] sm:block ${done ? "text-eco-green/70" : "text-eco-green/30"}`}>
                {t(step.key)}
              </span>
            </div>
            {!isLast && (
              <span className="mx-1 h-0.5 flex-1 rounded-full bg-eco-green/10">
                <span className="block h-full rounded-full bg-eco-green transition-all duration-500" style={{ width: i < current ? "100%" : "0%" }} />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function BagIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 8h14l-1 12H6L5 8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 8a3 3 0 0 1 6 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PulseIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M3 12h4l2 6 4-14 2 8h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

const STATUS_COMMON_KEY = {
  Pending: "common.status.pending",
  Preparing: "common.status.preparing",
  OnTheWay: "common.status.ready",
  Delivered: "common.status.completed",
  Cancelled: "common.status.cancelled",
};

function StatusPill({ status }) {
  const t = useT();
  const style = {
    Pending: "bg-eco-green/[0.06] text-eco-green/75 ring-1 ring-eco-green/15",
    Preparing: "bg-eco-softYellow/40 text-eco-green ring-1 ring-eco-softYellow/55",
    OnTheWay: "bg-eco-coral/12 text-eco-coral ring-1 ring-eco-coral/25",
    Delivered: "bg-eco-green/10 text-eco-green ring-1 ring-eco-green/20",
    Cancelled: "bg-red-50 text-red-600 ring-1 ring-red-200",
  }[status] ?? "bg-eco-green/[0.06] text-eco-green/75 ring-1 ring-eco-green/15";
  const commonKey = STATUS_COMMON_KEY[status];
  const label = commonKey ? t(commonKey) : (ORDER_STATUS_LABELS[status] ?? status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${style}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}
