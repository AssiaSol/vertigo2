import { apiFetch } from "./client";

export function getAdminStats() {
  return apiFetch("/api/admin/stats");
}
