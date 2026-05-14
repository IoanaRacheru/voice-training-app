import { createContext, useContext, useEffect, useState } from "react";
import * as authApi from "@/api/authClient";

/**
 * @typedef {{
 *   id: string;
 *   username: string;
 *   email: string;
 *   voice_goal?: "feminize" | "masculinize";
 *   experience_level?: "beginner" | "intermediate" | "advanced";
 *   target_pitch_range?: number[];
 *   training_focus?: string[];
 * }} User
 *
 * @typedef {{
 *   user: User | null;
 *   userId: string | null;
 *   isAuthenticated: boolean;
 *   isLoading: boolean;
 *   login: (email: string, password: string) => Promise<void>;
 *   register: (email: string, password: string) => Promise<void>;
 *   logout: () => void;
 *   updateUser: (updates: Partial<User>) => void;
 * }} AuthContextValue
 */

const TOKEN_KEY = "vta_token";

const AuthContext = createContext(/** @type {AuthContextValue | null} */ (null));

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(/** @type {User | null} */ (null));
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }
    authApi
      .getMe(token)
      .then(({ user_id, email }) => {
        setUser({ id: user_id, username: email.split("@")[0], email });
      })
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setIsLoading(false));
  }, []);

  /** @param {string} email @param {string} password */
  const login = async (email, password) => {
    const { token } = await authApi.login(email, password);
    localStorage.setItem(TOKEN_KEY, token);
    const { user_id } = await authApi.getMe(token);
    setUser({ id: user_id, username: email.split("@")[0], email });
  };

  /** @param {string} email @param {string} password */
  const register = async (email, password) => {
    await authApi.register(email, password);
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  /** @param {Partial<User>} updates */
  const updateUser = (updates) => {
    if (!user) return;
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
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
