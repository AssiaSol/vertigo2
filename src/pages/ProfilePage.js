import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMe, updateProfile } from "../api/auth";
import { getMyOrders, getBoutiqueOrders } from "../api/orders";
import { getMyFavorites } from "../api/favorites";
import { getMyMerchant } from "../api/merchants";
import { getMyDeals } from "../api/deals";
import { getAdminStats } from "../api/admin";
import { useT } from "../i18n";
import { AccountChrome } from "../components/AccountChrome";

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

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const t = useT();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [orders, setOrders] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    getMe()
      .then((u) => {
        setForm({
          Nom: u.nom ?? u.Nom ?? "",
          Email: u.email ?? u.Email ?? "",
          Telephone: u.telephone ?? u.Telephone ?? "",
          Wilaya: u.wilaya ?? u.Wilaya ?? "",
          Etudiant: u.etudiant ?? u.Etudiant ?? false,
          NumCarteEtu: u.numCarteEtu ?? u.NumCarteEtu ?? "",
          MotDePasse: "",
          ConfirmPhone: "",
          Role: u.role ?? u.Role ?? "Client",
          ProfilImagePath: u.profilImagePath ?? u.ProfilImagePath ?? "",
          Id: u.id ?? u.ID,
          DateInscription: u.dateInscription ?? u.DateInscription,
          NBReport: u.nBReport ?? u.NBReport ?? 0,
        });
      })
      .catch((err) => {
        if (err.status === 401) {
          setUser(null);
          navigate("/login", { replace: true });
        } else {
          setError(t("profile.couldNotLoad"));
        }
      })
      .finally(() => setLoading(false));
  }, [navigate, setUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const role = form?.Role ?? user?.role ?? user?.Role ?? "Client";
  const roleKey = String(role).toLowerCase();
  const isMerchant = roleKey === "gerant" || roleKey === "commercant" || roleKey === "merchant" || roleKey === "marchand";
  const isAdmin = roleKey === "admin";
  const isClient = !isMerchant && !isAdmin;

  useEffect(() => {
    getMyOrders().then((data) => setOrders(Array.isArray(data) ? data : [])).catch(() => {});
    getMyFavorites().then((data) => setFavorites(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm((f) => ({
    ...f,
    [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
  }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.MotDePasse) {
      const digitsOnly = (s) => (s ?? "").replace(/\D/g, "");
      const given = digitsOnly(form.ConfirmPhone);
      const real = digitsOnly(form.Telephone);
      if (!given) { setError(t("profile.errors.enterPhone")); return; }
      const tail = (s) => s.slice(-9);
      if (tail(given) !== tail(real)) { setError(t("profile.errors.phoneMismatch")); return; }
      if (form.MotDePasse.length < 8) { setError(t("profile.errors.passwordTooShort")); return; }
    }

    setSaving(true);
    try {
      await updateProfile(form.Id, {
        Nom: form.Nom,
        Email: form.Email,
        Telephone: form.Telephone,
        Wilaya: form.Wilaya || null,
        Etudiant: form.Etudiant,
        NumCarteEtu: form.Etudiant ? form.NumCarteEtu : null,
        MotDePasse: form.MotDePasse || "",
        Role: form.Role,
        ProfilImagePath: form.ProfilImagePath || "",
      });
      setSuccess(t("profile.changesSaved"));
      setUser((prev) => ({ ...prev, nom: form.Nom, Nom: form.Nom, email: form.Email, Email: form.Email }));
      setForm((f) => ({ ...f, MotDePasse: "", ConfirmPhone: "" }));
    } catch (err) {
      if (err.data?.errors && Array.isArray(err.data.errors)) {
        setError(err.data.errors[0]?.message ?? t("profile.checkForm"));
      } else if (err.data?.errors && typeof err.data.errors === "object") {
        const first = Object.entries(err.data.errors)[0];
        if (first) {
          const [field, msgs] = first;
          const msg = Array.isArray(msgs) ? msgs[0] : String(msgs);
          setError(`${field}: ${msg}`);
        } else {
          setError(t("profile.checkFormFields"));
        }
      } else if (typeof err.data?.message === "string") {
        setError(err.data.message);
      } else if (typeof err.data?.title === "string") {
        setError(err.data.title);
      } else {
        setError(t("profile.couldNotSave"));
      }
    } finally {
      setSaving(false);
    }
  };

  const memberSince = form?.DateInscription
    ? new Date(form.DateInscription).toLocaleDateString(undefined, { year: "numeric", month: "long" })
    : null;

  const handlePickPhoto = () => {
    const current = form?.ProfilImagePath && /^https?:\/\//i.test(form.ProfilImagePath) ? form.ProfilImagePath : "";
    const url = window.prompt(t("profile.photoPrompt"), current);
    if (url === null) return;
    setForm((f) => ({ ...f, ProfilImagePath: url.trim() }));
  };

  const settingsForm = form && (
    <form onSubmit={onSubmit} className="space-y-5">
      <Group title={t("profile.sections.personalTitle")}>
        <Row label={t("profile.fields.fullName")}>
          <InlineInput value={form.Nom} onChange={set("Nom")} required />
        </Row>
        <Row label={t("profile.fields.email")}>
          <InlineInput type="email" value={form.Email} onChange={set("Email")} required />
        </Row>
        <Row label={t("profile.fields.phone")}>
          <InlineInput type="tel" value={form.Telephone} onChange={set("Telephone")} required placeholder={t("profile.fields.phonePlaceholder")} />
        </Row>
        <Row label={t("profile.fields.wilaya")} last>
          <select value={form.Wilaya ?? ""} onChange={set("Wilaya")} className="w-full bg-transparent text-right text-[14px] text-eco-green focus:outline-none">
            <option value="">{t("profile.fields.wilayaNotSet")}</option>
            {WILAYAS.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        </Row>
      </Group>

      {isClient && (
        <Group title={t("profile.sections.studentTitle")}>
          <Row label={t("profile.fields.isStudent")} last={!form.Etudiant} hideEdit>
            <Toggle checked={form.Etudiant} onChange={set("Etudiant")} />
          </Row>
          {form.Etudiant && (
            <Row label={t("profile.fields.cardNumber")} last>
              <InlineInput value={form.NumCarteEtu ?? ""} onChange={set("NumCarteEtu")} placeholder={t("profile.fields.cardPlaceholder")} />
            </Row>
          )}
        </Group>
      )}

      <Group title={t("profile.sections.securityTitle")}>
        <div className="space-y-4 px-5 py-4">
          <PasswordField label={t("profile.fields.newPassword")} value={form.MotDePasse} onChange={set("MotDePasse")} />
          {form.MotDePasse && (
            <div className="rounded-2xl border border-eco-coral/25 bg-eco-coral/[0.08] p-4 backdrop-blur-md">
              <p className="mb-2 font-heading text-[11px] font-bold uppercase tracking-[0.18em] text-eco-coral">
                {t("profile.confirmPhone.eyebrow")}
              </p>
              <p className="mb-3 text-[11.5px] text-eco-green/60">{t("profile.confirmPhone.hint")}</p>
              <input
                type="tel"
                value={form.ConfirmPhone ?? ""}
                onChange={set("ConfirmPhone")}
                placeholder={t("profile.fields.phonePlaceholder")}
                className="w-full rounded-xl border border-eco-green/12 bg-white px-4 py-2.5 text-sm text-eco-green transition placeholder:text-eco-green/35 focus:border-eco-coral/60 focus:outline-none focus:ring-4 focus:ring-eco-coral/15"
              />
            </div>
          )}
        </div>
      </Group>

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-eco-green to-[#324a2d] px-6 py-3 font-heading text-[13px] font-bold tracking-tight text-white shadow-[0_14px_32px_-12px_rgba(63,93,58,0.55)] transition hover:brightness-[1.08] active:scale-[0.99] disabled:opacity-60"
        >
          {saving ? t("profile.saving") : t("profile.saveChanges")}
        </button>
      </div>
    </form>
  );

  /* ─── Dashboard (all roles; donut wheels hidden for clients) ──────────── */

  const stats = (() => {
    const total = orders.length;
    const completed = orders.filter((o) => {
      const s = String(o.statut ?? o.Statut ?? o.status ?? o.Status ?? "").toLowerCase();
      return s.includes("delivered") || s.includes("complet") || s.includes("livré") || s.includes("livre");
    }).length;
    const favCount = favorites.length;
    const totalGoal = Math.max(total, 10);
    const rescuedPct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const favPct = Math.min(100, favCount * 20);
    return {
      total,
      completed,
      favCount,
      totalPct: Math.min(100, Math.round((total / totalGoal) * 100)) || 0,
      rescuedPct,
      favPct,
    };
  })();

  const firstName = form?.Nom?.split(" ")[0] || user?.nom?.split?.(" ")[0] || user?.Nom?.split?.(" ")[0] || "";
  const recentOrders = orders.slice(-4).reverse();
  const topFavorites = favorites.slice(0, 4);
  const hasPhoto = form?.ProfilImagePath && /^https?:\/\//i.test(form.ProfilImagePath);
  const initials = (form?.Nom || firstName || "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <AccountChrome
      eyebrow={t("profile.dashboard.welcome")}
      title={t("profile.dashboard.hello", { name: (firstName || form?.Nom || "").toUpperCase() })}
    >
      {loading && <p className="text-sm text-eco-green/60">{t("common.loading")}</p>}
      {error && (
        <p className="rounded-2xl border border-eco-coral/25 bg-eco-coral/10 px-4 py-3 text-sm text-eco-coral">{error}</p>
      )}
      {success && (
        <p className="mt-3 rounded-2xl border border-emerald-300/40 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>
      )}

      {!loading && form && (
        <div className="grid grid-cols-1 gap-5">
          <div className="space-y-5">
            <section className="relative overflow-hidden rounded-[28px] border border-eco-green/8 bg-white p-6 shadow-[0_2px_8px_rgba(63,93,58,0.04),0_24px_54px_-28px_rgba(63,93,58,0.3)]">
              <span aria-hidden="true" className="pointer-events-none absolute -top-16 right-0 h-44 w-44 rounded-full bg-eco-softYellow/20 blur-3xl" />
              <span aria-hidden="true" className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-eco-coral/10 blur-3xl" />
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="relative shrink-0">
                  <div className="h-20 w-20 overflow-hidden rounded-3xl bg-gradient-to-b from-eco-beige to-[#ead9b0] ring-[3px] ring-white/70 shadow-[0_12px_28px_-12px_rgba(63,93,58,0.45)]">
                    {hasPhoto ? (
                      <img src={form.ProfilImagePath} alt={form.Nom} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    ) : (
                      <span className="grid h-full w-full place-items-center font-heading text-2xl font-extrabold text-eco-green/55">{initials}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handlePickPhoto}
                    aria-label={t("profile.changePhotoAria")}
                    className="absolute -bottom-1.5 -right-1.5 grid h-8 w-8 place-items-center rounded-full bg-eco-green text-eco-beige shadow-[0_8px_18px_-8px_rgba(63,93,58,0.7)] ring-2 ring-white/80 transition hover:brightness-110 active:scale-95"
                  >
                    <CameraIcon className="h-4 w-4" />
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-heading text-xl font-extrabold tracking-tight text-eco-green">{form.Nom || t("profile.titleFallback")}</h2>
                  <p className="mt-0.5 truncate text-[13px] text-eco-green/60">{form.Email}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <Badge tone="green">{translateRole(t, role)}</Badge>
                    {form.Etudiant ? <Badge tone="yellow">{t("profile.badgeStudent")}</Badge> : null}
                    {form.Wilaya ? <Badge tone="neutral">{form.Wilaya}</Badge> : null}
                    {memberSince ? <Badge tone="neutral">{t("profile.badgeJoined", { date: memberSince })}</Badge> : null}
                    {form.NBReport > 0 ? (
                      <Badge tone="coral">{t(form.NBReport > 1 ? "profile.badgeReports" : "profile.badgeReport", { n: form.NBReport })}</Badge>
                    ) : null}
                  </div>
                </div>
              </div>

              {isClient && (
                <div className="relative mt-5 grid grid-cols-3 gap-2 border-t border-eco-green/8 pt-4">
                  <QuickStat label={t("profile.dashboard.statTotalOrders")} value={stats.total} tone="green" />
                  <QuickStat label={t("profile.dashboard.statRescued")} value={stats.completed} tone="coral" />
                  <QuickStat label={t("profile.dashboard.statFavorites")} value={stats.favCount} tone="yellow" />
                </div>
              )}
            </section>

            {isMerchant && <MerchantDashboard />}
            {isAdmin && <AdminStats />}

            {isClient && (<>
            <section className="overflow-hidden rounded-[24px] border border-eco-green/8 bg-white p-5 shadow-[0_2px_8px_rgba(63,93,58,0.04),0_22px_50px_-30px_rgba(63,93,58,0.28)]">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-base font-bold text-eco-green">
                  {t("profile.dashboard.recentOrdersTitle")}
                </h2>
                <Link to="/orders" className="text-xs font-bold text-eco-coral hover:underline">
                  {t("profile.dashboard.recentOrdersSeeAll")} →
                </Link>
              </div>
              {recentOrders.length === 0 ? (
                <div className="mt-4 grid place-items-center gap-3 rounded-2xl border border-dashed border-eco-green/15 bg-eco-beige/15 p-6 text-center">
                  <p className="text-sm text-eco-green/60">{t("profile.dashboard.noRecentOrders")}</p>
                  <Link to="/deals" className="rounded-full bg-eco-coral px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:brightness-95">
                    {t("profile.dashboard.browseDeals")}
                  </Link>
                </div>
              ) : (
                <ul className="mt-3 divide-y divide-eco-green/8">
                  {recentOrders.map((o) => {
                    const id = o.id ?? o.ID ?? o.orderId;
                    const status = o.statut ?? o.Statut ?? o.status ?? o.Status ?? "Pending";
                    const basket = o.panier ?? o.Panier ?? {};
                    const name = basket.nom ?? basket.Nom ?? o.basketName ?? o.BasketName ?? "—";
                    const img = basket.imagePath ?? basket.ImagePath ?? o.imagePath ?? null;
                    return (
                      <li key={id} className="flex items-center gap-3 py-3">
                        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-eco-beige">
                          {img ? (
                            <img src={img} alt={name} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                          ) : (
                            <BasketIcon className="h-6 w-6 text-eco-green/45" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-heading text-sm font-bold text-eco-green">{name}</p>
                          <p className="text-[11px] text-eco-green/55">{t("profile.dashboard.orderId", { id })}</p>
                        </div>
                        <StatusPill status={status} t={t} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="overflow-hidden rounded-[24px] border border-eco-green/8 bg-white p-5 shadow-[0_2px_8px_rgba(63,93,58,0.04),0_22px_50px_-30px_rgba(63,93,58,0.28)]">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-base font-bold text-eco-green">
                  {t("profile.dashboard.favoritesTitle")}
                </h2>
                <Link to="/favorites" className="text-xs font-bold text-eco-coral hover:underline">
                  {t("profile.dashboard.favoritesSeeAll")} →
                </Link>
              </div>
              {topFavorites.length === 0 ? (
                <p className="mt-4 rounded-2xl border border-dashed border-eco-green/15 bg-eco-beige/15 p-5 text-center text-sm text-eco-green/60">
                  {t("profile.dashboard.noFavorites")}
                </p>
              ) : (
                <ul className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                  {topFavorites.map((f) => {
                    const id = f.id ?? f.ID ?? f.boutiqueId ?? f.BoutiqueId;
                    const name = f.nom ?? f.Nom ?? f.name ?? "—";
                    const img = f.imagePath ?? f.ImagePath ?? f.image ?? null;
                    return (
                      <Link key={id} to={`/restaurants/${id}`} className="group relative overflow-hidden rounded-2xl border border-eco-green/8 bg-eco-beige/30 transition hover:border-eco-coral/40 hover:shadow-[0_14px_30px_-18px_rgba(63,93,58,0.3)]">
                        <div className="aspect-square w-full overflow-hidden bg-eco-beige">
                          {img ? (
                            <img src={img} alt={name} className="h-full w-full object-cover transition group-hover:scale-105" />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-eco-green/40"><StoreThumbIcon className="h-8 w-8" /></div>
                          )}
                        </div>
                        <div className="p-2">
                          <p className="truncate text-[12px] font-bold text-eco-green">{name}</p>
                        </div>
                      </Link>
                    );
                  })}
                </ul>
              )}
            </section>

            </>)}

            <section className="overflow-hidden rounded-[24px] border border-eco-green/8 bg-white shadow-[0_2px_8px_rgba(63,93,58,0.04),0_22px_50px_-30px_rgba(63,93,58,0.28)]">
              <button
                type="button"
                onClick={() => setSettingsOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-eco-beige/15"
              >
                <div>
                  <h2 className="font-heading text-base font-bold text-eco-green">{t("profile.dashboard.settingsTitle")}</h2>
                  <p className="mt-0.5 text-[12px] text-eco-green/55">{t("profile.dashboard.settingsCaption")}</p>
                </div>
                <span className="rounded-full bg-eco-green px-3 py-1.5 text-[11px] font-bold text-eco-beige">
                  {settingsOpen ? t("profile.dashboard.collapseSettings") : t("profile.dashboard.openSettings")}
                </span>
              </button>
              {settingsOpen && <div className="border-t border-eco-green/8 px-5 py-5">{settingsForm}</div>}
            </section>
          </div>
        </div>
      )}
    </AccountChrome>
  );
}

/* ─── Primitives ────────────────────────────────────────────────────────── */

function QuickStat({ label, value, tone }) {
  const valueTone = {
    green: "text-eco-green",
    coral: "text-eco-coral",
    yellow: "text-eco-green",
  }[tone] ?? "text-eco-green";
  return (
    <div className="rounded-2xl border border-eco-green/8 bg-eco-beige/20 px-3 py-2.5 text-center">
      <p className={`font-heading text-xl font-extrabold leading-none tabular-nums ${valueTone}`}>{value}</p>
      <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-eco-green/50">{label}</p>
    </div>
  );
}

function StatTile({ label, value, tone }) {
  const valueTone = { coral: "text-eco-coral", yellow: "text-eco-green", green: "text-eco-green" }[tone] ?? "text-eco-green";
  return (
    <div className="rounded-2xl border border-eco-green/8 bg-eco-beige/15 p-4 text-center">
      <p className={`font-heading text-2xl font-extrabold leading-none tabular-nums ${valueTone}`}>{value}</p>
      <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-eco-green/50">{label}</p>
    </div>
  );
}

/* ─── Merchant: restaurant dashboard ─────────────────────────────────────── */

function MerchantDashboard() {
  const t = useT();
  const [boutique, setBoutique] = useState(null);
  const [orders, setOrders] = useState([]);
  const [baskets, setBaskets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMyMerchant().catch(() => null),
      getBoutiqueOrders().catch(() => []),
      getMyDeals().catch(() => []),
    ]).then(([b, o, d]) => {
      setBoutique(b);
      setOrders(Array.isArray(o) ? o : []);
      setBaskets(Array.isArray(d) ? d : []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-48 animate-pulse rounded-[24px] border border-eco-green/8 bg-white" />;

  if (!boutique) {
    return (
      <section className="rounded-[24px] border border-eco-softYellow/40 bg-eco-softYellow/15 p-6">
        <p className="font-heading text-lg font-bold text-eco-green">{t("profile.merchant.noRestaurantTitle")}</p>
        <p className="mt-1 text-sm text-eco-green/65">{t("profile.merchant.noRestaurantHint")}</p>
        <Link to="/become-merchant" className="mt-4 inline-flex rounded-xl bg-eco-green px-4 py-2 text-sm font-bold text-white shadow-sm hover:brightness-[1.05]">
          {t("profile.merchant.apply")}
        </Link>
      </section>
    );
  }

  const isDelivered = (o) => {
    const s = String(o.status ?? o.Status ?? "").toLowerCase();
    return s.includes("deliv") || o.statut === true || o.Statut === true;
  };
  const total = orders.length;
  const delivered = orders.filter(isDelivered).length;
  const pending = orders.filter((o) => !isDelivered(o) && !String(o.status ?? "").toLowerCase().includes("cancel")).length;
  const revenue = orders.filter(isDelivered).reduce((sum, o) => sum + (Number(o.prix ?? o.Prix) || 0), 0);
  const activeBaskets = baskets.filter((b) => b.isActive ?? b.IsActive).length;
  const rating = boutique.rating ?? boutique.Rating ?? 0;
  const ratingCount = boutique.ratingCount ?? boutique.RatingCount ?? 0;

  return (
    <section className="relative overflow-hidden rounded-[24px] border border-eco-green/8 bg-white p-6 shadow-[0_2px_8px_rgba(63,93,58,0.04),0_22px_50px_-30px_rgba(63,93,58,0.28)]">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-heading text-[10px] font-bold uppercase tracking-[0.22em] text-eco-coral">{t("profile.merchant.eyebrow")}</p>
          <h2 className="truncate font-heading text-xl font-extrabold text-eco-green">{boutique.nomBoutique ?? boutique.NomBoutique}</h2>
          <p className="mt-0.5 inline-flex items-center gap-1 text-[12px] font-semibold text-eco-green/55">
            <StarGlyph /> {Number(rating).toFixed(1)}{ratingCount > 0 ? ` (${ratingCount})` : ""}
          </p>
        </div>
        <Link to="/my-restaurant" className="shrink-0 rounded-xl bg-eco-green px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:brightness-[1.05] active:scale-[0.99]">
          {t("profile.merchant.manage")}
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label={t("profile.merchant.orders")} value={total} tone="green" />
        <StatTile label={t("profile.merchant.delivered")} value={delivered} tone="green" />
        <StatTile label={t("profile.merchant.pending")} value={pending} tone="coral" />
        <StatTile label={t("profile.merchant.activeBaskets")} value={activeBaskets} tone="yellow" />
      </div>

      <div className="mt-3 rounded-2xl bg-eco-green/[0.06] p-4 text-center">
        <p className="font-heading text-2xl font-extrabold tabular-nums text-eco-green">{revenue.toFixed(0)} {t("common.currency")}</p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-eco-green/50">{t("profile.merchant.revenue")}</p>
      </div>
    </section>
  );
}

/* ─── Admin: platform statistics ─────────────────────────────────────────── */

function AdminStats() {
  const t = useT();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats().then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-48 animate-pulse rounded-[24px] border border-eco-green/8 bg-white" />;
  if (!stats) return null;

  return (
    <section className="rounded-[24px] border border-eco-green/8 bg-white p-6 shadow-[0_2px_8px_rgba(63,93,58,0.04),0_22px_50px_-30px_rgba(63,93,58,0.28)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-heading text-[10px] font-bold uppercase tracking-[0.22em] text-eco-coral">{t("profile.admin.eyebrow")}</p>
          <h2 className="font-heading text-xl font-extrabold text-eco-green">{t("profile.admin.title")}</h2>
        </div>
        <Link to="/admin/approvals" className="shrink-0 rounded-xl bg-eco-green px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:brightness-[1.05] active:scale-[0.99]">
          {t("profile.admin.approvals")}
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label={t("profile.admin.users")} value={stats.totalUsers} tone="green" />
        <StatTile label={t("profile.admin.merchants")} value={stats.totalMerchants} tone="green" />
        <StatTile label={t("profile.admin.pending")} value={stats.pendingApplications} tone="coral" />
        <StatTile label={t("profile.admin.orders")} value={stats.totalOrders} tone="green" />
        <StatTile label={t("profile.admin.completed")} value={stats.completedOrders} tone="green" />
        <StatTile label={t("profile.admin.offers")} value={stats.activeOffers} tone="yellow" />
        <StatTile label={t("profile.admin.banned")} value={stats.bannedUsers} tone="coral" />
      </div>
    </section>
  );
}

function StarGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 text-eco-softYellow" aria-hidden="true">
      <path d="M12 2.5l2.76 6.92 7.44.54-5.65 4.87 1.76 7.27L12 18.3l-6.31 3.8 1.76-7.27L1.8 9.96l7.44-.54L12 2.5z" />
    </svg>
  );
}

function StatusPill({ status, t }) {
  const s = String(status).toLowerCase();
  let tone = "neutral";
  let key = "common.status.pending";
  if (s.includes("deliv") || s.includes("complet")) { tone = "green"; key = "common.status.completed"; }
  else if (s.includes("prepar")) { tone = "yellow"; key = "common.status.preparing"; }
  else if (s.includes("way") || s.includes("route")) { tone = "yellow"; key = "common.status.ready"; }
  else if (s.includes("cancel") || s.includes("annul")) { tone = "coral"; key = "common.status.cancelled"; }
  return <Badge tone={tone}>{t(key)}</Badge>;
}

function Group({ title, children }) {
  return (
    <section>
      <div className="mb-2 px-1">
        <p className="font-heading text-[10px] font-bold uppercase tracking-[0.18em] text-eco-green/55">{title}</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-eco-green/8 bg-eco-beige/15">
        {children}
      </div>
    </section>
  );
}

function Row({ label, children, last, hideEdit }) {
  return (
    <div className={["group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/60", last ? "" : "border-b border-eco-green/8"].join(" ")}>
      <span className="w-28 shrink-0 text-[12px] font-semibold text-eco-green/65">{label}</span>
      <div className="flex flex-1 justify-end">{children}</div>
      {!hideEdit && <PencilIcon className="h-3.5 w-3.5 shrink-0 text-eco-green/25 transition-colors group-hover:text-eco-coral/70" />}
    </div>
  );
}

function InlineInput({ type = "text", value, onChange, required, placeholder }) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className="w-full bg-transparent text-right text-[14px] text-eco-green placeholder:text-eco-green/30 focus:outline-none"
    />
  );
}

function PasswordField({ label, value, onChange }) {
  const t = useT();
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-eco-green/60">{label}</label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value ?? ""}
          onChange={onChange}
          placeholder={t("profile.fields.passwordPlaceholder")}
          className="w-full rounded-2xl border border-eco-green/12 bg-white px-4 py-3 pr-12 text-sm text-eco-green transition placeholder:text-eco-green/35 focus:border-eco-coral/50 focus:outline-none focus:ring-4 focus:ring-eco-coral/15"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t("profile.fields.hidePassword") : t("profile.fields.showPassword")}
          className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-eco-green/55 transition hover:bg-eco-green/[0.08] hover:text-eco-green active:scale-95"
        >
          {visible ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </button>
      </div>
      <p className="mt-1.5 text-[11px] text-eco-green/45">{t("profile.fields.passwordHint")}</p>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <label className="inline-flex cursor-pointer items-center justify-end">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span className={["relative block h-7 w-12 rounded-full transition-colors", checked ? "bg-eco-green" : "bg-eco-green/15"].join(" ")}>
        <span className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ease-out" style={{ transform: `translateX(${checked ? "22px" : "2px"})` }} />
      </span>
    </label>
  );
}

function Badge({ tone, children }) {
  const styles = {
    green: "bg-eco-green/10 text-eco-green ring-1 ring-eco-green/15",
    neutral: "bg-eco-beige/40 text-eco-green/70 ring-1 ring-eco-green/10",
    yellow: "bg-eco-softYellow/40 text-eco-green ring-1 ring-eco-softYellow/50",
    coral: "bg-eco-coral/15 text-eco-coral ring-1 ring-eco-coral/25",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${styles[tone] ?? styles.neutral}`}>
      {children}
    </span>
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

function CameraIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function PencilIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 20h4L20 8l-4-4L4 16v4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 6l4 4" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
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
      <path d="M10.6 6.2A10.9 10.9 0 0 1 12 6c6.5 0 10 6 10 6a17.9 17.9 0 0 1-3.3 4.1M6.7 7.7A17.7 17.7 0 0 0 2 12s3.5 6 10 6a10.9 10.9 0 0 0 4.3-.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function BasketIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M3 9h18l-1.5 10.5a2 2 0 0 1-2 1.5H6.5a2 2 0 0 1-2-1.5L3 9Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 9l2-5m6 5-2-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function StoreThumbIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M3 9l1-4h16l1 4M4 9v11h16V9M9 13h6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
