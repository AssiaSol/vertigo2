import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AuthCard,
  AuthChrome,
  AuthEyebrow,
  AuthInput,
  AuthPasswordInput,
} from "../components/auth/AuthChrome";
import { signup } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useT } from "../i18n";

const WILAYAS = [
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra",
  "Béchar", "Blida", "Bouira", "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret",
  "Tizi Ouzou", "Alger", "Djelfa", "Jijel", "Sétif", "Saïda", "Skikda",
  "Sidi Bel Abbès", "Annaba", "Guelma", "Constantine", "Médéa", "Mostaganem",
  "M'Sila", "Mascara", "Ouargla", "Oran", "El Bayadh", "Illizi",
  "Bordj Bou Arréridj", "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt",
  "El Oued", "Khenchela", "Souk Ahras", "Tipaza", "Mila", "Aïn Defla",
  "Naâma", "Aïn Témouchent", "Ghardaïa", "Relizane",
];

function WilayaSelect() {
  const t = useT();
  return (
    <div className="space-y-1.5">
      <label
        htmlFor="signup-wilaya"
        className="block text-xs font-semibold uppercase tracking-wide text-eco-green/55"
      >
        {t("signup.wilaya")}
      </label>
      <select
        id="signup-wilaya"
        name="wilaya"
        required
        defaultValue=""
        className="w-full rounded-xl border border-eco-green/15 bg-eco-beige/35 px-4 py-3 text-sm text-eco-green shadow-sm transition focus:border-eco-coral/60 focus:bg-white/80 focus:outline-none focus:ring-2 focus:ring-eco-coral/20"
      >
        <option value="" disabled>{t("signup.wilayaPlaceholder")}</option>
        {WILAYAS.map((w) => <option key={w} value={w}>{w}</option>)}
      </select>
    </div>
  );
}

function extractErrorMessage(err) {
  const d = err?.data;
  if (!d) return null;
  if (typeof d === "string") return d;

  // Single field error: { field, message }
  if (typeof d.message === "string") return d.message;

  // Multiple errors as array: { errors: [{ field, message }, ...] }
  if (Array.isArray(d.errors)) {
    const first = d.errors.find((e) => e && typeof e.message === "string");
    if (first) return first.message;
  }

  // ASP.NET ModelState: { errors: { FieldName: ["msg", ...] } }
  if (d.errors && typeof d.errors === "object") {
    for (const v of Object.values(d.errors)) {
      if (Array.isArray(v)) {
        const m = v.find((x) => typeof x === "string");
        if (m) return m;
      } else if (typeof v === "string") {
        return v;
      }
    }
  }

  return null;
}

export function SignUpPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const t = useT();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const data = new FormData(e.currentTarget);
    const firstName = data.get("firstName")?.trim() ?? "";
    const lastName = data.get("lastName")?.trim() ?? "";
    const nom = [firstName, lastName].filter(Boolean).join(" ");

    try {
      const res = await signup({
        nom,
        email: data.get("email"),
        motDePasse: data.get("password"),
        telephone: data.get("telephone"),
        wilaya: data.get("wilaya"),
      });
      setUser(res);
      navigate("/deals");
    } catch (err) {
      setError(extractErrorMessage(err) || t("signup.genericError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthChrome variant="signup">
      <main className="mx-auto flex min-h-[calc(100vh-5.25rem)] max-w-6xl items-center justify-center px-4 py-12 md:px-6 md:py-16 lg:py-20">
        <AuthCard>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:items-start">
            <div className="lg:pr-4">
              <AuthEyebrow>{t("signup.eyebrow")}</AuthEyebrow>
              <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight text-eco-green md:text-5xl">
                {t("signup.createAccount")}
              </h1>
              <p className="mt-4 max-w-md text-base leading-relaxed text-eco-green/70 md:text-lg">
                {t("signup.intro")}
              </p>
              <div className="mt-8 hidden h-px w-16 rounded-full bg-gradient-to-r from-eco-coral to-eco-softYellow lg:block" />
            </div>

            <form
              onSubmit={onSubmit}
              className="flex flex-col gap-4 lg:max-w-md lg:justify-self-end"
            >
              {error && (
                <p className="rounded-xl border border-eco-coral/25 bg-eco-coral/10 px-4 py-3 text-sm text-eco-coral">
                  {error}
                </p>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <AuthInput
                  id="firstName"
                  name="firstName"
                  label={t("signup.firstName")}
                  autoComplete="given-name"
                  placeholder={t("signup.firstNamePlaceholder")}
                />
                <AuthInput
                  id="lastName"
                  name="lastName"
                  label={t("signup.lastName")}
                  autoComplete="family-name"
                  placeholder={t("signup.lastNamePlaceholder")}
                />
              </div>
              <AuthInput
                id="signup-email"
                name="email"
                label={t("signup.email")}
                type="email"
                autoComplete="email"
                placeholder={t("signup.emailPlaceholder")}
              />
              <AuthInput
                id="signup-telephone"
                name="telephone"
                label={t("signup.phone")}
                type="tel"
                autoComplete="tel"
                placeholder={t("signup.phonePlaceholder")}
              />
              <WilayaSelect />
              <AuthPasswordInput
                id="signup-password"
                name="password"
                label={t("signup.password")}
                autoComplete="new-password"
                placeholder={t("signup.passwordPlaceholder")}
              />

              <p className="text-xs leading-relaxed text-eco-green/50">
                {t("signup.terms")}
              </p>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end sm:gap-3">
                <Link
                  to="/"
                  className="inline-flex min-h-[3rem] items-center justify-center rounded-2xl border border-white/50 bg-white/45 px-6 text-sm font-semibold text-eco-green shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-md transition hover:bg-white/65 active:scale-[0.99]"
                >
                  {t("signup.cancel")}
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex min-h-[3rem] items-center justify-center rounded-2xl bg-gradient-to-b from-eco-green to-[#324a2d] px-8 text-sm font-bold tracking-wide text-white shadow-[0_14px_32px_-12px_rgba(63,93,58,0.55)] transition hover:brightness-[1.08] active:scale-[0.99] disabled:opacity-60"
                >
                  {loading ? t("signup.submitting") : t("signup.submit")}
                </button>
              </div>

              <p className="text-center text-sm text-eco-green/55">
                {t("signup.alreadyRegistered")}{" "}
                <Link
                  to="/login"
                  className="font-semibold text-eco-coral underline-offset-2 hover:underline"
                >
                  {t("signup.logIn")}
                </Link>
              </p>
            </form>
          </div>
        </AuthCard>
      </main>
    </AuthChrome>
  );
}
