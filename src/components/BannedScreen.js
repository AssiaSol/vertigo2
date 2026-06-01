import { logout } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useT } from "../i18n";

// Plain full-screen lock shown to a banned user. No app access — only log out.
export function BannedScreen() {
  const { setUser } = useAuth();
  const t = useT();

  const handleLogout = async () => {
    try { await logout(); } catch { /* ignore */ }
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <div className="grid min-h-screen place-items-center bg-eco-beige px-4">
      <div className="w-full max-w-md rounded-3xl border border-eco-coral/20 bg-white p-8 text-center shadow-[0_20px_50px_-24px_rgba(0,0,0,0.25)]">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-eco-coral/10 text-eco-coral">
          <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            <path d="M5.6 5.6l12.8 12.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="mt-5 font-heading text-2xl font-extrabold text-eco-green">
          {t("banned.title")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-eco-green/65">
          {t("banned.message")}
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-7 w-full rounded-xl bg-eco-green px-5 py-3 font-heading text-sm font-bold text-white shadow-sm transition hover:brightness-[1.06] active:scale-[0.99]"
        >
          {t("banned.logout")}
        </button>
      </div>
    </div>
  );
}
