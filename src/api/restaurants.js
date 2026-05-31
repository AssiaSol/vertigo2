import { apiFetch } from "./client";

/**
 * @typedef {Object} Offer
 * @property {number} id
 * @property {string} title
 * @property {string} description
 * @property {number} discountPercentage
 * @property {number} originalPrice
 * @property {number} discountedPrice
 * @property {string|null} validFrom
 * @property {string|null} validUntil
 * @property {string|null} imageUrl
 */

/**
 * @typedef {Object} NearbyRestaurant
 * @property {number} id
 * @property {string} name
 * @property {string} address
 * @property {string} ville
 * @property {number} latitude
 * @property {number} longitude
 * @property {string|null} cuisineType
 * @property {number} rating
 * @property {string|null} imageUrl
 * @property {string|null} phoneNumber
 * @property {number} distanceKm
 * @property {Offer[]} offers
 */

/**
 * @param {{ latitude: number, longitude: number, radiusKm?: number, sortBy?: 'bestDiscount'|'distance'|'rating' }} params
 * @returns {Promise<NearbyRestaurant[]>}
 */
export function getNearbyRestaurants({ latitude, longitude, radiusKm = 5, sortBy = "bestDiscount" }) {
  const qs = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    radiusKm: String(radiusKm),
    sortBy,
  });
  return apiFetch(`/api/restaurants/nearby?${qs.toString()}`);
}

/**
 * @param {number} id
 * @param {{ latitude?: number, longitude?: number }} [coords]
 * @returns {Promise<NearbyRestaurant>}
 */
export function getRestaurant(id, coords = {}) {
  const qs = new URLSearchParams();
  if (coords.latitude != null) qs.set("latitude", String(coords.latitude));
  if (coords.longitude != null) qs.set("longitude", String(coords.longitude));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch(`/api/restaurants/${id}${suffix}`);
}
