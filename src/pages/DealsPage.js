import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getNearbyRestaurants } from "../api/restaurants";
import { placeOrder } from "../api/orders";
import { reportBoutique } from "../api/reports";
import { logout } from "../api/auth";
import { AuthedHeader } from "../components/AuthedHeader";

const ORAN_FALLBACK = { latitude: 35.6969, longitude: -0.6331 };

const WILAYAS = [
  { value: "auto", label: "Use my location", coords: null },
  { value: "oran", label: "Oran", coords: { latitude: 35.6969, longitude: -0.6331 } },
  { value: "mostaganem", label: "Mostaganem", coords: { latitude: 35.9359, longitude: 0.0892 } },
  { value: "sidi", label: "Sidi Bel Abbès", coords: { latitude: 35.1878, longitude: -0.6306 } },
];

const SORT_OPTIONS = [
  { value: "bestDiscount", label: "Best discount" },
  { value: "distance", label: "Distance" },
  { value: "rating", label: "Rating" },
];

const WILAYA_STORAGE_KEY = "vertigo.wilaya";

export function DealsPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [coords, setCoords] = useState(null);
  const [locationNotice, setLocationNotice] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("bestDiscount");
  const [radiusKm, setRadiusKm] = useState(5);
  const [wilaya, setWilaya] = useState(() => localStorage.getItem(WILAYA_STORAGE_KEY) || "auto");
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(WILAYA_STORAGE_KEY, wilaya);

    const chosen = WILAYAS.find((w) => w.value === wilaya);
    if (chosen && chosen.coords) {
      setCoords(chosen.coords);
      setLocationNotice(`Showing deals near ${chosen.label}.`);
      return;
    }

    // auto = use browser geolocation
    if (!navigator.geolocation) {
      setCoords(ORAN_FALLBACK);
      setLocationNotice("Geolocation unavailable — showing deals near Oran.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocationNotice("");
      },
      () => {
        setCoords(ORAN_FALLBACK);
        setLocationNotice("Location access denied — showing deals near Oran.");
      },
      { timeout: 8000 }
    );
  }, [wilaya]);

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
      setError("Couldn't load deals. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [coords, radiusKm, sortBy, navigate, setUser]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  return (
    <div className="min-h-screen bg-eco-beige/40 font-body text-eco-green">
      <AuthedHeader />

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
        <section className="mb-6 md:mb-8">
          <p className="font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-eco-coral">
            Welcome back
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-eco-green md:text-4xl">
            Hi {user?.nom ?? user?.Nom ?? "there"} 👋
          </h1>
          <p className="mt-2 max-w-xl text-sm text-eco-green/70 md:text-base">
            Best deals near you — rescue surplus food at a discount.
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
              Sort
            </label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-eco-green/15 bg-white px-3 py-2 text-sm text-eco-green shadow-sm focus:border-eco-coral/40 focus:outline-none focus:ring-2 focus:ring-eco-coral/25"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="radius" className="text-xs font-semibold uppercase tracking-wide text-eco-green/55">
              Radius
            </label>
            <select
              id="radius"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="rounded-xl border border-eco-green/15 bg-white px-3 py-2 text-sm text-eco-green shadow-sm focus:border-eco-coral/40 focus:outline-none focus:ring-2 focus:ring-eco-coral/25"
            >
              {[2, 5, 10, 20, 50].map((r) => (
                <option key={r} value={r}>{r} km</option>
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
              Settings
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

        <h2 className="mb-4 font-heading text-xl font-bold text-eco-green md:text-2xl">
          Best deals near you
        </h2>

        {loading && <DealsSkeleton />}

        {!loading && error && <ErrorState message={error} onRetry={fetchDeals} />}

        {!loading && !error && restaurants.length === 0 && <EmptyState />}

        {!loading && !error && restaurants.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((r) => <RestaurantCard key={r.id} restaurant={r} />)}
          </div>
        )}
      </main>
    </div>
  );
}

function RestaurantCard({ restaurant }) {
  const best = restaurant.offers[0];
  const [ordering, setOrdering] = useState(false);
  const [orderState, setOrderState] = useState(null); // 'success' | 'error'
  const [orderMessage, setOrderMessage] = useState("");
  const [reporting, setReporting] = useState(false);

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
      setOrderMessage("Order placed! Find it under My orders.");
    } catch (err) {
      setOrderState("error");
      setOrderMessage(err.data?.message || "Couldn't place order.");
    } finally {
      setOrdering(false);
    }
  };

  const handleReport = async () => {
    const reason = window.prompt("Why are you reporting this restaurant?");
    if (reason === null) return;
    setReporting(true);
    try {
      await reportBoutique(restaurant.id, reason);
      alert("Thanks — the restaurant has been reported.");
    } catch {
      alert("Couldn't submit the report.");
    } finally {
      setReporting(false);
    }
  };

  return (
    <article className="relative flex flex-col overflow-hidden rounded-2xl border border-eco-green/10 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative h-40 w-full overflow-hidden bg-eco-beige/60">
        {restaurant.imageUrl ? (
          <img src={restaurant.imageUrl} alt={restaurant.name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="grid h-full place-items-center text-eco-green/40">No image</div>
        )}
        {best && (
          <span className="absolute left-3 top-3 rounded-full bg-eco-coral px-3 py-1 text-xs font-bold text-white shadow-md">
            -{Math.round(Number(best.discountPercentage))}%
          </span>
        )}
        <button
          type="button"
          onClick={handleReport}
          disabled={reporting}
          title="Report restaurant"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/85 text-eco-coral shadow-md transition hover:bg-white disabled:opacity-50"
          aria-label="Report restaurant"
        >
          <FlagIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-base font-bold text-eco-green">{restaurant.name}</h3>
          <div className="flex shrink-0 items-center gap-1 text-sm text-eco-green/70">
            <StarIcon className="h-4 w-4 text-eco-softYellow" />
            {restaurant.rating?.toFixed(1) ?? "—"}
          </div>
        </div>

        <p className="text-xs text-eco-green/60">
          {restaurant.cuisineType ?? "Restaurant"} · {restaurant.distanceKm} km away
        </p>

        {best && (
          <div className="mt-1 rounded-xl bg-eco-beige/40 p-3">
            <p className="font-heading text-sm font-semibold text-eco-green">{best.title}</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-eco-green/60">{best.description}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-heading text-lg font-bold text-eco-coral">
                {formatPrice(best.discountedPrice)} DA
              </span>
              {Number(best.originalPrice) > 0 && (
                <span className="text-xs text-eco-green/45 line-through">
                  {formatPrice(best.originalPrice)} DA
                </span>
              )}
            </div>
            {validUntil && <p className="mt-1 text-[11px] text-eco-green/55">Valid until {validUntil}</p>}
          </div>
        )}

        {best && (
          <button
            type="button"
            onClick={handleOrder}
            disabled={ordering || orderState === "success"}
            className="mt-1 w-full rounded-xl bg-eco-green px-4 py-2.5 font-heading text-sm font-bold text-white shadow-md transition hover:brightness-[1.05] active:scale-[0.99] disabled:opacity-60"
          >
            {ordering ? "Ordering…" : orderState === "success" ? "Ordered ✓" : "Order now"}
          </button>
        )}

        {orderMessage && (
          <p className={`text-xs ${orderState === "success" ? "text-eco-green/70" : "text-eco-coral"}`}>
            {orderMessage}
          </p>
        )}

        {restaurant.offers.length > 1 && (
          <p className="text-[11px] text-eco-green/50">
            +{restaurant.offers.length - 1} more offer{restaurant.offers.length > 2 ? "s" : ""}
          </p>
        )}
      </div>
    </article>
  );
}

function DealsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-eco-green/10 bg-white shadow-sm">
          <div className="h-40 w-full animate-pulse bg-eco-beige/60" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-eco-green/10" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-eco-green/10" />
            <div className="h-16 w-full animate-pulse rounded-xl bg-eco-beige/40" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-eco-green/20 bg-white/60 p-8 text-center">
      <p className="font-heading text-lg font-semibold text-eco-green">No deals nearby</p>
      <p className="mt-1 text-sm text-eco-green/60">Try expanding your search radius or check back later.</p>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-eco-coral/25 bg-eco-coral/10 p-6 text-center">
      <p className="font-heading text-base font-semibold text-eco-coral">{message}</p>
      <button onClick={onRetry} className="mt-3 inline-flex items-center rounded-xl bg-eco-green px-4 py-2 text-sm font-bold text-white shadow-md transition hover:brightness-[1.05] active:scale-[0.99]">
        Retry
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

function formatPrice(n) {
  if (n == null) return "—";
  const num = Number(n);
  return Number.isFinite(num) ? num.toFixed(0) : String(n);
}

function SettingsPanel({ wilaya, onWilayaChange, onLogout, onClose }) {
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} aria-hidden="true" />
      <div className="absolute right-0 top-full z-40 mt-2 w-64 rounded-2xl border border-eco-green/15 bg-white p-4 shadow-xl">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-eco-green/55">Wilaya</p>
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
              {w.label}
            </button>
          ))}
        </div>

        <div className="my-3 h-px bg-eco-green/10" />

        <button
          type="button"
          onClick={onLogout}
          className="w-full rounded-xl border border-eco-coral/30 bg-white px-3 py-2 text-sm font-bold text-eco-coral hover:bg-eco-coral/10"
        >
          Log out
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
