import { createContext, useContext, useEffect, useState } from "react";
import * as authApi from "@/api/authClient";
import { account, ID } from "@/lib/appwrite";

/**
 * @typedef {{
 *   id: string;
 *   username: string;
 *   email: string;
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
 * }} User
 */

const AuthContext = createContext(/** @type {any} */ (null));

/** @returns {User} */
function buildUser(/** @type {any} */ data) {
  return {
    id: data.user_id,
    username: data.email?.split("@")[0] ?? data.user_id,
    email: data.email,
    voice_goal: data.voice_goal,
    experience_level: data.experience_level,
    target_pitch_range: data.target_pitch_range ?? [180, 240],
    training_focus: data.training_focus ?? ["pitch"],
    identity_background: data.identity_background,
    personalization_goals: data.personalization_goals,
    age: data.age,
    puberty_background: data.puberty_background,
    initial_voice_sample: data.initial_voice_sample,
  };
}

export function AuthProvider(/** @type {{ children: import("react").ReactNode }} */ { children }) {
  const [user, setUser] = useState(/** @type {User | null} */ (null));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    account
      .get()
      .then(() => authApi.getMe())
      .then((data) => setUser(buildUser(data)))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (/** @type {string} */ email, /** @type {string} */ password) => {
    await account.createEmailPasswordSession(email, password);
    const data = await authApi.getMe();
    setUser(buildUser(data));
  };

  const register = async (/** @type {string} */ email, /** @type {string} */ password) => {
    await account.create(ID.unique(), email, password);
    await login(email, password);
  };

  const logout = async () => {
    try {
      await account.deleteSession("current");
    } catch {}
    setUser(null);
  };

  const updateUser = async (/** @type {Partial<User>} */ updates) => {
    if (!user) return;
    await authApi.patchMe(updates);
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
