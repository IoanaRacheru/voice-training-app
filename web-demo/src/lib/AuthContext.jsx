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
 *   getToken: () => string | null;
 *   login: (email: string, password: string) => Promise<void>;
 *   register: (email: string, password: string) => Promise<void>;
 *   logout: () => void;
 *   updateUser: (updates: Partial<User>) => Promise<void>;
 * }} AuthContextValue
 */

const TOKEN_KEY = "vta_token";

const AuthContext = createContext(/** @type {AuthContextValue | null} */ (null));

/** @param {{ user_id: string, email: string, voice_goal?: string, experience_level?: string, target_pitch_range?: number[], training_focus?: string[] }} data */
function buildUser(data) {
  return {
    id: data.user_id,
    username: data.email.split("@")[0],
    email: data.email,
    voice_goal: data.voice_goal ?? "feminize",
    experience_level: data.experience_level ?? "beginner",
    target_pitch_range: data.target_pitch_range ?? [180, 240],
    training_focus: data.training_focus ?? ["pitch"],
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(/** @type {User | null} */ (null));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setIsLoading(false); return; }
    authApi
      .getMe(token)
      .then((data) => setUser(buildUser(data)))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setIsLoading(false));
  }, []);

  const getToken = () => localStorage.getItem(TOKEN_KEY);

  /** @param {string} email @param {string} password */
  const login = async (email, password) => {
    const { token } = await authApi.login(email, password);
    localStorage.setItem(TOKEN_KEY, token);
    const data = await authApi.getMe(token);
    setUser(buildUser(data));
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
  const updateUser = async (updates) => {
    if (!user) return;
    const token = getToken();
    if (!token) return;

    const { voice_goal, experience_level, target_pitch_range, training_focus } = updates;
    const patch = {};
    if (voice_goal !== undefined) patch.voice_goal = voice_goal;
    if (experience_level !== undefined) patch.experience_level = experience_level;
    if (target_pitch_range !== undefined) patch.target_pitch_range = target_pitch_range;
    if (training_focus !== undefined) patch.training_focus = training_focus;

    if (Object.keys(patch).length > 0) {
      await authApi.patchMe(token, patch);
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
        getToken,
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
