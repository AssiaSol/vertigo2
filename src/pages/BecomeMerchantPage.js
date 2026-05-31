import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AccountChrome } from "../components/AccountChrome";
import { applyMerchant, getMyMerchant } from "../api/merchants";
import { useT } from "../i18n";

export function BecomeMerchantPage() {
  const navigate = useNavigate();
  const t = useT();
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
        setError(flat[0] || t("becomeMerchant.validationFailed"));
      } else {
        setError(err.data?.message || t("becomeMerchant.submitFailed"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AccountChrome
      showBack
      eyebrow={t("becomeMerchant.eyebrow")}
      title={t("becomeMerchant.title")}
      breadcrumbs={[{ label: t("profile.dashboard.navDashboard"), to: "/profile" }, { label: t("becomeMerchant.title") }]}
    >
      <div className="mx-auto max-w-3xl">
        <p className="text-sm text-eco-green/70 md:text-base">
          {t("becomeMerchant.intro")}{" "}
          <strong>{t("becomeMerchant.registreLabel")}</strong>.
        </p>

        {checking && <p className="mt-6 text-sm text-eco-green/60">{t("becomeMerchant.checking")}</p>}

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
              <Field label={t("becomeMerchant.shopName")} name="nomBoutique" placeholder={t("becomeMerchant.shopNamePlaceholder")} required />
              <Field label={t("becomeMerchant.city")} name="ville" placeholder={t("becomeMerchant.cityPlaceholder")} required />
            </div>

            <Field label={t("becomeMerchant.description")} name="description" placeholder={t("becomeMerchant.descriptionPlaceholder")} required />

            <Field
              label={t("becomeMerchant.address")}
              name="localisation"
              placeholder={t("becomeMerchant.addressPlaceholder")}
              required
            />

            <Field
              label={t("becomeMerchant.registre")}
              name="registre"
              placeholder={t("becomeMerchant.registrePlaceholder")}
              required
              hint={t("becomeMerchant.registreHint")}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("becomeMerchant.cuisineType")} name="cuisineType" placeholder={t("becomeMerchant.cuisineTypePlaceholder")} />
              <Field label={t("becomeMerchant.phone")} name="phoneNumber" type="tel" placeholder={t("becomeMerchant.phonePlaceholder")} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("becomeMerchant.latitude")} name="latitude" placeholder={t("becomeMerchant.latitudePlaceholder")} />
              <Field label={t("becomeMerchant.longitude")} name="longitude" placeholder={t("becomeMerchant.longitudePlaceholder")} />
            </div>

            <Field label={t("becomeMerchant.imageUrl")} name="boutiqueImagePath" placeholder={t("becomeMerchant.imageUrlPlaceholder")} />

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 inline-flex justify-center rounded-xl bg-eco-green px-6 py-3 font-heading text-sm font-bold tracking-wide text-white shadow-lg shadow-eco-green/25 transition hover:brightness-[1.05] active:scale-[0.99] disabled:opacity-60"
            >
              {submitting ? t("becomeMerchant.submitting") : t("becomeMerchant.submit")}
            </button>
          </form>
        )}
      </div>
    </AccountChrome>
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
  const t = useT();
  if (boutique.valide) {
    return (
      <div className="mt-6 rounded-2xl border border-eco-green/20 bg-white p-6 shadow-sm">
        <p className="font-heading text-lg font-semibold text-eco-green">{t("becomeMerchant.approvedTitle")}</p>
        <p className="mt-1 text-sm text-eco-green/60">
          {t("becomeMerchant.approvedBody", { name: boutique.nomBoutique })}
        </p>
        <button
          onClick={onContinue}
          className="mt-4 inline-flex rounded-xl bg-eco-green px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:brightness-[1.05] active:scale-[0.99]"
        >
          {t("becomeMerchant.goToRestaurant")}
        </button>
      </div>
    );
  }
  return (
    <div className="mt-6 rounded-2xl border border-eco-softYellow/40 bg-eco-softYellow/20 p-6">
      <p className="font-heading text-lg font-semibold text-eco-green">{t("becomeMerchant.awaitingTitle")}</p>
      <p className="mt-1 text-sm text-eco-green/70">
        {t("becomeMerchant.awaitingBody", {
          name: boutique.nomBoutique,
          date: new Date(boutique.dateCreation).toLocaleDateString(),
          registre: boutique.registre,
        })}
      </p>
    </div>
  );
}
