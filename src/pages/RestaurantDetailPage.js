import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AccountChrome } from "../components/AccountChrome";
import { useAuth } from "../context/AuthContext";
import { getRestaurant } from "../api/restaurants";
import { placeOrder } from "../api/orders";
import { getBoutiqueReviews, submitReview } from "../api/reviews";
import {
  addDealFavorite,
  addFavorite,
  getFavoriteDealIds,
  getFavoriteIds,
  removeDealFavorite,
  removeFavorite,
} from "../api/favorites";
import { useT } from "../i18n";

export function RestaurantDetailPage() {
  const t = useT();
  const { id } = useParams();
  const restaurantId = Number(id);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [coords, setCoords] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favDealIds, setFavDealIds] = useState(new Set());

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => {},
      { timeout: 6000 }
    );
  }, []);

  const load = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    setError("");
    try {
      const [data, restoIds, dealIds] = await Promise.all([
        getRestaurant(restaurantId, coords ?? {}),
        getFavoriteIds().catch(() => []),
        getFavoriteDealIds().catch(() => []),
      ]);
      setRestaurant(data);
      setIsFavorite(new Set(restoIds ?? []).has(restaurantId));
      setFavDealIds(new Set(dealIds ?? []));
    } catch (err) {
      if (err.status === 401) {
        setUser(null);
        navigate("/login", { replace: true });
        return;
      }
      setError(err.status === 404 ? t("restaurantDetail.errorNotFound") : t("restaurantDetail.errorLoad"));
    } finally {
      setLoading(false);
    }
  }, [restaurantId, coords, navigate, setUser, t]);

  useEffect(() => { load(); }, [load]);

  const toggleRestaurantFavorite = async () => {
    const wasFav = isFavorite;
    setIsFavorite(!wasFav);
    try {
      if (wasFav) await removeFavorite(restaurantId);
      else await addFavorite(restaurantId);
    } catch {
      setIsFavorite(wasFav);
    }
  };

  const toggleDealFavorite = async (panierId) => {
    const wasFav = favDealIds.has(panierId);
    setFavDealIds((prev) => {
      const next = new Set(prev);
      if (wasFav) next.delete(panierId); else next.add(panierId);
      return next;
    });
    try {
      if (wasFav) await removeDealFavorite(panierId);
      else await addDealFavorite(panierId);
    } catch {
      setFavDealIds((prev) => {
        const next = new Set(prev);
        if (wasFav) next.add(panierId); else next.delete(panierId);
        return next;
      });
    }
  };

  const bestDiscount = useMemo(() => {
    if (!restaurant?.offers?.length) return 0;
    return Math.max(...restaurant.offers.map((o) => Number(o.discountPercentage) || 0));
  }, [restaurant]);

  const restaurantName = restaurant?.name ?? restaurant?.nom ?? restaurant?.Nom ?? "";

  return (
    <AccountChrome
      showBack
      title={restaurantName}
      breadcrumbs={[
        { label: t("profile.dashboard.navDashboard"), to: "/profile" },
        { label: t("common.nav.deals"), to: "/deals" },
        { label: restaurantName || t("restaurantDetail.restaurant") },
      ]}
    >
      <div className="mx-auto max-w-5xl">
        {loading && <DetailSkeleton />}

        {!loading && error && (
          <ErrorState message={error} onRetry={load} />
        )}

        {!loading && !error && restaurant && (
          <>
            <Hero
              restaurant={restaurant}
              bestDiscount={bestDiscount}
              isFavorite={isFavorite}
              onToggleFavorite={toggleRestaurantFavorite}
            />

            <StatsStrip restaurant={restaurant} dealCount={restaurant.offers.length} />

            <section className="mt-10">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <p className="font-heading text-[10px] font-bold uppercase tracking-[0.24em] text-eco-coral">
                    {t("restaurantDetail.activeDeals")}
                  </p>
                  <h2 className="mt-1 font-heading text-2xl font-bold tracking-tight text-eco-green md:text-3xl">
                    {restaurant.offers.length === 0
                      ? t("restaurantDetail.noDealsAvailable")
                      : restaurant.offers.length === 1
                        ? t("restaurantDetail.oneDealAvailable")
                        : t("restaurantDetail.dealsAvailable", { count: restaurant.offers.length })}
                  </h2>
                </div>
                {bestDiscount > 0 && (
                  <span className="hidden items-center gap-1.5 rounded-full bg-gradient-to-b from-eco-coral to-[#d85048] px-3.5 py-1.5 font-heading text-[11px] font-bold tracking-tight text-white shadow-[0_8px_20px_-6px_rgba(242,108,99,0.55)] ring-1 ring-white/30 sm:inline-flex">
                    {t("restaurantDetail.discountUpTo", { percent: Math.round(bestDiscount) })}
                  </span>
                )}
              </div>

              {restaurant.offers.length === 0 && <EmptyDeals />}

              {restaurant.offers.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
                  {restaurant.offers.map((offer) => (
                    <DealCard
                      key={offer.id}
                      offer={offer}
                      isFavorite={favDealIds.has(offer.id)}
                      onToggleFavorite={() => toggleDealFavorite(offer.id)}
                    />
                  ))}
                </div>
              )}
            </section>

            <Reviews boutiqueId={restaurant.id} />
          </>
        )}
      </div>
    </AccountChrome>
  );
}

/* ── Reviews (stars + comments, gated by a completed purchase) ───────────── */

function Reviews({ boutiqueId }) {
  const t = useT();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    getBoutiqueReviews(boutiqueId)
      .then((d) => {
        setData(d);
        if (d?.myReview) {
          setNote(d.myReview.note ?? 0);
          setComment(d.myReview.commentaire ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [boutiqueId]);

  useEffect(() => { load(); }, [load]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (note < 1) return;
    setSaving(true);
    setMsg("");
    try {
      await submitReview(boutiqueId, note, comment);
      setMsg(t("restaurantDetail.reviews.thanks"));
      load();
    } catch (err) {
      setMsg(err.data?.message || t("restaurantDetail.reviews.notEligible"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="mt-10 h-40 animate-pulse rounded-[24px] border border-eco-green/8 bg-white" />;
  }
  if (!data) return null;

  const items = data.items ?? [];
  const hasReview = !!data.myReview;

  return (
    <section className="mt-10">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="font-heading text-[10px] font-bold uppercase tracking-[0.24em] text-eco-coral">
            {t("restaurantDetail.reviews.title")}
          </p>
          <h2 className="mt-1 flex items-center gap-2 font-heading text-2xl font-bold tracking-tight text-eco-green md:text-3xl">
            <StarIcon className="h-6 w-6 text-eco-softYellow" filled />
            {data.count > 0 ? data.average.toFixed(1) : "—"}
            <span className="text-sm font-semibold text-eco-green/50">
              {t("restaurantDetail.reviews.summary", { avg: data.average.toFixed(1), count: data.count })}
            </span>
          </h2>
        </div>
      </div>

      {/* Review form (only after a completed order) */}
      {data.canReview ? (
        <form onSubmit={onSubmit} className="rounded-[24px] border border-eco-green/8 bg-white p-5 shadow-[0_2px_8px_rgba(63,93,58,0.04),0_22px_50px_-30px_rgba(63,93,58,0.28)]">
          <p className="font-heading text-base font-bold text-eco-green">{t("restaurantDetail.reviews.formTitle")}</p>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-eco-green/55">{t("restaurantDetail.reviews.yourRating")}</p>
          <StarRatingInput value={note} onChange={setNote} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder={t("restaurantDetail.reviews.commentPlaceholder")}
            className="mt-3 w-full rounded-xl border border-eco-green/15 bg-white px-3 py-2.5 text-sm text-eco-green placeholder:text-eco-green/35 focus:border-eco-green/40 focus:outline-none focus:ring-2 focus:ring-eco-green/15"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            {msg && <p className="text-[12px] text-eco-green/65">{msg}</p>}
            <button
              type="submit"
              disabled={saving || note < 1}
              className="ml-auto rounded-xl bg-gradient-to-b from-eco-green to-[#324a2d] px-5 py-2.5 font-heading text-[13px] font-bold text-white shadow-sm transition hover:brightness-[1.08] active:scale-[0.99] disabled:opacity-50"
            >
              {saving ? t("restaurantDetail.reviews.submitting") : hasReview ? t("restaurantDetail.reviews.updateSubmit") : t("restaurantDetail.reviews.submit")}
            </button>
          </div>
        </form>
      ) : (
        <p className="rounded-2xl border border-dashed border-eco-green/20 bg-white/60 px-4 py-3 text-sm text-eco-green/55">
          {t("restaurantDetail.reviews.notEligible")}
        </p>
      )}

      {/* Review list */}
      <div className="mt-5 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-eco-green/55">{t("restaurantDetail.reviews.none")}</p>
        ) : (
          items.map((r) => <ReviewItem key={r.id} review={r} />)
        )}
      </div>
    </section>
  );
}

function ReviewItem({ review }) {
  const date = review.dateCreation
    ? new Date(review.dateCreation).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    : "";
  return (
    <article className="rounded-2xl border border-eco-green/8 bg-white p-4 shadow-[0_2px_6px_rgba(63,93,58,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-eco-green/10 font-heading text-xs font-bold text-eco-green">
            {(review.authorName || "C").charAt(0).toUpperCase()}
          </span>
          <span className="font-heading text-sm font-bold text-eco-green">{review.authorName}</span>
        </div>
        <StarsDisplay value={review.note} />
      </div>
      {review.commentaire && (
        <p className="mt-2.5 text-[13px] leading-relaxed text-eco-green/70">{review.commentaire}</p>
      )}
      {date && <p className="mt-2 text-[11px] text-eco-green/40">{date}</p>}
    </article>
  );
}

function StarsDisplay({ value }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon key={i} className={`h-4 w-4 ${i <= value ? "text-eco-softYellow" : "text-eco-green/20"}`} filled={i <= value} />
      ))}
    </span>
  );
}

function StarRatingInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="mt-1.5 inline-flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => {
        const active = i <= (hover || value);
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            onMouseEnter={() => setHover(i)}
            aria-label={`${i}`}
            className="transition active:scale-90"
          >
            <StarIcon className={`h-7 w-7 ${active ? "text-eco-softYellow" : "text-eco-green/20"}`} filled={active} />
          </button>
        );
      })}
    </div>
  );
}

function Hero({ restaurant, bestDiscount, isFavorite, onToggleFavorite }) {
  const t = useT();
  return (
    <section className="relative overflow-hidden rounded-[28px] shadow-[0_24px_60px_-24px_rgba(63,93,58,0.35)] ring-1 ring-eco-green/[0.04]">
      <div className="relative h-64 w-full md:h-80">
        {restaurant.imageUrl ? (
          <img
            src={restaurant.imageUrl}
            alt={restaurant.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-eco-beige/60 text-eco-green/40">
            {t("restaurantDetail.noImage")}
          </div>
        )}

        {/* Cinematic gradient overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/0"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 to-transparent"
        />

        {/* Top bar: back + favorite */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 py-4 md:px-6">
          <Link
            to="/deals"
            aria-label={t("restaurantDetail.backToDeals")}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-eco-green shadow-md backdrop-blur-md transition hover:bg-white"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            {t("common.back")}
          </Link>

          <button
            type="button"
            onClick={onToggleFavorite}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? t("restaurantDetail.removeFromFavorites") : t("restaurantDetail.addToFavorites")}
            title={isFavorite ? t("restaurantDetail.removeFromFavorites") : t("restaurantDetail.addToFavorites")}
            className={[
              "grid h-10 w-10 place-items-center rounded-full shadow-md backdrop-blur-md transition active:scale-90",
              isFavorite
                ? "bg-eco-coral text-white"
                : "bg-white/90 text-eco-green/80 hover:bg-white hover:text-eco-coral",
            ].join(" ")}
          >
            <HeartIcon filled={isFavorite} className="h-4 w-4" />
          </button>
        </div>

        {/* Discount badge */}
        {bestDiscount > 0 && (
          <span className="absolute left-5 top-20 inline-flex items-center gap-1 rounded-full bg-gradient-to-b from-eco-coral to-[#d85048] px-3.5 py-1.5 font-heading text-[11px] font-bold tracking-tight text-white shadow-[0_10px_24px_-8px_rgba(242,108,99,0.6)] ring-1 ring-white/30">
            {t("restaurantDetail.discountOff", { percent: Math.round(bestDiscount) })}
          </span>
        )}

        {/* Bottom: title block */}
        <div className="absolute inset-x-0 bottom-0 px-5 pb-5 md:px-7 md:pb-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="font-heading text-[10px] font-bold uppercase tracking-[0.24em] text-white/80">
                {restaurant.cuisineType ?? t("restaurantDetail.restaurant")}
              </p>
              <h1 className="mt-1 truncate font-heading text-3xl font-bold tracking-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)] md:text-4xl">
                {restaurant.name}
              </h1>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[12px] font-bold text-eco-green shadow-md">
              <StarIcon className="h-3.5 w-3.5 text-eco-softYellow" filled />
              {restaurant.rating?.toFixed(1) ?? "—"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsStrip({ restaurant, dealCount }) {
  const t = useT();
  const items = [
    {
      icon: <PinIcon className="h-3.5 w-3.5" />,
      label: t("restaurantDetail.stats.distance"),
      value:
        restaurant.distanceKm > 0
          ? `${restaurant.distanceKm.toFixed(1)} km`
          : t("restaurantDetail.stats.nearby"),
    },
    {
      icon: <TagIcon className="h-3.5 w-3.5" />,
      label: t("restaurantDetail.stats.deals"),
      value: String(dealCount),
    },
    {
      icon: <PhoneIcon className="h-3.5 w-3.5" />,
      label: t("restaurantDetail.stats.phone"),
      value: restaurant.phoneNumber || "—",
      href: restaurant.phoneNumber ? `tel:${restaurant.phoneNumber}` : null,
    },
    {
      icon: <MapIcon className="h-3.5 w-3.5" />,
      label: t("restaurantDetail.stats.address"),
      value: [restaurant.address, restaurant.ville].filter(Boolean).join(", "),
      span: true,
    },
  ];

  return (
    <section className="mt-5 overflow-hidden rounded-[20px] glass-card shadow-[0_10px_30px_-14px_rgba(63,93,58,0.22)]">
      <ul className="grid grid-cols-2 divide-x divide-y divide-eco-green/[0.06] sm:grid-cols-4 sm:divide-y-0">
        {items.map((it, i) => (
          <li
            key={i}
            className={[
              "flex items-start gap-3 px-4 py-3.5 sm:px-5",
              it.span ? "col-span-2 sm:col-span-1" : "",
            ].join(" ")}
          >
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-eco-coral/10 text-eco-coral ring-1 ring-eco-coral/15">
              {it.icon}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-eco-green/50">
                {it.label}
              </p>
              {it.href ? (
                <a
                  href={it.href}
                  className="mt-0.5 block truncate text-[13px] font-semibold text-eco-green hover:text-eco-coral"
                >
                  {it.value}
                </a>
              ) : (
                <p className="mt-0.5 truncate text-[13px] font-semibold text-eco-green">
                  {it.value}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DealCard({ offer, isFavorite, onToggleFavorite }) {
  const t = useT();
  const [ordering, setOrdering] = useState(false);
  const [orderState, setOrderState] = useState(null);
  const [orderMessage, setOrderMessage] = useState("");

  const validUntil = offer.validUntil
    ? new Date(offer.validUntil).toLocaleDateString(undefined, { day: "numeric", month: "short" })
    : null;

  const original = Number(offer.originalPrice) || 0;
  const discounted = Number(offer.discountedPrice) || 0;
  const savings = original > 0 ? Math.max(0, original - discounted) : 0;
  const discountPct = Math.round(Number(offer.discountPercentage) || 0);

  const handleOrder = async () => {
    setOrdering(true);
    setOrderState(null);
    try {
      await placeOrder(offer.id);
      setOrderState("success");
      setOrderMessage(t("restaurantDetail.deal.orderSuccess"));
    } catch (err) {
      setOrderState("error");
      setOrderMessage(err.data?.message || t("restaurantDetail.deal.orderError"));
    } finally {
      setOrdering(false);
    }
  };

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[24px] glass-card shadow-[0_10px_30px_-14px_rgba(63,93,58,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-18px_rgba(63,93,58,0.32)]">
      <div className="relative m-2 h-44 overflow-hidden rounded-[18px] bg-eco-beige/60 ring-1 ring-black/5">
        {offer.imageUrl ? (
          <img
            src={offer.imageUrl}
            alt={offer.title}
            className="h-full w-full object-cover transition-transform duration-[600ms] group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full place-items-center text-eco-green/40">{t("restaurantDetail.noImage")}</div>
        )}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"
        />

        {discountPct > 0 && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-b from-eco-coral to-[#d85048] px-3 py-1 font-heading text-[11px] font-bold tracking-tight text-white shadow-[0_8px_20px_-6px_rgba(242,108,99,0.7)] ring-1 ring-white/30">
            <span className="opacity-90">−</span>
            {discountPct}%
          </span>
        )}

        <button
          type="button"
          onClick={onToggleFavorite}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? t("restaurantDetail.removeDealFromFavorites") : t("restaurantDetail.saveDeal")}
          title={isFavorite ? t("restaurantDetail.removeFromFavorites") : t("restaurantDetail.saveDeal")}
          className={[
            "absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full shadow-md backdrop-blur-md transition active:scale-90",
            isFavorite
              ? "bg-eco-softYellow text-eco-green ring-1 ring-eco-softYellow/60"
              : "bg-white/90 text-eco-green/70 hover:bg-white hover:text-eco-coral",
          ].join(" ")}
        >
          <StarIcon className="h-4 w-4" filled={isFavorite} />
        </button>

        {validUntil && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-eco-green/70 shadow-sm backdrop-blur-md">
            <ClockIcon className="h-3 w-3" />
            {t("restaurantDetail.deal.until", { date: validUntil })}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-3">
        <div>
          <h3 className="font-heading text-[16px] font-bold leading-tight tracking-tight text-eco-green">
            {offer.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-eco-green/55">
            {offer.description}
          </p>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-eco-green/10 to-transparent" />

        <div className="flex items-end justify-between gap-3">
          <div className="flex items-baseline gap-1.5">
            <span className="font-heading text-[24px] font-extrabold leading-none tracking-tight text-eco-green tabular-nums">
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
              {t("restaurantDetail.deal.save", { amount: Math.round(savings), currency: t("common.currency") })}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleOrder}
          disabled={ordering || orderState === "success"}
          className={[
            "mt-1 w-full rounded-2xl px-4 py-3 font-heading text-[13px] font-bold tracking-tight text-white shadow-[0_12px_28px_-12px_rgba(63,93,58,0.55)] transition active:scale-[0.99] disabled:opacity-60",
            orderState === "success"
              ? "bg-gradient-to-b from-emerald-500 to-emerald-600"
              : "bg-gradient-to-b from-eco-green to-[#324a2d] hover:brightness-[1.08]",
          ].join(" ")}
        >
          {ordering ? t("restaurantDetail.deal.ordering") : orderState === "success" ? t("restaurantDetail.deal.ordered") : t("restaurantDetail.deal.orderNow")}
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

function DetailSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-64 w-full animate-pulse rounded-[28px] glass-soft md:h-80" />
      <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-[20px] glass-soft sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse" />
        ))}
      </div>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-80 animate-pulse rounded-[24px] glass-soft" />
        ))}
      </div>
    </div>
  );
}

function EmptyDeals() {
  const t = useT();
  return (
    <div className="rounded-[24px] border border-dashed border-eco-green/25 glass-soft p-10 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-eco-coral/10 text-eco-coral ring-1 ring-eco-coral/15 backdrop-blur-md">
        <TagIcon className="h-5 w-5" />
      </div>
      <p className="mt-3 font-heading text-base font-bold text-eco-green">{t("restaurantDetail.empty.title")}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-eco-green/55">
        {t("restaurantDetail.empty.hint")}
      </p>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  const t = useT();
  return (
    <div className="rounded-[24px] border border-eco-coral/25 bg-eco-coral/10 p-6 text-center">
      <p className="font-heading text-base font-semibold text-eco-coral">{message}</p>
      <button
        onClick={onRetry}
        className="mt-3 inline-flex items-center rounded-xl bg-eco-green px-4 py-2 text-sm font-bold text-white shadow-md transition hover:brightness-[1.05] active:scale-[0.99]"
      >
        {t("common.retry")}
      </button>
    </div>
  );
}

/* ── Icons ──────────────────────────────────────────────────────────── */

function ArrowLeftIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
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

function PinIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function PhoneIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A14 14 0 0 1 4 7a2 2 0 0 1 1-3z"
        stroke="currentColor" strokeWidth="2" strokeLinejoin="round"
      />
    </svg>
  );
}

function TagIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M3 12V4h8l10 10-8 8L3 12z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="8" cy="8" r="1.6" fill="currentColor" />
    </svg>
  );
}

function MapIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 4v14M15 6v14" stroke="currentColor" strokeWidth="2" />
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
