import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminChrome } from "../components/AdminChrome";
import { useAuth } from "../context/AuthContext";
import { approveMerchant, getPendingMerchants, rejectMerchant } from "../api/merchants";
import { getAdminStats } from "../api/admin";
import { useT } from "../i18n";

export function AdminApprovalsPage() {
  const t = useT();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const isAdmin = (user?.role ?? user?.Role) === "Admin";

  const [pending, setPending] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [p, s] = await Promise.all([getPendingMerchants(), getAdminStats()]);
      setPending(p ?? []);
      setStats(s ?? null);
    } catch (err) {
      if (err.status === 401) {
        setUser(null);
        navigate("/login", { replace: true });
        return;
      }
      if (err.status === 403) setError(t("adminApprovals.accessDenied"));
      else setError(t("adminApprovals.errors.load"));
    } finally {
      setLoading(false);
    }
  }, [navigate, setUser, t]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id) => {
    if (!window.confirm(t("adminApprovals.confirm.approve"))) return;
    setActingId(id);
    try {
      await approveMerchant(id);
      await load();
    } catch {
      alert(t("adminApprovals.errors.approve"));
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm(t("adminApprovals.confirm.reject"))) return;
    setActingId(id);
    try {
      await rejectMerchant(id);
      await load();
    } catch {
      alert(t("adminApprovals.errors.reject"));
    } finally {
      setActingId(null);
    }
  };

  return (
    <AdminChrome
      title={t("adminApprovals.title")}
      subtitle={t("adminApprovals.subtitle")}
      action={
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-xl border border-eco-green/20 bg-white px-3 py-2 text-xs font-bold text-eco-green shadow-sm transition hover:border-eco-coral/40"
        >
          <RefreshIcon className="h-3.5 w-3.5" />
          {t("adminApprovals.refresh")}
        </button>
      }
    >
      {!isAdmin && (
        <div className="rounded-2xl border border-eco-coral/25 bg-eco-coral/10 p-4 text-sm text-eco-coral">
          {t("adminApprovals.accessDenied")}
        </div>
      )}

      {isAdmin && (
        <div className="space-y-6">
          <StatGrid stats={stats} loading={loading && !stats} />

          <section className="overflow-hidden rounded-2xl border border-eco-green/10 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-eco-green/10 px-5 py-3">
              <div>
                <h2 className="font-heading text-sm font-bold text-eco-green">{t("adminApprovals.section.title")}</h2>
                <p className="text-xs text-eco-green/60">{t("adminApprovals.section.subtitle")}</p>
              </div>
              <span className="rounded-full bg-eco-softYellow/40 px-2.5 py-1 text-[11px] font-bold text-eco-green">
                {t("adminApprovals.section.waiting", { count: pending.length })}
              </span>
            </div>

            {loading && <div className="px-5 py-10 text-center text-sm text-eco-green/60">{t("common.loading")}</div>}

            {!loading && error && (
              <div className="px-5 py-6 text-sm text-eco-coral">{error}</div>
            )}

            {!loading && !error && pending.length === 0 && (
              <div className="px-5 py-12 text-center">
                <p className="font-heading text-base font-bold text-eco-green">{t("adminApprovals.empty.title")}</p>
                <p className="mt-1 text-xs text-eco-green/55">{t("adminApprovals.empty.body")}</p>
              </div>
            )}

            {!loading && !error && pending.length > 0 && (
              <ApplicationsTable
                rows={pending}
                actingId={actingId}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            )}
          </section>
        </div>
      )}
    </AdminChrome>
  );
}

function StatGrid({ stats, loading }) {
  const t = useT();
  const cards = [
    { label: t("adminApprovals.stats.pendingApplications"), value: stats?.pendingApplications, tone: "coral" },
    { label: t("adminApprovals.stats.approvedMerchants"), value: stats?.totalMerchants, tone: "green" },
    { label: t("adminApprovals.stats.activeOffers"), value: stats?.activeOffers, tone: "yellow" },
    { label: t("adminApprovals.stats.totalUsers"), value: stats?.totalUsers, tone: "green" },
    { label: t("adminApprovals.stats.totalOrders"), value: stats?.totalOrders, tone: "green" },
    { label: t("adminApprovals.stats.completedOrders"), value: stats?.completedOrders, tone: "green" },
    { label: t("adminApprovals.stats.bannedUsers"), value: stats?.bannedUsers, tone: "coral" },
  ];

  const toneClass = {
    green: "text-eco-green",
    coral: "text-eco-coral",
    yellow: "text-eco-green",
  };

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border border-eco-green/10 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-eco-green/55">{c.label}</p>
          <p className={`mt-1 font-heading text-2xl font-bold tabular-nums ${toneClass[c.tone]}`}>
            {loading ? "…" : (c.value ?? 0)}
          </p>
        </div>
      ))}
    </div>
  );
}

function ApplicationsTable({ rows, actingId, onApprove, onReject }) {
  const t = useT();
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-eco-beige/40 text-left text-[10px] font-bold uppercase tracking-wider text-eco-green/60">
            <Th>{t("adminApprovals.table.applicant")}</Th>
            <Th>{t("adminApprovals.table.shop")}</Th>
            <Th>{t("adminApprovals.table.city")}</Th>
            <Th>{t("adminApprovals.table.registre")}</Th>
            <Th>{t("adminApprovals.table.submitted")}</Th>
            <Th className="text-right">{t("adminApprovals.table.actions")}</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-eco-green/10">
          {rows.map((m) => (
            <tr key={m.id} className="transition hover:bg-eco-beige/20">
              <Td>
                <div className="font-bold text-eco-green">{m.gerantNom || "—"}</div>
                <div className="font-mono text-[11px] text-eco-green/55">{m.gerantEmail}</div>
              </Td>
              <Td>
                <div className="font-bold text-eco-green">{m.nomBoutique}</div>
                <div className="text-[11px] text-eco-green/55">{m.cuisineType || m.description}</div>
              </Td>
              <Td>
                <span className="text-eco-green/80">{m.ville}</span>
                <div className="text-[11px] text-eco-green/45 truncate max-w-[180px]">{m.localisation}</div>
              </Td>
              <Td>
                <span className="inline-block rounded-lg bg-eco-beige/60 px-2 py-0.5 font-mono text-[11px] font-bold text-eco-green">
                  {m.registre}
                </span>
              </Td>
              <Td>
                <span className="text-eco-green/75">{new Date(m.dateCreation).toLocaleDateString()}</span>
                <div className="text-[11px] text-eco-green/45">{new Date(m.dateCreation).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
              </Td>
              <Td className="text-right whitespace-nowrap">
                <button
                  onClick={() => onApprove(m.id)}
                  disabled={actingId === m.id}
                  className="mr-1.5 inline-flex items-center rounded-lg bg-eco-green px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:brightness-[1.05] active:scale-[0.99] disabled:opacity-60"
                >
                  {t("adminApprovals.actions.approve")}
                </button>
                <button
                  onClick={() => onReject(m.id)}
                  disabled={actingId === m.id}
                  className="inline-flex items-center rounded-lg border border-eco-coral/30 bg-white px-2.5 py-1.5 text-[11px] font-bold text-eco-coral shadow-sm transition hover:bg-eco-coral/10 active:scale-[0.99] disabled:opacity-60"
                >
                  {t("adminApprovals.actions.reject")}
                </button>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, className = "" }) {
  return <th className={`px-5 py-3 ${className}`}>{children}</th>;
}

function Td({ children, className = "" }) {
  return <td className={`px-5 py-3 align-top ${className}`}>{children}</td>;
}

function RefreshIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M3 12a9 9 0 0 1 15.5-6.3M21 4v5h-5M21 12a9 9 0 0 1-15.5 6.3M3 20v-5h5"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}
