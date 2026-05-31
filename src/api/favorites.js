import { apiFetch } from "./client";

export function getMyFavorites({ latitude, longitude } = {}) {
  const qs = new URLSearchParams();
  if (latitude != null) qs.set("latitude", String(latitude));
  if (longitude != null) qs.set("longitude", String(longitude));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch(`/api/favorites${suffix}`);
}

export function getFavoriteIds() {
  return apiFetch("/api/favorites/ids");
}

export function addFavorite(boutiqueId) {
  return apiFetch(`/api/favorites/${boutiqueId}`, { method: "POST" });
}

export function removeFavorite(boutiqueId) {
  return apiFetch(`/api/favorites/${boutiqueId}`, { method: "DELETE" });
}

// ── Deal-level favorites ────────────────────────────────────────────────────

export function getMyFavoriteDeals() {
  return apiFetch("/api/favorites/deals");
}

export function getFavoriteDealIds() {
  return apiFetch("/api/favorites/deals/ids");
}

export function addDealFavorite(panierId) {
  return apiFetch(`/api/favorites/deals/${panierId}`, { method: "POST" });
}

export function removeDealFavorite(panierId) {
  return apiFetch(`/api/favorites/deals/${panierId}`, { method: "DELETE" });
}
