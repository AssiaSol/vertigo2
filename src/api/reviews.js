import { apiFetch } from "./client";

// Reviews (stars + comment) for a boutique. The GET also tells us whether the
// current user is allowed to review (i.e. has a completed order) and their own
// existing review, if any.
export function getBoutiqueReviews(boutiqueId) {
  return apiFetch(`/api/reviews/boutique/${boutiqueId}`);
}

export function submitReview(boutiqueId, note, commentaire) {
  return apiFetch("/api/reviews", {
    method: "POST",
    body: JSON.stringify({ boutiqueId, note, commentaire }),
  });
}
