import { createClient } from "@base44/sdk";

// Client simplu fără auth (temporar)
export const base44 = createClient({
  appId: "dev-app",
  token: "",
  functionsVersion: "v1",
  serverUrl: "",
  requiresAuth: false,
  appBaseUrl: "",
});