import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AuthCard,
  AuthChrome,
  AuthEyebrow,
  AuthInput,
} from "../components/auth/AuthChrome";
import { login } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        setError("Your account has been suspended.");
      } else if (err.status === 401) {
        setError("Incorrect email or password.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthChrome variant="login">
      <main className="mx-auto flex min-h-[calc(100vh-5.25rem)] max-w-6xl items-center justify-center px-4 py-12 md:px-6 md:py-16 lg:py-20  bg-[#F4E3B2]/60">
        <AuthCard>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:items-center">
            <div className="lg:pr-4">
              <AuthEyebrow>Welcome back</AuthEyebrow>
              <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight text-eco-green md:text-5xl">
                Log in
              </h1>
              <p className="mt-4 max-w-md text-base leading-relaxed text-eco-green/70 md:text-lg">
                Enter your email and password to view your rescued baskets and
                track deliveries.
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
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
              />
              <AuthInput
                id="login-password"
                name="password"
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
              />

              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-eco-green/65">
                  <input
                    type="checkbox"
                    name="remember"
                    className="h-4 w-4 rounded border-eco-green/25 text-eco-green focus:ring-eco-coral/30"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  className="text-sm font-medium text-eco-coral underline-offset-4 transition hover:text-eco-green hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-eco-green py-3.5 font-heading text-sm font-bold tracking-wide text-white shadow-lg shadow-eco-green/25 transition hover:brightness-[1.05] active:scale-[0.99] disabled:opacity-60 md:mt-1"
              >
                {loading ? "Logging in…" : "Log in"}
              </button>

              <p className="text-center text-sm text-eco-green/55 lg:hidden">
                New to Vertigo?{" "}
                <Link
                  to="/signup"
                  className="font-semibold text-eco-coral underline-offset-2 hover:underline"
                >
                  Create an account
                </Link>
              </p>
            </form>
          </div>
        </AuthCard>
      </main>
    </AuthChrome>
  );
}
