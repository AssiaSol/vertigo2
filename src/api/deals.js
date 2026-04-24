import { apiFetch } from "./client";

export const BASKET_TYPES = [
  "Bakery Basket",
  "Food Basket",
  "Grocery Basket",
  "Surprise Basket",
];

export function getMyDeals() {
  return apiFetch("/api/deals/mine");
}

export function createDeal(deal) {
  return apiFetch("/api/deals", {
    method: "POST",
    body: JSON.stringify(deal),
  });
}

export function updateDeal(id, deal) {
  return apiFetch(`/api/deals/${id}`, {
    method: "PUT",
    body: JSON.stringify(deal),
  });
}

export function deleteDeal(id) {
  return apiFetch(`/api/deals/${id}`, { method: "DELETE" });
}
