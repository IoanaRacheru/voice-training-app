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



const AuthContext = createContext( (null));

export function AuthProvider( { children }) {
  const [user, setUser] = useState( (null));
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
    keycloak.logout({ redirectUri: getAuthRedirectUri("/") });
  };

  const updateUser = async ( updates) => {
    if (!user) return;
    if (shouldSyncPreferenceOverrides(updates)) {
      savePreferenceOverrides(pickPreferenceOverrides(updates));
    }

    try {
      await authApi.patchMe(updates);
    } catch (_error) {
      
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
