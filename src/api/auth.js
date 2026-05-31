import { apiFetch } from "./client";

export function getMe() {
  return apiFetch("/account/me");
}

export function login({ email, password }) {
  return apiFetch("/account/login", {
    method: "POST",
    body: JSON.stringify({ Email: email, Password: password }),
  });
}

export function signup({ nom, email, motDePasse, telephone, wilaya }) {
  return apiFetch("/account/create", {
    method: "POST",
    body: JSON.stringify({
      Nom: nom,
      Email: email,
      MotDePasse: motDePasse,
      Telephone: telephone,
      Wilaya: wilaya || null,
      Role: "Client",
      ProfilImagePath: "/images/default-profile.png",
      Etudiant: false,
    }),
  });
}

export function logout() {
  return apiFetch("/account/logout", { method: "POST" });
}

export function updateProfile(id, payload) {
  return apiFetch(`/account/edit/${id}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
