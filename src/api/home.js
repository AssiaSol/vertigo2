import { apiFetch } from "./client";

export function getHomeInit() {
  return apiFetch("/home/init");
}
