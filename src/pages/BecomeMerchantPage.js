import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthedHeader } from "../components/AuthedHeader";
import { applyMerchant, getMyMerchant } from "../api/merchants";

export function BecomeMerchantPage() {
  const navigate = useNavigate();
  const [existing, setExisting] = useState(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getMyMerchant()
      .then((b) => setExisting(b))
      .catch(() => setExisting(null))
      .finally(() => setChecking(false));
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const data = new FormData(e.currentTarget);
    try {
      const res = await applyMerchant({
        NomBoutique: data.get("nomBoutique"),
        Ville: data.get("ville"),
        Description: data.get("description"),
        Localisation: data.get("localisation"),
        Registre: data.get("registre"),
        CuisineType: data.get("cuisineType") || null,
        PhoneNumber: data.get("phoneNumber") || null,
        Latitude: data.get("latitude") ? Number(data.get("latitude")) : null,
        Longitude: data.get("longitude") ? Number(data.get("longitude")) : null,
        BoutiqueImagePath: data.get("boutiqueImagePath") || null,
      });
      setExisting(res);
    } catch (err) {
      if (err.status === 400 && err.data?.errors) {
        const flat = Object.values(err.data.errors).flat();
        setError(flat[0] || "Validation failed.");
      } else {
        setError(err.data?.message || "Couldn't submit your application.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-eco-beige/40 font-body text-eco-green">
      <AuthedHeader />
      <main className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-10">
        <p className="font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-eco-coral">
          Open a shop
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-eco-green md:text-4xl">
          Become a merchant
        </h1>
        <p className="mt-2 text-sm text-eco-green/70 md:text-base">
          Real restaurants and stores only. We verify every application using your{" "}
          <strong>Registre de Commerce</strong> before approval.
        </p>

        {checking && <p className="mt-6 text-sm text-eco-green/60">Checking your status…</p>}

        {!checking && existing && (
          <StatusCard boutique={existing} onContinue={() => navigate("/my-restaurant")} />
        )}

        {!checking && !existing && (
          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4 rounded-2xl border border-eco-green/10 bg-white p-6 shadow-sm">
            {error && (
              <p className="rounded-xl border border-eco-coral/25 bg-eco-coral/10 px-4 py-3 text-sm text-eco-coral">
                {error}
              </p>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Shop name" name="nomBoutique" placeholder="Oran Bakery" required />
              <Field label="City" name="ville" placeholder="Oran" required />
            </div>

            <Field label="Short description (3-20 chars)" name="description" placeholder="Bakery" required />

            <Field
              label="Full address (min 25 chars)"
              name="localisation"
              placeholder="12 Rue principale, centre-ville d'Oran, Algérie"
              required
            />

            <Field
              label="Registre de Commerce"
              name="registre"
              placeholder="RC-12345"
              required
              hint="Your legal business registration number."
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Cuisine type" name="cuisineType" placeholder="Bakery" />
              <Field label="Phone number" name="phoneNumber" type="tel" placeholder="+213 555 123 456" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Latitude" name="latitude" placeholder="35.6969" />
              <Field label="Longitude" name="longitude" placeholder="-0.6331" />
            </div>

            <Field label="Image URL" name="boutiqueImagePath" placeholder="https://…" />

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 inline-flex justify-center rounded-xl bg-eco-green px-6 py-3 font-heading text-sm font-bold tracking-wide text-white shadow-lg shadow-eco-green/25 transition hover:brightness-[1.05] active:scale-[0.99] disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit application"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

function Field({ label, name, type = "text", placeholder, required, hint }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-xs font-semibold uppercase tracking-wide text-eco-green/55">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-eco-green/15 bg-eco-beige/35 px-4 py-3 text-sm text-eco-green shadow-sm placeholder:text-eco-green/35 focus:border-eco-coral/60 focus:bg-white/80 focus:outline-none focus:ring-2 focus:ring-eco-coral/20"
      />
      {hint && <p className="text-[11px] text-eco-green/50">{hint}</p>}
    </div>
  );
}

function StatusCard({ boutique, onContinue }) {
  if (boutique.valide) {
    return (
      <div className="mt-6 rounded-2xl border border-eco-green/20 bg-white p-6 shadow-sm">
        <p className="font-heading text-lg font-semibold text-eco-green">You're a merchant ✓</p>
        <p className="mt-1 text-sm text-eco-green/60">
          Your shop <strong>{boutique.nomBoutique}</strong> is approved and live.
        </p>
        <button
          onClick={onContinue}
          className="mt-4 inline-flex rounded-xl bg-eco-green px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:brightness-[1.05] active:scale-[0.99]"
        >
          Go to my restaurant
        </button>
      </div>
    );
  }
  return (
    <div className="mt-6 rounded-2xl border border-eco-softYellow/40 bg-eco-softYellow/20 p-6">
      <p className="font-heading text-lg font-semibold text-eco-green">Awaiting approval</p>
      <p className="mt-1 text-sm text-eco-green/70">
        Your application for <strong>{boutique.nomBoutique}</strong> was submitted on{" "}
        {new Date(boutique.dateCreation).toLocaleDateString()}. We'll review your Registre ({boutique.registre}) shortly.
      </p>
    </div>
  );
}
