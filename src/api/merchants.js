import { apiFetch } from "./client";

export function applyMerchant(application) {
  return apiFetch("/api/merchants/apply", {
    method: "POST",
    body: JSON.stringify(application),
  });
}

export function getMyMerchant() {
  return apiFetch("/api/merchants/mine");
}

export function getPendingMerchants() {
  return apiFetch("/api/merchants/pending");
}

export function approveMerchant(id) {
  return apiFetch(`/api/merchants/${id}/approve`, { method: "POST" });
}

export function rejectMerchant(id) {
  return apiFetch(`/api/merchants/${id}/reject`, { method: "POST" });
}
