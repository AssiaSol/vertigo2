import { useState } from "react";
import { Link } from "react-router-dom";
import vertigoLogo from "../../assets/vertigo-logo.png";
import { LanguageSwitcher, useT } from "../../i18n";

function ArrowIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M13.2 5.6 19.6 12l-6.4 6.4M19 12H4.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * @param {{ variant: 'login' | 'signup' }} props
 */
export function AuthChrome({ variant, children }) {
  const isLogin = variant === "login";
  const t = useT();

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-eco-beige via-[#f7ecc9] to-[#ffe3cc] font-body text-eco-green">
      {/* Multi-layer blurred gradient orbs — premium ambient background */}
      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        <div className="absolute -left-[10%] top-[-15%] h-[55vh] w-[70vw] rounded-full bg-eco-softYellow/35 blur-[90px]" />
        <div className="absolute -right-[15%] top-[30%] h-[55vh] w-[60vw] rounded-full bg-eco-coral/20 blur-[100px]" />
        <div className="absolute -bottom-[20%] left-[20%] h-[55vh] w-[60vw] rounded-full bg-eco-green/[0.10] blur-[110px]" />
        <div className="absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2 rounded-full bg-white/30 blur-[60px]" />
        {/* Noise overlay for depth */}
        <div
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/10 bg-eco-green/95 text-eco-beige shadow-[0_10px_40px_-12px_rgba(63,93,58,0.4)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <Link
            to="/"
            className="inline-flex rounded-lg ring-eco-softYellow/0 transition hover:ring-2 hover:ring-eco-softYellow/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-softYellow"
          >
            <img
              src={vertigoLogo}
              alt={t("common.appName")}
              className="h-11 w-auto select-none md:h-[3.25rem]"
              draggable={false}
            />
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            {isLogin ? (
              <>
                <span className="hidden text-sm text-eco-beige/70 sm:inline">
                  {t("login.newHere")}
                </span>
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 rounded-xl bg-eco-coral px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-95 sm:text-sm"
                >
                  {t("signup.createAccount")}
                  <ArrowIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Link>
              </>
            ) : (
              <>
                <span className="hidden text-sm text-eco-beige/70 sm:inline">
                  {t("signup.haveAccount")}
                </span>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-eco-coral px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-95 sm:text-sm"
                >
                  {t("common.nav.login")}
                  <ArrowIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Link>
              </>
            )}
            <LanguageSwitcher variant="dark" className="ml-1" />
          </div>
        </div>
      </header>

      <div className="relative z-[1]">{children}</div>
    </div>
  );
}

export function AuthCard({ children }) {
  return (
    <div className="relative mx-auto w-full max-w-4xl">
      {/* Faint outer glow for premium depth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-[1px] rounded-[28px] bg-gradient-to-b from-white/70 via-white/20 to-transparent opacity-60 blur-[1px]"
      />
      <div className="relative overflow-hidden rounded-[28px] border border-white/50 bg-white/40 p-8 shadow-[0_28px_64px_-20px_rgba(63,93,58,0.28)] backdrop-blur-2xl ring-1 ring-white/20 md:p-10 lg:p-12">
        {/* Subtle top highlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"
        />
        {/* Inner soft radial */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[70%] -translate-x-1/2 rounded-full bg-white/40 blur-3xl"
        />
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}

export function AuthEyebrow({ children }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-eco-coral/10 px-3 py-1 ring-1 ring-eco-coral/15">
      <span className="h-1.5 w-1.5 rounded-full bg-eco-coral" />
      <p className="font-heading text-[10px] font-bold uppercase tracking-[0.24em] text-eco-coral">
        {children}
      </p>
    </div>
  );
}

export function AuthInput({
  id,
  name,
  label,
  type = "text",
  autoComplete,
  placeholder,
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-[10px] font-bold uppercase tracking-[0.18em] text-eco-green/60"
      >
        {label}
      </label>
      <input
        id={id}
        name={name ?? id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/50 bg-white/45 px-4 py-3.5 text-sm text-eco-green shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-md transition placeholder:text-eco-green/35 hover:bg-white/55 focus:border-eco-coral/50 focus:bg-white/75 focus:outline-none focus:ring-4 focus:ring-eco-coral/15"
      />
    </div>
  );
}

export function AuthPasswordInput({ id, name, label, autoComplete, placeholder }) {
  const [visible, setVisible] = useState(false);
  const t = useT();
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-[10px] font-bold uppercase tracking-[0.18em] text-eco-green/60"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name ?? id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-white/50 bg-white/45 px-4 py-3.5 pr-12 text-sm text-eco-green shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-md transition placeholder:text-eco-green/35 hover:bg-white/55 focus:border-eco-coral/50 focus:bg-white/75 focus:outline-none focus:ring-4 focus:ring-eco-coral/15"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t("login.hidePassword") : t("login.showPassword")}
          aria-pressed={visible}
          className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-eco-green/55 transition hover:bg-eco-green/[0.08] hover:text-eco-green active:scale-95"
        >
          {visible ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function EyeIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function EyeOffIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M10.6 6.2A10.9 10.9 0 0 1 12 6c6.5 0 10 6 10 6a17.9 17.9 0 0 1-3.3 4.1M6.7 7.7A17.7 17.7 0 0 0 2 12s3.5 6 10 6a10.9 10.9 0 0 0 4.3-.9"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
