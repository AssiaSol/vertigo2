import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getNearbyRestaurants } from "../api/restaurants";
import { placeOrder, scheduleOrder } from "../api/orders";
import { reportBoutique } from "../api/reports";
import { logout } from "../api/auth";
import { addFavorite, getFavoriteIds, removeFavorite } from "../api/favorites";
import { AccountChrome } from "../components/AccountChrome";
import { useT } from "../i18n";

const ORAN_FALLBACK = { latitude: 35.6969, longitude: -0.6331 };

const WILAYAS = [
  { value: "auto", labelKey: "deals.wilaya.auto", coords: null },
  { value: "oran", labelKey: "deals.wilaya.oran", coords: { latitude: 35.6969, longitude: -0.6331 } },
  { value: "mostaganem", labelKey: "deals.wilaya.mostaganem", coords: { latitude: 35.9359, longitude: 0.0892 } },
  { value: "sidi", labelKey: "deals.wilaya.sidi", coords: { latitude: 35.1878, longitude: -0.6306 } },
];

const SORT_OPTIONS = [
  { value: "bestDiscount", labelKey: "deals.sort.bestDiscount" },
  { value: "distance", labelKey: "deals.sort.distance" },
  { value: "rating", labelKey: "deals.sort.rating" },
];

const WILAYA_STORAGE_KEY = "vertigo.wilaya.v2";

export function DealsPage() {
  const t = useT();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [coords, setCoords] = useState(null);
  const [locationNotice, setLocationNotice] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("bestDiscount");
  const [radiusKm, setRadiusKm] = useState(5);
  const [wilaya, setWilaya] = useState(() => localStorage.getItem(WILAYA_STORAGE_KEY) || "oran");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [favIds, setFavIds] = useState(new Set());
  const [query, setQuery] = useState("");

  useEffect(() => {
    getFavoriteIds()
      .then((ids) => setFavIds(new Set(ids ?? [])))
      .catch(() => {});
  }, []);

  const toggleFavorite = useCallback(async (boutiqueId) => {
    const isFav = favIds.has(boutiqueId);
    // Optimistic update
    setFavIds((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(boutiqueId);
      else next.add(boutiqueId);
      return next;
    });
    try {
      if (isFav) await removeFavorite(boutiqueId);
      else await addFavorite(boutiqueId);
    } catch {
      // revert on failure
      setFavIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.add(boutiqueId);
        else next.delete(boutiqueId);
        return next;
      });
    }
  }, [favIds]);

  useEffect(() => {
    localStorage.setItem(WILAYA_STORAGE_KEY, wilaya);

    const chosen = WILAYAS.find((w) => w.value === wilaya);
    if (chosen && chosen.coords) {
      setCoords(chosen.coords);
      setLocationNotice(t("deals.notice.showingNear", { place: t(chosen.labelKey) }));
      return;
    }

    // auto = use browser geolocation
    if (!navigator.geolocation) {
      setCoords(ORAN_FALLBACK);
      setLocationNotice(t("deals.notice.geoUnavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocationNotice("");
      },
      () => {
        setCoords(ORAN_FALLBACK);
        setLocationNotice(t("deals.notice.geoDenied"));
      },
      { timeout: 8000 }
    );
  }, [wilaya, t]);

  const handleLogout = async () => {
    try { await logout(); } catch { /* ignore */ }
    setUser(null);
    navigate("/login", { replace: true });
  };

  const fetchDeals = useCallback(async () => {
    if (!coords) return;
    setLoading(true);
    setError("");
    try {
      const data = await getNearbyRestaurants({ ...coords, radiusKm, sortBy });
      setRestaurants(data ?? []);
    } catch (err) {
      if (err.status === 401) {
        setUser(null);
        navigate("/login", { replace: true });
        return;
      }
      setError(t("deals.error"));
    } finally {
      setLoading(false);
    }
  }, [coords, radiusKm, sortBy, navigate, setUser, t]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  // Flatten restaurants → one entry per basket, filtered by the search query
  // (matches restaurant name, cuisine, or the basket's title/description).
  const visibleCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = restaurants.flatMap((r) => (r.offers ?? []).map((o) => ({ r, o })));
    if (!q) return all;
    return all.filter(({ r, o }) =>
      [r.name, r.cuisineType, o.title, o.description]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(q))
    );
  }, [restaurants, query]);

  return (
    <AccountChrome
      eyebrow={t("deals.welcomeBack")}
      title={t("deals.greeting", { name: user?.nom ?? user?.Nom ?? t("deals.fallbackName") })}
    >
      <div className="mx-auto max-w-6xl">
        <section className="mb-6 md:mb-8">
          <p className="max-w-xl text-sm text-eco-green/70 md:text-base">
            {t("deals.tagline")}
          </p>
          {locationNotice && (
            <p className="mt-3 inline-block rounded-full bg-eco-softYellow/40 px-3 py-1 text-xs text-eco-green/75">
              {locationNotice}
            </p>
          )}
        </section>

        <section className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="sortBy" className="text-xs font-semibold uppercase tracking-wide text-eco-green/55">
              {t("deals.sortLabel")}
            </label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-eco-green/15 bg-white px-3 py-2 text-sm text-eco-green shadow-sm focus:border-eco-coral/40 focus:outline-none focus:ring-2 focus:ring-eco-coral/25"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{t(o.labelKey)}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="radius" className="text-xs font-semibold uppercase tracking-wide text-eco-green/55">
              {t("deals.radiusLabel")}
            </label>
            <select
              id="radius"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="rounded-xl border border-eco-green/15 bg-white px-3 py-2 text-sm text-eco-green shadow-sm focus:border-eco-coral/40 focus:outline-none focus:ring-2 focus:ring-eco-coral/25"
            >
              {[2, 5, 10, 20, 50].map((r) => (
                <option key={r} value={r}>{t("deals.radiusUnit", { n: r })}</option>
              ))}
            </select>
          </div>

          <div className="relative ml-auto">
            <button
              type="button"
              onClick={() => setSettingsOpen((o) => !o)}
              aria-expanded={settingsOpen}
              className="inline-flex items-center gap-2 rounded-xl border border-eco-green/15 bg-white px-3 py-2 text-sm font-semibold text-eco-green shadow-sm transition hover:border-eco-coral/40"
            >
              <GearIcon className="h-4 w-4" />
              {t("deals.settings")}
            </button>

            {settingsOpen && (
              <SettingsPanel
                wilaya={wilaya}
                onWilayaChange={(v) => { setWilaya(v); setSettingsOpen(false); }}
                onLogout={handleLogout}
                onClose={() => setSettingsOpen(false)}
              />
            )}
          </div>
        </section>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-xl font-bold text-eco-green md:text-2xl">
            {t("deals.sectionTitle")}
          </h2>
          <div className="relative w-full sm:w-72">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-eco-green/40" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("deals.searchPlaceholder")}
              className="w-full rounded-full border border-eco-green/15 bg-white py-2 pl-9 pr-3 text-sm text-eco-green shadow-sm placeholder:text-eco-green/40 focus:border-eco-coral/40 focus:outline-none focus:ring-2 focus:ring-eco-coral/20"
            />
          </div>
        </div>

        {loading && <DealsSkeleton />}

        {!loading && error && <ErrorState message={error} onRetry={fetchDeals} />}

        {!loading && !error && restaurants.length === 0 && <EmptyState />}

        {!loading && !error && restaurants.length > 0 && (
          visibleCards.length === 0 ? (
            <div className="rounded-3xl border border-eco-green/8 bg-white p-10 text-center text-sm text-eco-green/55 shadow-[0_18px_44px_-28px_rgba(63,93,58,0.25)]">
              {t("deals.noMatches", { query })}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleCards.map(({ r, o }) => (
                <RestaurantCard
                  key={`${r.id}-${o.id}`}
                  restaurant={r}
                  offer={o}
                  isFavorite={favIds.has(r.id)}
                  onToggleFavorite={() => toggleFavorite(r.id)}
                />
              ))}
            </div>
          )
        )}
      </div>
    </AccountChrome>
  );
}

function RestaurantCard({ restaurant, offer, isFavorite, onToggleFavorite }) {
  const t = useT();
  const best = offer ?? restaurant.offers[0];
  const [ordering, setOrdering] = useState(false);
  const [orderState, setOrderState] = useState(null); // 'success' | 'error'
  const [orderMessage, setOrderMessage] = useState("");
  const [reporting, setReporting] = useState(false);
  const [bookingLater, setBookingLater] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);

  const validUntil = best?.validUntil
    ? new Date(best.validUntil).toLocaleDateString(undefined, { day: "numeric", month: "short" })
    : null;

  const handleOrder = async () => {
    if (!best) return;
    setOrdering(true);
    setOrderState(null);
    try {
      await placeOrder(best.id);
      setOrderState("success");
      setOrderMessage(t("deals.card.orderSuccess"));
    } catch (err) {
      setOrderState("error");
      setOrderMessage(err.data?.message || t("deals.card.orderError"));
    } finally {
      setOrdering(false);
    }
  };

  const handleSchedule = async (startISO, endISO) => {
    if (!best) return;
    setBookingLater(true);
    setOrderState(null);
    try {
      const res = await scheduleOrder(best.id, startISO, endISO);
      setOrderState("success");
      setOrderMessage(res?.message || t("deals.card.bookLaterSuccess"));
      setBookOpen(false);
    } catch (err) {
      setOrderState("error");
      setOrderMessage(err.data?.message || t("deals.card.orderError"));
    } finally {
      setBookingLater(false);
    }
  };

  const handleReport = async () => {
    const reason = window.prompt(t("deals.report.prompt"));
    if (reason === null) return;
    setReporting(true);
    try {
      await reportBoutique(restaurant.id, reason);
      alert(t("deals.report.thanks"));
    } catch {
      alert(t("deals.report.error"));
    } finally {
      setReporting(false);
    }
  };

  const savings =
    best && Number(best.originalPrice) > 0
      ? Math.max(0, Number(best.originalPrice) - Number(best.discountedPrice))
      : 0;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[24px] border border-eco-green/8 bg-white shadow-[0_2px_6px_rgba(63,93,58,0.04),0_18px_44px_-26px_rgba(63,93,58,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:border-eco-green/15 hover:shadow-[0_4px_10px_rgba(63,93,58,0.06),0_26px_56px_-26px_rgba(63,93,58,0.34)]">
      {/* Subtle top-edge highlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"
      />

      {/* Whole-card click target (buttons below sit above this with z-10) */}
      <Link
        to={`/restaurants/${restaurant.id}`}
        aria-label={restaurant.name}
        className="absolute inset-0 z-[1] rounded-[24px]"
      />

      {/* Image */}
      <div className="relative m-2 h-44 overflow-hidden rounded-[18px] bg-eco-beige/60 ring-1 ring-black/5">
        {(best?.imageUrl || restaurant.imageUrl) ? (
          <img
            src={best?.imageUrl || restaurant.imageUrl}
            alt={best?.title || restaurant.name}
            className="h-full w-full object-cover transition-transform duration-[600ms] group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full place-items-center text-eco-green/40">{t("deals.card.noImage")}</div>
        )}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"
        />

        {/* Discount pill — premium gradient */}
        {best && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-b from-eco-coral to-[#d85048] px-3 py-1 font-heading text-[11px] font-bold tracking-tight text-white shadow-[0_8px_20px_-6px_rgba(242,108,99,0.7)] ring-1 ring-white/30">
            <span className="opacity-90">−</span>
            {Math.round(Number(best.discountPercentage))}%
          </span>
        )}

        {/* Rating chip — bottom-left over image */}
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-eco-green shadow-sm backdrop-blur-md">
          <StarIcon className="h-3 w-3 text-eco-softYellow" />
          <span className="tabular-nums">{restaurant.rating?.toFixed(1) ?? "—"}</span>
        </span>

        {/* Top-right actions: favorite + report */}
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? t("deals.card.removeFavorite") : t("deals.card.addFavorite")}
            title={isFavorite ? t("deals.card.removeFavorite") : t("deals.card.addFavorite")}
            className={[
              "grid h-9 w-9 place-items-center rounded-full shadow-md backdrop-blur-md transition active:scale-90",
              isFavorite
                ? "bg-eco-coral text-white"
                : "bg-white/90 text-eco-green/70 hover:bg-white hover:text-eco-coral",
            ].join(" ")}
          >
            <HeartIcon filled={isFavorite} className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleReport}
            disabled={reporting}
            title={t("deals.card.reportTitle")}
            aria-label={t("deals.card.reportTitle")}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-eco-green/70 shadow-md backdrop-blur-md transition hover:bg-white hover:text-eco-coral disabled:opacity-50"
          >
            <FlagIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-3">
        <div>
          <h3 className="font-heading text-[17px] font-bold leading-tight tracking-tight text-eco-green">
            {best?.title ?? restaurant.name}
          </h3>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-eco-green/55">
            <span className="truncate font-semibold text-eco-green/70">{restaurant.name}</span>
            {restaurant.distanceKm > 0 && (
              <>
                <span>·</span>
                <PinMarkerIcon className="h-3 w-3 text-eco-green/55" />
                <span className="tabular-nums">{t("deals.card.distanceKm", { n: Number(restaurant.distanceKm).toFixed(1) })}</span>
              </>
            )}
          </div>
        </div>

        {best && (
          <>
            <div className="h-px bg-gradient-to-r from-transparent via-eco-green/10 to-transparent" />

            <div>
              <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-relaxed text-eco-green/55">
                {best.description}
              </p>

              <div className="mt-3 flex items-end justify-between gap-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-heading text-[22px] font-extrabold leading-none tracking-tight text-eco-green tabular-nums">
                    {formatPrice(best.discountedPrice)}
                  </span>
                  <span className="text-[11px] font-semibold text-eco-green/50">{t("common.currency")}</span>
                  {Number(best.originalPrice) > 0 && (
                    <span className="ml-1 text-[11px] text-eco-green/35 line-through tabular-nums">
                      {formatPrice(best.originalPrice)}
                    </span>
                  )}
                </div>
                {savings > 0 && (
                  <span className="shrink-0 rounded-full bg-eco-coral/10 px-2.5 py-0.5 text-[10px] font-bold tracking-tight text-eco-coral">
                    {t("deals.card.save", { amount: formatPrice(savings), currency: t("common.currency") })}
                  </span>
                )}
              </div>

              {validUntil && (
                <p className="mt-2 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-eco-green/40">
                  <ClockIcon className="h-3 w-3" />
                  {t("deals.card.validUntil", { date: validUntil })}
                </p>
              )}
            </div>
          </>
        )}

        {best && (
          <button
            type="button"
            onClick={handleOrder}
            disabled={ordering || orderState === "success"}
            className={[
              "relative z-10 mt-1 w-full rounded-2xl px-4 py-3 font-heading text-[13px] font-bold tracking-tight shadow-[0_12px_28px_-12px_rgba(63,93,58,0.45)] transition active:scale-[0.99]",
              orderState === "success"
                ? "bg-eco-green/12 text-eco-green ring-1 ring-eco-green/25"
                : "bg-gradient-to-b from-eco-green to-[#324a2d] text-white hover:brightness-[1.08]",
              ordering ? "opacity-60" : "",
            ].join(" ")}
          >
            {ordering ? t("deals.card.ordering") : orderState === "success" ? t("deals.card.ordered") : t("deals.card.order")}
          </button>
        )}

        {best && (
          <button
            type="button"
            onClick={() => setBookOpen((v) => !v)}
            disabled={bookingLater || ordering}
            aria-expanded={bookOpen}
            className="relative z-10 mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-2xl border border-eco-green/20 bg-white px-4 py-2.5 font-heading text-[12px] font-bold tracking-tight text-eco-green transition hover:bg-eco-beige/50 active:scale-[0.99] disabled:opacity-60"
          >
            <CalendarWeekIcon className="h-4 w-4" />
            {bookingLater ? t("deals.card.bookingLater") : t("deals.card.bookLater")}
          </button>
        )}

        {best && bookOpen && (
          <div className="relative z-10">
            <BookLaterCalendar busy={bookingLater} onConfirm={handleSchedule} onCancel={() => setBookOpen(false)} />
          </div>
        )}

        {orderMessage && (
          <p className={`relative z-10 text-[11px] ${orderState === "success" ? "text-eco-green/65" : "text-eco-coral"}`}>
            {orderMessage}
          </p>
        )}

        <Link
          to={`/restaurants/${restaurant.id}`}
          className="relative z-10 inline-flex items-center justify-between gap-1.5 rounded-xl border border-eco-green/10 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-eco-green/70 shadow-sm transition hover:bg-eco-beige/40 hover:text-eco-coral"
        >
          <span>{t("deals.card.viewRestaurant")}</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

function DealsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-[24px] border border-eco-green/8 bg-white shadow-[0_2px_6px_rgba(63,93,58,0.04),0_18px_44px_-26px_rgba(63,93,58,0.22)]">
          <div className="m-2 h-44 animate-pulse rounded-[18px] bg-eco-beige/60" />
          <div className="space-y-3 px-4 pb-4 pt-2">
            <div className="h-4 w-2/3 animate-pulse rounded-full bg-eco-green/10" />
            <div className="h-3 w-1/2 animate-pulse rounded-full bg-eco-green/10" />
            <div className="mt-2 h-[1px] w-full bg-eco-green/10" />
            <div className="h-3 w-4/5 animate-pulse rounded-full bg-eco-green/10" />
            <div className="h-7 w-1/3 animate-pulse rounded-full bg-eco-green/10" />
            <div className="h-10 w-full animate-pulse rounded-2xl bg-eco-green/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  const t = useT();
  return (
    <div className="rounded-2xl border border-eco-green/8 bg-white p-8 text-center shadow-[0_18px_44px_-28px_rgba(63,93,58,0.25)]">
      <p className="font-heading text-lg font-semibold text-eco-green">{t("deals.empty.title")}</p>
      <p className="mt-1 text-sm text-eco-green/60">{t("deals.empty.hint")}</p>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  const t = useT();
  return (
    <div className="rounded-2xl border border-eco-coral/25 bg-eco-coral/10 p-6 text-center">
      <p className="font-heading text-base font-semibold text-eco-coral">{message}</p>
      <button onClick={onRetry} className="mt-3 inline-flex items-center rounded-xl bg-eco-green px-4 py-2 text-sm font-bold text-white shadow-md transition hover:brightness-[1.05] active:scale-[0.99]">
        {t("common.retry")}
      </button>
    </div>
  );
}

function StarIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.5l2.76 6.92 7.44.54-5.65 4.87 1.76 7.27L12 18.3l-6.31 3.8 1.76-7.27L1.8 9.96l7.44-.54L12 2.5z" />
    </svg>
  );
}

function FlagIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 21V4m0 0h11l-2 4 2 4H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon({ className, filled }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} className={className} aria-hidden="true">
      <path
        d="M12 20.5s-7.5-4.6-7.5-10.2a4.3 4.3 0 0 1 7.5-2.9 4.3 4.3 0 0 1 7.5 2.9c0 5.6-7.5 10.2-7.5 10.2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PinMarkerIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function SearchIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarWeekIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M3 9h18M8 3v4M16 3v4M7 13h2m3 0h2m3 0h0M7 17h2m3 0h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ── Book-for-later mini calendar (range up to 7 days) ──────────────────── */

const MS_DAY = 86400000;
function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function toISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function sameDay(a, b) {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function BookLaterCalendar({ busy, onConfirm, onCancel }) {
  const t = useT();
  const today = startOfDay(new Date());
  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);

  // Max window is 7 days inclusive: start .. start+6.
  const maxEnd = start ? new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6) : null;

  const pick = (d) => {
    if (d < today) return;
    // No pending start, or a full range already chosen → begin a new selection.
    if (!start || end) { setStart(d); setEnd(null); return; }
    // Clicking before the start → move the start.
    if (d < start) { setStart(d); setEnd(null); return; }
    // Beyond the 7-day window → ignored (those days are disabled anyway).
    if (d > maxEnd) return;
    setEnd(d);
  };

  const firstDow = new Date(view.getFullYear(), view.getMonth(), 1).getDay();
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let n = 1; n <= daysInMonth; n++) cells.push(new Date(view.getFullYear(), view.getMonth(), n));

  const inRange = (d) => d && start && d >= start && d <= (end || start);
  const canPrev = !(view.getFullYear() === today.getFullYear() && view.getMonth() === today.getMonth());
  const go = (delta) => setView((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1));
  const fmt = (d) => d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  const nDays = start ? Math.round(((end || start) - start) / MS_DAY) + 1 : 0;

  return (
    <div className="mt-2 rounded-2xl border border-eco-green/12 bg-white p-3 shadow-sm">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-eco-green/55">{t("deals.card.pickPeriod")}</p>
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => canPrev && go(-1)} disabled={!canPrev} className="grid h-7 w-7 place-items-center rounded-lg text-lg text-eco-green/70 hover:bg-eco-beige/60 disabled:opacity-30">‹</button>
        <span className="font-heading text-[13px] font-bold capitalize text-eco-green">{view.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span>
        <button type="button" onClick={() => go(1)} className="grid h-7 w-7 place-items-center rounded-lg text-lg text-eco-green/70 hover:bg-eco-beige/60">›</button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map((w, i) => (
          <span key={i} className="py-1 text-[10px] font-bold text-eco-green/40">{w}</span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const past = d < today;
          // While choosing the end, grey out days beyond the 7-day window.
          const beyondWindow = start && !end && maxEnd && d > maxEnd;
          const disabled = past || beyondWindow;
          const edge = sameDay(d, start) || sameDay(d, end);
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => pick(d)}
              className={[
                "h-8 rounded-lg text-[12px] font-semibold transition",
                disabled ? "cursor-not-allowed text-eco-green/20"
                  : edge ? "bg-eco-green text-white"
                  : inRange(d) ? "bg-eco-green/15 text-eco-green"
                  : "text-eco-green/80 hover:bg-eco-beige/60",
              ].join(" ")}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
      {start && (
        <p className="mt-2 text-[11px] text-eco-green/60">
          {end && !sameDay(start, end) ? `${fmt(start)} → ${fmt(end)}` : fmt(start)} · {nDays}/7
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-eco-green/15 bg-white px-3 py-2 text-[12px] font-bold text-eco-green/70 transition hover:bg-eco-beige/50">
          {t("deals.card.cancel")}
        </button>
        <button type="button" onClick={() => start && onConfirm(toISODate(start), toISODate(end || start))} disabled={!start || busy} className="flex-1 rounded-xl bg-gradient-to-b from-eco-green to-[#324a2d] px-3 py-2 text-[12px] font-bold text-white transition hover:brightness-[1.08] disabled:opacity-50">
          {busy ? t("deals.card.bookingLater") : t("deals.card.confirmBooking")}
        </button>
      </div>
    </div>
  );
}

function formatPrice(n) {
  if (n == null) return "—";
  const num = Number(n);
  return Number.isFinite(num) ? num.toFixed(0) : String(n);
}

function SettingsPanel({ wilaya, onWilayaChange, onLogout, onClose }) {
  const t = useT();
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} aria-hidden="true" />
      <div className="absolute right-0 top-full z-40 mt-2 w-64 rounded-2xl border border-eco-green/15 bg-white p-4 shadow-xl">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-eco-green/55">{t("deals.wilaya.title")}</p>
        <div className="flex flex-col gap-1">
          {WILAYAS.map((w) => (
            <button
              key={w.value}
              type="button"
              onClick={() => onWilayaChange(w.value)}
              className={[
                "rounded-xl px-3 py-2 text-left text-sm transition",
                wilaya === w.value
                  ? "bg-eco-green text-white font-bold"
                  : "text-eco-green hover:bg-eco-beige/60",
              ].join(" ")}
            >
              {t(w.labelKey)}
            </button>
          ))}
        </div>

        <div className="my-3 h-px bg-eco-green/10" />

        <button
          type="button"
          onClick={onLogout}
          className="w-full rounded-xl border border-eco-coral/30 bg-white px-3 py-2 text-sm font-bold text-eco-coral hover:bg-eco-coral/10"
        >
          {t("common.nav.logout")}
        </button>
      </div>
    </>
  );
}

function GearIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor" strokeWidth="2" strokeLinejoin="round"
      />
      <path
        d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"
        stroke="currentColor" strokeWidth="2" strokeLinejoin="round"
      />
    </svg>
  );
}
