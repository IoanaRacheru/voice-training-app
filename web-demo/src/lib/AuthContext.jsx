import { createContext, useContext, useEffect, useState } from "react";
import * as authApi from "@/api/authClient";
import keycloak from "@/lib/keycloak";
import { savePreferenceOverrides } from "@/lib/profilePreferences";
import { getAuthRedirectUri } from "@/lib/authRedirect";
import { mapApiUserToAppUser } from "@/lib/auth/userMapper";
import {
  pickPreferenceOverrides,
  shouldSyncPreferenceOverrides,
} from "@/lib/auth/profilePreferenceSync";

/**
 * @typedef {{
 *   id: string;
 *   username: string;
 *   email: string;
 *   first_name?: string;
 *   last_name?: string;
 *   full_name?: string;
 *   voice_goal?: "feminize" | "masculinize" | "feminine" | "masculine" | "androgynous" | "custom";
 *   experience_level?: "beginner" | "intermediate" | "advanced";
 *   target_pitch_range?: number[];
 *   training_focus?: string[];
 *   identity_background?: string;
 *   personalization_goals?: string[];
 *   age?: string | number;
 *   puberty_background?: string;
 *   initial_voice_sample?: {
 *     name: string;
 *     type?: string;
 *     size?: number;
 *     source?: "recording" | "upload";
 *     saved_at?: string;
 *   };
 *   pitch_target_enabled?: boolean;
 * }} User
 */

const AuthContext = createContext(/** @type {any} */ (null));

export function AuthProvider(/** @type {{ children: import("react").ReactNode }} */ { children }) {
  const [user, setUser] = useState(/** @type {User | null} */ (null));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    keycloak
      .init({
        onLoad: "login-required",
        pkceMethod: "S256",
        redirectUri: getAuthRedirectUri("/profile"),
      })
      .then((authenticated) => {
        if (authenticated) {
          return authApi.getMe().then((data) => setUser(mapApiUserToAppUser(data)));
        }
      })
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = () => keycloak.login({ redirectUri: getAuthRedirectUri("/profile") });

  const register = () => keycloak.register();

  const logout = () => {
    setUser(null);
    keycloak.logout({ redirectUri: getAuthRedirectUri("/profile") });
  };

  const updateUser = async (/** @type {Partial<User>} */ updates) => {
    if (!user) return;
    if (shouldSyncPreferenceOverrides(updates)) {
      savePreferenceOverrides(pickPreferenceOverrides(updates));
    }

    try {
      await authApi.patchMe(updates);
    } catch (_error) {
      // Keep local profile settings usable even when backend profile patch fails.
    }
    setUser({ ...user, ...updates });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userId: user?.id ?? null,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
