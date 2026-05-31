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

// Book the same basket for a chosen period (one order per day, max 7 days).
// startDate / endDate are "YYYY-MM-DD" strings.
export function scheduleOrder(panierId, startDate, endDate) {
  return apiFetch("/api/orders/schedule", {
    method: "POST",
    body: JSON.stringify({ panierId, startDate, endDate }),
  });
}

// Remove a cancelled order from the client's list (cleanup only).
export function deleteOrder(id) {
  return apiFetch(`/api/orders/${id}`, { method: "DELETE" });
}

export function getBoutiqueOrders() {
  return apiFetch("/api/orders/boutique");
}

// Customer details for one order (gérant only): contact info, their review of
// this restaurant, and their order history with it.
export function getOrderClient(id) {
  return apiFetch(`/api/orders/${id}/client`);
}

// Merchant rates the customer of a delivered order (1–5 stars + comment).
export function rateOrderClient(id, note, commentaire) {
  return apiFetch(`/api/orders/${id}/rate-client`, {
    method: "POST",
    body: JSON.stringify({ note, commentaire }),
  });
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
