import { apiFetch } from "./client";

export function placeOrder(panierId) {
  return apiFetch("/api/orders", {
    method: "POST",
    body: JSON.stringify({ panierId }),
  });
}

export function getMyOrders() {
  return apiFetch("/api/orders/mine");
}

export function getBoutiqueOrders() {
  return apiFetch("/api/orders/boutique");
}

export function completeOrder(id) {
  return apiFetch(`/api/orders/${id}/complete`, { method: "POST" });
}

export function cancelOrder(id) {
  return apiFetch(`/api/orders/${id}/cancel`, { method: "POST" });
}

/**
 * Advance an order to a new stage.
 * @param {number} id
 * @param {"Preparing"|"OnTheWay"|"Delivered"|"Cancelled"} status
 */
export function updateOrderStatus(id, status) {
  return apiFetch(`/api/orders/${id}/status`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
}

export const ORDER_STATUS = {
  Pending: "Pending",
  Preparing: "Preparing",
  OnTheWay: "OnTheWay",
  Delivered: "Delivered",
  Cancelled: "Cancelled",
};

export const ORDER_STATUS_LABELS = {
  Pending: "Pending",
  Preparing: "Preparing",
  OnTheWay: "On the way",
  Delivered: "Delivered",
  Cancelled: "Cancelled",
};
