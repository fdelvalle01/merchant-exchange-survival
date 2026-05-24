import Keycloak, { type KeycloakInitOptions } from "keycloak-js";

export const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL ?? "http://localhost:8180",
  realm: import.meta.env.VITE_KEYCLOAK_REALM ?? "stockbar",
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? "stockbar-frontend"
});

let initPromise: Promise<boolean> | null = null;

export function initKeycloak(options: KeycloakInitOptions) {
  if (!initPromise) {
    initPromise = keycloak.init(options);
  }

  return initPromise;
}
