import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logout, getMe } from "../api/auth";
import { getMyOrders, ORDER_STATUS } from "../api/orders";
import { LanguageSwitcher, useT } from "../i18n";
import vertigoLogo from "../assets/vertigo-logo.png";

/**
 * AccountChrome — shared dashboard layout for authed pages.
 *
 * Props:
 *  - title?: string                   Top-bar page title
 *  - eyebrow?: string                 Tiny coral label above the title
 *  - breadcrumbs?: { label, to? }[]   Optional breadcrumb trail
 *  - showBack?: boolean               Show a back-arrow button at the top
 *  - action?: ReactNode               Right-side top-bar action slot
 *  - children: ReactNode              Page content
 */
export function AccountChrome({ title, eyebrow, breadcrumbs, showBack, action, children }) {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const t = useT();

  const [profile, setProfile] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    getMe()
      .then((u) => setProfile(u))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try { await logout(); } catch { /* ignore */ }
    setUser(null);
    navigate("/login", { replace: true });
  };

  const role = profile?.role ?? profile?.Role ?? user?.role ?? user?.Role ?? "Client";
  const roleKey = String(role).toLowerCase();
  const isGerant = roleKey === "gerant" || roleKey === "commercant" || roleKey === "merchant" || roleKey === "marchand";
  const isAdmin = roleKey === "admin";

  const fullName = profile?.nom ?? profile?.Nom ?? user?.nom ?? user?.Nom ?? "";
  const profilePic = profile?.profilImagePath ?? profile?.ProfilImagePath ?? "";
  const hasPhoto = profilePic && /^https?:\/\//i.test(profilePic);

  const SidebarBody = (
    <>
      <div className="flex items-center gap-3 border-b border-eco-beige/15 px-5 py-5">
        <img src={vertigoLogo} alt={t("common.appName")} className="h-10 w-auto select-none" draggable={false} />
        <div className="min-w-0">
          <p className="truncate font-heading text-sm font-bold text-eco-beige">{t("common.appName")}</p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-eco-beige/60">
            {t("profile.dashboard.sidebarSubtitle")}
          </p>
        </div>
      </div>

      <div className="px-5 py-5">
        <Link
          to="/profile"
          onClick={() => setMobileNavOpen(false)}
          className="mx-auto block h-20 w-20 overflow-hidden rounded-full bg-gradient-to-b from-eco-beige to-[#ead9b0] ring-[3px] ring-eco-beige/60 shadow-[0_10px_24px_-10px_rgba(0,0,0,0.45)] transition active:scale-[0.98]"
        >
          {hasPhoto ? (
            <img src={profilePic} alt={fullName} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          ) : (
            <span className="grid h-full w-full place-items-center"><PersonIcon className="h-10 w-10 text-eco-green/45" /></span>
          )}
        </Link>
        <p className="mt-3 truncate text-center font-heading text-sm font-bold text-eco-beige">{fullName || t("common.appName")}</p>
        <p className="truncate text-center text-[11px] text-eco-beige/65">{translateRole(t, role)}</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 pb-4">
        <SidebarLink to="/profile" icon={<DashboardIcon />} label={t("profile.dashboard.navDashboard")} onClick={() => setMobileNavOpen(false)} />
        <SidebarLink to="/deals" icon={<DealsIcon />} label={t("profile.dashboard.navDeals")} onClick={() => setMobileNavOpen(false)} />
        <SidebarLink to="/orders" icon={<OrdersIcon />} label={t("profile.dashboard.navOrders")} onClick={() => setMobileNavOpen(false)} />
        <SidebarLink to="/favorites" icon={<HeartIcon />} label={t("profile.dashboard.navFavorites")} onClick={() => setMobileNavOpen(false)} />
        {isGerant && (
          <SidebarLink to="/my-restaurant" icon={<StoreIcon />} label={t("profile.dashboard.navMerchant")} onClick={() => setMobileNavOpen(false)} />
        )}
        {!isGerant && !isAdmin && (
          <SidebarLink to="/become-merchant" icon={<StoreIcon />} label={t("profile.dashboard.navBecomeMerchant")} onClick={() => setMobileNavOpen(false)} />
        )}
        {isAdmin && (
          <SidebarLink to="/admin/approvals" icon={<ShieldIcon />} label={t("common.nav.adminApprovals")} onClick={() => setMobileNavOpen(false)} />
        )}
      </nav>

      <div className="space-y-2 border-t border-eco-beige/15 p-4">
        <LanguageSwitcher variant="dark" className="w-full justify-center" />
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-eco-beige/30 bg-eco-beige/5 px-3 py-2 text-xs font-bold text-eco-beige transition hover:border-eco-softYellow/50 hover:bg-eco-beige/15"
        >
          <LogoutIcon className="h-4 w-4" />
          {t("profile.dashboard.navLogout")}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-glass-page font-body text-eco-green">
      {/* Desktop sidebar — sticks in place while the main column scrolls */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-eco-green/10 bg-eco-green text-eco-beige md:flex">
        {SidebarBody}
      </aside>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileNavOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <aside
            className="absolute inset-y-0 left-0 flex w-72 flex-col bg-eco-green text-eco-beige shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {SidebarBody}
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-eco-green/10 bg-eco-green text-eco-beige md:bg-white md:text-eco-green md:shadow-[0_8px_24px_-22px_rgba(63,93,58,0.5)]">
          <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-8 md:py-4">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {/* Mobile hamburger */}
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="grid h-9 w-9 place-items-center rounded-xl bg-eco-beige/15 text-eco-beige md:hidden"
                aria-label="Open menu"
              >
                <MenuIcon className="h-5 w-5" />
              </button>

              {/* Mobile logo */}
              <Link to="/profile" className="md:hidden">
                <img src={vertigoLogo} alt={t("common.appName")} className="h-9 w-auto" />
              </Link>

              {/* Desktop: back + breadcrumbs + title */}
              <div className="hidden min-w-0 items-center gap-3 md:flex">
                {showBack && (
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-1 rounded-full bg-eco-green/5 px-3 py-1.5 text-[11px] font-bold text-eco-green transition hover:bg-eco-green/10"
                  >
                    <ArrowLeftIcon className="h-3.5 w-3.5" />
                    {t("common.back")}
                  </button>
                )}

                <div className="min-w-0">
                  {breadcrumbs && breadcrumbs.length > 0 && (
                    <nav className="mb-0.5 flex items-center gap-1 text-[11px] font-semibold text-eco-green/55">
                      {breadcrumbs.map((b, i) => (
                        <span key={i} className="inline-flex items-center gap-1">
                          {b.to ? (
                            <Link to={b.to} className="hover:text-eco-coral">{b.label}</Link>
                          ) : (
                            <span>{b.label}</span>
                          )}
                          {i < breadcrumbs.length - 1 && <span className="opacity-50">/</span>}
                        </span>
                      ))}
                    </nav>
                  )}
                  {eyebrow && (
                    <p className="font-heading text-[10px] font-bold uppercase tracking-[0.22em] text-eco-coral">{eyebrow}</p>
                  )}
                  {title && (
                    <h1 className="truncate font-heading text-lg font-extrabold tracking-tight text-eco-green md:text-xl">
                      {title}
                    </h1>
                  )}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {action}
              <NotificationBell />
              <LanguageSwitcher variant={location.pathname.startsWith("/profile") ? "default" : "default"} className="hidden md:inline-flex" />
            </div>
          </div>

          {/* Mobile sub-bar: back + title */}
          {(showBack || title) && (
            <div className="flex items-center gap-2 px-4 pb-3 md:hidden">
              {showBack && (
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center gap-1 rounded-full bg-eco-beige/15 px-2.5 py-1 text-[11px] font-bold text-eco-beige"
                >
                  <ArrowLeftIcon className="h-3 w-3" />
                  {t("common.back")}
                </button>
              )}
              {title && <h1 className="truncate font-heading text-sm font-bold text-eco-beige">{title}</h1>}
            </div>
          )}
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}

const READ_STORAGE_KEY = "vertigo:notif:read";
const DISMISS_STORAGE_KEY = "vertigo:notif:dismissed";

const STATUS_NOTIF = {
  [ORDER_STATUS.Pending]: { key: "profile.dashboard.notif.status.pending", tone: "neutral" },
  [ORDER_STATUS.Preparing]: { key: "profile.dashboard.notif.status.preparing", tone: "yellow" },
  [ORDER_STATUS.OnTheWay]: { key: "profile.dashboard.notif.status.ready", tone: "coral" },
  [ORDER_STATUS.Delivered]: { key: "profile.dashboard.notif.status.delivered", tone: "green" },
  [ORDER_STATUS.Cancelled]: { key: "profile.dashboard.notif.status.cancelled", tone: "red" },
};

function readStoredSet(key) {
  try {
    const raw = localStorage.getItem(key);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function NotificationBell() {
  const t = useT();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [readSet, setReadSet] = useState(() => readStoredSet(READ_STORAGE_KEY));
  const [dismissedSet, setDismissedSet] = useState(() => readStoredSet(DISMISS_STORAGE_KEY));
  const ref = useRef(null);

  const load = useCallback(() => {
    getMyOrders()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setOrders(list);
        // Drop read/dismissed state for orders that no longer exist (cancelled/deleted).
        const validIds = new Set(list.map((o) => String(o.id)));
        const prune = (prev, key) => {
          const next = new Set([...prev].filter((k) => validIds.has(k.split(":")[0])));
          if (next.size === prev.size) return prev;
          try { localStorage.setItem(key, JSON.stringify([...next])); } catch { /* ignore */ }
          return next;
        };
        setReadSet((prev) => prune(prev, READ_STORAGE_KEY));
        setDismissedSet((prev) => prune(prev, DISMISS_STORAGE_KEY));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const onChange = () => load();
    window.addEventListener("vertigo:orders-changed", onChange);
    return () => window.removeEventListener("vertigo:orders-changed", onChange);
  }, [load]);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const notifications = useMemo(() => {
    return orders
      .map((o) => {
        const meta = STATUS_NOTIF[o.status];
        if (!meta) return null;
        return {
          id: `${o.id}:${o.status}`,
          orderId: o.id,
          tone: meta.tone,
          message: t(meta.key, { name: o.panierName ?? "" }),
          date: o.dateDeCommande ? new Date(o.dateDeCommande) : null,
        };
      })
      .filter(Boolean)
      .filter((n) => !dismissedSet.has(n.id))
      .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
      .slice(0, 12);
  }, [orders, t, dismissedSet]);

  const unread = notifications.filter((n) => !readSet.has(n.id)).length;

  const persist = (set) => {
    setReadSet(new Set(set));
    try { localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...set])); } catch { /* ignore */ }
  };

  const markAll = () => persist(new Set(notifications.map((n) => n.id)));

  const dismiss = (id) => {
    setDismissedSet((prev) => {
      const next = new Set(prev).add(id);
      try { localStorage.setItem(DISMISS_STORAGE_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  };

  const handleOpen = (n) => {
    persist(new Set([...readSet, n.id]));
    setOpen(false);
    navigate("/orders");
  };

  return (
    <div className="relative hidden md:block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("profile.dashboard.notifications")}
        aria-expanded={open}
        className="relative grid h-10 w-10 place-items-center rounded-full bg-eco-green/5 text-eco-green transition hover:bg-eco-green/10"
      >
        <BellIcon className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-eco-coral px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-30 w-80 overflow-hidden rounded-2xl border border-eco-green/8 bg-white shadow-[0_2px_8px_rgba(63,93,58,0.06),0_28px_60px_-24px_rgba(63,93,58,0.4)]">
          <div className="flex items-center justify-between border-b border-eco-green/8 px-4 py-3">
            <p className="font-heading text-sm font-bold text-eco-green">{t("profile.dashboard.notif.title")}</p>
            {unread > 0 && (
              <button type="button" onClick={markAll} className="text-[11px] font-bold text-eco-coral hover:underline">
                {t("profile.dashboard.notif.markAll")}
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-eco-green/55">{t("profile.dashboard.notif.empty")}</p>
          ) : (
            <ul className="max-h-80 divide-y divide-eco-green/8 overflow-y-auto">
              {notifications.map((n) => {
                const isUnread = !readSet.has(n.id);
                return (
                  <li
                    key={n.id}
                    className={`group relative flex items-start gap-2 px-4 py-3 transition hover:bg-eco-beige/20 ${isUnread ? "bg-eco-coral/[0.03]" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => handleOpen(n)}
                      className="flex min-w-0 flex-1 items-start gap-3 text-left"
                    >
                      <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${notifToneClass(n.tone)}`}>
                        <BellIcon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] leading-snug text-eco-green">{n.message}</span>
                        {n.date && (
                          <span className="mt-0.5 block text-[11px] text-eco-green/45">
                            {n.date.toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </span>
                      {isUnread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-eco-coral" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => dismiss(n.id)}
                      aria-label={t("profile.dashboard.notif.dismiss")}
                      title={t("profile.dashboard.notif.dismiss")}
                      className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-eco-green/35 transition hover:bg-eco-green/10 hover:text-eco-green active:scale-90"
                    >
                      <CloseIcon className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <Link
            to="/orders"
            onClick={() => setOpen(false)}
            className="block border-t border-eco-green/8 px-4 py-2.5 text-center text-[12px] font-bold text-eco-green transition hover:bg-eco-beige/20"
          >
            {t("profile.dashboard.notif.viewAll")}
          </Link>
        </div>
      )}
    </div>
  );
}

function CloseIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function notifToneClass(tone) {
  return {
    green: "bg-eco-green/10 text-eco-green",
    coral: "bg-eco-coral/12 text-eco-coral",
    yellow: "bg-eco-softYellow/40 text-eco-green",
    red: "bg-red-50 text-red-500",
    neutral: "bg-eco-green/[0.06] text-eco-green/60",
  }[tone] ?? "bg-eco-green/[0.06] text-eco-green/60";
}

function SidebarLink({ to, icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === "/profile"}
      onClick={onClick}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition",
          isActive
            ? "bg-eco-beige/20 text-white"
            : "text-eco-beige/80 hover:bg-eco-beige/10 hover:text-white",
        ].join(" ")
      }
    >
      <span className="grid h-4 w-4 place-items-center">{icon}</span>
      {label}
    </NavLink>
  );
}

function translateRole(t, role) {
  if (!role) return "";
  const key = String(role).toLowerCase();
  if (key === "client") return t("common.role.client");
  if (key === "merchant" || key === "marchand" || key === "gerant" || key === "commercant") return t("common.role.merchant");
  if (key === "admin") return t("common.role.admin");
  return role;
}

/* ─── Icons ─────────────────────────────────────────────────────────────── */

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="13" y="3" width="8" height="5" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="13" y="10" width="8" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function DealsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
function OrdersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M5 7h14l-1.5 12.5a1.5 1.5 0 0 1-1.5 1.3H8a1.5 1.5 0 0 1-1.5-1.3L5 7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M3 9l1-4h16l1 4M4 9v11h16V9M9 13h6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M12 3 4 6v6c0 4.5 3.4 7.9 8 9 4.6-1.1 8-4.5 8-9V6l-8-3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
function LogoutIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 12h12m0 0-3-3m3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function BellIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 8a6 6 0 1 1 12 0v5l1.5 3h-15L6 13V8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function MenuIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function ArrowLeftIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
