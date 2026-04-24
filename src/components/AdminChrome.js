import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logout } from "../api/auth";
import vertigoLogo from "../assets/vertigo-logo.png";

const NAV = [
  { to: "/admin/approvals", label: "Approvals", iconPath: "M5 12l5 5L20 7" },
];

export function AdminChrome({ title, subtitle, action, children }) {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await logout(); } catch { /* ignore */ }
    setUser(null);
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-eco-beige/40 font-body text-eco-green">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-black/10 bg-eco-green text-eco-beige md:flex">
        <div className="flex items-center gap-3 border-b border-eco-beige/15 px-5 py-5">
          <img src={vertigoLogo} alt="Vertigo" className="h-10 w-auto select-none" draggable={false} />
          <div className="min-w-0">
            <p className="truncate font-heading text-sm font-bold text-eco-beige">Vertigo</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-eco-beige/60">Admin console</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition",
                  isActive
                    ? "bg-eco-beige/20 text-white"
                    : "text-eco-beige/80 hover:bg-eco-beige/10 hover:text-white",
                ].join(" ")
              }
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path d={item.iconPath} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-eco-beige/15 p-4">
          <div className="rounded-xl bg-eco-beige/10 px-3 py-2.5">
            <p className="truncate text-xs font-bold text-eco-beige">{user?.nom ?? user?.Nom ?? "Admin"}</p>
            <p className="truncate text-[10px] text-eco-beige/60">{user?.email ?? user?.Email ?? ""}</p>
            <button
              onClick={handleLogout}
              className="mt-2 w-full rounded-lg border border-eco-beige/30 bg-eco-beige/5 px-2 py-1.5 text-[11px] font-bold text-eco-beige transition hover:border-eco-softYellow/50 hover:bg-eco-beige/15"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-10 border-b border-eco-green/10 bg-white">
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <div className="min-w-0">
              <p className="font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-eco-coral">
                {subtitle ?? "Admin"}
              </p>
              <h1 className="mt-1 truncate font-heading text-xl font-bold text-eco-green md:text-2xl">
                {title}
              </h1>
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>

          {/* Mobile nav */}
          <nav className="flex items-center gap-1 overflow-x-auto border-t border-eco-green/10 bg-eco-beige/40 px-4 py-2 md:hidden">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold",
                    isActive ? "bg-eco-green text-eco-beige" : "text-eco-green/70 hover:bg-white",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        {/* Content */}
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
