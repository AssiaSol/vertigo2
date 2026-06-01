import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AccountChrome } from "../components/AccountChrome";
import { RescueMap } from "../components/RescueMap";
import { useAuth } from "../context/AuthContext";
import { getNearbyRestaurants } from "../api/restaurants";
import { useT } from "../i18n";

const ORAN = { latitude: 35.6969, longitude: -0.6331 };

export function RescueMapPage() {
  const t = useT();
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const [coords, setCoords] = useState(null);
  const [notice, setNotice] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Get the user's location (fall back to Oran where the seed data lives).
  useEffect(() => {
    if (!navigator.geolocation) {
      setCoords(ORAN);
      setNotice(t("rescueMap.page.usingOran"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => { setCoords(ORAN); setNotice(t("rescueMap.page.usingOran")); },
      { timeout: 8000 }
    );
  }, [t]);

  const load = useCallback(async () => {
    if (!coords) return;
    setLoading(true);
    setError("");
    try {
      const data = await getNearbyRestaurants({ ...coords, radiusKm: 50, sortBy: "distance" });
      setRestaurants(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.status === 401) {
        setUser(null);
        navigate("/login", { replace: true });
        return;
      }
      setError(t("rescueMap.page.error"));
    } finally {
      setLoading(false);
    }
  }, [coords, navigate, setUser, t]);

  useEffect(() => { load(); }, [load]);

  // Shape the restaurants into the single-"city" structure RescueMap expects.
  const cities = useMemo(() => {
    const center = coords ?? ORAN;
    return [{
      name: "nearby",
      lat: center.latitude,
      lng: center.longitude,
      zoom: 12,
      restaurants: restaurants
        .filter((r) => r.latitude && r.longitude)
        .map((r) => ({
          id: r.id,
          name: r.name,
          cuisine: r.cuisineType || "",
          lat: r.latitude,
          lng: r.longitude,
        })),
    }];
  }, [coords, restaurants]);

  return (
    <AccountChrome
      eyebrow={t("rescueMap.page.eyebrow")}
      title={t("rescueMap.page.title")}
      breadcrumbs={[{ label: t("profile.dashboard.navDashboard"), to: "/profile" }, { label: t("rescueMap.page.title") }]}
    >
      <div className="mx-auto max-w-5xl">
        <p className="max-w-xl text-sm text-eco-green/65 md:text-base">
          {t("rescueMap.page.subtitle")}
        </p>

        {notice && (
          <p className="mt-3 inline-block rounded-full bg-eco-softYellow/40 px-3 py-1 text-xs text-eco-green/75">
            {notice}
          </p>
        )}

        <div className="mt-6 overflow-hidden rounded-[24px] border border-eco-green/8 bg-white p-3 shadow-[0_2px_8px_rgba(63,93,58,0.04),0_22px_50px_-30px_rgba(63,93,58,0.28)]">
          {loading && (
            <div className="aspect-[5/4] animate-pulse rounded-lg bg-eco-beige/50 md:aspect-[16/10]" />
          )}
          {!loading && error && (
            <div className="rounded-2xl border border-eco-coral/25 bg-eco-coral/5 p-4 text-sm text-eco-coral">{error}</div>
          )}
          {!loading && !error && coords && (
            <RescueMap
              cities={cities}
              activeIndex={0}
              onSelect={(r) => { if (r.id) navigate(`/restaurants/${r.id}`); }}
            />
          )}
        </div>

        {!loading && !error && (
          <p className="mt-3 text-center text-[12px] text-eco-green/55">
            {t("rescueMap.page.count", { n: cities[0].restaurants.length })}
          </p>
        )}
      </div>
    </AccountChrome>
  );
}
