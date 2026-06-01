import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AuthCard,
  AuthChrome,
  AuthEyebrow,
  AuthInput,
  AuthPasswordInput,
} from "../components/auth/AuthChrome";
import { login } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useT } from "../i18n";
import { BannedScreen } from "../components/BannedScreen";

export function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const t = useT();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [banned, setBanned] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const data = new FormData(e.currentTarget);
    try {
      const res = await login({
        email: data.get("email"),
        password: data.get("password"),
      });
      setUser(res.user);
      navigate("/deals");
    } catch (err) {
      if (err.status === 403) {
        setBanned(true);
      } else if (err.status === 401) {
        setError(t("login.errors.invalid"));
      } else {
        setError(t("login.errors.generic"));
      }
    } finally {
      setLoading(false);
    }
  };

  if (banned) {
    return <BannedScreen />;
  }

  return (
    <AuthChrome variant="login">
      <main className="mx-auto flex min-h-[calc(100vh-5.25rem)] max-w-6xl items-center justify-center px-4 py-12 md:px-6 md:py-16 lg:py-20">
        <AuthCard>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:items-center">
            <div className="lg:pr-4">
              <AuthEyebrow>{t("login.eyebrow")}</AuthEyebrow>
              <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight text-eco-green md:text-5xl">
                {t("login.title")}
              </h1>
              <p className="mt-4 max-w-md text-base leading-relaxed text-eco-green/70 md:text-lg">
                {t("login.subtitle")}
              </p>
              <div className="mt-8 hidden h-px w-16 rounded-full bg-gradient-to-r from-eco-coral to-eco-softYellow lg:block" />
            </div>

            <form
              onSubmit={onSubmit}
              className="flex flex-col gap-5 lg:max-w-md lg:justify-self-end"
            >
              {error && (
                <p className="rounded-xl border border-eco-coral/25 bg-eco-coral/10 px-4 py-3 text-sm text-eco-coral">
                  {error}
                </p>
              )}

              <AuthInput
                id="login-email"
                name="email"
                label={t("login.emailLabel")}
                type="email"
                autoComplete="email"
                placeholder={t("login.emailPlaceholder")}
              />
              <AuthPasswordInput
                id="login-password"
                name="password"
                label={t("login.passwordLabel")}
                autoComplete="current-password"
                placeholder={t("login.passwordPlaceholder")}
              />

              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-eco-green/65">
                  <input
                    type="checkbox"
                    name="remember"
                    className="h-4 w-4 rounded border-eco-green/25 text-eco-green focus:ring-eco-coral/30"
                  />
                  {t("login.rememberMe")}
                </label>
                <button
                  type="button"
                  className="text-sm font-medium text-eco-coral underline-offset-4 transition hover:text-eco-green hover:underline"
                >
                  {t("login.forgotPassword")}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-2xl bg-gradient-to-b from-eco-green to-[#324a2d] py-4 font-heading text-sm font-bold tracking-wide text-white shadow-[0_14px_32px_-12px_rgba(63,93,58,0.55)] transition hover:brightness-[1.08] active:scale-[0.99] disabled:opacity-60 md:mt-1"
              >
                {loading ? t("login.submitting") : t("login.submit")}
              </button>

              <p className="text-center text-sm text-eco-green/55">
                {t("login.newToVertigo")}{" "}
                <Link
                  to="/signup"
                  className="font-semibold text-eco-coral underline-offset-2 hover:underline"
                >
                  {t("login.createAccount")}
                </Link>
              </p>
            </form>
          </div>
        </AuthCard>
      </main>
    </AuthChrome>
  );
}
