import { apiFetch } from "./client";

export function reportUser(userId, reason) {
  return apiFetch(`/api/reports/user/${userId}`, {
    method: "POST",
    body: JSON.stringify({ reason: reason ?? "" }),
  });
}

export function reportBoutique(boutiqueId, reason) {
  return apiFetch(`/api/reports/boutique/${boutiqueId}`, {
    method: "POST",
    body: JSON.stringify({ reason: reason ?? "" }),
  });
}
