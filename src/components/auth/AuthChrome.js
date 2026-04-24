import { Link } from "react-router-dom";
import vertigoLogo from "../../assets/vertigo-logo.png";

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

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-eco-beige font-body text-eco-green">
      <div
        className="pointer-events-none fixed inset-0 opacity-90"
        aria-hidden="true"
      >
        <div className="absolute -left-1/4 top-0 h-[50vh] w-[70vw] rounded-full bg-eco-softYellow/25 blur-3xl" />
        <div className="absolute -right-1/4 bottom-0 h-[45vh] w-[65vw] rounded-full bg-eco-coral/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-eco-green/[0.06] blur-2xl" />
      </div>

      <header className="relative z-10 border-b border-black/5 bg-eco-green text-eco-beige shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link
            to="/"
            className="inline-flex rounded-lg ring-eco-softYellow/0 transition hover:ring-2 hover:ring-eco-softYellow/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-softYellow"
          >
            <img
              src={vertigoLogo}
              alt="Vertigo — home"
              className="h-11 w-auto select-none md:h-[3.25rem]"
              draggable={false}
            />
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            {isLogin ? (
              <>
                <span className="hidden text-sm text-eco-beige/70 sm:inline">
                  New here?
                </span>
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#d6d1c4] bg-[#e8e1d3] px-3.5 py-2 text-xs font-semibold text-[#2f2d27] shadow-sm transition hover:bg-[#ddd5c5] sm:px-4 sm:text-sm"
                >
                  Create account
                  <ArrowIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Link>
              </>
            ) : (
              <>
                <span className="hidden text-sm text-eco-beige/70 sm:inline">
                  Have an account?
                </span>
                <Link
                  to="/login"
                  className="rounded-xl border border-eco-beige/35 bg-eco-beige/10 px-4 py-2 text-sm font-semibold text-eco-beige backdrop-blur-sm transition hover:border-eco-softYellow/50 hover:bg-eco-beige/20 hover:text-white"
                >
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="relative z-[1]">{children}</div>
    </div>
  );
}

export function AuthCard({ children }) {
  return (
    <div className="mx-auto w-full max-w-4xl rounded-3xl border border-eco-green/10 bg-white/75 p-8 shadow-[0_24px_64px_-12px_rgba(63,93,58,0.18)] backdrop-blur-xl md:p-10 lg:p-12">
      {children}
    </div>
  );
}

export function AuthEyebrow({ children }) {
  return (
    <p className="font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-eco-coral">
      {children}
    </p>
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
        className="block text-xs font-semibold uppercase tracking-wide text-eco-green/55"
      >
        {label}
      </label>
      <input
        id={id}
        name={name ?? id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="w-full rounded-xl border border-eco-green/15 bg-eco-beige/35 px-4 py-3 text-sm text-eco-green shadow-sm transition placeholder:text-eco-green/35 focus:border-eco-coral/60 focus:bg-white/80 focus:outline-none focus:ring-2 focus:ring-eco-coral/20"
      />
    </div>
  );
}
