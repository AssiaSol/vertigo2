import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AccountChrome } from "../components/AccountChrome";
import { useAuth } from "../context/AuthContext";
import {
  getMyFavorites,
  getMyFavoriteDeals,
  removeDealFavorite,
  removeFavorite,
} from "../api/favorites";
import { placeOrder } from "../api/orders";
import { useT } from "../i18n";

const TAB_IDS = ["restaurants", "deals"];

export function FavoritesPage() {
  const t = useT();
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("restaurants");
  const [restaurants, setRestaurants] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => {},
      { timeout: 6000 }
    );
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [restos, dls] = await Promise.all([
        getMyFavorites(coords ?? {}),
        getMyFavoriteDeals(),
      ]);
      setRestaurants(restos ?? []);
      setDeals(dls ?? []);
    } catch (err) {
      if (err.status === 401) {
        setUser(null);
        navigate("/login", { replace: true });
        return;
      }
      setError(t("favorites.loadError"));
    } finally {
      setLoading(false);
    }
  }, [coords, navigate, setUser, t]);

  useEffect(() => { load(); }, [load]);

  const handleUnfavoriteRestaurant = async (id) => {
    const prev = restaurants;
    setRestaurants((list) => list.filter((r) => r.id !== id));
    try {
      await removeFavorite(id);
    } catch {
      setRestaurants(prev);
    }
  };

  const handleUnfavoriteDeal = async (id) => {
    const prev = deals;
    setDeals((list) => list.filter((d) => d.id !== id));
    try {
      await removeDealFavorite(id);
    } catch {
      setDeals(prev);
    }
  };

  const counts = { restaurants: restaurants.length, deals: deals.length };
  const activeList = tab === "restaurants" ? restaurants : deals;

  return (
    <AccountChrome
      eyebrow={t("favorites.eyebrow")}
      title={t("favorites.title")}
      breadcrumbs={[{ label: t("profile.dashboard.navDashboard"), to: "/profile" }, { label: t("favorites.title") }]}
    >
      <div className="mx-auto max-w-6xl">
        <p className="max-w-xl text-sm text-eco-green/65 md:text-base">
          {t("favorites.subtitle")}
        </p>

        <div className="mt-6 flex justify-center">
          <div className="inline-flex rounded-full border border-eco-green/10 bg-white p-1 shadow-sm">
            {TAB_IDS.map((tabId) => {
              const active = tab === tabId;
              const count = counts[tabId];
              return (
                <button
                  key={tabId}
                  type="button"
                  onClick={() => setTab(tabId)}
                  className={[
                    "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-bold transition",
                    active
                      ? "bg-eco-green text-eco-beige shadow-[0_8px_18px_-10px_rgba(63,93,58,0.6)]"
                      : "text-eco-green/60 hover:text-eco-green",
                  ].join(" ")}
                >
                  {t(`favorites.tabs.${tabId}`)}
                  <span
                    className={[
                      "rounded-full px-1.5 text-[10px] font-bold tabular-nums",
                      active ? "bg-eco-beige/25 text-eco-beige" : "bg-eco-green/[0.08] text-eco-green/60",
                    ].join(" ")}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <section className="mt-6">
          {loading && <ListSkeleton />}

          {!loading && error && (
            <div className="rounded-2xl border border-eco-coral/25 bg-eco-coral/5 p-4 text-sm text-eco-coral">
              {error}
            </div>
          )}

          {!loading && !error && activeList.length === 0 && (
            <EmptyState which={tab} />
          )}

          {!loading && !error && activeList.length > 0 && tab === "restaurants" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {restaurants.map((r) => (
                <RestaurantCard
                  key={r.id}
                  restaurant={r}
                  onUnfavorite={() => handleUnfavoriteRestaurant(r.id)}
                />
              ))}
            </div>
          )}

          {!loading && !error && activeList.length > 0 && tab === "deals" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {deals.map((d) => (
                <FavoriteDealCard
                  key={d.id}
                  deal={d}
                  onUnfavorite={() => handleUnfavoriteDeal(d.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </AccountChrome>
  );
}

function RestaurantCard({ restaurant, onUnfavorite }) {
  const t = useT();
  const best = restaurant.offers?.[0];
  const [ordering, setOrdering] = useState(false);
  const [orderState, setOrderState] = useState(null);
  const [orderMessage, setOrderMessage] = useState("");

  const handleOrder = async () => {
    if (!best) return;
    setOrdering(true);
    setOrderState(null);
    try {
      await placeOrder(best.id);
      setOrderState("success");
      setOrderMessage(t("favorites.orderPlaced"));
    } catch (err) {
      setOrderState("error");
      setOrderMessage(err.data?.message || t("favorites.orderFailed"));
    } finally {
      setOrdering(false);
    }
  };

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[24px] border border-eco-green/8 bg-white shadow-[0_2px_6px_rgba(63,93,58,0.04),0_18px_44px_-26px_rgba(63,93,58,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:border-eco-green/15 hover:shadow-[0_4px_10px_rgba(63,93,58,0.06),0_26px_56px_-26px_rgba(63,93,58,0.34)]">
      <div className="relative m-2 h-44 overflow-hidden rounded-[18px] bg-eco-beige/60 ring-1 ring-black/5">
        {restaurant.imageUrl ? (
          <img
            src={restaurant.imageUrl}
            alt={restaurant.name}
            className="h-full w-full object-cover transition-transform duration-[600ms] group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full place-items-center text-eco-green/40">{t("favorites.noImage")}</div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {best && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-b from-eco-coral to-[#d85048] px-3 py-1 font-heading text-[11px] font-bold tracking-tight text-white shadow-[0_8px_20px_-6px_rgba(242,108,99,0.7)] ring-1 ring-white/30">
            −{Math.round(Number(best.discountPercentage))}%
          </span>
        )}

        <button
          type="button"
          onClick={onUnfavorite}
          aria-label={t("favorites.removeRestaurant")}
          title={t("favorites.removeRestaurant")}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-eco-coral text-white shadow-md backdrop-blur-md transition active:scale-90"
        >
          <HeartIcon filled className="h-4 w-4" />
        </button>

        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-eco-green shadow-sm backdrop-blur-md">
          <StarIcon className="h-3 w-3 text-eco-softYellow" filled />
          <span className="tabular-nums">{restaurant.rating?.toFixed(1) ?? "—"}</span>
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-3">
        <div>
          <Link
            to={`/restaurants/${restaurant.id}`}
            className="font-heading text-[17px] font-bold leading-tight tracking-tight text-eco-green hover:text-eco-coral"
          >
            <h3>{restaurant.name}</h3>
          </Link>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-eco-green/55">
            <span className="inline-flex items-center gap-1 rounded-full bg-eco-green/[0.06] px-2 py-0.5 font-semibold">
              {restaurant.cuisineType ?? t("favorites.defaultCuisine")}
            </span>
            {restaurant.distanceKm > 0 && (
              <>
                <span>·</span>
                <span className="tabular-nums">{restaurant.distanceKm.toFixed(1)} km</span>
              </>
            )}
          </div>
        </div>

        {best ? (
          <>
            <div className="h-px bg-gradient-to-r from-transparent via-eco-green/10 to-transparent" />
            <div>
              <p className="font-heading text-[13px] font-semibold tracking-tight text-eco-green">
                {best.title}
              </p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="font-heading text-[22px] font-extrabold leading-none text-eco-green tabular-nums">
                  {Math.round(Number(best.discountedPrice))}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-eco-green/55">{t("common.currency")}</span>
                {Number(best.originalPrice) > 0 && (
                  <span className="ml-1 text-[11px] text-eco-green/35 line-through tabular-nums">
                    {Math.round(Number(best.originalPrice))}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleOrder}
              disabled={ordering || orderState === "success"}
              className={[
                "w-full rounded-2xl px-4 py-3 font-heading text-[13px] font-bold tracking-tight text-white shadow-[0_12px_28px_-12px_rgba(63,93,58,0.55)] transition active:scale-[0.99] disabled:opacity-60",
                orderState === "success"
                  ? "bg-gradient-to-b from-emerald-500 to-emerald-600"
                  : "bg-gradient-to-b from-eco-green to-[#324a2d] hover:brightness-[1.08]",
              ].join(" ")}
            >
              {ordering ? t("favorites.ordering") : orderState === "success" ? t("favorites.ordered") : t("favorites.orderNow")}
            </button>

            {orderMessage && (
              <p className={`text-[11px] ${orderState === "success" ? "text-eco-green/65" : "text-eco-coral"}`}>
                {orderMessage}
              </p>
            )}
          </>
        ) : (
          <p className="text-[12px] italic text-eco-green/50">{t("favorites.noActiveOffers")}</p>
        )}
      </div>
    </article>
  );
}

function FavoriteDealCard({ deal, onUnfavorite }) {
  const t = useT();
  const [ordering, setOrdering] = useState(false);
  const [orderState, setOrderState] = useState(null);
  const [orderMessage, setOrderMessage] = useState("");

  const original = Number(deal.originalPrice) || 0;
  const discounted = Number(deal.discountedPrice) || 0;
  const savings = original > 0 ? Math.max(0, original - discounted) : 0;
  const discountPct = Math.round(Number(deal.discountPercentage) || 0);

  const validUntil = deal.validUntil
    ? new Date(deal.validUntil).toLocaleDateString(undefined, { day: "numeric", month: "short" })
    : null;

  const handleOrder = async () => {
    setOrdering(true);
    setOrderState(null);
    try {
      await placeOrder(deal.id);
      setOrderState("success");
      setOrderMessage(t("favorites.orderPlaced"));
    } catch (err) {
      setOrderState("error");
      setOrderMessage(err.data?.message || t("favorites.orderFailed"));
    } finally {
      setOrdering(false);
    }
  };

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[24px] border border-eco-green/8 bg-white shadow-[0_2px_6px_rgba(63,93,58,0.04),0_18px_44px_-26px_rgba(63,93,58,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:border-eco-green/15 hover:shadow-[0_4px_10px_rgba(63,93,58,0.06),0_26px_56px_-26px_rgba(63,93,58,0.34)]">
      <div className="relative m-2 h-44 overflow-hidden rounded-[18px] bg-eco-beige/60 ring-1 ring-black/5">
        {deal.imageUrl ? (
          <img
            src={deal.imageUrl}
            alt={deal.title}
            className="h-full w-full object-cover transition-transform duration-[600ms] group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full place-items-center text-eco-green/40">{t("favorites.noImage")}</div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {discountPct > 0 && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-b from-eco-coral to-[#d85048] px-3 py-1 font-heading text-[11px] font-bold tracking-tight text-white shadow-[0_8px_20px_-6px_rgba(242,108,99,0.7)] ring-1 ring-white/30">
            −{discountPct}%
          </span>
        )}

        <button
          type="button"
          onClick={onUnfavorite}
          aria-label={t("favorites.removeDeal")}
          title={t("favorites.removeRestaurant")}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-eco-softYellow text-eco-green shadow-md backdrop-blur-md transition active:scale-90"
        >
          <StarIcon className="h-4 w-4" filled />
        </button>

        {validUntil && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-eco-green/70 shadow-sm backdrop-blur-md">
            <ClockIcon className="h-3 w-3" />
            {t("favorites.until", { date: validUntil })}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-3">
        <div>
          {deal.boutiqueName && (
            <Link
              to={`/restaurants/${deal.boutiqueId}`}
              className="text-[10px] font-bold uppercase tracking-[0.18em] text-eco-coral hover:underline"
            >
              {deal.boutiqueName}
            </Link>
          )}
          <h3 className="mt-1 font-heading text-[16px] font-bold leading-tight tracking-tight text-eco-green">
            {deal.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-eco-green/55">
            {deal.description}
          </p>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-eco-green/10 to-transparent" />

        <div className="flex items-end justify-between gap-3">
          <div className="flex items-baseline gap-1.5">
            <span className="font-heading text-[22px] font-extrabold leading-none text-eco-green tabular-nums">
              {Math.round(discounted)}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-eco-green/55">{t("common.currency")}</span>
            {original > 0 && (
              <span className="ml-1 text-[11px] text-eco-green/35 line-through tabular-nums">
                {Math.round(original)}
              </span>
            )}
          </div>
          {savings > 0 && (
            <span className="shrink-0 rounded-full bg-eco-coral/10 px-2.5 py-0.5 text-[10px] font-bold tracking-tight text-eco-coral ring-1 ring-eco-coral/15">
              {t("favorites.save", { amount: Math.round(savings), currency: t("common.currency") })}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleOrder}
          disabled={ordering || orderState === "success"}
          className={[
            "w-full rounded-2xl px-4 py-3 font-heading text-[13px] font-bold tracking-tight text-white shadow-[0_12px_28px_-12px_rgba(63,93,58,0.55)] transition active:scale-[0.99] disabled:opacity-60",
            orderState === "success"
              ? "bg-gradient-to-b from-emerald-500 to-emerald-600"
              : "bg-gradient-to-b from-eco-green to-[#324a2d] hover:brightness-[1.08]",
          ].join(" ")}
        >
          {ordering ? t("favorites.ordering") : orderState === "success" ? t("favorites.ordered") : t("favorites.orderNow")}
        </button>

        {orderMessage && (
          <p className={`text-[11px] ${orderState === "success" ? "text-eco-green/65" : "text-eco-coral"}`}>
            {orderMessage}
          </p>
        )}
      </div>
    </article>
  );
}

function ListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-80 animate-pulse rounded-[24px] border border-eco-green/8 bg-white" />
      ))}
    </div>
  );
}

function EmptyState({ which }) {
  const t = useT();
  const isRestos = which === "restaurants";
  return (
    <div className="rounded-[24px] border border-eco-green/8 bg-white p-10 text-center shadow-[0_18px_44px_-28px_rgba(63,93,58,0.25)]">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-eco-coral/10 text-eco-coral ring-1 ring-eco-coral/15">
        {isRestos ? <HeartIcon className="h-5 w-5" /> : <StarIcon className="h-5 w-5" />}
      </div>
      <p className="mt-3 font-heading text-lg font-bold text-eco-green">
        {isRestos ? t("favorites.empty.restaurantsTitle") : t("favorites.empty.dealsTitle")}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-eco-green/55">
        {isRestos
          ? t("favorites.empty.restaurantsHint")
          : t("favorites.empty.dealsHint")}
      </p>
      <Link
        to="/deals"
        className="mt-4 inline-flex rounded-2xl bg-gradient-to-b from-eco-green to-[#324a2d] px-5 py-2.5 text-sm font-bold tracking-tight text-white shadow-[0_12px_28px_-12px_rgba(63,93,58,0.55)] transition hover:brightness-[1.08] active:scale-[0.99]"
      >
        {t("favorites.empty.browseDeals")}
      </Link>
    </div>
  );
}

/* ── Icons ──────────────────────────────────────────────────────────── */

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

function StarIcon({ className, filled }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} className={className} aria-hidden="true">
      <path
        d="M12 2.5l2.76 6.92 7.44.54-5.65 4.87 1.76 7.27L12 18.3l-6.31 3.8 1.76-7.27L1.8 9.96l7.44-.54L12 2.5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
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
